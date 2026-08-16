import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.scheduler import (
    run_periodic_checks,
    run_periodic_retention_purge,
    run_periodic_scoring_and_recommendations,
)
from app.core.websocket_manager import manager
from app.database import Base, engine
from app.services.live_camera_manager import live_camera_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("attention_mapping")

# Auto-create tables on startup if they don't exist yet. For real schema
# evolution, use `alembic upgrade head` instead (see alembic/ directory).
Base.metadata.create_all(bind=engine)

# create_all only adds missing TABLES, not missing COLUMNS on tables that
# already exist - so a column added to a model after someone's database was
# first created (like max_capacity below) needs this explicit, safe backfill.
#
# Postgres supports `ADD COLUMN IF NOT EXISTS` directly; SQLite (used by the
# no-Docker local quick-start) does not, so there we check PRAGMA
# table_info first and only add the column if it's actually missing.
def _add_column_if_missing(conn, table: str, column: str, ddl_type: str) -> None:
    if conn.dialect.name == "sqlite":
        existing = {row[1] for row in conn.exec_driver_sql(f"PRAGMA table_info({table});")}
        if column not in existing:
            conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type};")
    else:
        conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {ddl_type};")


with engine.connect() as _conn:
    _add_column_if_missing(_conn, "stores", "max_capacity", "INTEGER")
    # Milestone 3: trajectory-analysis velocity field and shelf vertical
    # placement, both added after some databases were first created.
    _add_column_if_missing(_conn, "shopper_sessions", "avg_velocity_mps", "FLOAT")
    _add_column_if_missing(_conn, "shelves", "shelf_level", "VARCHAR(20) NOT NULL DEFAULT 'middle'")
    # Floor-plan placement fields (Store Layout drag-and-place feature) were
    # added to the Shelf model after some databases already had a `shelves`
    # table, so - like shelf_level above - they need an explicit backfill or
    # every query against the shelves table (list, get, update) fails with
    # "no such column: shelves.shelf_width_m" on any pre-existing database.
    _add_column_if_missing(_conn, "shelves", "shelf_width_m", "FLOAT")
    _add_column_if_missing(_conn, "shelves", "shelf_height_m", "FLOAT")
    # Belt-and-suspenders normalization for SQLite too: it never had a native
    # enum type, but a database created back when ShelfLevelEnum's values
    # were uppercase can still hold uppercase strings, which fail the same
    # LookupError against the current lowercase enum values.
    _conn.exec_driver_sql(
        "UPDATE shelves SET shelf_level = lower(shelf_level) WHERE shelf_level <> lower(shelf_level);"
    )
    _conn.commit()

# shelf_level was originally declared as a native Postgres ENUM type, but
# that combined with ShelfLevelEnum mixing in `str` to create a read/write
# mismatch (see the comment in models/shelf.py) - every existing shelf row
# ends up with an unreadable shelf_level value. The model now declares the
# column as plain VARCHAR (native_enum=False), so on Postgres convert any
# pre-existing native-enum column over to match; this is a no-op if it's
# already VARCHAR (e.g. SQLite, or a database that already had this fix).
if engine.dialect.name != "sqlite":
    try:
        with engine.connect() as _conn:
            # Drop the default first: if it was tied to the enum type
            # (DEFAULT 'middle'::shelflevelenum), changing the column's
            # type out from under that default can fail or silently strand
            # the old cast, so clear it and re-apply as a plain string
            # default after the type change instead of relying on Postgres
            # to carry it over.
            _conn.exec_driver_sql("ALTER TABLE shelves ALTER COLUMN shelf_level DROP DEFAULT;")
            _conn.exec_driver_sql(
                "ALTER TABLE shelves ALTER COLUMN shelf_level TYPE VARCHAR(20) USING shelf_level::text;"
            )
            # The type conversion above carries the *stored* value over as-is
            # (e.g. 'BOTTOM' stays 'BOTTOM', just as text instead of an enum
            # label now). ShelfLevelEnum's values are lowercase
            # (bottom/middle/eye_level/top), so any row written back when the
            # enum used uppercase values would otherwise still fail to load
            # with a LookupError even after this column-type fix.
            _conn.exec_driver_sql(
                "UPDATE shelves SET shelf_level = lower(shelf_level) WHERE shelf_level <> lower(shelf_level);"
            )
            _conn.exec_driver_sql("ALTER TABLE shelves ALTER COLUMN shelf_level SET DEFAULT 'middle';")
            _conn.exec_driver_sql("ALTER TABLE shelves ALTER COLUMN shelf_level SET NOT NULL;")
            _conn.exec_driver_sql("DROP TYPE IF EXISTS shelflevelenum;")
            _conn.commit()
    except Exception:  # noqa: BLE001
        logger.exception("Could not normalize shelves.shelf_level column type")

