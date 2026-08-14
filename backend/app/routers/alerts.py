from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role, READ_ALL_ROLES, MANAGER_ROLES
from app.models.user import UserRole
from app.services.alert_service import (
    get_alerts,
    get_active_alerts,
    mark_alert_read,
    evaluate_system_alerts,
    create_alert,
)

router = APIRouter(prefix="/alerts", tags=["Alert & Notification System"])


@router.get("")
@router.get("/stores/{store_id}")
def list_alerts_endpoint(
    store_id: int = 1,
    alert_type: Optional[str] = Query(None, description="shelf_performance, product_visibility, traffic_anomaly, camera_health"),
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW"),
    status: Optional[str] = Query(None, description="active, acknowledged, resolved"),
    is_read: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_role(*READ_ALL_ROLES))
):
    alerts = get_alerts(db, store_id=store_id, alert_type=alert_type, severity=severity, status=status, is_read=is_read)
    return [
        {
            "id": a.id,
            "store_id": a.store_id,
            "zone_id": a.zone_id,
            "camera_id": a.camera_id,
            "product_id": a.product_id,
            "shelf_id": a.shelf_id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "status": a.status,
            "is_read": a.is_read,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in alerts
    ]


@router.get("/active")
@router.get("/stores/{store_id}/active")
def get_active_alerts_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*READ_ALL_ROLES))
):
    alerts = get_active_alerts(db, store_id=store_id)
    return [
        {
            "id": a.id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "status": a.status,
            "is_read": a.is_read,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in alerts
    ]


@router.patch("/{alert_id}/read")
@router.put("/{alert_id}/read")
def mark_alert_read_endpoint(
    alert_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_role(*READ_ALL_ROLES))
):
    alert = mark_alert_read(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert marked as read", "alert_id": alert_id, "is_read": True}


@router.post("/evaluate")
@router.post("/stores/{store_id}/evaluate")
def evaluate_alerts_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*MANAGER_ROLES))
):
    return evaluate_system_alerts(db, store_id=store_id)
