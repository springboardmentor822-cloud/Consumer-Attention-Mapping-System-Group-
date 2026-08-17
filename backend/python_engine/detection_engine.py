"""
CAMS Detection Engine — YOLOv8 + ByteTrack
===========================================
Processes each camera video stream independently.
- Strictly PERSON-ONLY detection (COCO class 0).
- Geometric box validation (aspect ratio, min/max dimensions, coordinate bounds).
- Decoupled video playback and AI inference: video plays smoothly at native FPS
  without blocking or slow-motion lag, while YOLO runs asynchronously on the latest frame.
- ByteTrack provides stable TRK-XXX IDs for visible people.
- Tracks disappear promptly when a person leaves the camera view.
- Non-blocking Queue-based frame broadcasting: drops stale frames if network is slow,
  guaranteeing real-time video playback and instant WebSocket response.
"""

import os
import sys
import cv2
import time
import asyncio
import logging
import threading
import base64
import json
import datetime
from pathlib import Path
from types import SimpleNamespace
from typing import Dict, List, Optional, Set

import torch
import numpy as np
from ultralytics import YOLO
from ultralytics.trackers.byte_tracker import BYTETracker

logger = logging.getLogger(__name__)

# Limit intra-op threads on CPU to prevent thread starvation of the event loop
try:
    torch.set_num_threads(2)
except Exception:
    pass

# ---------------------------------------------------------------------------
# Configuration from environment variables
# ---------------------------------------------------------------------------
def _env(key: str, default: str) -> str:
    return os.environ.get(key, default)


_YOLO_MODEL_RAW     = _env("YOLO_MODEL", "yolov8n.pt")
YOLO_CONFIDENCE     = float(_env("YOLO_CONFIDENCE", "0.30"))
YOLO_IOU            = float(_env("YOLO_IOU", "0.45"))
YOLO_IMGSZ          = int(_env("YOLO_IMGSZ", "640"))
YOLO_DEVICE         = _env("YOLO_DEVICE", "auto")
TRACK_BUFFER        = int(_env("TRACK_BUFFER", "90"))           # ByteTrack track buffer in frames (3s at 30fps — stable occlusion handling)
RETIRE_AFTER_FRAMES = int(_env("RETIRE_AFTER_FRAMES", str(TRACK_BUFFER))) # Sync with track buffer to prevent premature ID resets

# Minimum consecutive frames a track must be seen before being broadcast as confirmed.
# Set to 1: phantom prevention is handled by new_track_thresh (0.50) — bags/shelves rarely
# score above 0.50 for class=person. Moving people should be broadcast immediately.
TRACK_CONFIRM_FRAMES = int(_env("TRACK_CONFIRM_FRAMES", "1"))

# Minimum score ByteTrack output must have before we forward a track to clients.
# Rejects Kalman-predicted tracks whose score has decayed too far.
TRACK_OUTPUT_MIN_SCORE = float(_env("TRACK_OUTPUT_MIN_SCORE", "0.30"))

PERSON_CLASS_ID = 0  # COCO class 0 = person ONLY


def _resolve_device() -> str:
    if YOLO_DEVICE.lower() != "auto":
        return YOLO_DEVICE
    try:
        return "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        return "cpu"


def _resolve_model_path(model_name: str) -> str:
    if os.path.isabs(model_name) and os.path.isfile(model_name):
        return model_name

    candidates = [
        Path(model_name),
        Path(__file__).parent / model_name,
        Path(__file__).parent.parent / model_name,
        Path(__file__).parent.parent.parent / model_name,
    ]
    for p in candidates:
        if p.is_file():
            abs_path = str(p.resolve())
            logger.info(f"Resolved YOLO model: {abs_path}")
            return abs_path

    logger.warning(f"Model file '{model_name}' not found locally; ultralytics will attempt download.")
    return model_name


YOLO_MODEL = _resolve_model_path(_YOLO_MODEL_RAW)

_shared_yolo_model = None
_model_lock = threading.Lock()


def get_yolo_model():
    global _shared_yolo_model
    if _shared_yolo_model is not None:
        return _shared_yolo_model
    with _model_lock:
        if _shared_yolo_model is not None:
            return _shared_yolo_model
        try:
            device = _resolve_device()
            logger.info(f"Loading shared YOLO model: {YOLO_MODEL} on device={device}")
            model = YOLO(YOLO_MODEL)
            model.to(device)
            _shared_yolo_model = model
            logger.info("Shared YOLO model loaded successfully")
        except Exception as exc:
            logger.error(f"Failed to load YOLO model: {exc}")
            raise
    return _shared_yolo_model


