"""
Live camera wall for the Store Manager dashboard.

Runs one background thread per configured camera. Each thread:
  1. Opens its video source with OpenCV (cv2.VideoCapture) - a real RTSP/HTTP
     IP-camera URL, a webcam index, or (absent real hardware) a local sample
     video file, so the panel still shows genuinely "live" footage instead
     of a placeholder.
  2. Runs the same pretrained YOLOv8n person detector used by the uploaded-
     video pipeline (see detection_pipeline.get_person_model) on the stream,
     drawing bounding boxes and keeping a running person count.
  3. Publishes the latest annotated JPEG frame + status + count into a
     thread-safe CameraState, which the FastAPI endpoints below read from.
  4. If the source can't be opened, or drops mid-stream, marks the camera
     "offline" and keeps retrying on a fixed interval (auto-reconnect) -
     for a looped local video file, briefly hitting end-of-file is NOT
     treated as a disconnect; the clip is rewound and playback continues.

Threads (not asyncio tasks) are used deliberately: cv2.VideoCapture.read()
is a blocking call, and doing 8 of these concurrently is exactly the kind
of I/O + CPU-bound fan-out threads are for - an asyncio task would stall
the whole event loop on every frame grab.
"""
from __future__ import annotations

import json
import logging
import os
import threading
import time
from dataclasses import dataclass
from typing import Optional

import cv2

from app.core.config import settings

logger = logging.getLogger("live_camera_manager")

# backend/ - two levels up from backend/app/services/
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _resolve_source(raw_source: str) -> str | int:
    """A source can be a webcam index ('0'), a network stream
    (rtsp://..., http://...), or a path to a local file - relative paths
    are resolved against the backend/ root so the config file can just say
    'sample_media/vtest.avi' regardless of the working directory."""
    if raw_source.isdigit():
        return int(raw_source)
    if "://" in raw_source:
        return raw_source
    return os.path.join(BACKEND_ROOT, raw_source)


@dataclass
class CameraState:
    id: str
    name: str
    source: str
    status: str = "connecting"  # connecting | online | offline
    person_count: int = 0
    last_frame_jpeg: Optional[bytes] = None
    last_update_ts: float = 0.0
    last_error: Optional[str] = None


