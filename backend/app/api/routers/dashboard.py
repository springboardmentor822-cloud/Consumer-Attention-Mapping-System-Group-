from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import dashboard_access, resolve_store_scope
from app.db.session import get_db
from app.models.camera import Camera
from app.models.store import Store
from app.models.user import User
from app.models.zone import Zone
from app.services.tracking_repository import TrackingRepository

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _start_of_today() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


@router.get("/stats")
def get_dashboard_stats(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)

    store_query = db.query(Store)
    camera_query = db.query(Camera)
    zone_query = db.query(Zone)
    if effective_store_id is not None:
        store_query = store_query.filter(Store.id == effective_store_id)
        camera_query = camera_query.filter(Camera.store_id == effective_store_id)
        zone_query = zone_query.filter(Zone.store_id == effective_store_id)

    camera_ids = [c.id for c in camera_query.with_entities(Camera.id).all()]

    repo = TrackingRepository(db)
    since_today = _start_of_today()
    active_customers = repo.unique_customers_for_cameras(camera_ids, since=datetime.now(timezone.utc) - timedelta(minutes=5))
    today_footfall = repo.unique_customers_for_cameras(camera_ids, since=since_today)

    return {
        "totalStores": store_query.count(),
        "totalCameras": camera_query.count(),
        "totalZones": zone_query.count(),
        "activeCustomers": active_customers,
        "todayFootfall": today_footfall,
    }


@router.get("/live-tracking")
def get_live_tracking(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)

    camera_query = db.query(Camera.id)
    if effective_store_id is not None:
        camera_query = camera_query.filter(Camera.store_id == effective_store_id)
    camera_ids = [c.id for c in camera_query.all()]
    scoped_camera_ids = camera_ids if effective_store_id is not None else None

    repo = TrackingRepository(db)
    recent = repo.get_recent_points(seconds=60, camera_ids=scoped_camera_ids)
    active_customers = len({t.customer_id for t in recent})

    lookup_ids = camera_ids if effective_store_id is not None else [c.id for c in db.query(Camera.id).all()]
    total_tracked = repo.unique_customers_for_cameras(lookup_ids)
    avg_dwell = repo.avg_dwell_seconds(lookup_ids)
    peak_hour = repo.peak_hour(lookup_ids)

    return {
        "activeCustomers": active_customers,
        "totalTracked": total_tracked,
        "peakHour": f"{peak_hour:02d}:00 - {(peak_hour + 1) % 24:02d}:00" if peak_hour is not None else None,
        "avgDwellTime": f"{avg_dwell / 60:.1f} min",
        "currentTracks": [
            {
                "customer_id": t.customer_id,
                "x": float(t.x),
                "y": float(t.y),
                "zone_id": t.zone_id,
            }
            for t in recent[:20]
        ],
    }
