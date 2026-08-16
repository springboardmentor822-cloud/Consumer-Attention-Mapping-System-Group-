import asyncio
import logging
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.utils.logging import get_structured_logger
from app.core.database import SessionLocal
from app.models.schemas import TrackingLog, ProductInteraction as InteractionLog, CameraEvent, Notification, Camera, Store, Shelf, Product
from app.services.video_ingestion import active_streams, stream_control

logger = get_structured_logger("notification_worker")

def is_duplicate_alert(db: Session, store_id: str, ntype: str, message: str) -> bool:
    two_hours_ago = datetime.datetime.now() - datetime.timedelta(hours=2)
    notif_exists = db.query(Notification).filter(
        Notification.store_id == store_id,
        Notification.type == ntype,
        Notification.message == message,
        Notification.timestamp >= two_hours_ago
    ).first()
    return notif_exists is not None

def is_duplicate_event(db: Session, camera_id: str, etype: str, details: str) -> bool:
    two_hours_ago = datetime.datetime.now() - datetime.timedelta(hours=2)
    event_exists = db.query(CameraEvent).filter(
        CameraEvent.camera_id == camera_id,
        CameraEvent.event_type == etype,
        CameraEvent.details == details,
        CameraEvent.timestamp >= two_hours_ago
    ).first()
    return event_exists is not None

async def start_notification_worker():
    """
    Subscribes to notifications and prints system-level alerts
    """
    logger.info("Initializing Notification Push Worker Node...")

    while True:
        db = None
        try:
            db = SessionLocal()

            # 1. Forward structure and mark unreads
            unreads = db.query(Notification).filter(Notification.is_read == False).all()
            for notif in unreads:
                logger.info(f"FORWARDING ALERT: [{notif.type}] {notif.message}")
                notif.is_read = True
            db.commit()

            # 2. Evaluate alert rules
            now = datetime.datetime.now()
            one_hour_ago = now - datetime.timedelta(hours=1)
            five_mins_ago = now - datetime.timedelta(minutes=5)

            current_hour = now.hour
            is_open_hours = 9 <= current_hour < 21

            stores = db.query(Store).all()
            for store in stores:
                cameras = db.query(Camera).filter(Camera.store_id == store.id).all()
                cam_ids = [c.id for c in cameras]

                if not cam_ids:
                    continue

                total_logs_last_hour = db.query(TrackingLog).filter(
                    TrackingLog.camera_id.in_(cam_ids),
                    TrackingLog.timestamp >= one_hour_ago
                ).count()

                if total_logs_last_hour > 0:
                    # SHELF_LOW_PERFORMANCE
                    shelves = db.query(Shelf).filter(Shelf.store_id == store.id).all()
                    for shelf in shelves:
                        gaze_count = db.query(TrackingLog).filter(
                            TrackingLog.camera_id.in_(cam_ids),
                            TrackingLog.gaze_facing_shelf_id == shelf.id,
                            TrackingLog.timestamp >= one_hour_ago
                        ).count()

                        if gaze_count < 10:
                            msg = f"Shelf '{shelf.name}' engagement has fallen below the threshold (Gaze count: {gaze_count} in the last hour)."
                            if not is_duplicate_alert(db, store.id, "Shelf", msg):
                                notif = Notification(
                                    store_id=store.id,
                                    type="Shelf",
                                    message=msg,
                                    is_read=False,
                                    timestamp=now
                                )
                                db.add(notif)
                                db.commit()
                                logger.info(f"Generated Shelf Alert: {msg}")

                    # PRODUCT_LOW_VISIBILITY
                    products = db.query(Product).filter(Product.store_id == store.id).all()
                    for prod in products:
                        view_count = db.query(InteractionLog).filter(
                            InteractionLog.product_id == prod.id,
                            InteractionLog.interaction_type == "viewed",
                            InteractionLog.timestamp >= one_hour_ago
                        ).count()

                        if view_count < 5:
                            msg = f"Product '{prod.name}' has poor visibility (Views: {view_count} in the last hour)."
                            if not is_duplicate_alert(db, store.id, "Product", msg):
                                notif = Notification(
                                    store_id=store.id,
                                    type="Product",
                                    message=msg,
                                    is_read=False,
                                    timestamp=now
                                )
                                db.add(notif)
                                db.commit()
                                logger.info(f"Generated Product Alert: {msg}")

                # Traffic alerts and hardware monitoring
                for camera in cameras:
                    distinct_shoppers = db.query(func.count(func.distinct(TrackingLog.shopper_id))).filter(
                        TrackingLog.camera_id == camera.id,
                        TrackingLog.timestamp >= five_mins_ago
                    ).scalar() or 0

                    # CROWD_ALERT
                    if distinct_shoppers > 30:
                        details = f"High congestion detected at '{camera.name}' ({distinct_shoppers} distinct shopper tracks in 5 mins)."
                        if not is_duplicate_event(db, camera.id, "CROWD_ALERT", details):
                            event = CameraEvent(
                                camera_id=camera.id,
                                event_type="CROWD_ALERT",
                                details=details,
                                timestamp=now
                            )
                            db.add(event)
                            db.commit()
                            logger.info(f"Generated CameraEvent: {details}")

                    # TRAFFIC_DROP_ALERT
                    if distinct_shoppers == 0 and is_open_hours:
                        details = f"Sudden traffic drop detected at '{camera.name}' (0 logs in last 5 minutes)."
                        if not is_duplicate_event(db, camera.id, "TRAFFIC_DROP_ALERT", details):
                            event = CameraEvent(
                                camera_id=camera.id,
                                event_type="TRAFFIC_DROP_ALERT",
                                details=details,
                                timestamp=now
                            )
                            db.add(event)
                            db.commit()
                            logger.info(f"Generated CameraEvent: {details}")

                    # CAMERA_DISCONNECT (Strict thread active_streams logic)
                    if camera.is_active:
                        is_disconnected = False
                        if camera.id not in active_streams:
                            is_disconnected = True
                        else:
                            thread = active_streams[camera.id]
                            if not thread.is_alive():
                                is_disconnected = True
                            elif not stream_control.get(camera.id, False):
                                is_disconnected = True

                        if is_disconnected:
                            details = f"Camera '{camera.name}' stream connection offline."
                            if not is_duplicate_event(db, camera.id, "CAMERA_DISCONNECT", details):
                                event = CameraEvent(
                                    camera_id=camera.id,
                                    event_type="CAMERA_DISCONNECT",
                                    details=details,
                                    timestamp=now
                                )
                                db.add(event)
                                db.commit()
                                logger.info(f"Generated CameraEvent: {details}")

        except Exception as e:
            logger.error(f"Error in notification worker: {e}")
        finally:
            if db:
                db.close()

        await asyncio.sleep(10)
