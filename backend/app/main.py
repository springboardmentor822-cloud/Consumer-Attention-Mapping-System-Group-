from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import engine, init_db
from app.core.timescale_db import init_timescale_db  # NEW
import app.models  # noqa: F401 - triggers app/models/__init__.py, which
                    # imports every MAIN-Postgres model (including
                    # ShelfCameraView) so init_db()'s create_all() creates
                    # ALL their tables. TrackingEvent is deliberately NOT
                    # among them - see tracking_event.py's top comment.
from app.models.user import Role
from app.api import auth, stores, shelves, cameras, zones, shelf_camera_views
from app.routers.live_tracking import router as live_tracking_router

app = FastAPI(title="Consumer Attention Mapping System - Backend")


@app.on_event("startup")
def on_startup():
    init_db()
    init_timescale_db()  # NEW - creates tracking_events as a real
                          # hypertable on the SEPARATE TimescaleDB engine,
                          # never touching the main Postgres above
    # Seed default roles if they don't exist yet
    default_roles = ["SuperAdmin", "StoreManager", "Analyst"]
    with Session(engine) as session:
        for role_name in default_roles:
            existing = session.exec(select(Role).where(Role.name == role_name)).first()
            if not existing:
                session.add(Role(name=role_name))
        session.commit()

# CORS - tighten origins before production; wide open for local dev only
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(stores.router, prefix="/api/stores", tags=["stores"])
app.include_router(shelves.router, prefix="/api/stores", tags=["shelves"])
app.include_router(cameras.router, prefix="/api/stores", tags=["cameras"])
app.include_router(zones.router, prefix="/api/stores", tags=["zones"])
app.include_router(shelf_camera_views.router, prefix="/api/shelves", tags=["shelf-camera-views"])  # NEW
app.include_router(live_tracking_router)  # NEW - WebSocket at /ws/live-tracking,
                                           # no prefix (not a REST resource under
                                           # /api/stores like the others)


@app.get("/health")
def health_check():
    return {"status": "ok"}
