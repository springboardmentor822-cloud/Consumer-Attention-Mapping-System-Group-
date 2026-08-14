"""
CAMS Detection Engine — YOLOv8 + ByteTrack (Ultralytics)
=========================================================
Processes each camera video independently.
Only detects COCO class 0 = person.
Outputs normalized bounding boxes (0-1) relative to native video resolution.
Maintains stable TRK-XXX IDs across the session.

Environment variables:
  YOLO_MODEL       = yolov8s.pt   (n/s/m supported)
  YOLO_CONFIDENCE  = 0.30         (lowered for better partial-body detection)
  YOLO_IOU         = 0.50
  YOLO_IMGSZ       = 640          (inference size; 960 improves edge/small persons)
  YOLO_DEVICE      = auto         (auto → CUDA if available, else CPU)
  FRAME_SKIP       = 1            (process every Nth frame; 1 = every frame)
  TRACK_BUFFER     = 90           (ByteTrack track buffer in frames, ~3s at 30fps)
  RETIRE_AFTER_FRAMES = 90        (frames of consecutive absence before retiring a CAMS ID)
"""

import os
import cv2
import time
import asyncio
import logging
import threading
import base64
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration from environment variables
# ---------------------------------------------------------------------------
def _env(key: str, default: str) -> str:
    return os.environ.get(key, default)


_YOLO_MODEL_RAW     = _env("YOLO_MODEL", "yolov8s.pt")
YOLO_CONFIDENCE     = float(_env("YOLO_CONFIDENCE", "0.30"))   # lowered: better partial detection
YOLO_IOU            = float(_env("YOLO_IOU", "0.50"))
YOLO_IMGSZ          = int(_env("YOLO_IMGSZ", "640"))            # increase to 960 for better edge detection
YOLO_DEVICE         = _env("YOLO_DEVICE", "auto")
FRAME_SKIP          = int(_env("FRAME_SKIP", "1"))
TRACK_BUFFER        = int(_env("TRACK_BUFFER", "90"))           # frames to hold a lost ByteTrack
RETIRE_AFTER_FRAMES = int(_env("RETIRE_AFTER_FRAMES", "90"))    # frames before retiring a CAMS ID

# ---------------------------------------------------------------------------
# Resolve YOLO model path — search CWD, this file's directory, and the
# project root so the .pt file is found regardless of working directory.
# ---------------------------------------------------------------------------
def _resolve_model_path(model_name: str) -> str:
    """Return an absolute path to the YOLO model file.

    Search order:
    1. As-is (absolute path or already on ultralytics hub path)
    2. Relative to this file's directory  (backend/python_engine/)
    3. One level up                        (backend/)
    4. Two levels up = project root        (project root where .pt files live)
    5. CWD at runtime
    If found nowhere on disk, return the raw name and let ultralytics
    download it from the hub automatically.
    """
    if os.path.isabs(model_name) and os.path.isfile(model_name):
        return model_name

    candidates = [
        Path(model_name),                                         # CWD-relative
        Path(__file__).parent / model_name,                       # python_engine/
        Path(__file__).parent.parent / model_name,                # backend/
        Path(__file__).parent.parent.parent / model_name,         # project root
    ]
    for p in candidates:
        if p.is_file():
            abs_path = str(p.resolve())
            logger.info(f"Resolved YOLO model: {abs_path}")
            return abs_path

    # Not on disk — ultralytics will try to download it
    logger.warning(f"Model file '{model_name}' not found locally; ultralytics will attempt download.")
    return model_name


YOLO_MODEL = _resolve_model_path(_YOLO_MODEL_RAW)

PERSON_CLASS_ID = 0   # COCO class 0 = person — the ONLY class we process

# ---------------------------------------------------------------------------
# Lazy-load YOLO model once (shared across camera sessions)
# ---------------------------------------------------------------------------
_yolo_model = None
_model_lock = threading.Lock()


def _resolve_device() -> str:
    """Return 'cuda' if a CUDA GPU is available, else 'cpu'."""
    if YOLO_DEVICE.lower() != "auto":
        return YOLO_DEVICE
    try:
        import torch
        return "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        return "cpu"


