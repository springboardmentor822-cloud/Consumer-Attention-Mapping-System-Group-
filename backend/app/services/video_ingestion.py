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
from app.ml.detector import PersonDetector, ProductDetector
from app.ml.tracker import ByteTracker
from app.ml.gaze import estimate_gaze_direction, is_gaze_overlapping_shelf
from app.ml.interaction_engine import InteractionEngine

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
latest_clean_frames: Dict[str, bytes] = {}

# Dictionary keeping track of coordinate trajectories for motion trails
shopper_trails: Dict[str, Dict[str, List[tuple]]] = {}

class ProductTracker:
    def __init__(self):
        self.next_id = 1
        self.tracks = {} # id -> (bbox, last_seen, hits)

    def update(self, detected_products):
        updated_tracks = {}
        for p in detected_products:
            p_bbox = p["bbox"]
            px1, py1, px2, py2 = p_bbox
            pcx = (px1 + px2) / 2
            pcy = (py1 + py2) / 2
            
            # Find best match in existing tracks
            best_id = None
            best_dist = 50.0 # threshold distance for matching static products
            for tid, (tbox, _, _) in self.tracks.items():
                tcx = (tbox[0] + tbox[2]) / 2
                tcy = (tbox[1] + tbox[3]) / 2
                dist = math.hypot(pcx - tcx, pcy - tcy)
                if dist < best_dist:
                    best_dist = dist
                    best_id = tid
            
            if best_id is not None:
                tbox, last_seen, hits = self.tracks[best_id]
                new_hits = min(hits + 1, 100)
                updated_tracks[best_id] = (p_bbox, time.time(), new_hits)
                p["id"] = best_id
                p["hits"] = new_hits
            else:
                new_id = self.next_id
                self.next_id += 1
                updated_tracks[new_id] = (p_bbox, time.time(), 1)
                p["id"] = new_id
                p["hits"] = 1
                
        # Keep old tracks that were recently seen
        for tid, (tbox, last_seen, hits) in self.tracks.items():
            if tid not in updated_tracks and (time.time() - last_seen) < 1.5:
                updated_tracks[tid] = (tbox, last_seen, hits)
                
        self.tracks = updated_tracks
        return detected_products

