from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import dashboard_access, resolve_camera_scope, resolve_store_scope
from app.db.session import get_db
from app.models.camera import Camera
from app.models.enums import UserRole
from app.models.user import User
from app.models.zone import Zone
from app.schemas.ai_dashboard import (
    LiveDashboardResponse,
    LiveCustomerPoint,
    HeatmapDataResponse,
    HeatmapPoint,
    CustomerPathResponse,
    CustomerPathPoint,
    StoreSummaryResponse,
)
from app.services.tracking_repository import TrackingRepository

router = APIRouter(prefix="/dashboard", tags=["AI Dashboard"])

# How fresh the latest tracking activity must be to call this genuinely "live"
# (a camera actively streaming) rather than just "recent" (the tail end of a
# batch-processed video that finished a while ago).
LIVE_FRESHNESS_SECONDS = 15


@router.get("/live", response_model=LiveDashboardResponse)
def live_dashboard(
    seconds: int = Query(default=30, le=3600),
    camera_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    allowed_camera_ids = resolve_camera_scope(db, current_user, camera_id)
    filter_ids = [camera_id] if camera_id is not None else allowed_camera_ids

    repo = TrackingRepository(db)
    rows = repo.get_recent_points(seconds=seconds, camera_ids=filter_ids)
    points = [
        LiveCustomerPoint(
            customer_id=r.customer_id,
            camera_id=r.camera_id,
            zone_id=r.zone_id,
            x=r.x,
            y=r.y,
            timestamp=r.timestamp,
        )
        for r in rows
    ]
    active = len({p.customer_id for p in points})

    as_of = repo.latest_timestamp(filter_ids)
    is_live = as_of is not None and (
        datetime.now(timezone.utc) - as_of.astimezone(timezone.utc) <= timedelta(seconds=LIVE_FRESHNESS_SECONDS)
    )
    return LiveDashboardResponse(active_customers=active, points=points, as_of=as_of, is_live=is_live)


@router.get("/heatmap-data", response_model=HeatmapDataResponse)
def heatmap_data(
    camera_id: int | None = Query(default=None),
    zone_id: int | None = Query(default=None),
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    allowed_camera_ids = resolve_camera_scope(db, current_user, camera_id)

    effective_store_id = resolve_store_scope(current_user, store_id)
    store_camera_ids: list[int] | None = None
    if effective_store_id is not None and camera_id is None:
        store_camera_ids = [c.id for c in db.query(Camera.id).filter(Camera.store_id == effective_store_id).all()]
        if allowed_camera_ids is not None:
            store_camera_ids = [cid for cid in store_camera_ids if cid in allowed_camera_ids]

    rows = TrackingRepository(db).heatmap_points(
        camera_id=camera_id,
        zone_id=zone_id,
        camera_ids=store_camera_ids if camera_id is None else None,
    )

    grid_size = 20
    buckets: Counter = Counter()
    for r in rows:
        key = (int(r.x // grid_size) * grid_size, int(r.y // grid_size) * grid_size)
        buckets[key] += 1

    points = [HeatmapPoint(x=x, y=y, weight=weight) for (x, y), weight in buckets.items()]
    return HeatmapDataResponse(
        camera_id=camera_id,
        zone_id=zone_id,
        total_points=len(points),
        points=points
    )


@router.get("/customer-path", response_model=CustomerPathResponse)
def customer_path(
    customer_id: int = Query(...),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    rows = TrackingRepository(db).get_customer_path(customer_id)

    if current_user.role == UserRole.store_manager.value:
        allowed_camera_ids = set(resolve_camera_scope(db, current_user, None) or [])
        rows = [r for r in rows if r.camera_id in allowed_camera_ids]

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tracking history for this customer"
        )

    path = [
        CustomerPathPoint(
            frame_number=r.frame_number,
            x=r.x,
            y=r.y,
            timestamp=r.timestamp
        )
        for r in rows
    ]
    return CustomerPathResponse(
        customer_id=customer_id,
        total_points=len(path),
        path=path
    )


@router.get("/store-summary", response_model=StoreSummaryResponse)
def store_summary(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    if effective_store_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="store_id is required")

    camera_ids = [c.id for c in db.query(Camera.id).filter(Camera.store_id == effective_store_id).all()]
    zone_ids = [z.id for z in db.query(Zone.id).filter(Zone.store_id == effective_store_id).all()]

    repo = TrackingRepository(db)
    total_records = repo.count_for_store_cameras(camera_ids)
    unique_customers = repo.unique_customers_for_cameras(camera_ids)
    busiest_zone = repo.busiest_zone(zone_ids)

    return StoreSummaryResponse(
        store_id=effective_store_id,
        total_cameras=len(camera_ids),
        total_zones=len(zone_ids),
        unique_customers_tracked=unique_customers,
        total_tracking_records=total_records,
        busiest_zone_id=busiest_zone,
    )
