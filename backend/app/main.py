from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import redis as redis_lib
from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import engine, init_db
from app.core.timescale_db import init_timescale_db, timescale_engine  # NEW
import app.models  # noqa: F401
from app.models.user import Role
from app.api import auth, stores, shelves, cameras, zones, shelf_camera_views, dwell_time, traffic_analytics, heatmaps, attractiveness, recommendations, segments, users, admin, reports, product_interactions, admin_logs, campaigns, campaign_analytics, completion_analytics
from app.routers.live_tracking import router as live_tracking_router

app = FastAPI(title="Consumer Attention Mapping System - Backend")

@app.on_event("startup")
def on_startup():
    init_db()
    init_timescale_db()
    default_roles = ["SuperAdmin", "StoreManager", "Analyst", "MarketingManager"]
    with Session(engine) as session:
        for role_name in default_roles:
            existing = session.exec(select(Role).where(Role.name == role_name)).first()
            if not existing:
                session.add(Role(name=role_name))
        session.commit()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(stores.router, prefix="/api/stores", tags=["stores"])
app.include_router(product_interactions.router, prefix="/api/stores", tags=["product-interactions"])
app.include_router(shelves.router, prefix="/api/stores", tags=["shelves"])
app.include_router(cameras.router, prefix="/api/stores", tags=["cameras"])
app.include_router(zones.router, prefix="/api/stores", tags=["zones"])
app.include_router(shelf_camera_views.router, prefix="/api/shelves", tags=["shelf-camera-views"])
app.include_router(dwell_time.router, prefix="/api/stores", tags=["dwell-time"])
app.include_router(traffic_analytics.router, prefix="/api/stores", tags=["traffic-analytics"])
app.include_router(heatmaps.router)
app.include_router(attractiveness.router, prefix="/api/stores", tags=["attractiveness"])
app.include_router(recommendations.router, prefix="/api/stores", tags=["recommendations"])
app.include_router(segments.router, prefix="/api/stores", tags=["segments"])
app.include_router(reports.router, prefix="/api/stores", tags=["reports"])
app.include_router(admin_logs.router)  # router already carries prefix="/api/admin" internally
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["campaigns"])
app.include_router(campaign_analytics.router, prefix="/api/campaigns", tags=["campaign-analytics"])
app.include_router(completion_analytics.router)  # router already carries prefix="/api/v1/completion" internally
app.include_router(live_tracking_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/dependencies")
def dependency_health():
    checks = {}
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as exc:
        checks["postgres"] = f"error: {type(exc).__name__}"
    try:
        with timescale_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["timescaledb"] = "ok"
    except Exception as exc:
        checks["timescaledb"] = f"error: {type(exc).__name__}"
    try:
        redis_lib.from_url(settings.REDIS_URL).ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {type(exc).__name__}"
    return {"status": "ok" if all(v == "ok" for v in checks.values()) else "degraded", "checks": checks}
