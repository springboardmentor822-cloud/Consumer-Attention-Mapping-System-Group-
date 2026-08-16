"""
Rule-based alerting. Intended to be invoked periodically (e.g. from a
cron job / Celery beat / simple asyncio background task in main.py).
"""
import datetime as dt

from sqlalchemy.orm import Session

from app.models.analytics import Notification, ProductAttractivenessScore
from app.models.camera import Camera
from app.models.enums import CameraStatusEnum, NotificationSeverityEnum, NotificationTypeEnum
from app.models.session import ShopperSession

CAMERA_OFFLINE_THRESHOLD_MINUTES = 5
LOW_SCORE_THRESHOLD = 20.0
TRAFFIC_SPIKE_SESSIONS_PER_HOUR = 50


def check_camera_health(db: Session) -> list[Notification]:
    cutoff = dt.datetime.utcnow() - dt.timedelta(minutes=CAMERA_OFFLINE_THRESHOLD_MINUTES)
    stale_cameras = (
        db.query(Camera)
        .filter(
            Camera.status != CameraStatusEnum.OFFLINE,
            (Camera.last_heartbeat_at.is_(None)) | (Camera.last_heartbeat_at < cutoff),
        )
        .all()
    )
    notifications = []
    for camera in stale_cameras:
        camera.status = CameraStatusEnum.OFFLINE
        note = Notification(
            store_id=camera.store_id,
            camera_id=camera.id,
            notification_type=NotificationTypeEnum.CAMERA_OFFLINE,
            severity=NotificationSeverityEnum.CRITICAL,
            message=f"Camera '{camera.name}' has not reported a heartbeat in over "
            f"{CAMERA_OFFLINE_THRESHOLD_MINUTES} minutes and has been marked offline.",
        )
        db.add(note)
        notifications.append(note)
    db.commit()
    return notifications


def check_low_product_visibility(db: Session, store_id: int) -> list[Notification]:
    low_scores = (
        db.query(ProductAttractivenessScore)
        .filter(ProductAttractivenessScore.total_score < LOW_SCORE_THRESHOLD)
        .order_by(ProductAttractivenessScore.computed_at.desc())
        .limit(50)
        .all()
    )
    notifications = []
    for score in low_scores:
        note = Notification(
            store_id=store_id,
            product_id=score.product_id,
            notification_type=NotificationTypeEnum.PRODUCT_LOW_VISIBILITY,
            severity=NotificationSeverityEnum.WARNING,
            message=f"Product {score.product_id} has a low attractiveness score "
            f"({score.total_score}/100) for the period {score.period_start} - {score.period_end}.",
        )
        db.add(note)
        notifications.append(note)
    db.commit()
    return notifications


def check_traffic_spike(db: Session, store_id: int) -> Notification | None:
    one_hour_ago = dt.datetime.utcnow() - dt.timedelta(hours=1)
    recent_sessions = (
        db.query(ShopperSession)
        .filter(ShopperSession.store_id == store_id, ShopperSession.entry_time >= one_hour_ago)
        .count()
    )
    if recent_sessions < TRAFFIC_SPIKE_SESSIONS_PER_HOUR:
        return None
    note = Notification(
        store_id=store_id,
        notification_type=NotificationTypeEnum.TRAFFIC_SPIKE,
        severity=NotificationSeverityEnum.WARNING,
        message=f"Store {store_id} recorded {recent_sessions} shopper entries in the last hour, "
        f"exceeding the {TRAFFIC_SPIKE_SESSIONS_PER_HOUR}/hour threshold.",
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note
