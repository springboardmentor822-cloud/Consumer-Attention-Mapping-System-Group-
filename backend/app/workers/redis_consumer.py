import asyncio
import logging
import datetime
import queue
import time
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.schemas import TrackingLog, InteractionLog, CameraEvent, Notification, AuditLog, Camera
import redis

from app.utils.logging import get_structured_logger

logger = get_structured_logger("redis_consumer")

try:
    r_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    r_client.ping()
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    r_client = None

# Local queue fallback for offline Redis
local_stream_queue = queue.Queue()

camera_store_cache = {}

def get_store_id(db: Session, camera_id: str):
    if camera_id in camera_store_cache:
        return camera_store_cache[camera_id]
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if camera:
        camera_store_cache[camera_id] = camera.store_id
        return camera.store_id
    return None


async def start_redis_consumers():
    global r_client
    logger.info("Initializing Partitioned Redis Streams Consumer Node...")
    
    if r_client:
        # Initialize Streams
        for stream_name in ["tracking_stream", "interaction_stream", "alert_stream", "notification_stream"]:
            try:
                r_client.xadd(stream_name, {"init": "true"}, id="0-1")
            except Exception:
                pass

    last_track_id = "$"
    last_int_id = "$"
    last_alert_id = "$"
    last_notif_id = "$"

    tracking_batch = []
    last_flush_time = asyncio.get_event_loop().time()

    from app.main import manager

    while True:
        try:
            db = SessionLocal()

            # Read from Redis or local queue
            if r_client:
                try:
                    streams_data = r_client.xread({
                        "tracking_stream": last_track_id,
                        "interaction_stream": last_int_id,
                        "alert_stream": last_alert_id,
                        "notification_stream": last_notif_id
                    }, block=1000, count=50)
                except Exception as e:
                    logger.warning(f"Redis link failed, reverting to local queue fallback: {e}")
                    r_client = None
                    streams_data = None
            else:
                messages = []
                try:
                    for _ in range(50):
                        msg = local_stream_queue.get_nowait()
                        messages.append(msg)
                except queue.Empty:
                    pass

                if messages:
                    streams_map = {}
                    for stream_name, fields in messages:
                        if stream_name not in streams_map:
                            streams_map[stream_name] = []
                        streams_map[stream_name].append((str(time.time()), fields))
                    streams_data = list(streams_map.items())
                else:
                    streams_data = None
                    await asyncio.sleep(0.1)

            if streams_data:
                for stream_name, messages in streams_data:
                    for msg_id, fields in messages:
                        if "init" in fields:
                            continue

                        # 1. TRACKING STREAM
                        if stream_name == "tracking_stream":
                            last_track_id = msg_id
                            camera_id = fields.get("camera_id")
                            shopper_id = fields.get("shopper_id")
                            x = float(fields.get("x", 0.0))
                            y = float(fields.get("y", 0.0))
                            zone_id = int(fields.get("zone_id", 0))
                            timestamp_str = fields.get("timestamp")
                            gaze_shelf_id = fields.get("gaze_facing_shelf_id")

                            store_id = get_store_id(db, camera_id)
                            if not store_id:
                                continue

                            ts = datetime.datetime.fromisoformat(timestamp_str) if timestamp_str else datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

                            # Calculate actual elapsed dwell time dynamically
                            oldest_log = db.query(TrackingLog).filter(
                                TrackingLog.shopper_id == shopper_id
                            ).order_by(TrackingLog.timestamp.asc()).first()
                            
                            dwell_seconds = 1.0
                            if oldest_log:
                                dwell_seconds = max(1.0, (ts - oldest_log.timestamp).total_seconds())

                            log_entry = TrackingLog(
                                timestamp=ts,
                                shopper_id=shopper_id,
                                camera_id=camera_id,
                                zone_id=zone_id,
                                x=x,
                                y=y,
                                gaze_facing_shelf_id=gaze_shelf_id or None,
                                dwell_time=dwell_seconds
                            )
                            tracking_batch.append(log_entry)

                            # Push live coordinate updates via WebSocket
                            import json
                            bbox_list = []
                            if "bbox" in fields:
                                try:
                                    bbox_list = json.loads(fields["bbox"])
                                except Exception:
                                    pass

                            await manager.broadcast(store_id, {
                                "type": "COORDINATES",
                                "shopper_id": shopper_id,
                                "camera_id": camera_id,
                                "zone_id": zone_id,
                                "x": x,
                                "y": y,
                                "bbox": bbox_list,
                                "gaze_facing_shelf_id": gaze_shelf_id or "",
                                "timestamp": ts.isoformat()
                            })

                        # 2. INTERACTION STREAM
                        elif stream_name == "interaction_stream":
                            last_int_id = msg_id
                            shopper_id = fields.get("shopper_id")
                            product_id = fields.get("product_id")
                            shelf_id = fields.get("shelf_id")
                            itype = fields.get("interaction_type") # viewed, pickup, returned, purchased
                            ts_str = fields.get("timestamp")
                            
                            ts = datetime.datetime.fromisoformat(ts_str) if ts_str else datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
                            int_log = InteractionLog(
                                timestamp=ts,
                                shopper_id=shopper_id,
                                product_id=product_id,
                                shelf_id=shelf_id,
                                interaction_type=itype
                            )
                            db.add(int_log)
                            db.commit()

                        # 3. ALERT STREAM (Camera events / Overcrowding)
                        elif stream_name == "alert_stream":
                            last_alert_id = msg_id
                            camera_id = fields.get("camera_id")
                            etype = fields.get("event_type")
                            details = fields.get("details")
                            ts_str = fields.get("timestamp")

                            ts = datetime.datetime.fromisoformat(ts_str) if ts_str else datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
                            event = CameraEvent(
                                timestamp=ts,
                                camera_id=camera_id,
                                event_type=etype,
                                details=details
                            )
                            db.add(event)
                            db.commit()

                            # Broadcast alert triggers over WebSocket too
                            store_id = get_store_id(db, camera_id)
                            if store_id:
                                await manager.broadcast(store_id, {
                                    "type": "CAMERA_ALERT",
                                    "camera_id": camera_id,
                                    "event_type": etype,
                                    "message": details,
                                    "timestamp": ts.isoformat()
                                })

                        # 4. NOTIFICATION STREAM (System-level alerts)
                        elif stream_name == "notification_stream":
                            last_notif_id = msg_id
                            store_id = fields.get("store_id")
                            ntype = fields.get("type")
                            message = fields.get("message")
                            
                            notif = Notification(
                                store_id=store_id,
                                type=ntype,
                                message=message,
                                is_read=False,
                                timestamp=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
                            )
                            db.add(notif)
                            db.commit()

            # Batch write tracking coordinates
            time_now = asyncio.get_event_loop().time()
            if (len(tracking_batch) >= 100 or (time_now - last_flush_time >= 1.0)) and tracking_batch:
                try:
                    db.add_all(tracking_batch)
                    db.commit()
                    logger.info(f"Batched {len(tracking_batch)} tracking logs written to database.")
                    tracking_batch = []
                    last_flush_time = time_now
                except Exception as e:
                    db.rollback()
                    logger.error(f"Failed to batch insert tracking logs: {e}")

            db.close()
        except Exception as e:
            logger.error(f"Error in stream consumer worker: {e}")
            await asyncio.sleep(2)

        await asyncio.sleep(0.01)
