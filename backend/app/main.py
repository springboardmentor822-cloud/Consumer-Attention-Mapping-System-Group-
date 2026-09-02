import time
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import redis as redis_lib
from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import engine, init_db
from app.core.timescale_db import init_timescale_db, timescale_engine  # NEW
from app.core.logging_config import configure_logging
import app.models  # noqa: F401
from app.models.user import Role
from app.api import auth, stores, shelves, cameras, zones, shelf_camera_views, dwell_time, traffic_analytics, heatmaps, attractiveness, recommendations, segments, users, admin, reports, product_interactions, admin_logs, campaigns, campaign_analytics, completion_analytics
from app.routers.live_tracking import router as live_tracking_router

configure_logging()
logger = logging.getLogger("app.requests")

app = FastAPI(title="Consumer Attention Mapping System - Backend")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Real per-request logging: method, path, status code, and duration
    for every request that reaches this backend. This is what makes
    "something is slow" or "something is 500ing in production"
    debuggable after the fact instead of only visible if you happened
    to be watching a terminal at the time.
    """
    start = time.monotonic()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.monotonic() - start) * 1000, 1)
        logger.exception(
            f"{request.method} {request.url.path} -> UNHANDLED EXCEPTION after {duration_ms}ms"
        )
        raise
    duration_ms = round((time.monotonic() - start) * 1000, 1)
    log_level = logging.WARNING if response.status_code >= 500 else logging.INFO
    logger.log(
        log_level,
        f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)",
    )
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Builds the clean JSON 500 response (never leak a raw traceback to
    the client). The actual logging of the exception happens once,
    in log_requests' except branch above - not duplicated here, since
    that branch re-raises specifically so this handler still runs and
    can shape the response, and logging the same crash twice per
    request would just double every error-log entry for no benefit.
    """
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.on_event("startup")
def on_startup():
    # Real security-audit fix: JWT_SECRET_KEY's default value
    # ("change-this-in-your-env-file") is sitting in plain sight in
    # app/core/config.py, in this source tree. If the .env file was
    # ever missing or misconfigured, this backend would silently sign
    # every login token with a publicly-readable secret - meaning
    # anyone who has ever seen this repository could forge a valid
    # SuperAdmin token for it. That's a full authentication bypass, not
    # a minor misconfiguration, so this refuses to start rather than
    # start insecurely. Not a new requirement this introduces - the
    # config always intended for you to set a real secret; this just
    # actually enforces it instead of failing silently into an insecure
    # default.
    if settings.JWT_SECRET_KEY == "change-this-in-your-env-file":
        raise RuntimeError(
            "JWT_SECRET_KEY is still the default placeholder value. Set a real, "
            "random secret in your .env file before starting this backend - "
            "with the default value, anyone who has seen this source code can "
            "forge valid login tokens for any account, including SuperAdmin."
        )
    if settings.DEV_PASSWORD_RESET:
        logger.warning(
            "DEV_PASSWORD_RESET is True: password-reset tokens are returned "
            "directly in the API response instead of being emailed. This is "
            "correct for local development, but if this is a production "
            "deployment, anyone who can trigger 'forgot password' for an "
            "account can take it over with no email access needed. Set "
            "DEV_PASSWORD_RESET=false and configure SMTP_* before deploying."
        )

    init_db()
    init_timescale_db()
    default_roles = ["SuperAdmin", "StoreManager", "Analyst", "MarketingManager"]
    with Session(engine) as session:
        for role_name in default_roles:
            existing = session.exec(select(Role).where(Role.name == role_name)).first()
            if not existing:
                session.add(Role(name=role_name))
        session.commit()
    logger.info("Application startup complete.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """
    Real security-audit fix: this backend had zero response security
    headers before this. These are all standard, low-risk, no-behavior-
    change-for-a-JSON-API headers - added here rather than per-route
    since they should apply uniformly. Strict-Transport-Security is
    deliberately NOT included: forcing HTTPS via HSTS is correct in
    production behind a real TLS-terminating proxy, but sending it over
    plain HTTP local development would be actively wrong (browsers that
    cache an HSTS header can lock a dev machine out of http://localhost
    for the HSTS max-age duration) - add it at your reverse
    proxy/load balancer once this is actually served over HTTPS, not here.
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

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