def _placeholder_jpeg(name: str, message: str) -> bytes:
    """A dark 'no signal' frame with the camera name + reason, shown while a
    camera is connecting for the first time or confirmed offline - so the
    <img> tag always has something valid to render instead of a broken
    image icon."""
    import numpy as np

    frame = np.zeros((360, 640, 3), dtype="uint8")
    frame[:] = (18, 21, 26)  # matches the dashboard's dark panel background
    cv2.putText(frame, name, (24, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (124, 133, 146), 2, cv2.LINE_AA)
    cv2.putText(frame, message, (24, 205), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (242, 96, 59), 2, cv2.LINE_AA)
    ok, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    return buf.tobytes() if ok else b""


class CameraWorker(threading.Thread):
    def __init__(self, cfg: dict):
        super().__init__(daemon=True, name=f"camera-{cfg['id']}")
        self.id: str = cfg["id"]
        self.name: str = cfg["name"]
        self.raw_source: str = str(cfg["source"])
        self.start_offset_frames: int = int(cfg.get("start_offset_frames", 0))
        self.source = _resolve_source(self.raw_source)

        self._stop_event = threading.Event()
        self._lock = threading.Lock()
        self.state = CameraState(id=self.id, name=self.name, source=str(self.source))

    # -- public, thread-safe reads -----------------------------------
    def snapshot(self) -> dict:
        with self._lock:
            s = self.state
            return {
                "id": s.id,
                "name": s.name,
                "status": s.status,
                "person_count": s.person_count,
                "last_update_ts": s.last_update_ts,
                "last_error": s.last_error,
            }

    def latest_jpeg(self) -> bytes:
        with self._lock:
            frame = self.state.last_frame_jpeg
            status = self.state.status
            name = self.state.name
        if frame is not None:
            return frame
        return _placeholder_jpeg(name, "Connecting…" if status == "connecting" else "Offline")

    def stop(self) -> None:
        self._stop_event.set()

    # -- worker thread body --------------------------------------------
    def run(self) -> None:
        while not self._stop_event.is_set():
            cap = self._try_open()
            if cap is None or not cap.isOpened():
                self._mark_offline("Source unavailable")
                if self._stop_event.wait(settings.LIVE_CAMERA_RECONNECT_SECONDS):
                    break
                continue

            self._mark_status("online")
            logger.info("Camera '%s' connected (%s)", self.id, self.raw_source)
            disconnected = self._stream_loop(cap)
            cap.release()

            if self._stop_event.is_set():
                break
            if disconnected:
                self._mark_offline("Stream disconnected")
                logger.warning("Camera '%s' disconnected - retrying in %.0fs", self.id, settings.LIVE_CAMERA_RECONNECT_SECONDS)
                self._stop_event.wait(settings.LIVE_CAMERA_RECONNECT_SECONDS)

    def _try_open(self) -> Optional[cv2.VideoCapture]:
        try:
            cap = cv2.VideoCapture(self.source)
            if cap.isOpened() and self.start_offset_frames:
                cap.set(cv2.CAP_PROP_POS_FRAMES, self.start_offset_frames)
            return cap
        except Exception:  # noqa: BLE001
            logger.exception("Failed opening camera source for '%s'", self.id)
            return None

    def _stream_loop(self, cap: cv2.VideoCapture) -> bool:
        """Reads/annotates/publishes frames until the stream ends for real
        (returns True, meaning 'go reconnect') or stop() is called
        (returns False)."""
        from app.services.detection_pipeline import get_person_model

        model = get_person_model()
        frame_interval = 1.0 / max(1.0, settings.LIVE_CAMERA_STREAM_FPS)
        detect_every = max(1, settings.LIVE_CAMERA_DETECT_EVERY_N_FRAMES)
        is_finite_clip = cap.get(cv2.CAP_PROP_FRAME_COUNT) > 1  # local sample video vs. live stream

        frame_idx = 0
        last_boxes: list[tuple[float, float, float, float]] = []
        eof_retries = 0

        while not self._stop_event.is_set():
            tick_start = time.time()
            ok, frame = cap.read()

            if not ok or frame is None:
                if is_finite_clip and eof_retries < 3:
                    # Sample footage looping back to the start is normal
                    # playback, not a disconnect.
                    cap.set(cv2.CAP_PROP_POS_FRAMES, self.start_offset_frames)
                    eof_retries += 1
                    continue
                return True  # genuine read failure -> reconnect

            eof_retries = 0
            frame_idx += 1

            if frame_idx % detect_every == 0 or not last_boxes:
                try:
                    result = model.predict(frame, classes=[0], conf=0.35, verbose=False)[0]
                    boxes = result.boxes
                    last_boxes = boxes.xyxy.tolist() if boxes is not None and boxes.xyxy is not None else []
                except Exception:  # noqa: BLE001
                    logger.exception("YOLO inference failed on camera '%s'", self.id)

            self._annotate(frame, last_boxes)
            ok_enc, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 72])
            if ok_enc:
                with self._lock:
                    self.state.last_frame_jpeg = buf.tobytes()
                    self.state.person_count = len(last_boxes)
                    self.state.status = "online"
                    self.state.last_update_ts = time.time()
                    self.state.last_error = None

            elapsed = time.time() - tick_start
            remaining = frame_interval - elapsed
            if remaining > 0:
                self._stop_event.wait(remaining)

        return False

    def _annotate(self, frame, boxes: list[tuple[float, float, float, float]]) -> None:
        h, w = frame.shape[:2]
        for (x1, y1, x2, y2) in boxes:
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (79, 209, 197), 2)

        # Enterprise-CCTV-style overlay: camera name + live REC dot top-left,
        # person count top-right, timestamp bottom-left.
        cv2.rectangle(frame, (0, 0), (w, 34), (10, 12, 15), -1)
        cv2.circle(frame, (16, 17), 5, (60, 60, 235), -1)
        cv2.putText(frame, self.name.upper(), (30, 23), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (237, 239, 242), 1, cv2.LINE_AA)
        count_text = f"PERSONS: {len(boxes)}"
        (tw, _), _ = cv2.getTextSize(count_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.putText(frame, count_text, (w - tw - 12, 23), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (79, 209, 197), 1, cv2.LINE_AA)

        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.rectangle(frame, (0, h - 22), (170, h), (10, 12, 15), -1)
        cv2.putText(frame, ts, (6, h - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (150, 156, 166), 1, cv2.LINE_AA)

    def _mark_status(self, status: str) -> None:
        with self._lock:
            self.state.status = status

    def _mark_offline(self, error: str) -> None:
        with self._lock:
            self.state.status = "offline"
            self.state.last_error = error
            self.state.last_frame_jpeg = None
            self.state.person_count = 0


class LiveCameraManager:
    """Owns the full set of camera worker threads, loaded from the
    configurable JSON file at settings.LIVE_CAMERAS_CONFIG_PATH."""

    def __init__(self) -> None:
        self._workers: dict[str, CameraWorker] = {}
        self._order: list[str] = []
        self._started = False
        self._lock = threading.Lock()

    def _config_path(self) -> str:
        path = settings.LIVE_CAMERAS_CONFIG_PATH
        return path if os.path.isabs(path) else os.path.join(BACKEND_ROOT, path)

    def _load_config(self) -> list[dict]:
        path = self._config_path()
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error("Live camera config not found at %s - no camera feeds will start.", path)
            return []

    def start(self) -> None:
        with self._lock:
            if self._started:
                return
            for cfg in self._load_config():
                worker = CameraWorker(cfg)
                self._workers[worker.id] = worker
                self._order.append(worker.id)
                worker.start()
            self._started = True
            logger.info("Live camera manager started %d camera worker(s).", len(self._order))

    def stop(self) -> None:
        with self._lock:
            for worker in self._workers.values():
                worker.stop()
            for worker in self._workers.values():
                worker.join(timeout=2)
            self._workers.clear()
            self._order.clear()
            self._started = False

    def camera_ids(self) -> list[str]:
        return list(self._order)

    def list_snapshots(self) -> list[dict]:
        return [self._workers[cid].snapshot() for cid in self._order if cid in self._workers]

    def get_worker(self, camera_id: str) -> Optional[CameraWorker]:
        return self._workers.get(camera_id)

    def latest_jpeg(self, camera_id: str) -> Optional[bytes]:
        worker = self._workers.get(camera_id)
        return worker.latest_jpeg() if worker else None


live_camera_manager = LiveCameraManager()