try:
    with engine.connect() as _conn:
        # `tracking_data` is the high-frequency raw-position table (one row
        # per tracked shopper per tick). TimescaleDB's hypertable partitions
        # it transparently by time, which is what keeps queries/writes fast
        # once this table grows into the millions of rows the brief describes.
        #
        # TimescaleDB requires any primary key to include the partitioning
        # column, so the plain `id` primary key has to become a composite
        # (id, timestamp) key before the table can be converted. This whole
        # block only runs once - it's a no-op on every later restart.
        _conn.exec_driver_sql("CREATE EXTENSION IF NOT EXISTS timescaledb;")
        _conn.exec_driver_sql(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM timescaledb_information.hypertables
                    WHERE hypertable_name = 'tracking_data'
                ) THEN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE table_name = 'tracking_data'
                          AND constraint_type = 'PRIMARY KEY'
                          AND constraint_name = 'tracking_data_pkey'
                    ) THEN
                        ALTER TABLE tracking_data DROP CONSTRAINT tracking_data_pkey;
                    END IF;
                    ALTER TABLE tracking_data ADD PRIMARY KEY (id, timestamp);
                    PERFORM create_hypertable('tracking_data', 'timestamp', if_not_exists => true, migrate_data => true);
                END IF;
            END $$;
            """
        )
        _conn.commit()
except Exception:  # noqa: BLE001
    # TimescaleDB setup is a performance optimization, not something the
    # rest of the app depends on to function - if it fails for any reason,
    # log it loudly but let auth/register/everything else keep working.
    logger.exception("TimescaleDB hypertable setup failed - continuing without it.")

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])

# Clients connected to /ws/live-cameras - a lightweight fan-out list
# (separate from `manager`, which is keyed by store_id for the
# tracking/notifications socket) since the camera wall isn't per-store.
_live_camera_ws_clients: set[WebSocket] = set()


async def _broadcast_live_camera_status() -> None:
    """Every second, pushes each camera's status/person_count/last-update to
    every connected dashboard - this is what lets the panel's status badges
    and 'Online Cameras' counter update live without the browser polling
    the REST endpoint."""
    while True:
        await asyncio.sleep(1.0)
        if not _live_camera_ws_clients:
            continue
        payload = {"type": "live_camera_status", "cameras": live_camera_manager.list_snapshots()}
        stale: list[WebSocket] = []
        for ws in list(_live_camera_ws_clients):
            try:
                await ws.send_json(payload)
            except Exception:  # noqa: BLE001
                stale.append(ws)
        for ws in stale:
            _live_camera_ws_clients.discard(ws)


@asynccontextmanager
async def lifespan(app: FastAPI):
    notification_task = asyncio.create_task(run_periodic_checks())
    retention_task = asyncio.create_task(run_periodic_retention_purge())
    scoring_task = asyncio.create_task(run_periodic_scoring_and_recommendations())
    # Live Cameras panel: spins up one background capture+YOLO thread per
    # configured camera (see app/config/live_cameras.json). Threads, not an
    # asyncio task, since OpenCV frame reads block - see live_camera_manager.
    live_camera_manager.start()
    camera_broadcast_task = asyncio.create_task(_broadcast_live_camera_status())
    logger.info(
        "Started background notification-check, data-retention, "
        "scoring/recommendation, and live-camera schedulers."
    )
    yield
    notification_task.cancel()
    retention_task.cancel()
    scoring_task.cancel()
    camera_broadcast_task.cancel()
    live_camera_manager.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description=(
        "Backend API for the Consumer Attention Mapping System: store/camera "
        "management, shopper tracking ingest, attention analytics, heatmaps, "
        "product attractiveness scoring, recommendations, reports and alerts."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": settings.PROJECT_NAME}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


@app.websocket("/ws/stores/{store_id}")
async def store_live_updates(websocket: WebSocket, store_id: int):
    """
    Live feed of tracking points / notifications / camera status changes
    for a given store. Backend services (e.g. the CV inference pipeline,
    the notification checker) call `manager.broadcast(store_id, payload)`
    whenever something changes; connected dashboards receive it instantly.
    """
    await manager.connect(store_id, websocket)
    try:
        while True:
            # Dashboards don't need to send anything; this keeps the socket open.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(store_id, websocket)


@app.websocket("/ws/live-cameras")
async def live_camera_status_updates(websocket: WebSocket):
    """Live status/person-count feed for every camera in the Live Cameras
    panel (separate from each camera's own MJPEG video stream). Sends a
    snapshot immediately on connect, then again every second via
    _broadcast_live_camera_status."""
    await websocket.accept()
    _live_camera_ws_clients.add(websocket)
    try:
        await websocket.send_json({"type": "live_camera_status", "cameras": live_camera_manager.list_snapshots()})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        _live_camera_ws_clients.discard(websocket)
