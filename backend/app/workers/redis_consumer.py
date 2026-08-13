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

def finalize_shopper_session(db: Session, shopper_identifier: str, exit_time):
    from app.models.session import Session as ShopperSession
    from app.models.tracking import TrackingLog
    from app.models.interaction import ProductInteraction
    import math

    sess = db.query(ShopperSession).filter(
        ShopperSession.shopper_identifier == shopper_identifier,
        ShopperSession.exit_time == None
    ).first()
    if not sess:
        return None

    logs = db.query(TrackingLog).filter(
        TrackingLog.shopper_id == shopper_identifier
    ).order_by(TrackingLog.timestamp.asc()).all()

    if not logs:
        entry_time = sess.entry_time
    else:
        entry_time = logs[0].timestamp

    sess.entry_time = entry_time
    sess.exit_time = exit_time
    duration = (exit_time - entry_time).total_seconds()
    sess.duration_seconds = max(1.0, duration)

    total_dist = 0.0
    stopping = 0
    prev_x, prev_y = None, None
    for log in logs:
        if prev_x is not None:
            dist = math.hypot(log.x - prev_x, log.y - prev_y)
            total_dist += dist
            if dist < 2.0:
                stopping += 1
        prev_x, prev_y = log.x, log.y

    sess.path_distance = total_dist
    sess.velocity = total_dist / sess.duration_seconds
    sess.stopping_events = stopping

    interactions = db.query(ProductInteraction).filter(
        ProductInteraction.session_id == sess.id
    ).all()
    
    sess.interaction_count = len(interactions)
    sess.shelf_visit_count = len(set(i.shelf_id for i in interactions if i.shelf_id))

    segment = "Explorer"
    if sess.duration_seconds < 40.0:
        if sess.interaction_count > 0:
            segment = "Quick Buyer"
        else:
            segment = "Impulse Buyer"
    else:
        if sess.shelf_visit_count == 1:
            segment = "Brand Loyal"
        elif sess.shelf_visit_count > 1:
            if sess.interaction_count > 2:
                segment = "Comparison Shopper"
            else:
                segment = "Explorer"

    sess.segment = segment

    # Populate zone_sequence based on zones visited
    from app.models.zone import Zone
    zones = db.query(Zone).filter(Zone.store_id == sess.store_id).all()
    zone_map = {str(z.id): z.name for z in zones}
    for z in zones:
        zone_map[str(z.name)] = z.name
        
    sequence = []
    for log in logs:
        zone_name = str(log.zone_id)
        if zone_name in zone_map:
            zone_name = zone_map[zone_name]
        sequence.append(zone_name)
        
    collapsed = []
    for item in sequence:
        if not collapsed or collapsed[-1] != item:
            collapsed.append(item)
            
    sess.zone_sequence = collapsed

    db.commit()
    print(f"[ANALYTICS] Finalized Session {shopper_identifier} | Segment: {segment} | Distance: {total_dist:.1f} | Duration: {duration:.1f}s")
    return sess

def get_store_id(db: Session, camera_id: str):
    if camera_id in camera_store_cache:
        return camera_store_cache[camera_id]
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if camera:
        camera_store_cache[camera_id] = camera.store_id
        return camera.store_id
    return None


def safe_broadcast(store_id: str, message: dict):
    try:
        import app.main as main_module
        loop = getattr(main_module, "main_loop", None)
        manager = getattr(main_module, "manager", None)
        if loop and loop.is_running() and manager:
            asyncio.run_coroutine_threadsafe(manager.broadcast(store_id, message), loop)
    except Exception as e:
        logger.error(f"Failed to safe_broadcast: {e}")