def get_yolo_model():
    """Return the shared YOLO model, loading it on first call."""
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model
    with _model_lock:
        if _yolo_model is not None:
            return _yolo_model
        try:
            from ultralytics import YOLO
            device = _resolve_device()
            logger.info(f"Loading YOLO model: {YOLO_MODEL} on device={device}")
            model = YOLO(YOLO_MODEL)
            model.to(device)
            _yolo_model = model
            logger.info(f"YOLO model loaded successfully ({YOLO_MODEL})")
        except Exception as exc:
            logger.error(f"Failed to load YOLO model: {exc}")
            raise
    return _yolo_model


# ---------------------------------------------------------------------------
# Per-camera tracking session
# ---------------------------------------------------------------------------

class CameraSession:
    """
    Manages one camera's detection loop.

    The session:
    - Opens the video file with OpenCV and loops it
    - Runs YOLOv8 + ByteTrack on every FRAME_SKIP-th frame
    - Maps backend tracker integer IDs → stable TRK-XXX CAMS IDs
    - Keeps the same TRK-XXX while ByteTrack still holds the track internally
    - Only retires a CAMS ID after RETIRE_AFTER_FRAMES consecutive missed frames
    - Re-broadcasts last-known tracks on skipped frames so the frontend
      never receives a silent gap
    - Sends JSON tracking payloads to all subscribed WebSocket clients
    """

    def __init__(self, camera_id: str, video_path: str):
        self.camera_id = camera_id
        self.video_path = video_path

        # ID mapping: tracker int ID → "TRK-NNN"
        self._id_map: Dict[int, str] = {}
        self._next_cams_id: int = 1

        # Per-tracker-ID: number of consecutive frames it has been absent.
        # A tracker ID is only retired (and its CAMS ID recycled) after
        # RETIRE_AFTER_FRAMES consecutive misses — not on the very first miss.
        self._miss_counter: Dict[int, int] = {}

        # Set of officially retired tracker IDs (absent > RETIRE_AFTER_FRAMES).
        # When ByteTrack re-uses an integer ID after it was truly retired we
        # treat the re-appearance as a new person.
        self._retired_tracker_ids: set = set()

        # Temporary hold buffer (15 frames) for occlusions
        self._last_known_boxes: Dict[str, dict] = {}
        self._last_known_confidences: Dict[str, float] = {}
        self._cams_id_miss_counter: Dict[str, int] = {}

        # Raw YOLO detection counts for logging/diagnostics
        self._raw_detection_count: int = 0
        self._person_detection_count: int = 0
        self._tracker_input_count: int = 0

        self._frame_count: int = 0
        self._running: bool = False
        self._task: Optional[asyncio.Task] = None

        # Subscribers: set of websocket send callables
        self._subscribers: List = []
        self._subscriber_lock = asyncio.Lock()

        # Diagnostics
        self._last_inference_ms: float = 0
        self._source_width: int = 0
        self._source_height: int = 0
        self._device: str = _resolve_device()

        # Time sync: frontend sets this to seek OpenCV to matching video position
        self._pending_sync_sec: Optional[float] = None

        # Last successfully built track list — re-broadcast on skipped frames
        # so the frontend never receives an empty/silent gap.
        self._last_tracks: List[dict] = []

    # -----------------------------------------------------------------------
    # CAMS ID management — robust re-association
    # -----------------------------------------------------------------------

    def _get_cams_id(self, tracker_id: int) -> str:
        """
        Map a ByteTrack integer tracker ID to a stable CAMS TRK-NNN string.

        A tracker ID is only treated as a brand-new person when it appears
        after having been officially *retired* (absent for > RETIRE_AFTER_FRAMES
        consecutive frames).  A short re-appearance after a temporary detection
        miss keeps the same TRK-NNN.
        """
        if tracker_id in self._retired_tracker_ids:
            # Truly retired → new person, fresh CAMS ID
            new_id = f"TRK-{self._next_cams_id:03d}"
            self._next_cams_id += 1
            self._id_map[tracker_id] = new_id
            self._retired_tracker_ids.discard(tracker_id)
            self._miss_counter.pop(tracker_id, None)
            return new_id

        if tracker_id not in self._id_map:
            new_id = f"TRK-{self._next_cams_id:03d}"
            self._next_cams_id += 1
            self._id_map[tracker_id] = new_id

        # Reset miss counter on re-appearance
        self._miss_counter[tracker_id] = 0

        return self._id_map[tracker_id]

    def _update_miss_counters(self, active_tracker_ids: set):
        """
        Increment miss counters for absent tracker IDs.
        Only officially retire a tracker ID after RETIRE_AFTER_FRAMES
        consecutive frames of absence — never on the first missed frame.
        """
        known = set(self._id_map.keys()) - self._retired_tracker_ids
        for tid in known:
            if tid not in active_tracker_ids:
                self._miss_counter[tid] = self._miss_counter.get(tid, 0) + 1
                if self._miss_counter[tid] >= RETIRE_AFTER_FRAMES:
                    self._retired_tracker_ids.add(tid)
                    logger.debug(
                        f"[{self.camera_id}] Retired tracker {tid} → "
                        f"{self._id_map[tid]} after {RETIRE_AFTER_FRAMES} missed frames"
                    )
            else:
                # Active — clear miss counter
                self._miss_counter[tid] = 0

    # -----------------------------------------------------------------------
    # Subscriber management
    # -----------------------------------------------------------------------

    async def add_subscriber(self, send_fn):
        async with self._subscriber_lock:
            self._subscribers.append(send_fn)

    async def remove_subscriber(self, send_fn):
        async with self._subscriber_lock:
            try:
                self._subscribers.remove(send_fn)
            except ValueError:
                pass

    async def _broadcast(self, payload: dict):
        """Send payload to all subscribed WebSocket clients."""
        import json
        message = json.dumps(payload)
        async with self._subscriber_lock:
            dead = []
            for send_fn in self._subscribers:
                try:
                    await send_fn(message)
                except Exception:
                    dead.append(send_fn)
            for fn in dead:
                self._subscribers.remove(fn)

    # -----------------------------------------------------------------------
    # Detection
    # -----------------------------------------------------------------------

    def _run_detection_sync(self, frame, model):
        """
        Run YOLOv8 + ByteTrack on a single BGR frame.
        Returns list of track dicts with source pixel coords and raw detection count.
        Only class 0 (person) is returned.
        """
        t0 = time.perf_counter()

        # Reset counts for the new frame
        self._raw_detection_count = 0
        self._person_detection_count = 0
        self._tracker_input_count = 0

        _tracker_cfg = str(Path(__file__).parent / "bytetrack.yaml")
        try:
            results = model.track(
                source=frame,
                persist=True,
                classes=[PERSON_CLASS_ID],   # PERSON ONLY — mandatory filter
                conf=0.05,                   # Lowered threshold to feed ByteTrack Stage-2 low-confidence matching
                iou=YOLO_IOU,
                imgsz=YOLO_IMGSZ,            # Configurable; 960 for better edge detection
                tracker=_tracker_cfg,        # Use ByteTrack (absolute path)
                verbose=False,
            )
        except Exception as exc:
            logger.warning(f"[{self.camera_id}] YOLO track error: {exc}")
            return [], 0

        self._last_inference_ms = (time.perf_counter() - t0) * 1000

        if not results or results[0].boxes is None:
            return [], 0

        boxes = results[0].boxes
        tracks = []
        active_ids = set()

        if boxes.id is not None:
            for i in range(len(boxes)):
                # Validate class — must be person (0)
                cls_id = int(boxes.cls[i].item()) if boxes.cls is not None else -1
                if cls_id != PERSON_CLASS_ID:
                    continue  # defensive check

                conf = float(boxes.conf[i].item()) if boxes.conf is not None else 0.0
                if conf < YOLO_CONFIDENCE:              # Filter tracks with conf < YOLO_CONFIDENCE
                    continue

                tracker_id = int(boxes.id[i].item())
                active_ids.add(tracker_id)

                # Bounding box in pixel coords (xyxy format)
                x1, y1, x2, y2 = boxes.xyxy[i].tolist()

                # Source frame pixel coordinates as integers
                px1 = int(round(x1))
                py1 = int(round(y1))
                px2 = int(round(x2))
                py2 = int(round(y2))

                cams_id = self._get_cams_id(tracker_id)

                tracks.append({
                    "trackId": cams_id,
                    "class": "person",
                    "cameraId": self.camera_id,
                    "bbox": {
                        "x1": px1,
                        "y1": py1,
                        "x2": px2,
                        "y2": py2,
                    },
                    "confidence": round(conf, 3),
                    "confirmed": True,
                    "timestamp": int(time.time() * 1000),
                })

        # Update temporary hold buffer (15 frames) for active tracks
        for track in tracks:
            tid = track["trackId"]
            self._last_known_boxes[tid] = track["bbox"]
            self._last_known_confidences[tid] = track["confidence"]
            self._cams_id_miss_counter[tid] = 0

        # Increment miss counters for buffered tracks and include them if within 15 frames limit
        buffered_tracks = []
        detected_tids = {t["trackId"] for t in tracks}
        for tid, bbox in list(self._last_known_boxes.items()):
            if tid not in detected_tids:
                self._cams_id_miss_counter[tid] = self._cams_id_miss_counter.get(tid, 0) + 1
                if self._cams_id_miss_counter[tid] <= 15:
                    buffered_tracks.append({
                        "trackId": tid,
                        "class": "person",
                        "cameraId": self.camera_id,
                        "bbox": bbox,
                        "confidence": self._last_known_confidences.get(tid, 0.0),
                        "confirmed": True,
                        "buffered": True,
                        "timestamp": int(time.time() * 1000),
                    })
                else:
                    # Missed for > 15 frames -> remove from holding buffer
                    self._last_known_boxes.pop(tid, None)
                    self._last_known_confidences.pop(tid, None)

        # Merge active and buffered tracks
        all_tracks = tracks + buffered_tracks

        # Update miss counters — only retires IDs absent for RETIRE_AFTER_FRAMES (90 frames)
        self._update_miss_counters(active_ids)

        return all_tracks, self._person_detection_count

    # -----------------------------------------------------------------------
    # Main detection loop
    # -----------------------------------------------------------------------

    async def run(self):
        """Main async detection loop for this camera."""
        self._running = True
        loop = asyncio.get_running_loop()
        logger.info(f"[{self.camera_id}] Detection loop starting. Video: {self.video_path}")

        import sys

        # YOLO prediction callback definition
        def raw_detection_callback(predictor):
            if predictor.results and predictor.results[0].boxes is not None:
                boxes = predictor.results[0].boxes
                # Since we track with classes=[0], YOLO only detects class 0 (person)
                person_boxes = [b for b in boxes if int(b.cls[0].item()) == PERSON_CLASS_ID]
                self._raw_detection_count = len(boxes)
                self._person_detection_count = len(person_boxes)
                self._tracker_input_count = len(person_boxes)

        try:
            # Instantiate an independent YOLO model per camera session
            from ultralytics import YOLO
            model = await loop.run_in_executor(None, lambda: YOLO(YOLO_MODEL))
            await loop.run_in_executor(None, lambda: model.to(self._device))
            model.add_callback('on_predict_postprocess_end', raw_detection_callback)
            logger.info(f"[{self.camera_id}] Independent YOLO model loaded on device={self._device}")
        except Exception as exc:
            logger.error(f"[{self.camera_id}] Cannot start — model load failed: {exc}")
            return

        def open_cap():
            cap = cv2.VideoCapture(self.video_path)
            return cap

        cap = await loop.run_in_executor(None, open_cap)

        if not cap.isOpened():
            logger.error(f"[{self.camera_id}] Cannot open video: {self.video_path}")
            return

        self._source_width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self._source_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_interval = (1.0 / fps) * max(1, FRAME_SKIP)
        logger.info(
            f"[{self.camera_id}] Video opened: {self._source_width}×{self._source_height} "
            f"@ {fps:.1f} FPS (target frame interval: {frame_interval*1000:.1f}ms)"
        )

        frame_index = 0
        self._pending_sync_sec = None

        # Real-time synchronization state
        ref_system_time = time.perf_counter()
        ref_video_time = 0.0

        while self._running:
            t_loop_start = time.perf_counter()

            # Handle time sync from frontend WebSocket if requested
            if self._pending_sync_sec is not None:
                sync_sec = self._pending_sync_sec
                self._pending_sync_sec = None
                
                # Check current video position
                current_video_time = frame_index / fps
                
                # Only perform a hard seek if the drift is large (> 1.0s), which indicates user seeking
                if abs(current_video_time - sync_sec) > 1.0:
                    sync_msec = sync_sec * 1000.0
                    await loop.run_in_executor(None, lambda: cap.set(cv2.CAP_PROP_POS_MSEC, sync_msec))
                    frame_index = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
                
                # Align the reference clock to match frontend time
                ref_system_time = time.perf_counter()
                ref_video_time = sync_sec

            # Calculate where the video SHOULD be based on the reference clock
            elapsed = time.perf_counter() - ref_system_time
            target_video_time = ref_video_time + elapsed
            target_frame_index = int(target_video_time * fps)

            # Skip lagging frames quickly using grab() to catch up to real-time playback
            frames_to_skip = target_frame_index - frame_index
            if frames_to_skip > 0:
                skip_limit = min(frames_to_skip, 5) # cap to avoid blocking the event loop
                for _ in range(skip_limit):
                    ret_grab = await loop.run_in_executor(None, cap.grab)
                    if not ret_grab:
                        break
                    frame_index += 1

            ret, frame = await loop.run_in_executor(None, cap.read)

            if not ret:
                # End of video — loop back to start
                # Reset backend inference and ByteTrack state
                from ultralytics import YOLO
                model = await loop.run_in_executor(None, lambda: YOLO(YOLO_MODEL))
                await loop.run_in_executor(None, lambda: model.to(self._device))
                model.add_callback('on_predict_postprocess_end', raw_detection_callback)

                self._id_map.clear()
                self._next_cams_id = 1
                self._miss_counter.clear()
                self._retired_tracker_ids.clear()
                self._last_tracks.clear()
                self._last_known_boxes.clear()
                self._last_known_confidences.clear()
                self._cams_id_miss_counter.clear()

                reset_payload = {
                    "type": "loop_reset",
                    "cameraId": self.camera_id,
                }
                await self._broadcast(reset_payload)

                await loop.run_in_executor(None, lambda: cap.set(cv2.CAP_PROP_POS_FRAMES, 0))
                frame_index = 0
                ref_system_time = time.perf_counter()
                ref_video_time = 0.0
                continue

            frame_index += 1
            self._frame_count = frame_index

            # JPEG frame encoding & compression for WebSocket streaming
            # Resize image to a maximum width of 960px to conserve bandwidth
            send_w = 960
            if self._source_width > send_w:
                send_h = int(self._source_height * (send_w / self._source_width))
                send_frame = cv2.resize(frame, (send_w, send_h))
            else:
                send_frame = frame

            _, jpeg_buffer = cv2.imencode('.jpg', send_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            frame_base64 = base64.b64encode(jpeg_buffer).decode('utf-8')
            frame_data_url = f"data:image/jpeg;base64,{frame_base64}"

            # Frame skip: only run YOLO inference on every FRAME_SKIP-th frame.
            # On skipped frames, re-broadcast the last known tracks so the
            # frontend never receives a silent gap that makes tracks appear to
            # disappear between inference frames.
            if frame_index % max(1, FRAME_SKIP) != 0:
                if self._last_tracks is not None:
                    # Print diagnostic logs to stdout per frame as required
                    print(f"FRAME {frame_index}")
                    print(f"YOLO detections: {self._raw_detection_count}")
                    print(f"Person detections: {self._person_detection_count}")
                    print(f"ByteTrack input: {self._tracker_input_count}")
                    print(f"Active tracks: {len(self._last_tracks)}")
                    sys.stdout.flush()

                    skip_payload = {
                        "type": "tracks",
                        "cameraId": self.camera_id,
                        "source": {
                            "width":  self._source_width,
                            "height": self._source_height,
                            "fps":    round(fps, 1),
                        },
                        "tracks":      self._last_tracks,
                        "frameNumber": frame_index,
                        "inferenceMs": 0.0,   # no inference this frame
                        "device":      self._device,
                        "timestamp":   int(time.time() * 1000),
                        "skipped":     True,  # diagnostic flag
                        "frame":       frame_data_url,
                    }
                    await self._broadcast(skip_payload)

                    # Also broadcast debug payload for skipped frames
                    debug_payload = {
                        "type": "tracking_debug",
                        "cameraId": self.camera_id,
                        "frameNumber": frame_index,
                        "yoloDetections": self._raw_detection_count,
                        "personDetections": self._person_detection_count,
                        "activeTracks": len(self._last_tracks),
                        "sourceWidth": self._source_width,
                        "sourceHeight": self._source_height,
                        "fps": round(fps, 1),
                    }
                    await self._broadcast(debug_payload)

                await asyncio.sleep(0.01)
                continue

            # Run detection in thread pool to avoid blocking event loop
            try:
                tracks, raw_person_count = await loop.run_in_executor(
                    None, self._run_detection_sync, frame, model
                )
            except Exception as exc:
                logger.warning(f"[{self.camera_id}] Detection error frame {frame_index}: {exc}")
                tracks, raw_person_count = [], 0

            # Cache last known tracks for re-broadcast on skipped frames
            self._last_tracks = tracks

            # Print diagnostic logs to stdout per frame as required
            print(f"FRAME {frame_index}")
            print(f"YOLO detections: {self._raw_detection_count}")
            print(f"Person detections: {self._person_detection_count}")
            print(f"ByteTrack input: {self._tracker_input_count}")
            print(f"Active tracks: {len(tracks)}")
            sys.stdout.flush()

            # Structured per-frame diagnostic log (to standard logger)
            if frame_index % 30 == 0 or len(tracks) > 0:
                logger.info(
                    f"[{self.camera_id}] Frame: {frame_index:>4d} | Res: {self._source_width}x{self._source_height} | "
                    f"YOLO persons: {self._person_detection_count} | ByteTrack confirmed: {len(tracks)} | "
                    f"Inference: {self._last_inference_ms:.1f}ms | Device: {self._device}"
                )

            # Build and broadcast payload
            payload = {
                "type": "tracks",
                "cameraId": self.camera_id,
                "source": {
                    "width":  self._source_width,
                    "height": self._source_height,
                    "fps":    round(fps, 1),
                },
                "tracks":      tracks,
                "frameNumber": frame_index,
                "inferenceMs": round(self._last_inference_ms, 1),
                "device":      self._device,
                "timestamp":   int(time.time() * 1000),
                "frame":       frame_data_url,
            }

            await self._broadcast(payload)

            # Build and broadcast debug payload
            debug_payload = {
                "type": "tracking_debug",
                "cameraId": self.camera_id,
                "frameNumber": frame_index,
                "yoloDetections": self._raw_detection_count,
                "personDetections": self._person_detection_count,
                "activeTracks": len(tracks),
                "sourceWidth": self._source_width,
                "sourceHeight": self._source_height,
                "fps": round(fps, 1),
            }
            await self._broadcast(debug_payload)

            # Pace execution to match real-time video playback rate
            elapsed    = time.perf_counter() - t_loop_start
            sleep_time = max(0.005, frame_interval - elapsed)
            await asyncio.sleep(sleep_time)

        cap.release()
        logger.info(f"[{self.camera_id}] Detection loop stopped.")

    def request_sync_time(self, time_sec: float):
        """Schedule a video position sync to match frontend video playback time."""
        self._pending_sync_sec = time_sec

    def start(self, loop: asyncio.AbstractEventLoop):
        self._task = asyncio.ensure_future(self.run(), loop=loop)

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass


# ---------------------------------------------------------------------------
# Global session registry
# ---------------------------------------------------------------------------

_sessions: Dict[str, CameraSession] = {}
_sessions_lock = threading.Lock()


def get_or_create_session(camera_id: str, video_path: str) -> CameraSession:
    """Return existing session for camera_id, or create and start a new one."""
    with _sessions_lock:
        if camera_id in _sessions:
            return _sessions[camera_id]

        session = CameraSession(camera_id, video_path)
        _sessions[camera_id] = session

        # Schedule the detection loop on the current running event loop
        try:
            loop = asyncio.get_running_loop()
            asyncio.ensure_future(session.run())
            logger.info(f"Started detection session for {camera_id}")
        except RuntimeError:
            # No running loop yet; will be started when main.py runs
            logger.warning(f"No running event loop; session {camera_id} queued")

        return session


def get_session(camera_id: str) -> Optional[CameraSession]:
    with _sessions_lock:
        return _sessions.get(camera_id)
