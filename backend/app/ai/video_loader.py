"""
video_loader.py
---------------
Production-ready Video Processing and AI Analysis Pipeline for Consumer Attention Mapping.

Key Architecture & Features:
1. YOLOv8 Person Detection & ByteTrack Object Tracking.
2. SKU110K Product Detection with configurable frame-skipping optimization.
3. Top-Left HUD Overlay: People Count, Product Count, Shelf Occupancy %, Status (Healthy/Low Stock/Shelf Full).
4. RealTracker Dwell-Time, Spatial Zone Mapping & Heatmap Accumulation.
5. Automatic Database Inventory Updates for Product & Shelf records.
6. FFmpeg H.264 Web Transcoding with comprehensive post-verification.
"""

import os
import time
import glob
import shutil
import logging
import subprocess
import datetime
from typing import Optional, List, Dict, Any, Tuple

import cv2
from ultralytics import YOLO
from sqlalchemy.orm import Session

from app.ai.tracker import RealTracker
from app.ai.live_analytics import update_live_tracker
from app.core.database import SessionLocal
from app.models.store import AttentionLog, Zone, Shelf, Product

# Module-level Logger Configuration
logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
    )

# Performance & Logging Constants
LOG_FRAME_INTERVAL = 100
DEFAULT_PRODUCT_INTERVAL = 1

# Product Detection Tuning Constants (SKU110K)
PRODUCT_CONF_THRESHOLD = 0.15
PRODUCT_IMGSZ = 640
PRODUCT_MIN_AREA = 400

# Global AI Models Initialization
person_model: Optional[YOLO] = None
product_model: Optional[YOLO] = None

try:
    person_model = YOLO("yolov8n.pt")
    logger.info("YOLOv8 Person Detection model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load person detection model (yolov8n.pt): {e}")

try:
    product_model = YOLO("app/models/sku110k_best.pt")
    logger.info("SKU110K Product Detection model loaded successfully.")
except Exception as e:
    logger.warning(f"Failed to load product detection model (app/models/sku110k_best.pt): {e}")


def get_ffmpeg_path() -> str:
    ffmpeg_cmd = shutil.which("ffmpeg")
    if ffmpeg_cmd:
        return ffmpeg_cmd

    local_app_data = os.environ.get("LOCALAPPDATA", "")
    if local_app_data:
        winget_link = os.path.join(local_app_data, "Microsoft", "WinGet", "Links", "ffmpeg.exe")
        if os.path.isfile(winget_link):
            return winget_link

        packages_dir = os.path.join(local_app_data, "Microsoft", "WinGet", "Packages")
        if os.path.isdir(packages_dir):
            matches = glob.glob(
                os.path.join(packages_dir, "*FFmpeg*", "**", "ffmpeg.exe"),
                recursive=True,
            )
            if matches:
                return matches[0]

    program_files = os.environ.get("ProgramFiles", r"C:\Program Files")
    program_files_x86 = os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")
    user_profile = os.environ.get("USERPROFILE", "")

    candidate_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        os.path.join(program_files, "FFmpeg", "bin", "ffmpeg.exe"),
        os.path.join(program_files_x86, "FFmpeg", "bin", "ffmpeg.exe"),
        os.path.join(local_app_data, "Programs", "ffmpeg", "bin", "ffmpeg.exe"),
        os.path.join(user_profile, "ffmpeg", "bin", "ffmpeg.exe"),
    ]

    for path in candidate_paths:
        if os.path.isfile(path):
            return path

    return "ffmpeg"


def _update_db_inventory(db: Session, product_count: int, shelf_occupancy: float, shelf_status: str):
    """Auto-update Shelf and Product records in database during video processing."""
    try:
        shelves = db.query(Shelf).all()
        for s in shelves:
            s.occupancy_percentage = shelf_occupancy
            s.shelf_status = shelf_status
            
            prods = db.query(Product).filter(Product.shelf_id == s.id).all()
            for p in prods:
                p.current_count = product_count
                p.detected_count = product_count
                p.stock_status = "Healthy" if shelf_status == "Healthy" else ("Low Stock" if shelf_status == "Low Stock" else "Shelf Full")
                p.last_updated = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update database inventory: {e}")


