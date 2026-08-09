import time
from pathlib import Path

import psutil
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import admin_access
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.admin_dashboard import AuditLogItem, AuditLogsResponse, SystemHealthResponse

router = APIRouter(prefix="/dashboard/admin", tags=["Admin Dashboard"])

BACKEND_ROOT = Path(__file__).resolve().parents[3]
_PROCESS_START = time.time()


@router.get("/system-health", response_model=SystemHealthResponse)
def system_health(_: User = Depends(admin_access), db: Session = Depends(get_db)):
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage(str(BACKEND_ROOT))

    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    return SystemHealthResponse(
        cpu_percent=psutil.cpu_percent(interval=0.2),
        memory_percent=memory.percent,
        memory_used_mb=round(memory.used / (1024 ** 2), 1),
        memory_total_mb=round(memory.total / (1024 ** 2), 1),
        disk_percent=disk.percent,
        disk_used_gb=round(disk.used / (1024 ** 3), 1),
        disk_total_gb=round(disk.total / (1024 ** 3), 1),
        process_count=len(psutil.pids()),
        uptime_seconds=round(time.time() - _PROCESS_START, 1),
        api_status="healthy",
        db_status=db_status,
    )


@router.get("/audit-logs", response_model=AuditLogsResponse)
def audit_logs(
    limit: int = Query(default=50, le=200),
    severity: str | None = Query(default=None),
    _: User = Depends(admin_access),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if severity:
        query = query.filter(AuditLog.severity == severity)
    total = query.count()
    rows = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return AuditLogsResponse(logs=[AuditLogItem.model_validate(r) for r in rows], total=total)
