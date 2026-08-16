import json
import time
import logging
import threading
from typing import Dict, List, Any
from sqlalchemy import insert
from app.core.database import SessionLocal
from app.models.models import ShopperPosition, Camera
from app.core.redis_client import redis_client

logger = logging.getLogger("telemetry_worker")
logging.basicConfig(level=logging.INFO)

class TelemetryWorker:
    def __init__(self):
        self.running = False
        self.worker_thread = None
        self.last_read_id = "0"
        self.batch_size = 100
        self.flush_interval_seconds = 2.0
        self.inactivity_timeout_seconds = 10.0

    def start(self):
        if self.running:
            return
        self.running = True
        self.worker_thread = threading.Thread(target=self._run_loop, daemon=True)
        self.worker_thread.start()
        logger.info("Telemetry background worker started.")

    def stop(self):
        self.running = False
        if self.worker_thread and self.worker_thread.is_alive():
            self.worker_thread.join(timeout=1.0)
        logger.info("Telemetry background worker stopped.")

    def _run_loop(self):
        last_flush_time = time.time()
        accumulator: List[Dict[str, Any]] = []

        while self.running:
            try:
                # 1. Read from Redis Stream 'telemetry_ingest'
                # Block for up to 1000ms, reading up to self.batch_size messages
                stream_events = redis_client.xread(
                    streams={"telemetry_ingest": self.last_read_id}, 
                    count=self.batch_size, 
                    block=100
                )

                if stream_events:
                    for stream_name, messages in stream_events:
                        for msg_id, fields in messages:
                            self.last_read_id = msg_id
                            
                            # Parse telemetry data
                            try:
                                shopper_data = {
                                    "camera_id": int(fields["camera_id"]),
                                    "shopper_id": int(fields["shopper_id"]),
                                    "x": float(fields["x"]),
                                    "y": float(fields["y"]),
                                    "dwell_time": int(fields["dwell_time"]),
                                    "gaze_target": fields.get("gaze_target"),
                                    "gaze_x": float(fields["gaze_x"]) if fields.get("gaze_x") else None,
                                    "gaze_y": float(fields["gaze_y"]) if fields.get("gaze_y") else None,
                                    "object_type": fields.get("object_type", "person"),
                                    "confidence": float(fields.get("confidence", "0.96")),
                                    "label": fields.get("label", "Person"),
                                    "timestamp": fields.get("timestamp")  # Optional timestamp override
                                }
                                
                                # Add to DB insert accumulator
                                accumulator.append({
                                    "camera_id": shopper_data["camera_id"],
                                    "shopper_id": shopper_data["shopper_id"],
                                    "x": shopper_data["x"],
                                    "y": shopper_data["y"],
                                    "dwell_time": shopper_data["dwell_time"],
                                    "gaze_target": shopper_data["gaze_target"],
                                    "gaze_x": shopper_data["gaze_x"],
                                    "gaze_y": shopper_data["gaze_y"]
                                    # timestamp defaults to utc_now in model
                                })
                                
                                # Update real-time state in Redis hashes
                                self._update_redis_state(shopper_data)

                            except Exception as parse_err:
                                logger.error(f"Error parsing telemetry stream message: {parse_err}")

                # 2. Bulk Save to database when batch size is reached or interval elapsed
                current_time = time.time()
                if len(accumulator) >= self.batch_size or (current_time - last_flush_time >= self.flush_interval_seconds):
                    if accumulator:
                        self._bulk_save(accumulator)
                        accumulator.clear()
                    last_flush_time = current_time

                # 3. Perform periodic pruning of inactive shoppers (every 3 seconds)
                if int(current_time) % 3 == 0:
                    self._prune_inactive_shoppers()

            except Exception as e:
                logger.error(f"Worker loop error: {e}")
                time.sleep(1.0)

    def _update_redis_state(self, data: Dict[str, Any]):
        camera_id = data["camera_id"]
        shopper_id = data["shopper_id"]
        
        # We need store_id to update store occupancy. We can lookup or cache camera -> store relationships.
        # For simplicity, query or use camera_id to find store context.
        store_id = self._get_store_id_for_camera(camera_id)
        if not store_id:
            return

        # Write shopper state to Redis hash: store:{store_id}:camera:{camera_id}:shoppers
        hash_key = f"store:{store_id}:camera:{camera_id}:shoppers"
        shopper_state = {
            "shopper_id": shopper_id,
            "x": data["x"],
            "y": data["y"],
            "dwell_time": data["dwell_time"],
            "gaze_target": data["gaze_target"] or "",
            "gaze_x": data["gaze_x"] if data["gaze_x"] is not None else "",
            "gaze_y": data["gaze_y"] if data["gaze_y"] is not None else "",
            "object_type": data.get("object_type", "person"),
            "confidence": data.get("confidence", 0.96),
            "label": data.get("label", "Person"),
            "last_seen": time.time()
        }
        
        # Save as JSON string under key shopper_id
        redis_client.hset(hash_key, str(shopper_id), json.dumps(shopper_state))

    def _prune_inactive_shoppers(self):
        # Fetch all camera keys from active store keys or cameras
        # We can discover them by keys pattern or database query
        db = SessionLocal()
        try:
            cameras = db.query(Camera).all()
            now = time.time()
            
            # Map unique active shoppers across the whole store
            # key: store:{store_id}:occupancy
            store_occupants: Dict[int, set] = {}

            for camera in cameras:
                store_id = camera.store_id
                if store_id not in store_occupants:
                    store_occupants[store_id] = set()

                hash_key = f"store:{store_id}:camera:{camera.id}:shoppers"
                shoppers_hash = redis_client.hgetall(hash_key)
                
                for shopper_id_str, val_json in shoppers_hash.items():
                    try:
                        state = json.loads(val_json)
                        last_seen = state.get("last_seen", 0)
                        if now - last_seen > self.inactivity_timeout_seconds:
                            # Prune from hash
                            redis_client.hdel(hash_key, shopper_id_str)
                            logger.info(f"Pruned inactive shopper #{shopper_id_str} from camera #{camera.id}")
                        else:
                            store_occupants[store_id].add(int(shopper_id_str))
                    except Exception as err:
                        logger.error(f"Error pruning shopper {shopper_id_str}: {err}")

            # Update live store occupancy counters in Redis
            for store_id, occupants in store_occupants.items():
                redis_client.set(f"store:{store_id}:occupancy", len(occupants))

        except Exception as e:
            logger.error(f"Error during shopper pruning: {e}")
        finally:
            db.close()

    def _bulk_save(self, positions: List[Dict[str, Any]]):
        db = SessionLocal()
        try:
            db.execute(insert(ShopperPosition), positions)
            db.commit()
            logger.debug(f"Successfully batch-saved {len(positions)} shopper coordinates to database.")
        except Exception as e:
            db.rollback()
            logger.error(f"Database bulk save failed: {e}")
        finally:
            db.close()

    # Cached mapping of camera_id to store_id to avoid redundant queries
    _camera_store_cache: Dict[int, int] = {}

    def _get_store_id_for_camera(self, camera_id: int) -> Optional[int]:
        if camera_id in self._camera_store_cache:
            return self._camera_store_cache[camera_id]
        
        db = SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.id == camera_id).first()
            if camera:
                self._camera_store_cache[camera_id] = camera.store_id
                return camera.store_id
        except Exception as e:
            logger.error(f"Error fetching store_id for camera {camera_id}: {e}")
        finally:
            db.close()
        return None

# Global background worker instance
telemetry_worker = TelemetryWorker()
