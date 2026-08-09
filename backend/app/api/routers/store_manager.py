"""
Store Manager Dashboard endpoints.

Two of these values are proxies rather than literal metrics, because the
schema has no purchase/checkout events and no product-pick detection model
(the AI pipeline only does person detection/tracking):

- `conversion_rate` is customers-who-passed-through-a-checkout-like-zone /
  total customers, and is None if the store has no zone whose name suggests
  a checkout area.
- `shelf_engagement_proxy` / `activity_proxy` is unique-customer count near
  a shelf's camera, standing in for "products picked".
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.ai.inference import latest_snapshot_url, latest_video_url
from app.ai.live_stream import get_live_people_count, get_registered_video
from app.analytics.services import run_behavior_analysis
from app.api.deps import dashboard_access, resolve_store_scope
from app.db.session import get_db
from app.models.camera import Camera
from app.models.shelf import Shelf
from app.models.user import User
from app.models.zone import Zone
from app.schemas.store_manager import (
    ActivitiesResponse,
    ActivityItem,
    AlertItem,
    AlertsResponse,
    CameraStatusItem,
    CameraStatusResponse,
    HourlyVisitorPoint,
    QueueCounterItem,
    QueueResponse,
    ShelfActivityItem,
    ShelfActivityResponse,
    StoreManagerSummary,
    VisitorsByHourResponse,
    VisitorsByZoneResponse,
    ZoneVisitorPoint,
)
from app.services.tracking_repository import TrackingRepository

router = APIRouter(prefix="/dashboard/store-manager", tags=["Store Manager Dashboard"])

# No per-store alert-threshold config exists yet; a fixed default is used
# until that lands (flagged as a follow-up in the security/config round).
OCCUPANCY_ALERT_THRESHOLD = 40
LIVE_WINDOW_MINUTES = 5

# A "counter" here is any zone whose name suggests a checkout/queue area -
# there's no separate queue-sensor hardware or counter-assignment table, so
# queue length is a live occupancy proxy of that zone, same pattern as the
# existing conversion_rate/shelf_engagement_proxy fields on StoreManagerSummary.
QUEUE_BUSY_THRESHOLD = 5


def _require_store(current_user: User, store_id: int | None) -> int:
    effective_store_id = resolve_store_scope(current_user, store_id)
    if effective_store_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="store_id is required")
    return effective_store_id


def _start_of_today() -> datetime:
    return datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)


@router.get("/summary", response_model=StoreManagerSummary)
def summary(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = _require_store(current_user, store_id)
    cameras = db.query(Camera).filter(Camera.store_id == effective_store_id).all()
    camera_ids = [c.id for c in cameras]
    online_cameras = sum(1 for c in cameras if c.status == "Online")

    repo = TrackingRepository(db)
    live_since = datetime.now(timezone.utc) - timedelta(minutes=LIVE_WINDOW_MINUTES)

    # Per camera, not one store-wide query: a camera actively live-streaming
    # (see app/ai/live_stream.py) has its own real-time tracker with ids
    # that have no relationship to tracking_data's customer_ids, so its
    # count can't be merged into one "unique customers" query without
    # risking a double count. Summing per-camera counts - live where a
    # stream is actually running right now, the historical window
    # otherwise - is what makes this number reflect what the live camera
    # grid is actually showing instead of a stale batch-processing window.
    current_customers = 0
    for camera_id in camera_ids:
        live_count = get_live_people_count(camera_id)
        if live_count is not None:
            current_customers += live_count
        else:
            current_customers += repo.unique_customers_for_cameras([camera_id], since=live_since)

    today_visitors = repo.unique_customers_for_cameras(camera_ids, since=_start_of_today())
    avg_dwell = repo.avg_dwell_seconds(camera_ids)

    checkout_zone_ids = [
        z.id
        for z in db.query(Zone).filter(Zone.store_id == effective_store_id, Zone.zone_name.ilike("%checkout%")).all()
    ]
    conversion_rate: float | None = None
    if checkout_zone_ids and today_visitors:
        checkout_customers = repo.unique_customers_for_zones(checkout_zone_ids, since=_start_of_today())
        conversion_rate = round(checkout_customers / today_visitors, 4)

    shelves = db.query(Shelf).filter(Shelf.store_id == effective_store_id).all()
    shelf_camera_ids = [s.camera_id for s in shelves if s.camera_id is not None]
    shelf_engagement = repo.unique_customers_for_cameras(shelf_camera_ids) if shelf_camera_ids else 0

    return StoreManagerSummary(
        store_id=effective_store_id,
        today_visitors=today_visitors,
        current_customers=current_customers,
        avg_dwell_time_seconds=avg_dwell,
        conversion_rate=conversion_rate,
        shelf_engagement_proxy=shelf_engagement,
        online_cameras=online_cameras,
        total_cameras=len(cameras),
    )


@router.get("/cameras", response_model=CameraStatusResponse)
def cameras_status(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = _require_store(current_user, store_id)
    cameras = db.query(Camera).filter(Camera.store_id == effective_store_id).all()
    zone_names = {z.id: z.zone_name for z in db.query(Zone).filter(Zone.store_id == effective_store_id).all()}

    repo = TrackingRepository(db)
    items = []
    for camera in cameras:
        has_live_source = get_registered_video(camera.id, db=db) is not None
        # Prefer the live stream's own real-time count over the historical
        # tracking_data window - a camera whose feed is actively open in
        # the browser right now should show what it's actually detecting
        # this second, not a snapshot from the last few minutes of
        # (possibly much older) batch-processed data.
        live_count = get_live_people_count(camera.id) if has_live_source else None

        recent = repo.get_recent_points(seconds=LIVE_WINDOW_MINUTES * 60, camera_ids=[camera.id])
        latest_zone_id = recent[0].zone_id if recent else None
        items.append(
            CameraStatusItem(
                camera_id=camera.id,
                camera_name=camera.camera_name,
                camera_location=camera.camera_location,
                status=camera.status,
                zone_id=latest_zone_id,
                zone_name=zone_names.get(latest_zone_id) if latest_zone_id else None,
                latest_people_count=live_count if live_count is not None else len({t.customer_id for t in recent}),
                snapshot_url=latest_snapshot_url(camera.id),
                video_url=latest_video_url(camera.id),
                live_stream_url=f"/api/live/{camera.id}/stream" if has_live_source else None,
            )
        )
    return CameraStatusResponse(store_id=effective_store_id, cameras=items)


@router.get("/visitors-by-hour", response_model=VisitorsByHourResponse)
def visitors_by_hour(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = _require_store(current_user, store_id)
    camera_ids = [c.id for c in db.query(Camera.id).filter(Camera.store_id == effective_store_id).all()]

    counts = TrackingRepository(db).counts_by_hour(camera_ids, since=_start_of_today())
    points = [HourlyVisitorPoint(hour=hour, visitors=counts.get(hour, 0)) for hour in range(24)]
    return VisitorsByHourResponse(store_id=effective_store_id, points=points)


@router.get("/visitors-by-zone", response_model=VisitorsByZoneResponse)
def visitors_by_zone(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = _require_store(current_user, store_id)
    zones = db.query(Zone).filter(Zone.store_id == effective_store_id).all()
    zone_ids = [z.id for z in zones]

    counts = TrackingRepository(db).counts_by_zone(zone_ids, since=_start_of_today())
    points = [ZoneVisitorPoint(zone_id=z.id, zone_name=z.zone_name, visitors=counts.get(z.id, 0)) for z in zones]
    return VisitorsByZoneResponse(store_id=effective_store_id, points=points)


@router.get("/shelf-activity", response_model=ShelfActivityResponse)
def shelf_activity(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = _require_store(current_user, store_id)
    shelves = db.query(Shelf).filter(Shelf.store_id == effective_store_id).all()

    repo = TrackingRepository(db)
    items = [
        ShelfActivityItem(
            shelf_id=shelf.id,
            shelf_name=shelf.shelf_name,
            zone=shelf.zone,
            camera_id=shelf.camera_id,
            activity_proxy=repo.unique_customers_for_cameras([shelf.camera_id]) if shelf.camera_id else 0,
        )
        for shelf in shelves
    ]
    items.sort(key=lambda item: item.activity_proxy, reverse=True)
    return ShelfActivityResponse(store_id=effective_store_id, shelves=items)


@router.get("/alerts", response_model=AlertsResponse)
def alerts(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = _require_store(current_user, store_id)
    cameras = db.query(Camera).filter(Camera.store_id == effective_store_id).all()

    repo = TrackingRepository(db)
    items: list[AlertItem] = []

    for camera in cameras:
        if camera.status != "Online":
            items.append(
                AlertItem(
                    severity="critical",
                    message=f"{camera.camera_name} is {camera.status.lower()}",
                    camera_id=camera.id,
                )
            )

    for camera in cameras:
        recent = repo.get_recent_points(seconds=LIVE_WINDOW_MINUTES * 60, camera_ids=[camera.id])
        occupancy = len({t.customer_id for t in recent})
        if occupancy > OCCUPANCY_ALERT_THRESHOLD:
            items.append(
                AlertItem(
                    severity="warning",
                    message=f"{camera.camera_name} occupancy ({occupancy}) is above the alert threshold ({OCCUPANCY_ALERT_THRESHOLD})",
                    camera_id=camera.id,
                )
            )

    return AlertsResponse(store_id=effective_store_id, alerts=items)


@router.get("/activities", response_model=ActivitiesResponse)
def activities(
    store_id: int | None = Query(default=None),
    limit: int = Query(default=20, le=100),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = _require_store(current_user, store_id)
    cameras = db.query(Camera).filter(Camera.store_id == effective_store_id).all()
    camera_by_id = {c.id: c for c in cameras}
    camera_ids = list(camera_by_id.keys())

    repo = TrackingRepository(db)
    recent = repo.get_recent_points(seconds=6 * 60 * 60, limit=limit * 5, camera_ids=camera_ids)

    items: list[ActivityItem] = []
    seen_buckets: set[tuple[int, int]] = set()
    for row in recent:
        minute_bucket = int(row.timestamp.timestamp() // 60)
        key = (row.camera_id, minute_bucket)
        if key in seen_buckets:
            continue
        seen_buckets.add(key)
        camera = camera_by_id.get(row.camera_id)
        items.append(
            ActivityItem(
                timestamp=row.timestamp,
                message=f"Customer #{row.customer_id} detected at {camera.camera_name if camera else 'a camera'}",
                camera_id=row.camera_id,
                zone_id=row.zone_id,
            )
        )
        if len(items) >= limit:
            break

    return ActivitiesResponse(store_id=effective_store_id, activities=items)


@router.get("/queue", response_model=QueueResponse)
def queue(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Queue Management, without queue-sensor hardware: any zone whose name
    suggests a checkout/queue area is treated as one "counter", live occupancy
    in that zone is the queue-length proxy, and its average dwell time (via
    app.analytics, reused rather than duplicated) is the wait-time proxy."""
    effective_store_id = _require_store(current_user, store_id)
    counter_zones = (
        db.query(Zone)
        .filter(Zone.store_id == effective_store_id, Zone.zone_name.ilike("%checkout%"))
        .all()
    )

    if not counter_zones:
        return QueueResponse(
            store_id=effective_store_id, counters=[], busy_threshold=QUEUE_BUSY_THRESHOLD,
            note="No checkout/queue zone configured for this store yet.",
        )

    repo = TrackingRepository(db)
    zone_ids = [z.id for z in counter_zones]
    live_since = datetime.now(timezone.utc) - timedelta(minutes=LIVE_WINDOW_MINUTES)

    dwell_by_zone = run_behavior_analysis(db, None, zone_ids, None, None).dwell_by_zone

    counters = []
    for zone in counter_zones:
        current_length = repo.unique_customers_for_zones([zone.id], since=live_since)
        avg_wait = dwell_by_zone.get(zone.id)
        counters.append(
            QueueCounterItem(
                zone_id=zone.id,
                zone_name=zone.zone_name,
                current_length=current_length,
                average_wait_seconds=avg_wait.average_seconds if avg_wait else 0.0,
                is_busy=current_length >= QUEUE_BUSY_THRESHOLD,
            )
        )

    return QueueResponse(
        store_id=effective_store_id,
        counters=sorted(counters, key=lambda c: c.current_length, reverse=True),
        busy_threshold=QUEUE_BUSY_THRESHOLD,
        note="Queue length is live occupancy of checkout-named zones (no dedicated queue sensor exists); wait time is that zone's average dwell duration.",
    )
