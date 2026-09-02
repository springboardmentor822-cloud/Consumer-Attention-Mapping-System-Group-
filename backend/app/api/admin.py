import shutil
import subprocess

from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func, text

from app.core.db import get_session, engine
from app.core.timescale_db import timescale_engine
from app.core.redis_client import redis_client
from app.core.deps import require_roles
from app.core.monitoring_state import get_stats, get_network_rate_kbps
from app.models.user import User
from app.models.store import Store
from app.models.camera import Camera
from datetime import datetime, timedelta

HEARTBEAT_TIMEOUT_SECONDS = 60

router = APIRouter()

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    # Not installed - /monitoring still returns real GPU/services/API
    # stats, just system_available=False and system=None instead of
    # crashing the whole endpoint over one missing package. Run
    # `pip install psutil --break-system-packages` (or your venv
    # equivalent) to turn this on - not confirmed pre-installed, same
    # caveat as apscheduler earlier in this project.
    PSUTIL_AVAILABLE = False


@router.get("/config")
def get_system_configuration(_=Depends(require_roles("SuperAdmin"))):
    """
    Real, currently-in-effect configuration values pulled directly from
    app.core.config.settings and the handful of service-level constants
    that aren't in Settings (thresholds/intervals were deliberately kept
    as plain module constants close to the code that uses them - see
    recommendation_engine.py's own docstring on HIGH_THRESHOLD/
    LOW_THRESHOLD - rather than duplicated into Settings).

    Read-only on purpose: none of these are editable through this
    endpoint. Making them live-editable would need a real settings-
    persistence layer (a Settings table, or safely rewriting .env) -
    a bigger change than "show what's currently configured", which is
    what Admin's System Configuration section actually needs first.

    Secrets are deliberately excluded, not redacted-with-asterisks -
    JWT_SECRET_KEY, DATABASE_URL, TIMESCALE_DATABASE_URL, and
    SMTP_PASSWORD are never returned, even to SuperAdmin, since this
    travels over HTTP to a browser tab (logs, screen shares, browser
    history). Only whether SMTP is configured (bool) is exposed, not
    the credential itself.
    """
    from app.core.config import settings
    from app.services.recommendation_engine import HIGH_THRESHOLD, LOW_THRESHOLD, COLD_ZONE_RATIO
    from app.services.heatmap_engine import CACHE_TTL_SECONDS
    from app.workers.recommendation_scheduler import INTERVAL_MINUTES, RETENTION_DAYS

    return {
        "auth": {
            "jwt_algorithm": settings.JWT_ALGORITHM,
            "jwt_expire_minutes": settings.JWT_EXPIRE_MINUTES,
            "dev_password_reset_mode": settings.DEV_PASSWORD_RESET,
        },
        "cors": {
            "allowed_origins": settings.CORS_ORIGINS,
            "frontend_url": settings.FRONTEND_URL,
        },
        "email": {
            "smtp_configured": bool(settings.SMTP_HOST and settings.SMTP_USERNAME),
            "smtp_host": settings.SMTP_HOST or None,
            "smtp_use_tls": settings.SMTP_USE_TLS,
        },
        "recommendation_engine": {
            "high_attention_threshold": HIGH_THRESHOLD,
            "low_engagement_threshold": LOW_THRESHOLD,
            "cold_zone_ratio": COLD_ZONE_RATIO,
            "thresholds_are_assumption": True,  # per the module's own docstring - not from the spec doc
        },
        "recommendation_scheduler": {
            "interval_minutes": INTERVAL_MINUTES,
            "retention_days": RETENTION_DAYS,
        },
        "heatmap_cache": {
            "cache_ttl_seconds": CACHE_TTL_SECONDS,
        },
    }


