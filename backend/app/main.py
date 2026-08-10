import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import OperationalError

# Nothing configured the root logger before this, so every logging.info()
# call across the app (video processing, alert generation, etc.) was
# silently below the default WARNING level and never actually printed -
# real log statements already written throughout this codebase were
# effectively dead code. INFO is the right default for an app that logs
# real pipeline/security events, not debug noise.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

from app import models  # noqa: F401
from app.api.routers import (
    admin_dashboard,
    ai_dashboard,
    alerts,
    analytics_dashboard,
    analytics_engine,
    auth,
    cameras,
    campaigns,
    customer_analytics,
    customers,
    dashboard,
    employees,
    live,
    products,
    promotions,
    security_dashboard,
    shelves,
    store_manager,
    stores,
    tracking,
    video,
    zones,
)
from app.core.config import settings
from app.core.errors import register_error_handlers
from app.db.migrations import ensure_schema_compatibility
from app.db.session import SessionLocal, engine
from app.services.camera_registration import backfill_camera_video_registrations

# Schema is now managed by Alembic (see migrations/) instead of
# Base.metadata.create_all() - run `alembic upgrade head` before starting the
# app on a fresh or updated database. ensure_schema_compatibility() is kept:
# it only ALTERs columns on tables that already exist, so it doesn't race
# with Alembic-managed CREATE TABLEs.
#
# These run at import time, which means a database that isn't reachable
# surfaces as a SQLAlchemy traceback raised from deep inside uvicorn's module
# importer - ~200 lines where the one line that matters ("could not translate
# host name ...") is buried in the middle. Catching OperationalError here and
# re-raising with the resolved host/port plus the usual causes turns a
# config typo into a message that says what to fix. Only connection failures
# are translated; any other error still propagates untouched.
try:
    ensure_schema_compatibility(engine)

    # One-time reconciliation for cameras processed before
    # Camera.last_processed_video_filename existed - see the module's docstring.
    # Safe to run on every startup: cameras that already have the field set are
    # skipped, so this is a no-op once everything's backfilled.
    with SessionLocal() as _startup_db:
        backfill_camera_video_registrations(_startup_db)
except OperationalError as exc:
    _url = engine.url
    raise RuntimeError(
        f"Cannot reach the database at host={_url.host!r} port={_url.port} "
        f"database={_url.database!r} as user={_url.username!r}.\n"
        f"  Underlying error: {exc.orig}\n"
        f"  Check backend/.env (see backend/.env.example):\n"
        f"    - Use host 'localhost' when running uvicorn directly on your machine.\n"
        f"      Host 'postgres' only resolves inside docker-compose.\n"
        f"    - Confirm PostgreSQL is running and the password is correct.\n"
        f"    - URL-encode special characters in the password (e.g. '@' -> '%40')."
    ) from exc

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0"
)

# ===== Serve annotated videos (MUST be after app = FastAPI) =====
annotated_path = Path(__file__).resolve().parents[1] / "uploads" / "annotated"
annotated_path.mkdir(parents=True, exist_ok=True)
app.mount("/annotated", StaticFiles(directory=str(annotated_path)), name="annotated")
# ==============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)


@app.get("/")
def root():
    return {
        "message": "Consumer Attention Mapping System API is running",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME
    }


@app.get("/test")
def test():
    return {
        "message": "Backend is working"
    }


# Include all routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(stores.router)
app.include_router(shelves.router)
app.include_router(products.router)
app.include_router(cameras.router)
app.include_router(zones.router)
app.include_router(video.router)
app.include_router(live.router)
app.include_router(tracking.router)
app.include_router(ai_dashboard.router)
app.include_router(store_manager.router)
app.include_router(admin_dashboard.router)
app.include_router(analytics_dashboard.router)
app.include_router(campaigns.router)
app.include_router(promotions.router)
app.include_router(analytics_engine.router)
app.include_router(employees.router)
app.include_router(customers.router)
app.include_router(customer_analytics.router)
app.include_router(alerts.router)
app.include_router(security_dashboard.router)