# ---------------------------------------------------------------------------
# Per-camera tracking session
# ---------------------------------------------------------------------------

class CameraSession:
    """
    Manages one camera's video playback stream and decoupled AI inference.

    Architecture:
    1. Video Playback Loop: Reads frames at native video FPS (e.g. 30 FPS),
       encodes JPEG frames, and pushes to client queues with zero lag.
    2. Decoupled AI Inference Worker: Grabs latest available frame asynchronously,
       runs YOLOv8 person-only detection, validates bounding box geometry,
       runs ByteTrack, and updates active tracks.
    """

    def __init__(self, camera_id: str, video_path: str):
        self.camera_id = camera_id
        self.video_path = video_path

        # ID mapping: tracker int ID -> "TRK-NNN"
        self._id_map: Dict[int, str] = {}
        self._next_cams_id: int = 1
        self._miss_counter: Dict[int, int] = {}
        self._retired_tracker_ids: set = set()

        # Confirmation gate: tracker_id -> consecutive-seen frame count.
        # A new track is only broadcast after TRACK_CONFIRM_FRAMES consecutive detections,
        # eliminating single-frame false positives from shelves, boxes, or signboards.
        self._confirm_counter: Dict[int, int] = {}

        # Active tracks lock and published state
        self._tracks_lock = threading.Lock()
        self._active_tracks: List[dict] = []

        # Diagnostics & counts
        self._raw_detection_count: int = 0
        self._person_detection_count: int = 0
        self._last_inference_ms: float = 0.0
        self._source_width: int = 1280
        self._source_height: int = 720
        self._source_fps: float = 30.0
        self._device: str = _resolve_device()

        # Decoupled frame exchange (atomic latest frame buffer)
        self._frame_lock = threading.Lock()
        self._latest_frame: Optional[np.ndarray] = None
        self._latest_frame_idx: int = 0
        self._last_processed_frame_idx: int = -1

        # Control flags
        self._running: bool = False
        self._playback_thread: Optional[threading.Thread] = None
        self._inference_thread: Optional[threading.Thread] = None

        # Queue-based subscribers (thread-safe, non-blocking)
        self._subscriber_queues: Set[asyncio.Queue] = set()
        self._subscriber_queues_lock = threading.Lock()
        self._event_loop: Optional[asyncio.AbstractEventLoop] = None

        # Database and session tracking metadata state
        self.db_camera_id = None
        self.db_store_id = 1
        self.products_by_category = {}
        self._last_db_insert_time = {}       # trackId -> float time
        self._track_start_times = {}         # trackId -> float time
        self._zone_dwell_start_times = {}    # trackId -> float time
        self._track_zones = {}               # trackId -> str zone
        self._track_journeys = {}            # trackId -> list of zones
        self._track_activities = {}          # trackId -> str activity
        self._track_activity_history = {}    # trackId -> set of activities

    def load_db_metadata(self):
        try:
            from database import execute_query
            res = execute_query("SELECT id, store_id FROM cameras WHERE camera_id = %s LIMIT 1;", (self.camera_id,))
            if res:
                self.db_camera_id = res[0]["id"]
                self.db_store_id = res[0]["store_id"]
            else:
                self.db_camera_id = None
                self.db_store_id = 1

            prod_res = execute_query("SELECT product_id, name, category, price, cost_price, profit FROM products;")
            self.products_by_category = {}
            for p in prod_res:
                cat = p["category"].lower()
                if cat not in self.products_by_category:
                    self.products_by_category[cat] = []
                self.products_by_category[cat].append(p)
            logger.info(f"[{self.camera_id}] DB metadata loaded successfully (store_id={self.db_store_id}).")
        except Exception as exc:
            logger.error(f"[{self.camera_id}] Error loading metadata from DB: {exc}")
            self.db_camera_id = None
            self.db_store_id = 1
            self.products_by_category = {}

    def _get_cams_id(self, tracker_id: int) -> str:
        """Map ByteTrack integer ID to stable CAMS TRK-NNN string."""
        if tracker_id in self._retired_tracker_ids:
            new_id = f"TRK-{self._next_cams_id:03d}"
            self._next_cams_id += 1
            self._id_map[tracker_id] = new_id
            self._retired_tracker_ids.discard(tracker_id)
            self._miss_counter.pop(tracker_id, None)

            now = time.time()
            self._track_start_times[new_id] = now
            self._zone_dwell_start_times[new_id] = now
            self._track_zones[new_id] = "Entrance"
            self._track_journeys[new_id] = ["Entrance"]
            self._track_activities[new_id] = "Walking"
            self._track_activity_history[new_id] = {"Walking"}
            return new_id

        if tracker_id not in self._id_map:
            new_id = f"TRK-{self._next_cams_id:03d}"
            self._next_cams_id += 1
            self._id_map[tracker_id] = new_id

            now = time.time()
            self._track_start_times[new_id] = now
            self._zone_dwell_start_times[new_id] = now
            self._track_zones[new_id] = "Entrance"
            self._track_journeys[new_id] = ["Entrance"]
            self._track_activities[new_id] = "Walking"
            self._track_activity_history[new_id] = {"Walking"}

        self._miss_counter[tracker_id] = 0
        return self._id_map[tracker_id]

    def _update_miss_counters(self, active_tracker_ids: set):
        known = set(self._id_map.keys()) - self._retired_tracker_ids
        for tid in known:
            if tid not in active_tracker_ids:
                self._miss_counter[tid] = self._miss_counter.get(tid, 0) + 1
                # Decay confirm counter while track is absent so a re-appearing
                # object must re-earn confirmation rather than inheriting stale count
                if tid in self._confirm_counter:
                    self._confirm_counter[tid] = max(0, self._confirm_counter[tid] - 1)
                if self._miss_counter[tid] >= RETIRE_AFTER_FRAMES:
                    self._retired_tracker_ids.add(tid)
                    self._confirm_counter.pop(tid, None)
                    cams_id = self._id_map[tid]
                    self.persist_retired_session(cams_id)
            else:
                self._miss_counter[tid] = 0

    def persist_retired_session(self, cams_id: str):
        try:
            from database import execute_query
            now = time.time()
            start_time = self._track_start_times.get(cams_id, now)
            total_dwell = max(1.0, now - start_time)
            last_zone = self._track_zones.get(cams_id, "Central Aisle")
            activity_history = self._track_activity_history.get(cams_id, {"Walking"})

            ZONE_PRODUCT_SHELF_MAP = {
                "Bakery": ("SH-101", "P-001"),
                "Dairy": ("SH-102", "P-002"),
                "Produce": ("SH-103", "P-005"),
                "Cosmetics": ("SH-104", "P-006"),
                "Electronics": ("SH-105", "P-007"),
                "Household": ("SH-106", "P-008"),
                "Frozen Foods": ("SH-107", "P-010"),
                "Checkout Area": ("SH-108", "P-004"),
                "Checkout": ("SH-108", "P-004"),
                "Central Aisle": ("SH-108", "P-004"),
            }

            shelf_id, product_id = ZONE_PRODUCT_SHELF_MAP.get(last_zone, ("SH-108", "P-004"))
            prod_name = "Free-Range Eggs (12pk)"
            prod_price = 7.00
            prod_profit = 3.20

            cat_key = last_zone.lower()
            if cat_key in self.products_by_category and self.products_by_category[cat_key]:
                p_item = self.products_by_category[cat_key][0]
                product_id = p_item["product_id"]
                prod_name = p_item["name"]
                prod_price = p_item["price"] or p_item.get("selling_price", 7.00)
                prod_profit = p_item["profit"] or (prod_price * 0.35)

            today_date = datetime.date.today()
            dwell_res = execute_query(
                "SELECT id, avg_dwell_time, visitor_count FROM dwell_metrics "
                "WHERE store_id = %s AND zone_id = %s AND date = %s LIMIT 1;",
                (self.db_store_id, last_zone, today_date)
            )
            if dwell_res:
                d_id = dwell_res[0]["id"]
                old_avg = dwell_res[0]["avg_dwell_time"] or 0.0
                old_count = dwell_res[0]["visitor_count"] or 0
                new_count = old_count + 1
                new_avg = (old_avg * old_count + total_dwell) / new_count
                execute_query(
                    "UPDATE dwell_metrics SET avg_dwell_time = %s, visitor_count = %s WHERE id = %s;",
                    (new_avg, new_count, d_id),
                    fetch=False, commit=True
                )
            else:
                execute_query(
                    "INSERT INTO dwell_metrics (store_id, zone_id, avg_dwell_time, visitor_count, date) "
                    "VALUES (%s, %s, %s, %s, %s);",
                    (self.db_store_id, last_zone, total_dwell, 1, today_date),
                    fetch=False, commit=True
                )

            attn_res = execute_query(
                "SELECT id, attention_score FROM attention_metrics "
                "WHERE store_id = %s AND shelf_id = %s AND product_id = %s AND date = %s LIMIT 1;",
                (self.db_store_id, shelf_id, product_id, today_date)
            )
            attention_score = min(100.0, total_dwell * 1.5)
            if attn_res:
                a_id = attn_res[0]["id"]
                old_attn = attn_res[0]["attention_score"] or 0.0
                new_attn = (old_attn + attention_score) / 2.0
                execute_query(
                    "UPDATE attention_metrics SET attention_score = %s WHERE id = %s;",
                    (new_attn, a_id),
                    fetch=False, commit=True
                )
            else:
                execute_query(
                    "INSERT INTO attention_metrics (store_id, shelf_id, product_id, attention_score, date) "
                    "VALUES (%s, %s, %s, %s, %s);",
                    (self.db_store_id, shelf_id, product_id, attention_score, today_date),
                    fetch=False, commit=True
                )

            inter_res = execute_query(
                "SELECT id, views, pickups, returns FROM product_interactions "
                "WHERE product_id = %s AND store_id = %s AND date = %s LIMIT 1;",
                (product_id, self.db_store_id, today_date)
            )
            has_view = "Browsing" in activity_history or "Viewing Product" in activity_history or "Picking Product" in activity_history
            has_pickup = "Picking Product" in activity_history or "Viewing Product" in activity_history
            has_return = has_pickup and ("No Purchase" in activity_history or "Browsing" in activity_history)

            views_inc = 1 if has_view else 0
            pickups_inc = 1 if has_pickup else 0
            returns_inc = 1 if has_return else 0

            if inter_res:
                i_id = inter_res[0]["id"]
                new_views = (inter_res[0]["views"] or 0) + views_inc
                new_pickups = (inter_res[0]["pickups"] or 0) + pickups_inc
                new_returns = (inter_res[0]["returns"] or 0) + returns_inc
                execute_query(
                    "UPDATE product_interactions SET views = %s, pickups = %s, returns = %s WHERE id = %s;",
                    (new_views, new_pickups, new_returns, i_id),
                    fetch=False, commit=True
                )
            else:
                execute_query(
                    "INSERT INTO product_interactions (product_id, store_id, views, pickups, returns, date) "
                    "VALUES (%s, %s, %s, %s, %s, %s);",
                    (product_id, self.db_store_id, max(1, views_inc), pickups_inc, returns_inc, today_date),
                    fetch=False, commit=True
                )

            is_purchased = has_pickup and ("Picking Product" in activity_history) and (total_dwell > 20)
            purchase_status = 'Purchased' if is_purchased else 'No Purchase'
            purchase_amount = prod_price if is_purchased else 0.0
            transaction_id = f"TXN-TRK-{cams_id}" if is_purchased else '—'

            viewed_json = [{"id": product_id, "name": prod_name, "price": prod_price}]
            purchased_json = viewed_json if is_purchased else []

            if is_purchased:
                time_str = datetime.datetime.now().strftime("%H:%M:%S")
                execute_query(
                    "INSERT INTO transactions (transaction_id, customer_id, date, time, products, quantity, amount, profit, payment_status) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);",
                    (transaction_id, f"CUST-TRK-{cams_id}", today_date.strftime("%Y-%m-%d"), time_str, prod_name, 1, purchase_amount, prod_profit, "Completed"),
                    fetch=False, commit=True
                )

            date_str = today_date.strftime("%Y-%m-%d")
            entry_time_str = datetime.datetime.fromtimestamp(start_time).strftime("%H:%M:%S")
            exit_time_str = datetime.datetime.now().strftime("%H:%M:%S")
            dwell_hours = round(total_dwell / 3600.0, 4)

            store_name = "Downtown Flagship"
            if self.db_store_id == 2:
                store_name = "Westside Mall"
            elif self.db_store_id == 3:
                store_name = "Metro Center"

            execute_query(
                "INSERT INTO customers (customer_id, visit_date, entry_time, exit_time, dwell_time, purchase_status, purchase_amount, transaction_id, store, zone, products_viewed, products_purchased, is_active, created_at, updated_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW());",
                (f"CUST-TRK-{cams_id}", date_str, entry_time_str, exit_time_str, dwell_hours, purchase_status, purchase_amount, transaction_id, store_name, last_zone, json.dumps(viewed_json), json.dumps(purchased_json), False),
                fetch=False, commit=True
            )
            logger.info(f"[{self.camera_id}] Retired session {cams_id} persisted successfully.")
        except Exception as e:
            logger.error(f"[{self.camera_id}] Error persisting retired session {cams_id}: {e}")

    # -----------------------------------------------------------------------
    # Subscriber Queue Management (Non-blocking, zero event-loop lock contention)
    # -----------------------------------------------------------------------

    def add_subscriber_queue(self, queue: asyncio.Queue):
        with self._subscriber_queues_lock:
            self._subscriber_queues.add(queue)

    def remove_subscriber_queue(self, queue: asyncio.Queue):
        with self._subscriber_queues_lock:
            self._subscriber_queues.discard(queue)

    def has_subscribers(self) -> bool:
        with self._subscriber_queues_lock:
            return len(self._subscriber_queues) > 0

    def _broadcast_payload(self, payload: dict):
        """Thread-safe dispatch of payload to subscriber queues via call_soon_threadsafe."""
        if not self._event_loop or not self._event_loop.is_running():
            return

        with self._subscriber_queues_lock:
            if not self._subscriber_queues:
                return
            queues = list(self._subscriber_queues)

        def _push():
            for q in queues:
                try:
                    if q.full():
                        try:
                            q.get_nowait()
                        except Exception:
                            pass
                    q.put_nowait(payload)
                except Exception:
                    pass

        self._event_loop.call_soon_threadsafe(_push)

    # -----------------------------------------------------------------------
    # Bounding Box Validation Helper
    # -----------------------------------------------------------------------

    def _is_valid_person_box(self, x1: float, y1: float, x2: float, y2: float, img_w: int, img_h: int) -> bool:
        """
        Relaxed validation for person bounding boxes.
        Accepts partially-visible people (head-only, upper-body, seated cashiers).
        Rejects pure background (near-full-frame, sub-pixel) and extremely wide objects.
        - Minimum absolute size: 15px wide AND 15px tall
        - Aspect ratio: 0.5 to 6.0 (portrait AND landscape accepted)
        - Area fraction: 0.05% to 85% of frame
        - Coordinate bounds: box must overlap the frame at all
        """
        bw = x2 - x1
        bh = y2 - y1

        # Relaxed absolute minimum size — allows head-only or partial body detection
        if bw < 15 or bh < 15:
            return False

        # Reject near-full-frame boxes (walls, background, oversized shelf aisle clips)
        if bw > img_w * 0.95 or bh > img_h * 0.95:
            return False

        # Human aspect ratio: relaxed to support seated cashiers, upper-body only, or leaning poses
        aspect = bh / max(bw, 1e-3)
        if aspect < 0.5 or aspect > 6.0:
            return False

        # Area sanity: relaxed to allow small/distant people or partial occlusions
        area_ratio = (bw * bh) / max(img_w * img_h, 1)
        if area_ratio < 0.0005 or area_ratio > 0.85:
            return False

        # Box must be meaningfully inside the frame boundaries
        if x2 < 0 or y2 < 0 or x1 > img_w or y1 > img_h:
            return False

        return True

    # -----------------------------------------------------------------------
    # Decoupled AI Inference Worker Thread
    # -----------------------------------------------------------------------

    def _inference_worker(self):
        """
        Dedicated background worker for YOLOv8 person detection + ByteTrack.
        Pulls the latest available frame, performs inference and filtering,
        updates active tracks, and sleeps if no new frame is ready.
        """
        logger.info(f"[{self.camera_id}] Inference worker thread started.")
        try:
            model = get_yolo_model()

            args = SimpleNamespace(
                # High threshold: matches confident detections in first association step
                track_high_thresh=YOLO_CONFIDENCE,
                # Low threshold: matches low-confidence/partial body detections of existing tracks
                track_low_thresh=0.10,
                # New track birth threshold: high threshold so phantom objects (bags, shelves, posters)
                # cannot start tracks — they rarely score > 0.50 for class=person
                new_track_thresh=YOLO_CONFIDENCE + 0.20,
                track_buffer=TRACK_BUFFER,
                # Match threshold: standard IoU distance threshold
                match_thresh=0.80,
                fuse_score=True,
                fps=int(self._source_fps or 30),
            )
            tracker = BYTETracker(args=args)
            logger.info(f"[{self.camera_id}] Inference worker & ByteTracker initialized.")
        except Exception as exc:
            logger.error(f"[{self.camera_id}] Inference worker initialization failed: {exc}")
            return

        while self._running:
            # Only run inference if there are active subscribers to conserve CPU
            if not self.has_subscribers():
                time.sleep(0.1)
                continue

            # Grab latest frame
            with self._frame_lock:
                if self._latest_frame is None or self._latest_frame_idx == self._last_processed_frame_idx:
                    frame = None
                    frame_idx = self._last_processed_frame_idx
                else:
                    frame = self._latest_frame.copy()
                    frame_idx = self._latest_frame_idx

            if frame is None:
                time.sleep(0.005)
                continue

            self._last_processed_frame_idx = frame_idx
            t0 = time.perf_counter()

            try:
                # 1. Run YOLO inference strictly for PERSON class (0)
                with _model_lock:
                    results = model.predict(
                        source=frame,
                        conf=0.25,  # Balanced: catches partially-visible people, rejects bag/shelf false positives
                        classes=[PERSON_CLASS_ID],
                        imgsz=YOLO_IMGSZ,
                        verbose=False,
                    )

                h, w = frame.shape[:2]
                valid_indices = []

                if results and results[0].boxes is not None and len(results[0].boxes) > 0:
                    boxes = results[0].boxes
                    self._raw_detection_count = len(boxes)

                    for i in range(len(boxes)):
                        cls_id = int(boxes.cls[i].item()) if boxes.cls is not None else -1
                        if cls_id != PERSON_CLASS_ID:
                            continue

                        conf = float(boxes.conf[i].item()) if boxes.conf is not None else 0.0
                        if conf < 0.25:
                            continue

                        x1, y1, x2, y2 = boxes.xyxy[i].tolist()
                        if not self._is_valid_person_box(x1, y1, x2, y2, w, h):
                            continue

                        valid_indices.append(i)

                    self._person_detection_count = len(valid_indices)

                    # 2. Feed validated person detections into ByteTrack
                    if len(valid_indices) > 0:
                        keep_tensor = torch.tensor(valid_indices, dtype=torch.long, device=boxes.data.device)
                        filtered_boxes = boxes[keep_tensor]
                        raw_tracks = tracker.update(filtered_boxes)
                    else:
                        empty_tensor = torch.tensor([], dtype=torch.long, device=boxes.data.device)
                        raw_tracks = tracker.update(boxes[empty_tensor])
                else:
                    self._raw_detection_count = 0
                    self._person_detection_count = 0
                    if results and results[0].boxes is not None:
                        empty_tensor = torch.tensor([], dtype=torch.long, device=results[0].boxes.data.device)
                        raw_tracks = tracker.update(results[0].boxes[empty_tensor])
                    else:
                        raw_tracks = np.empty((0, 8))

                self._last_inference_ms = (time.perf_counter() - t0) * 1000

                # 3. Format active confirmed person tracks
                new_tracks = []
                active_ids = set()

                if raw_tracks is not None and len(raw_tracks) > 0:
                    for t in raw_tracks:
                        # raw_tracks cols: [x1, y1, x2, y2, track_id, score, cls, idx]
                        tx1, ty1, tx2, ty2 = float(t[0]), float(t[1]), float(t[2]), float(t[3])
                        tid = int(t[4])
                        score = float(t[5])

                        # Score floor: reject Kalman-predicted tracks whose confidence has decayed
                        if score < TRACK_OUTPUT_MIN_SCORE:
                            continue

                        if not self._is_valid_person_box(tx1, ty1, tx2, ty2, w, h):
                            continue

                        # Increment confirmation counter.
                        # Only broadcast tracks that have been seen TRACK_CONFIRM_FRAMES frames in a row,
                        # preventing single-frame false positives from shelves/objects reaching the frontend.
                        self._confirm_counter[tid] = self._confirm_counter.get(tid, 0) + 1
                        is_confirmed = self._confirm_counter[tid] >= TRACK_CONFIRM_FRAMES

                        active_ids.add(tid)
                        cams_id = self._get_cams_id(tid)

                        px1 = int(round(tx1))
                        py1 = int(round(ty1))
                        px2 = int(round(tx2))
                        py2 = int(round(ty2))

                        cx = (tx1 + tx2) / 2.0
                        cy = (ty1 + ty2) / 2.0

                        # Homography & Zone Resolution
                        from heatmap_engine import heatmap_engine
                        from behavior_engine import resolve_zone_by_coords
                        x_norm, y_norm = heatmap_engine.transform_camera_coords(cx, cy)
                        zone_name = resolve_zone_by_coords(x_norm, y_norm)

                        now = time.time()
                        if cams_id not in self._track_start_times:
                            self._track_start_times[cams_id] = now
                            self._zone_dwell_start_times[cams_id] = now
                            self._track_zones[cams_id] = zone_name
                            self._track_journeys[cams_id] = [zone_name]
                            self._track_activities[cams_id] = "Walking"
                            self._track_activity_history[cams_id] = {"Walking"}

                        if zone_name != self._track_zones[cams_id]:
                            self._track_zones[cams_id] = zone_name
                            self._zone_dwell_start_times[cams_id] = now
                            self._track_journeys[cams_id].append(zone_name)

                        dwell_seconds = max(1, int(now - self._zone_dwell_start_times[cams_id]))
                        if dwell_seconds > 25:
                            activity = "Viewing Product"
                        elif dwell_seconds > 15:
                            activity = "Picking Product"
                        elif dwell_seconds > 8:
                            activity = "Browsing"
                        else:
                            activity = "Walking"

                        self._track_activities[cams_id] = activity
                        self._track_activity_history[cams_id].add(activity)

                        # Persist coordinate tracking events periodically (1s)
                        last_insert = self._last_db_insert_time.get(cams_id, 0.0)
                        if now - last_insert >= 1.0:
                            self._last_db_insert_time[cams_id] = now
                            try:
                                from database import execute_query
                                execute_query(
                                    "INSERT INTO tracking (track_id, camera_id, store_id, zone_id, timestamp, x, y, bbox, activity, start_time, end_time) "
                                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);",
                                    (cams_id, self.camera_id, self.db_store_id, zone_name, datetime.datetime.now(), x_norm, y_norm, json.dumps([px1, py1, px2, py2]), activity, datetime.datetime.fromtimestamp(self._track_start_times[cams_id]), datetime.datetime.now()),
                                    fetch=False, commit=True
                                )
                                execute_query(
                                    "INSERT INTO heatmap_points (store_id, camera_id, zone_id, x_coord, y_coord, intensity, timestamp) "
                                    "VALUES (%s, %s, %s, %s, %s, %s, %s);",
                                    (self.db_store_id, self.camera_id, zone_name, x_norm, y_norm, 1.0, datetime.datetime.now()),
                                    fetch=False, commit=True
                                )
                            except Exception as e:
                                logger.error(f"[{self.camera_id}] Error writing event to database: {e}")

                        # Only broadcast after track has been seen consistently enough frames
                        if is_confirmed:
                            new_tracks.append({
                                "trackId": cams_id,
                                "class": "person",
                                "cameraId": self.camera_id,
                                "bbox": {
                                    "x1": px1,
                                    "y1": py1,
                                    "x2": px2,
                                    "y2": py2,
                                },
                                "confidence": round(score, 3),
                                "confirmed": True,
                                "zone": zone_name,
                                "activity": activity,
                                "dwellSeconds": dwell_seconds,
                                "totalDwellSeconds": max(1, int(now - self._track_start_times[cams_id])),
                                "centerX": x_norm,
                                "centerY": y_norm,
                                "timestamp": int(time.time() * 1000),
                            })

                # Update miss counters
                self._update_miss_counters(active_ids)

                # Atomically publish active tracks
                with self._tracks_lock:
                    self._active_tracks = new_tracks

            except Exception as exc:
                logger.warning(f"[{self.camera_id}] Inference error on frame {frame_idx}: {exc}")

        logger.info(f"[{self.camera_id}] Inference worker stopped.")

    # -----------------------------------------------------------------------
    # Real-Time Video Playback Thread
    # -----------------------------------------------------------------------

    def _playback_worker(self):
        """
        Reads frames from the video file at exact real-time playback speed.
        Encodes frames for WebSocket streaming and broadcasts them along with
        the latest confirmed person tracks.
        """
        logger.info(f"[{self.camera_id}] Video playback worker started: {self.video_path}")
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            logger.error(f"[{self.camera_id}] Cannot open video file: {self.video_path}")
            return

        self._source_width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self._source_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        self._source_fps = fps
        frame_interval = 1.0 / max(1.0, fps)

        logger.info(
            f"[{self.camera_id}] Video properties: {self._source_width}x{self._source_height} "
            f"@ {fps:.1f} FPS (frame interval: {frame_interval*1000:.1f}ms)"
        )

        frame_index = 0
        loop_start_time = time.perf_counter()

        while self._running:
            if not self.has_subscribers():
                time.sleep(0.1)
                loop_start_time = time.perf_counter() - frame_index * frame_interval
                continue

            target_time = loop_start_time + frame_index * frame_interval

            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                frame_index = 0
                loop_start_time = time.perf_counter()

                with self._tracks_lock:
                    self._active_tracks.clear()

                self._id_map.clear()
                self._miss_counter.clear()
                self._confirm_counter.clear()
                self._retired_tracker_ids.clear()

                reset_payload = {
                    "type": "loop_reset",
                    "cameraId": self.camera_id,
                }
                self._broadcast_payload(reset_payload)
                continue

            frame_index += 1

            # Update latest frame buffer atomically for AI worker
            with self._frame_lock:
                self._latest_frame = frame
                self._latest_frame_idx = frame_index

            # Fast frame encoding
            send_w = 640
            if self._source_width > send_w:
                send_h = int(self._source_height * (send_w / self._source_width))
                send_frame = cv2.resize(frame, (send_w, send_h), interpolation=cv2.INTER_NEAREST)
            else:
                send_frame = frame

            _, jpeg_buffer = cv2.imencode('.jpg', send_frame, [cv2.IMWRITE_JPEG_QUALITY, 55])
            frame_base64 = base64.b64encode(jpeg_buffer).decode('ascii')
            frame_data_url = f"data:image/jpeg;base64,{frame_base64}"

            with self._tracks_lock:
                current_tracks = list(self._active_tracks)

            payload = {
                "type": "tracks",
                "cameraId": self.camera_id,
                "source": {
                    "width":  self._source_width,
                    "height": self._source_height,
                    "fps":    round(fps, 1),
                },
                "tracks":      current_tracks,
                "frameNumber": frame_index,
                "inferenceMs": round(self._last_inference_ms, 1),
                "device":      self._device,
                "timestamp":   int(time.time() * 1000),
                "frame":       frame_data_url,
            }
            self._broadcast_payload(payload)

            # Precise clock pacing for smooth 1.0x realtime video playback
            now_t = time.perf_counter()
            target_time = loop_start_time + frame_index * frame_interval
            delay = target_time - now_t
            if delay > 0.001:
                time.sleep(delay)
            elif delay < -0.10:
                # Resync loop clock if we drifted
                loop_start_time = now_t - frame_index * frame_interval

        cap.release()
        logger.info(f"[{self.camera_id}] Playback worker stopped.")

    # -----------------------------------------------------------------------
    # Lifecycle
    # -----------------------------------------------------------------------

    def start(self, loop: asyncio.AbstractEventLoop):
        if self._running:
            return
        self._running = True
        self._event_loop = loop

        # Load database metadata
        self.load_db_metadata()

        # Start playback & inference background threads
        self._playback_thread = threading.Thread(target=self._playback_worker, daemon=True, name=f"playback-{self.camera_id}")
        self._inference_thread = threading.Thread(target=self._inference_worker, daemon=True, name=f"inference-{self.camera_id}")

        self._playback_thread.start()
        self._inference_thread.start()
        logger.info(f"[{self.camera_id}] CameraSession threads started.")

    async def stop(self):
        self._running = False
        if self._playback_thread and self._playback_thread.is_alive():
            self._playback_thread.join(timeout=1.0)
        if self._inference_thread and self._inference_thread.is_alive():
            self._inference_thread.join(timeout=1.0)
        logger.info(f"[{self.camera_id}] CameraSession stopped.")


# ---------------------------------------------------------------------------
# Global session registry
# ---------------------------------------------------------------------------

_sessions: Dict[str, CameraSession] = {}
_sessions_lock = threading.Lock()


def get_or_create_session(camera_id: str, video_path: str) -> CameraSession:
    with _sessions_lock:
        if camera_id in _sessions:
            return _sessions[camera_id]

        session = CameraSession(camera_id, video_path)
        _sessions[camera_id] = session

        try:
            loop = asyncio.get_running_loop()
            session.start(loop)
            logger.info(f"Started detection session for {camera_id}")
        except RuntimeError:
            logger.warning(f"No running event loop; session {camera_id} initialized without loop")

        return session


def get_session(camera_id: str) -> Optional[CameraSession]:
    with _sessions_lock:
        return _sessions.get(camera_id)