class VideoIngestionService:
    def __init__(self, camera_id: str, video_source: str):
        self.camera_id = camera_id
        self.video_source = video_source
        self.detector = PersonDetector()
        self.product_detector = ProductDetector()
        self.tracker = ByteTracker()
        self.interaction_engine = InteractionEngine()
        self.product_tracker = ProductTracker()

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

        # Interaction state tracking per shopper (track_id -> tracking info dict)
        interaction_states = {}

        prev_time = time.time()

        while cap.isOpened() and stream_control.get(self.camera_id, False):
            loop_start = time.time()
            
            if frame_count % frame_interval == 0:
                ret, frame = cap.read()
                if not ret:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue

                # Calculate actual processing FPS
                curr_time = time.time()
                actual_fps = 1.0 / (curr_time - prev_time + 1e-6)
                prev_time = curr_time

                frame_resized = cv2.resize(frame, (640, 480))
                clean_frame = frame_resized.copy()
                
                # No zone or shelf rectangles drawn directly on video per requirements

                detections = self.detector.detect(frame_resized)
                tracks = self.tracker.update(detections)
                raw_products = self.product_detector.detect(frame_resized)
                nms_products = self.product_detector.nms(raw_products, iou_threshold=0.35, max_products=100)
                products = self.product_tracker.update(nms_products)

                # Draw detected products/objects
                for p in products:
                    hits = p.get("hits", 0)
                    if hits < 5:
                        continue
                    px1, py1, px2, py2 = map(int, p["bbox"])
                    pw = px2 - px1
                    ph = py2 - py1
                    
                    # Discard giant background rectangles
                    if pw >= 80 or ph >= 120 or pw < 8 or ph < 8:
                        continue
                        
                    cv2.rectangle(frame_resized, (px1, py1), (px2, py2), (0, 180, 0), 1)
                    cv2.putText(
                        frame_resized,
                        f"Product #{p['id']}",
                        (px1, max(10, py1 - 4)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.35,
                        (0, 180, 0),
                        1,
                        cv2.LINE_AA
                    )

                now_str = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).isoformat()
                
                # Loop through tracked shoppers
                for trk in tracks:
                    bbox = trk["bbox"]
                    x1, y1, x2, y2 = map(int, bbox)
                    cx = (x1 + x2) / 2.0
                    cy = (y1 + y2) / 2.0
                    nx = (cx / 640.0) * 100.0
                    ny = (cy / 480.0) * 100.0

                    track_id = str(trk["track_id"])

                    if track_id not in trails:
                        trails[track_id] = []
                    trails[track_id].append((int(cx), int(cy)))
                    if len(trails[track_id]) > 15:
                        trails[track_id].pop(0)

                    # Dynamic Zone Mapping
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
                        head_x = int(gaze_data.get("nose_x", cx))
                        head_y = int(gaze_data.get("nose_y", y1 + (y2 - y1) * 0.1))
                        yaw_rad = math.radians(gaze_data.get("yaw", 0.0))
                        gaze_len = 60
                        gx = int(head_x + gaze_len * math.cos(yaw_rad))
                        gy = int(head_y + gaze_len * math.sin(yaw_rad))
                        cv2.line(frame_resized, (head_x, head_y), (gx, gy), (0, 255, 255), 2)
                        
                        for sh in shelves:
                            if is_gaze_overlapping_shelf(gaze_data, bbox, sh):
                                gaze_shelf_id = sh["id"]
                                break

                    # Run Advanced Interaction Engine
                    eng_out = self.interaction_engine.update_shopper(
                        track_id=track_id,
                        cx=cx,
                        cy=cy,
                        bbox=bbox,
                        shelves=shelves,
                        products=products,
                        zones=zones,
                        camera_id=self.camera_id
                    )
                    
                    # Log event dynamically if state changes to a verified interaction
                    if eng_out["state"] in ["VIEWING_SHELF", "PICKUP_CANDIDATE", "RETURN_CANDIDATE"]:
                        from app.workers.redis_consumer import local_stream_queue
                        local_stream_queue.put(("interaction_stream", eng_out["payload"]))

                    # Draw Bounding Box (subtle BLUE box for person)
                    cv2.rectangle(frame_resized, (x1, y1), (x2, y2), (255, 100, 0), 1)
                    
                    # Display ONLY requested HUD text showing walking/observing/interacting status
                    y_offset = max(15, y1 - 25)
                    status_display = "WALKING"
                    if eng_out["state"] in ["PICKUP_CANDIDATE", "RETURN_CANDIDATE"]:
                        status_display = f"INTERACTING (Dwell: {eng_out['dwell_time']:.1f}s)"
                    elif eng_out["state"] in ["VIEWING_SHELF", "INTERACTING_WITH_PRODUCT"]:
                        status_display = "OBSERVING"
                        
                    cv2.putText(frame_resized, f"Shopper #{track_id}", (x1, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 100, 0), 1)
                    cv2.putText(frame_resized, f"Status: {status_display}", (x1, y_offset + 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 100, 0), 1)

                    # Apply Kalman Filter coordinate smoothing
                    from app.ml.filters.kalman import kalman_manager
                    smoothed_nx, smoothed_ny = kalman_manager.get_smoothed_coords(
                        self.camera_id, track_id, nx, ny
                    )

                    event = {
                        "shopper_id": track_id,
                        "timestamp": now_str,
                        "camera_id": self.camera_id,
                        "x": float(smoothed_nx),
                        "y": float(smoothed_ny),
                        "zone_id": int(eng_out["zone_id"]),
                        "bbox": json.dumps(bbox),
                        "confidence": float(trk["confidence"]),
                        "gaze_facing_shelf_id": gaze_shelf_id or ""
                    }
                    from app.workers.redis_consumer import local_stream_queue
                    local_stream_queue.put(("tracking_stream", event))

                # Track lost/exit event handling
                current_active_ids = {str(trk["track_id"]) for trk in tracks}
                for sh_id in list(self.interaction_engine.shoppers.keys()):
                    if sh_id not in current_active_ids:
                        exit_payload = self.interaction_engine.handle_exit(sh_id)
                        if exit_payload:
                            from app.workers.redis_consumer import local_stream_queue
                            local_stream_queue.put(("interaction_stream", exit_payload))
                            
                            # Clean up Kalman filter state on exit
                            from app.ml.filters.kalman import kalman_manager
                            kalman_manager.remove_filter(self.camera_id, sh_id)
                            if sh_id in trails:
                                del trails[sh_id]

                # Draw motion trails only for active tracks
                for t_id, pts in list(trails.items()):
                    if t_id in current_active_ids:
                        for i in range(1, len(pts)):
                            cv2.line(frame_resized, pts[i-1], pts[i], (255, 100, 0), 1)
                            cv2.circle(frame_resized, pts[i], 1, (255, 100, 0), -1)

                # No Status HUD overlays drawn per requirements

                # Encode and buffer
                ret_enc, jpeg = cv2.imencode('.jpg', frame_resized)
                if ret_enc:
                    latest_frames[self.camera_id] = jpeg.tobytes()

                ret_enc_clean, jpeg_clean = cv2.imencode('.jpg', clean_frame)
                if ret_enc_clean:
                    latest_clean_frames[self.camera_id] = jpeg_clean.tobytes()

                time.sleep(0.1)
            else:
                ret = cap.grab()
                if not ret:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                # Sleep to match video FPS rate for skipped frames and yield control to the GIL
                time.sleep(max(0.015, 1.0 / fps_calc))

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