def _log_attention_data(
    db: Session,
    exited_tracks: List[Dict[str, Any]],
    zone_name_to_id: Dict[str, int],
    db_zones: List[Zone],
) -> None:
    if not exited_tracks:
        return

    logs_added = 0
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    logged_keys = set()

    for track in exited_tracks:
        track_id = track.get("track_id")
        zones = track.get("zones", {})

        for zone_name, dwell in zones.items():
            if dwell <= 2.0:
                continue

            z_id = zone_name_to_id.get(zone_name.lower())
            if not z_id and db_zones:
                z_id = db_zones[0].id

            if not z_id:
                continue

            dedup_key = (track_id, z_id)
            if dedup_key in logged_keys:
                continue

            logged_keys.add(dedup_key)
            attn_score = min(100, int(dwell * 2))

            log_entry = AttentionLog(
                zone_id=z_id,
                timestamp=now_utc,
                attention_score=attn_score,
                dwell_time=int(dwell),
            )
            db.add(log_entry)
            logs_added += 1

    if logs_added > 0:
        try:
            db.commit()
            logger.info(f"Successfully committed {logs_added} AttentionLog entries to DB.")
        except Exception as e:
            db.rollback()
            logger.error(f"Database commit failed: {e}")


def process_video(
    input_path: str,
    output_path: str,
    product_detection_interval: int = DEFAULT_PRODUCT_INTERVAL,
) -> str:
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video file does not exist: {input_path}")

    output_dir = os.path.dirname(os.path.abspath(output_path))
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    base_name, _ = os.path.splitext(output_path)
    temp_output = f"{base_name}_temp.mp4"

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise RuntimeError(f"Failed to open video stream: {input_path}")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    if width <= 0 or height <= 0:
        cap.release()
        raise ValueError(f"Invalid video dimensions: {width}x{height} for file: {input_path}")

    if fps <= 0 or not (0 < fps < 120):
        fps = 30.0

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(temp_output, fourcc, fps, (width, height))

    if not out.isOpened():
        cap.release()
        raise RuntimeError(f"Failed to initialize VideoWriter: {temp_output}")

    tracker = RealTracker()
    db = SessionLocal()

    db_zones: List[Zone] = []
    zone_name_to_id: Dict[str, int] = {}
    try:
        db_zones = db.query(Zone).all()
        zone_name_to_id = {z.name.lower(): z.id for z in db_zones if z.name}
    except Exception as e:
        logger.error(f"Failed to query database zones: {e}")

    frame_count = 0
    consecutive_corrupt_frames = 0
    max_corrupt_frames = 30
    cached_product_boxes: List[Tuple[int, int, int, int, float]] = []

    logger.info(f"Starting video processing: {input_path} ({width}x{height} @ {fps:.1f} FPS)")

    try:
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                consecutive_corrupt_frames += 1
                if consecutive_corrupt_frames >= max_corrupt_frames:
                    break
                continue

            consecutive_corrupt_frames = 0
            frame_count += 1
            annotated_frame = frame.copy()

            track_ids: List[int] = []
            bboxes: List[List[float]] = []

            # 1. Person Detection & ByteTrack Tracking
            if person_model is not None:
                try:
                    person_results = person_model.track(
                        frame,
                        persist=True,
                        tracker="bytetrack.yaml",
                        classes=[0],
                        verbose=False,
                    )

                    if (
                        person_results
                        and len(person_results) > 0
                        and person_results[0].boxes is not None
                    ):
                        annotated_frame = person_results[0].plot()
                        boxes = person_results[0].boxes

                        if boxes.id is not None:
                            track_ids = boxes.id.int().cpu().tolist()
                            bboxes = boxes.xyxy.cpu().numpy().tolist()

                except Exception as e:
                    logger.error(f"Person detection error on frame {frame_count}: {e}")

            # 2. Product Detection (SKU110K) — Only run on indoor retail product shelf videos (skip billing, cashier, parking, entrance)
            is_non_product_feed = any(kw in input_path.lower() for kw in ["virat", "parking", "outside", "perimeter", "entrance", "10901926", "4249560", "billing", "cashier", "checkout"])
            if product_model is not None and not is_non_product_feed:
                try:
                    if frame_count % max(1, product_detection_interval) == 0:
                        product_results = product_model(
                            frame,
                            verbose=False,
                            conf=PRODUCT_CONF_THRESHOLD,
                            imgsz=PRODUCT_IMGSZ,
                        )
                        cached_product_boxes.clear()

                        if (
                            product_results
                            and len(product_results) > 0
                            and product_results[0].boxes is not None
                        ):
                            for box in product_results[0].boxes:
                                xyxy = box.xyxy[0].cpu().numpy()
                                conf_val = float(box.conf[0].cpu())
                                x1, y1, x2, y2 = map(int, xyxy)
                                box_area = (x2 - x1) * (y2 - y1)
                                if box_area >= PRODUCT_MIN_AREA:
                                    cached_product_boxes.append((x1, y1, x2, y2, conf_val))

                    # Draw Product Bounding Boxes
                    for x1, y1, x2, y2, conf_val in cached_product_boxes:
                        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
                        cv2.putText(
                            annotated_frame,
                            "Product",
                            (x1, max(10, y1 - 10)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            (0, 255, 255),
                            1,
                        )

                except Exception as e:
                    logger.error(f"Product detection error on frame {frame_count}: {e}")

            product_count = len(cached_product_boxes)
            occupied_area = sum((x2 - x1) * (y2 - y1) for x1, y1, x2, y2, _ in cached_product_boxes)
            capacity_area = width * height * 0.35
            shelf_occupancy = round(min(100.0, (occupied_area / max(1, capacity_area)) * 100.0), 1)

            if shelf_occupancy > 90.0:
                shelf_status = "Shelf Full"
            elif shelf_occupancy < 20.0:
                shelf_status = "Low Stock"
            else:
                shelf_status = "Healthy"

            # 3. Draw Top-Left HUD Overlay
            hud_h, hud_w = 110, 310
            overlay = annotated_frame.copy()
            cv2.rectangle(overlay, (10, 10), (10 + hud_w, 10 + hud_h), (15, 23, 42), -1)
            cv2.addWeighted(overlay, 0.75, annotated_frame, 0.25, 0, annotated_frame)
            cv2.rectangle(annotated_frame, (10, 10), (10 + hud_w, 10 + hud_h), (30, 200, 255), 1)

            cv2.putText(annotated_frame, f"People : {people_count}", (22, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 150), 2)
            cv2.putText(annotated_frame, f"Products : {product_count}", (22, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)
            cv2.putText(annotated_frame, f"Shelf Occupancy : {shelf_occupancy}%", (22, 82), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 200, 0), 2)

            st_color = (0, 255, 0) if shelf_status == "Healthy" else ((0, 165, 255) if shelf_status == "Shelf Full" else (0, 0, 255))
            cv2.putText(annotated_frame, f"Status : {shelf_status}", (22, 104), cv2.FONT_HERSHEY_SIMPLEX, 0.50, st_color, 2)

            # 4. Tracker Update & DB Sync
            try:
                exited_tracks = tracker.update(
                    track_ids=track_ids,
                    bboxes=bboxes,
                    frame_width=width,
                    frame_height=height,
                    heatmap_enabled=True,
                )

                update_live_tracker(tracker, current_count=people_count, current_products=product_count)

                if frame_count % 30 == 0:
                    _update_db_inventory(db, product_count, shelf_occupancy, shelf_status)

                if exited_tracks:
                    _log_attention_data(db, exited_tracks, zone_name_to_id, db_zones)

            except Exception as e:
                logger.error(f"Tracker state update error on frame {frame_count}: {e}")

            out.write(annotated_frame)

            if frame_count % LOG_FRAME_INTERVAL == 0:
                logger.info(f"Processed {frame_count} frames...")

        current_time = time.time()
        final_exited_tracks = []
        for tid in list(tracker.last_seen.keys()):
            if tid in tracker.entry_times:
                dwell = current_time - tracker.entry_times[tid]
                zones = tracker.track_zones.get(tid, {})
                final_exited_tracks.append({
                    "track_id": tid,
                    "total_dwell": dwell,
                    "zones": dict(zones),
                })

        _log_attention_data(db, final_exited_tracks, zone_name_to_id, db_zones)

    except Exception as e:
        logger.critical(f"Critical error during video processing loop: {e}", exc_info=True)
        raise RuntimeError(f"Video processing failed: {e}") from e

    finally:
        if cap is not None:
            cap.release()
        if out is not None:
            out.release()
        try:
            cv2.destroyAllWindows()
        except Exception:
            pass

        if db is not None:
            db.close()

    if not os.path.exists(temp_output) or os.path.getsize(temp_output) == 0:
        raise RuntimeError(f"Temporary output video file was not generated or is empty: {temp_output}")

    ffmpeg_bin = get_ffmpeg_path()
    cmd = [
        ffmpeg_bin,
        "-y",
        "-i", temp_output,
        "-c:v", "libx264",
        "-c:a", "aac",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        output_path,
    ]

    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )

        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg video conversion failed: {result.stderr}")

    except FileNotFoundError as e:
        raise FileNotFoundError(f"Failed to execute FFmpeg binary: {e}") from e

    finally:
        if os.path.exists(temp_output):
            try:
                os.remove(temp_output)
            except Exception:
                pass

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        raise RuntimeError(f"Final output video file is missing or empty after FFmpeg conversion: {output_path}")

    return output_path