"""
Consolidated Security Monitoring dashboard endpoints - what
frontend/src/pages/SecurityAlerts.tsx polls. Separate from alerts.py
(plain Alert CRUD) the same way analytics_dashboard.py is separate from
the resource routers it reads from: this router composes real data across
Camera/Alert/tracking_data into the exact shapes the dashboard cards need,
rather than making the frontend stitch together several raw CRUD calls.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import dashboard_access, resolve_store_scope
from app.db.session import get_db
from app.models.alert import Alert
from app.models.camera import Camera
from app.models.user import User
from app.schemas.alert import AlertResponse
from app.schemas.security_dashboard import (
    CameraStatusSummary,
    OccupancyItem,
    OccupancyResponse,
    SecurityDashboardResponse,
)
from app.services.alert_service import OCCUPANCY_ALERT_THRESHOLD
from app.services.tracking_repository import TrackingRepository

router = APIRouter(prefix="/dashboard", tags=["Security Monitoring"])

RECENT_INCIDENTS_LIMIT = 10
LIVE_ALERTS_LIMIT = 50


@router.get("/security", response_model=SecurityDashboardResponse)
def security_dashboard(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)

    alert_query = db.query(Alert)
    camera_query = db.query(Camera)
    if effective_store_id is not None:
        alert_query = alert_query.filter(Alert.store_id == effective_store_id)
        camera_query = camera_query.filter(Camera.store_id == effective_store_id)

    cameras = camera_query.all()
    online = sum(1 for c in cameras if c.status == "Online")

    unresolved = alert_query.filter(Alert.is_resolved.is_(False))
    unresolved_count = unresolved.count()
    occupancy_alert_count = unresolved.filter(Alert.alert_type == "occupancy").count()
    recent_incidents = alert_query.order_by(Alert.created_at.desc()).limit(RECENT_INCIDENTS_LIMIT).all()

    return SecurityDashboardResponse(
        store_id=effective_store_id,
        live_alert_count=unresolved_count,
        unresolved_count=unresolved_count,
        camera_status=CameraStatusSummary(online=online, offline=len(cameras) - online, total=len(cameras)),
        occupancy_alert_count=occupancy_alert_count,
        recent_incidents=recent_incidents,
    )


@router.get("/live-alerts", response_model=list[AlertResponse])
def live_alerts(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Same data as GET /alerts/live - kept as its own /dashboard-prefixed
    route since that's the exact path this system's dashboard endpoints
    otherwise use (see analytics_dashboard.py, store_manager.py)."""
    effective_store_id = resolve_store_scope(current_user, store_id)
    query = db.query(Alert).filter(Alert.is_resolved.is_(False))
    if effective_store_id is not None:
        query = query.filter(Alert.store_id == effective_store_id)
    return query.order_by(Alert.created_at.desc()).limit(LIVE_ALERTS_LIMIT).all()


@router.get("/occupancy", response_model=OccupancyResponse)
def occupancy(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Live snapshot, not persisted - occupancy is only meaningful as "right
    now", the same reasoning documented on store_manager.py's /alerts
    endpoint for this exact threshold."""
    effective_store_id = resolve_store_scope(current_user, store_id)
    camera_query = db.query(Camera)
    if effective_store_id is not None:
        camera_query = camera_query.filter(Camera.store_id == effective_store_id)
    cameras = camera_query.all()

    repo = TrackingRepository(db)
    items: list[OccupancyItem] = []
    for camera in cameras:
        count = repo.unique_customers_for_cameras([camera.id])
        items.append(
            OccupancyItem(
                camera_id=camera.id,
                camera_name=camera.camera_name,
                occupancy=count,
                threshold=OCCUPANCY_ALERT_THRESHOLD,
                is_over_threshold=count > OCCUPANCY_ALERT_THRESHOLD,
            )
        )
    return OccupancyResponse(store_id=effective_store_id, cameras=items)
