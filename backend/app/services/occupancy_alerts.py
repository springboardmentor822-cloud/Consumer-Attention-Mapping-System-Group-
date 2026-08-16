"""
Overcrowding detection - the "alert pop-ups if overcrowding occurs" piece
from the Milestone 2 brief (Step 6).

Runs right after every occupancy update, from either producer
(tracking_simulator.py's simulated shoppers, or detection_pipeline.py's
real YOLOv8 + ByteTrack detections) - both feed the same occupancy counter,
so both can trigger this the same way.

Edge-triggered, not level-triggered: this fires once when the crowd first
crosses the limit, then stays quiet (using a Redis flag) until the crowd
thins back out below the limit, at which point it clears itself and will
fire again if it crosses back over later. Without this debounce, a store
sitting over capacity for 5 minutes would create hundreds of duplicate
notifications - the exact kind of notification-spam bug found earlier in
this project's original scoring job.
"""
import logging

from sqlalchemy.orm import Session

from app.core.redis_client import get_redis, overcrowding_flag_key
from app.core.websocket_manager import manager
from app.database import SessionLocal
from app.models.analytics import Notification
from app.models.enums import NotificationSeverityEnum, NotificationTypeEnum

logger = logging.getLogger("occupancy_alerts")

# Used when a store hasn't set its own max_capacity.
DEFAULT_MAX_CAPACITY = 15


async def check_overcrowding(store_id: int, total_occupancy: int, max_capacity: int | None) -> None:
    """Call this right after updating a store's live occupancy total (the
    Redis `occupancy:{store_id}` hash's "total" field)."""
    limit = max_capacity or DEFAULT_MAX_CAPACITY
    r = get_redis()
    flag_key = overcrowding_flag_key(store_id)

    was_alerting = (await r.get(flag_key)) == "1"
    is_over = total_occupancy > limit

    if is_over and not was_alerting:
        await r.set(flag_key, "1")
        await _raise_alert(store_id, total_occupancy, limit)
    elif not is_over and was_alerting:
        await r.delete(flag_key)
        await _clear_alert(store_id, total_occupancy, limit)


async def _raise_alert(store_id: int, total_occupancy: int, limit: int) -> None:
    message = (
        f"Store is overcrowded: {total_occupancy} people in store right now "
        f"(limit {limit}). Consider directing staff to manage the flow."
    )

    db: Session = SessionLocal()
    try:
        note = Notification(
            store_id=store_id,
            notification_type=NotificationTypeEnum.STORE_CONGESTION,
            severity=NotificationSeverityEnum.CRITICAL,
            message=message,
        )
        db.add(note)
        db.commit()
    finally:
        db.close()

    await manager.broadcast(
        store_id,
        {
            "type": "overcrowding_alert",
            "store_id": store_id,
            "total": total_occupancy,
            "limit": limit,
            "message": message,
        },
    )
    logger.warning("Overcrowding alert for store %s: %d/%d", store_id, total_occupancy, limit)


async def _clear_alert(store_id: int, total_occupancy: int, limit: int) -> None:
    await manager.broadcast(
        store_id,
        {
            "type": "overcrowding_cleared",
            "store_id": store_id,
            "total": total_occupancy,
            "limit": limit,
        },
    )
    logger.info("Overcrowding cleared for store %s: %d/%d", store_id, total_occupancy, limit)