def start_redis_consumers():
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
    last_flush_time = time.time()
    session_last_active = {}

    while True:
        try:
            db = SessionLocal()

            # Read from Redis or local queue
            if r_client:
                # ... try block
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
                    time.sleep(0.1)

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

                            from app.models.session import Session as ShopperSession

                            # Find or create active session scoped by camera and shopper ID
                            sess = db.query(ShopperSession).filter(
                                ShopperSession.shopper_identifier.like(f"shopper_{camera_id}_{shopper_id}_%"),
                                ShopperSession.exit_time == None
                            ).first()

                            # Enforce a small, safe inactivity timeout of 30.0 seconds
                            if sess:
                                last_active = session_last_active.get(sess.shopper_identifier)
                                if not last_active:
                                    latest_log = db.query(TrackingLog).filter(
                                        TrackingLog.shopper_id == sess.shopper_identifier
                                    ).order_by(TrackingLog.timestamp.desc()).first()
                                    last_active = latest_log.timestamp if latest_log else sess.entry_time
                                    session_last_active[sess.shopper_identifier] = last_active

                                if (ts - last_active).total_seconds() > 30.0:
                                    finalize_shopper_session(db, sess.shopper_identifier, last_active)
                                    session_last_active.pop(sess.shopper_identifier, None)
                                    sess = None

                            if not sess:
                                unique_ident = f"shopper_{camera_id}_{shopper_id}_{int(ts.timestamp())}"
                                sess = ShopperSession(
                                    shopper_identifier=unique_ident,
                                    store_id=store_id,
                                    entry_time=ts
                                )
                                db.add(sess)
                                db.commit()
                                db.refresh(sess)
                                session_last_active[sess.shopper_identifier] = ts

                            # Calculate actual elapsed dwell time dynamically from session entry_time
                            dwell_seconds = max(1.0, (ts - sess.entry_time).total_seconds())
                            session_last_active[sess.shopper_identifier] = ts

                            log_entry_dict = {
                                "timestamp": ts,
                                "shopper_id": sess.shopper_identifier,
                                "camera_id": camera_id,
                                "zone_id": zone_id,
                                "x": x,
                                "y": y,
                                "gaze_facing_shelf_id": gaze_shelf_id or None,
                                "dwell_time": dwell_seconds
                            }
                            tracking_batch.append(log_entry_dict)

                            # Push live coordinate updates via WebSocket
                            import json
                            bbox_list = []
                            if "bbox" in fields:
                                try:
                                    bbox_list = json.loads(fields["bbox"])
                                except Exception:
                                    pass

                            safe_broadcast(store_id, {
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
                            camera_id = fields.get("camera_id", "unknown-camera")
                            
                            ts = datetime.datetime.fromisoformat(ts_str) if ts_str else datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
                            
                            from app.models.session import Session as ShopperSession
                            from app.models.product import Product
                            from app.models.shelf import Shelf
                            from app.models.store import Store
                            
                            prod_obj = None
                            if product_id:
                                prod_obj = db.query(Product).filter((Product.name.ilike(product_id)) | (Product.id == product_id)).first()
                            if not prod_obj:
                                prod_obj = db.query(Product).first()
                            real_product_id = prod_obj.id if prod_obj else product_id
                                    
                            shelf_obj = None
                            if shelf_id:
                                shelf_obj = db.query(Shelf).filter((Shelf.name.ilike(shelf_id)) | (Shelf.id == shelf_id)).first()
                            if not shelf_obj:
                                shelf_obj = db.query(Shelf).first()
                            real_shelf_id = shelf_obj.id if shelf_obj else shelf_id

                            # Look up active session
                            sess = db.query(ShopperSession).filter(
                                ShopperSession.shopper_identifier.like(f"shopper_{camera_id}_{shopper_id}_%"),
                                ShopperSession.exit_time == None
                            ).first()
                            
                            # Enforce a small, safe inactivity timeout of 30.0 seconds
                            if sess:
                                latest_log = db.query(TrackingLog).filter(
                                    TrackingLog.shopper_id == sess.shopper_identifier
                                ).order_by(TrackingLog.timestamp.desc()).first()
                                last_active = latest_log.timestamp if latest_log else sess.entry_time
                                if (ts - last_active).total_seconds() > 30.0:
                                    finalize_shopper_session(db, sess.shopper_identifier, last_active)
                                    sess = None

                            if not sess:
                                store_obj = db.query(Store).first()
                                store_id = store_obj.id if store_obj else "store-1"
                                unique_ident = f"shopper_{camera_id}_{shopper_id}_{int(ts.timestamp())}"
                                sess = ShopperSession(
                                    shopper_identifier=unique_ident,
                                    store_id=store_id,
                                    entry_time=ts
                                )
                                db.add(sess)
                                db.commit()
                                db.refresh(sess)
                                
                            int_log = InteractionLog(
                                timestamp=ts,
                                session_id=sess.id,
                                product_id=real_product_id,
                                shelf_id=real_shelf_id,
                                interaction_type=itype
                            )
                            db.add(int_log)
                            db.commit()
                            
                            if itype == "EXIT":
                                finalize_shopper_session(db, sess.shopper_identifier, ts)
                                try:
                                    safe_broadcast(sess.store_id, {
                                        "type": "ANALYTICS_UPDATE",
                                        "store_id": sess.store_id,
                                        "timestamp": ts.isoformat()
                                    })
                                except Exception:
                                    pass

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
                                safe_broadcast(store_id, {
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
            time_now = time.time()
            if (len(tracking_batch) >= 100 or (time_now - last_flush_time >= 1.0)) and tracking_batch:
                try:
                    db_objs = [TrackingLog(**fields) for fields in tracking_batch]
                    db.add_all(db_objs)
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
            time.sleep(2)

        time.sleep(0.01)
