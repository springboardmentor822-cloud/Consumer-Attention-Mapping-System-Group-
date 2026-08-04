import cv2
import os
import time
import json
import logging
import threading
import datetime
import math
from typing import Dict, Any, List
import redis
from app.core.config import settings
from app.ml.detector import PersonDetector
from app.ml.tracker import ByteTracker
from app.ml.gaze import estimate_gaze_direction, is_gaze_overlapping_shelf

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("video_ingestion")

try:
    r_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    r_client = None

active_streams: Dict[str, threading.Thread] = {}
stream_control: Dict[str, bool] = {}

# Global dictionary holding latest annotated JPEG frames per camera
latest_frames: Dict[str, bytes] = {}

# Dictionary keeping track of coordinate trajectories for motion trails
shopper_trails: Dict[str, Dict[str, List[tuple]]] = {}

class VideoIngestionService:
    def __init__(self, camera_id: str, video_source: str):
        self.camera_id = camera_id
        self.video_source = video_source
        self.detector = PersonDetector()
        self.tracker = ByteTracker()

    def process_stream(self):
        source = self.video_source
        if not source.startswith("rtsp://") and not os.path.isabs(source):
            from app.ml.dataset_registry import DatasetRegistry
            try:
                coco_path = DatasetRegistry.get_path("COCO")
                datasets_base = os.path.dirname(coco_path)
                chk_path = os.path.join(datasets_base, "videos", "sample", source)
                if os.path.exists(chk_path):
                    source = chk_path
            except Exception:
                chk_path = os.path.join("datasets", "videos", "sample", source)
                if os.path.exists(chk_path):
                    source = chk_path

        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            logger.error(f"Cannot open video source: {source}")
            return

        from app.core.database import SessionLocal
        from app.models.schemas import Zone, Camera, Shelf
        db = SessionLocal()
        zones = []
        shelves = []
        cam_name = "Camera Feed"
        try:
            cam = db.query(Camera).filter(Camera.id == self.camera_id).first()
            if cam:
                cam_name = cam.name
                db_zones = db.query(Zone).filter(Zone.store_id == cam.store_id).all()
                zones = [{"id": z.id, "x": z.x, "y": z.y, "width": z.width, "height": z.height, "name": z.name} for z in db_zones]
                db_shelves = db.query(Shelf).filter(Shelf.store_id == cam.store_id).all()
                shelves = [{"id": s.id, "name": s.name, "x": s.x, "y": s.y, "width": s.width, "height": s.height} for s in db_shelves]
        except Exception as e:
            logger.error(f"Failed to load layout entities for camera {self.camera_id}: {e}")
        finally:
            db.close()

        fps_calc = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_interval = int(fps_calc / 5) or 1
        frame_count = 0

        # Maintain local trails for this camera
        if self.camera_id not in shopper_trails:
            shopper_trails[self.camera_id] = {}
        trails = shopper_trails[self.camera_id]

        prev_time = time.time()

        while cap.isOpened() and stream_control.get(self.camera_id, False):
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            # Calculate actual processing FPS
            curr_time = time.time()
            actual_fps = 1.0 / (curr_time - prev_time + 1e-6)
            prev_time = curr_time

            if frame_count % frame_interval == 0:
                frame_resized = cv2.resize(frame, (640, 480))
                
                # Draw database shelf areas
                for sh in shelves:
                    # Shelves coords in mock DB are scaled for 640x480 screen placement
                    sx = int(sh["x"])
                    sy = int(sh["y"])
                    sw = int(sh["width"])
                    sh_h = int(sh["height"])
                    cv2.rectangle(frame_resized, (sx, sy), (sx + sw, sy + sh_h), (0, 0, 180), 1)
                    cv2.putText(frame_resized, sh["name"], (sx + 5, sy + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 180), 1)

                # Draw database zone overlays
                for z in zones:
                    # Zones are represented as percentages of the floor layout
                    zx = int((z["x"] / 100.0) * 640.0)
                    zy = int((z["y"] / 100.0) * 480.0)
                    zw = int((z["width"] / 100.0) * 640.0)
                    zh = int((z["height"] / 100.0) * 480.0)
                    cv2.rectangle(frame_resized, (zx, zy), (zx + zw, zy + zh), (100, 100, 0), 1)
                    cv2.putText(frame_resized, z["name"], (zx + 5, zy + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100, 100, 0), 1)

                detections = self.detector.detect(frame_resized)
                tracks = self.tracker.update(detections)

                now_str = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).isoformat()
                for trk in tracks:
                    bbox = trk["bbox"]
                    x1, y1, x2, y2 = map(int, bbox)
                    cx = (x1 + x2) / 2.0
                    cy = (y1 + y2) / 2.0
                    nx = (cx / 640.0) * 100.0
                    ny = (cy / 480.0) * 100.0

                    track_id = str(trk["track_id"])

                    # Save motion trail coordinates
                    if track_id not in trails:
                        trails[track_id] = []
                    trails[track_id].append((int(cx), int(cy)))
                    if len(trails[track_id]) > 15:
                        trails[track_id].pop(0)

                    # Dynamic Zone Mapping using centroid-in-polygon
                    zone_id = 1
                    active_zone_name = "Entrance Foyer"
                    for z in zones:
                        if z["x"] <= nx <= z["x"] + z["width"] and z["y"] <= ny <= z["y"] + z["height"]:
                            if "entrance" in z["name"].lower() or "entrance" in z["id"].lower():
                                zone_id = 1
                                active_zone_name = z["name"]
                            elif "aisle" in z["name"].lower() or "aisle" in z["id"].lower():
                                zone_id = 2
                                active_zone_name = z["name"]
                            elif "checkout" in z["name"].lower() or "checkout" in z["id"].lower():
                                zone_id = 3
                                active_zone_name = z["name"]
                            break

                    # Estimate Gaze & Head Pose
                    gaze_shelf_id = None
                    gaze_data = estimate_gaze_direction(bbox, frame=frame_resized)
                    if gaze_data:
                        # Draw Gaze Line vector
                        head_x = int(gaze_data.get("nose_x", cx))
                        head_y = int(gaze_data.get("nose_y", y1 + (y2 - y1) * 0.1))
                        yaw_rad = math.radians(gaze_data.get("yaw", 0.0))
                        gaze_len = 60
                        gx = int(head_x + gaze_len * math.cos(yaw_rad))
                        gy = int(head_y + gaze_len * math.sin(yaw_rad))
                        cv2.line(frame_resized, (head_x, head_y), (gx, gy), (0, 255, 255), 2)
                        
                        # Find overlapping shelf
                        for sh in shelves:
                            if is_gaze_overlapping_shelf(gaze_data, bbox, sh):
                                gaze_shelf_id = sh["id"]
                                break

                    # Draw Bounding Box & Labels
                    cv2.rectangle(frame_resized, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    label = f"ID: {track_id} Conf: {trk['confidence']:.2f}"
                    cv2.putText(frame_resized, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)

                    event = {
                        "shopper_id": track_id,
                        "timestamp": now_str,
                        "camera_id": self.camera_id,
                        "x": float(nx),
                        "y": float(ny),
                        "zone_id": int(zone_id),
                        "bbox": json.dumps(bbox),
                        "confidence": float(trk["confidence"]),
                        "gaze_facing_shelf_id": gaze_shelf_id or ""
                    }
                    if r_client:
                        try:
                            r_client.xadd("tracking_stream", event)
                        except Exception as e:
                            logger.error(f"Redis Stream push failed, using local queue: {e}")
                            from app.workers.redis_consumer import local_stream_queue
                            local_stream_queue.put(("tracking_stream", event))
                    else:
                        from app.workers.redis_consumer import local_stream_queue
                        local_stream_queue.put(("tracking_stream", event))

                # Draw motion trails
                for t_id, pts in list(trails.items()):
                    for i in range(1, len(pts)):
                        cv2.line(frame_resized, pts[i-1], pts[i], (0, 255, 0), 1)
                        cv2.circle(frame_resized, pts[i], 2, (0, 255, 0), -1)

                # Draw Status HUD overlays
                cv2.putText(frame_resized, f"FPS: {actual_fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                cv2.putText(frame_resized, f"People: {len(tracks)}", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                cv2.putText(frame_resized, f"Camera: {cam_name}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
                cv2.putText(frame_resized, datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)

                # Encode and buffer
                ret_enc, jpeg = cv2.imencode('.jpg', frame_resized)
                if ret_enc:
                    latest_frames[self.camera_id] = jpeg.tobytes()

                time.sleep(0.1)

            frame_count += 1

        cap.release()

def start_stream(camera_id: str, video_source: str, store_id: str, zone_id: int):
    global active_streams, stream_control
    if camera_id in active_streams and active_streams[camera_id].is_alive():
        logger.info(f"Stream {camera_id} is already running.")
        return

    stream_control[camera_id] = True
    service = VideoIngestionService(camera_id, video_source)
    t = threading.Thread(target=service.process_stream, args=(), daemon=True)
    active_streams[camera_id] = t
    t.start()

def stop_stream(camera_id: str):
    global stream_control
    if camera_id in stream_control:
        stream_control[camera_id] = False
        logger.info(f"Signal sent to stop camera stream {camera_id}")