@router.get("/overview")
def admin_overview(
    session: Session = Depends(get_session),
    _=Depends(require_roles("SuperAdmin")),
):
    total_stores = session.exec(select(func.count()).select_from(Store)).one()
    total_users = session.exec(select(func.count()).select_from(User)).one()
    total_cameras = session.exec(select(func.count()).select_from(Camera)).one()
    active_cameras = session.exec(
        select(func.count()).select_from(Camera).where(Camera.is_active == True)  # noqa: E712
    ).one()

    now = datetime.utcnow()
    cameras = session.exec(select(Camera)).all()
    online_cameras = sum(
        1
        for camera in cameras
        if camera.last_seen_at
        and (now - camera.last_seen_at.replace(tzinfo=None)).total_seconds() < HEARTBEAT_TIMEOUT_SECONDS
    )

    return {
        "total_stores": total_stores,
        "total_users": total_users,
        "total_cameras": total_cameras,
        "active_cameras_flagged": active_cameras,
        "online_cameras": online_cameras,
    }


def _check_postgres() -> bool:
    try:
        with Session(engine) as s:
            s.exec(text("SELECT 1"))
        return True
    except Exception:
        return False


def _check_timescale() -> bool:
    try:
        with Session(timescale_engine) as s:
            s.exec(text("SELECT 1"))
        return True
    except Exception:
        return False


def _check_redis() -> bool:
    try:
        return bool(redis_client.ping())
    except Exception:
        return False


def _get_gpu_stats() -> list[dict] | None:
    """
    Shells out to nvidia-smi rather than adding a pynvml dependency -
    works as long as nvidia-smi is on PATH, true for this project's dev
    machine (RTX 4060 laptop GPU, drivers already confirmed working).
    Returns None on any machine without an NVIDIA GPU/driver - that's a
    normal case (e.g. a CPU-only deploy target), not treated as an error.
    """
    if not shutil.which("nvidia-smi"):
        return None
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,utilization.gpu,memory.used,memory.total",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=3,
        )
        if result.returncode != 0:
            return None
        gpus = []
        for line in result.stdout.strip().splitlines():
            parts = [p.strip() for p in line.split(",")]
            if len(parts) != 4:
                continue
            name, util, mem_used, mem_total = parts
            gpus.append({
                "name": name,
                "utilization_percent": float(util),
                "memory_used_mb": float(mem_used),
                "memory_total_mb": float(mem_total),
            })
        return gpus or None
    except Exception:
        # nvidia-smi present but timed out / gave unparseable output -
        # fail to None rather than 500ing the whole monitoring endpoint
        # over a GPU read.
        return None


@router.get("/monitoring")
def admin_monitoring(_=Depends(require_roles("SuperAdmin"))):
    """
    Platform Monitoring (Roles_Based_Dashboard.pdf Admin Sec4:
    CPU/GPU/RAM/DB Load/API Response Time/Storage Usage) plus the
    Running Services / System Uptime / API Requests KPIs from Sec1.

    "System Uptime" here means this API process's uptime (time since
    the current uvicorn process started), not host OS uptime - more
    meaningful for a dev/demo deployment and doesn't need host-level
    permissions to read.

    NOT covered by this endpoint: Security Logs (Sec6) and Audit Logs
    (Sec7). Both need a persisted event log (login attempts, permission
    changes, entity create/update/delete history) that doesn't exist
    anywhere in this system yet - that's a logging/audit feature, not a
    monitoring read, and is a separate build.
    """
    services = {
        "postgres": _check_postgres(),
        "timescaledb": _check_timescale(),
        "redis": _check_redis(),
    }

    if PSUTIL_AVAILABLE:
        cpu_percent = psutil.cpu_percent(interval=0.2)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        system = {
            "cpu_percent": cpu_percent,
            "ram_percent": mem.percent,
            "ram_used_gb": round(mem.used / (1024 ** 3), 1),
            "ram_total_gb": round(mem.total / (1024 ** 3), 1),
            "disk_percent": disk.percent,
            "disk_used_gb": round(disk.used / (1024 ** 3), 1),
            "disk_total_gb": round(disk.total / (1024 ** 3), 1),
        }
    else:
        system = None

    return {
        "system": system,
        "system_available": PSUTIL_AVAILABLE,
        "gpu": _get_gpu_stats(),
        "network": get_network_rate_kbps(),
        "services": services,
        "services_running_count": sum(services.values()),
        "services_total_count": len(services),
        "api": get_stats(),
    }
