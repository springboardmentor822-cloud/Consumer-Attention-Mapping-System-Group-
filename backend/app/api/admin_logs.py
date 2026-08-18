from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.core.deps import require_roles
from app.core.db import get_session
from app.models.camera import Camera
from app.models.event_log import EventCategory, EventLog


router = APIRouter(
    prefix="/api/admin",
    tags=["admin-logs"],
)


def _query_logs(
    session: Session,
    category: EventCategory,
    event_type: Optional[str],
    start: Optional[datetime],
    end: Optional[datetime],
    skip: int,
    limit: int,
):
    statement = select(EventLog).where(
        EventLog.category == category
    )

    if event_type:
        statement = statement.where(
            EventLog.event_type == event_type
        )

    if start:
        statement = statement.where(
            EventLog.created_at >= start
        )

    if end:
        statement = statement.where(
            EventLog.created_at <= end
        )

    statement = (
        statement
        .order_by(EventLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    return session.exec(statement).all()


@router.get("/logs/security")
def get_security_logs(
    event_type: Optional[str] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    session: Session = Depends(get_session),
    current_user=Depends(
        require_roles("SuperAdmin")
    ),
):
    return _query_logs(
        session,
        EventCategory.security,
        event_type,
        start,
        end,
        skip,
        limit,
    )


@router.get("/logs/audit")
def get_audit_logs(
    event_type: Optional[str] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    session: Session = Depends(get_session),
    current_user=Depends(
        require_roles("SuperAdmin")
    ),
):
    return _query_logs(
        session,
        EventCategory.audit,
        event_type,
        start,
        end,
        skip,
        limit,
    )


HEARTBEAT_TIMEOUT_SECONDS = 60


@router.get("/cameras/health")
def get_camera_health(
    session: Session = Depends(get_session),
    current_user=Depends(
        require_roles("SuperAdmin")
    ),
):
    cameras = session.exec(select(Camera)).all()
    now = datetime.utcnow()

    result = []

    for camera in cameras:
        online = bool(
            camera.last_seen_at
            and (
                now - camera.last_seen_at
            ) < timedelta(
                seconds=HEARTBEAT_TIMEOUT_SECONDS
            )
        )

        result.append(
            {
                "camera_id": camera.id,
                "name": getattr(camera, "name", None),
                "online": online,
                "last_seen_at": camera.last_seen_at,

                # The current system does not have independent
                # recording/streaming signals, so these mirror online.
                "recording": online,
                "streaming": online,

                # No genuine network-quality instrumentation exists yet.
                "network_quality": None,
            }
        )

    return result


@router.get("/alerts")
def get_alerts(
    alert_type: Optional[str] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    session: Session = Depends(get_session),
    current_user=Depends(require_roles("SuperAdmin")),
):
    """Return persisted Redis alert events."""
    statement = select(EventLog).where(
        EventLog.category == EventCategory.audit,
        EventLog.event_type.like("alert_%"),
    )
    if alert_type:
        event_type = alert_type if alert_type.startswith("alert_") else f"alert_{alert_type}"
        statement = statement.where(EventLog.event_type == event_type)
    if start:
        statement = statement.where(EventLog.created_at >= start)
    if end:
        statement = statement.where(EventLog.created_at <= end)
    statement = statement.order_by(EventLog.created_at.desc()).offset(skip).limit(limit)
    return session.exec(statement).all()
