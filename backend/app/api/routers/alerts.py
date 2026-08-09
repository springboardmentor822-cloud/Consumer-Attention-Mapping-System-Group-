from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import dashboard_access, resolve_store_scope, write_access
from app.db.session import get_db
from app.models.alert import Alert
from app.models.user import User
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.audit import record_audit_event
from app.services.crud import CRUDService

router = APIRouter(prefix="/alerts", tags=["Security Monitoring"])
service = CRUDService[Alert, AlertCreate, AlertCreate](Alert, "Alert")

# How many of the most recent unresolved alerts GET /alerts/live returns -
# a live feed, not a full history (that's what GET /alerts with filters is
# for), so it's capped rather than unbounded.
LIVE_ALERTS_LIMIT = 50


@router.get("", response_model=list[AlertResponse])
def list_alerts(
    store_id: int | None = Query(default=None),
    is_resolved: bool | None = Query(default=None),
    severity: str | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    query = db.query(Alert)
    if effective_store_id is not None:
        query = query.filter(Alert.store_id == effective_store_id)
    if is_resolved is not None:
        query = query.filter(Alert.is_resolved == is_resolved)
    if severity is not None:
        query = query.filter(Alert.severity == severity)
    return query.order_by(Alert.created_at.desc()).all()


@router.get("/live", response_model=list[AlertResponse])
def list_live_alerts(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Unresolved alerts, newest first - what the Security dashboard polls
    every few seconds. A subset of GET /alerts (is_resolved=false), exposed
    as its own route because that's the exact contract the frontend's
    polling loop wants and it reads clearer at the call site."""
    effective_store_id = resolve_store_scope(current_user, store_id)
    query = db.query(Alert).filter(Alert.is_resolved.is_(False))
    if effective_store_id is not None:
        query = query.filter(Alert.store_id == effective_store_id)
    return query.order_by(Alert.created_at.desc()).limit(LIVE_ALERTS_LIMIT).all()


@router.post("", response_model=AlertResponse)
def create_alert(payload: AlertCreate, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    alert = Alert(**payload.model_dump(), created_by=current_user.id)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    record_audit_event(
        db, action="alert_created", message=f"Alert #{alert.id} logged: {alert.message}",
        actor=current_user, resource="alert", resource_id=alert.id, severity=alert.severity,
    )
    return alert


def _resolve_alert(item_id: int, current_user: User, db: Session) -> Alert:
    alert = service.get_or_404(db, item_id)
    alert.is_resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by = current_user.id
    db.commit()
    db.refresh(alert)
    record_audit_event(
        db, action="alert_resolved", message=f"Alert #{alert.id} resolved",
        actor=current_user, resource="alert", resource_id=alert.id,
    )
    return alert


@router.post("/{item_id}/resolve", response_model=AlertResponse)
def resolve_alert_post(item_id: int, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return _resolve_alert(item_id, current_user, db)


@router.patch("/{item_id}/resolve", response_model=AlertResponse)
def resolve_alert_patch(item_id: int, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    """Same behavior as the POST route above, kept for backward
    compatibility - PATCH is the semantically correct verb for a partial
    update like this, and the one this project's spec calls for."""
    return _resolve_alert(item_id, current_user, db)
