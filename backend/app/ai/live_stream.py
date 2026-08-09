"""
Simulated live camera feed: no real camera hardware is connected yet, so
this loops whichever video was last processed for a camera and runs
detection + tracking on every frame in real time, streamed out as MJPEG.

Architecture: one background CameraWorker thread per camera_id owns the
single cv2.VideoCapture and runs the detect/track/encode pipeline exactly
once per processed frame, however many HTTP clients are watching. Each
streaming connection is a thin reader that polls the worker's latest
encoded frame at a steady pace - it never opens its own capture and never
calls into YOLO itself. Before this, every connection ran its own full
capture + detection pipeline independently, so N viewers of the same
camera (or just N different cameras open in one grid) cost N times the
CPU for redundant work on frames nobody needed recomputed twice. That
multiplication - not any single slow step - was the actual lag: on
CPU-only hardware, 3-4 concurrent full YOLO pipelines saturate available
cores and every stream degrades together.

Same detection pipeline as inference.process_video, just running forever
against a looping source instead of once against a fixed file - this is
the seam to swap in a real RTSP/webcam source later without touching the
streaming or detection logic.
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import TYPE_CHECKING, Generator

import cv2

from app.ai.detector import detect_people, detect_products_and_shelves
from app.ai.inference import draw_products, draw_shelves, draw_tracks
from app.ai.preprocessing import enhance_frame
from app.ai.tracker import CustomerTracker
from app.ai.video_processor import resize_frames
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.camera import Camera
from app.services import attendance_service
from app.services.employee_identification import get_identifier

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

TARGET_FPS = 8.0
JPEG_QUALITY = 80  # kept within the requested 70-80 range
# YOLO-World (product/shelf) is ~9x slower per-frame than the person model on
# this CPU - running it every frame would drag the whole live stream down to
# its speed. Running it every Nth frame and reusing the last-known boxes in
# between keeps person tracking smooth while still surfacing real product/
# shelf boxes, just updating less often.
WORLD_DETECT_INTERVAL = 5
# The person detector is much cheaper than YOLO-World, but still real CPU
# cost that's paid once per camera per frame regardless of viewer count
# now (see module docstring). Running it every other frame and reusing the
# last frame's boxes for ByteTrack in between roughly halves that cost.
# ByteTrack tolerates this fine at TARGET_FPS - real motion between two
# ~125ms frames is small, so a one-frame-stale box is visually
# indistinguishable, and reusing (not dropping) the boxes keeps track ids
# stable instead of causing the flicker empty-detections would.
PERSON_DETECT_INTERVAL = 2
# Frames get downscaled before preprocessing/detection (mirrors the exact
# pattern already used by the batch pipeline in app/ai/inference.py -
# resize -> enhance -> detect -> scale boxes back up to draw). Measured
# impact on a real 4K source: enhance_frame() alone dropped from ~110ms to
# single digits, since CLAHE/denoise cost scales with pixel count and 4K
# has ~27x the pixels of this target size. A live grid tile is a few
# hundred pixels wide on screen - there's no benefit to running the full
# preprocessing+detection pipeline at native 4K just to shrink it after.
LIVE_DETECT_SIZE = (640, 640)
# The encoded/displayed frame is also capped, independent of the source
# resolution - a 4K JPEG costs more to encode AND more bandwidth to push
# per frame than a small grid tile can even render, for no visible benefit.
LIVE_MAX_OUTPUT_HEIGHT = 720
# How stale a camera's last live-frame update can be before
# get_live_people_count() stops trusting it and reports "not live" instead
# of a frozen number from a stream that already disconnected. Generous
# relative to the ~0.125s per-frame cadence at TARGET_FPS, to tolerate
# normal network/browser hiccups without flapping.
LIVE_COUNT_STALE_SECONDS = 10.0
# How often (in frames) to log a timing/progress summary. Per-frame
# logging at TARGET_FPS would print ~8 lines/second/camera forever - pure
# noise. This still satisfies "log every stage's timing" without flooding.
LOG_EVERY_N_FRAMES = 15
# A frame read failing for a reason OTHER than "end of file" (a genuinely
# corrupt/unreadable file) would otherwise spin this loop as fast as the
# CPU allows, forever, calling cap.set()+continue with no work done -
# effectively a livelock that pegs a core and never produces an error a
# human would see. This many consecutive failed reads without a single
# good frame means the file itself is the problem, not just "reached the
# end" - so the worker stops cleanly instead of spinning.
MAX_CONSECUTIVE_READ_FAILURES = 30
# How long a worker keeps running with zero viewers before it releases its
# VideoCapture and stops. Long enough that a page reload or a brief tab
# switch doesn't tear down and re-pay video-open cost; short enough that a
# camera nobody is watching doesn't burn CPU indefinitely.
IDLE_SHUTDOWN_SECONDS = 15.0
# Automatic employee attendance is checked on a wall-clock cadence, not
# every processed frame - identification (see employee_identification.py)
# is a per-tick DB lookup, and an employee's presence doesn't need
# sub-second resolution the way live video does. This is also the
# "configurable amount of time" a departed employee's last_seen simply
# stops advancing after - there's no separate timeout/checkout job; the
# most recent tick that still finds them in-frame IS their last_seen.
ATTENDANCE_CHECK_INTERVAL_SECONDS = 10.0

_camera_video_map: dict[int, Path] = {}
_camera_live_people_count: dict[int, int] = {}
_camera_live_last_update: dict[int, float] = {}


def register_camera_video(camera_id: int, video_path: Path) -> None:
    """Associate a camera with the video its live feed should loop."""
    _camera_video_map[camera_id] = Path(video_path)
    logger.info("Registered live source for camera_id=%s -> %s", camera_id, video_path)


def get_registered_video(camera_id: int, db: "Session | None" = None) -> Path | None:
    """The in-memory map above is process-local and empty again after every
    backend restart - this is a simulated feed, not an always-on camera
    process, so there's no way to recover it except by remembering what was
    processed. When `db` is provided and the in-memory entry is missing,
    fall back to Camera.last_processed_video_filename (persisted the moment
    a video finishes processing - see app/api/routers/video.py) and re-warm
    the cache, so a camera that was genuinely processed before stays "live"
    across restarts instead of silently reverting to REPLAY until someone
    reprocesses it."""
    path = _camera_video_map.get(camera_id)
    if path is not None and path.exists():
        return path

    if db is None:
        return None

    from app.models.camera import Camera  # local import: avoids a package-level cycle
    from app.services.video_service import UPLOAD_DIR

    camera = db.get(Camera, camera_id)
    if camera is None or not camera.last_processed_video_filename:
        return None

    resolved = UPLOAD_DIR / camera.last_processed_video_filename
    if not resolved.exists():
        return None

    register_camera_video(camera_id, resolved)
    return resolved


def get_live_people_count(camera_id: int) -> int | None:
    """Real-time person count from this camera's active worker, if one is
    currently running (i.e. at least one client is watching - the worker
    stops itself after IDLE_SHUTDOWN_SECONDS with no viewers). None means
    "not currently live", not "zero people" - callers should fall back to
    the historical tracking_data window in that case, the same way they
    did before this existed."""
    last_update = _camera_live_last_update.get(camera_id)
    if last_update is None or (time.time() - last_update) > LIVE_COUNT_STALE_SECONDS:
        return None
    return _camera_live_people_count.get(camera_id)


def _encode_frame(frame) -> bytes | None:
    ok, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
    return buffer.tobytes() if ok else None


def _scale_box(box: list[float], scale_x: float, scale_y: float) -> list[float]:
    x1, y1, x2, y2 = box
    return [x1 * scale_x, y1 * scale_y, x2 * scale_x, y2 * scale_y]


class _TimingWindow:
    """Rolling per-stage timing accumulator for the periodic summary log -
    real measured seconds per stage, not estimates."""

    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.start = time.time()
        self.frames = 0
        self.dropped = 0
        self.read_s = 0.0
        self.enhance_s = 0.0
        self.person_s = 0.0
        self.world_s = 0.0
        self.track_s = 0.0
        self.draw_s = 0.0
        self.encode_s = 0.0
        self.people_sum = 0

    def log(self, camera_id: int, frame_number: int) -> None:
        elapsed = time.time() - self.start
        n = max(self.frames, 1)
        total_s = self.read_s + self.enhance_s + self.person_s + self.world_s + self.track_s + self.draw_s + self.encode_s
        logger.info(
            "Live worker timing: camera_id=%s frame=%s fps=%.1f dropped=%d "
            "avg_ms[read=%.1f enhance=%.1f person=%.1f world=%.1f track=%.1f draw=%.1f encode=%.1f total=%.1f] "
            "avg_people=%.1f",
            camera_id, frame_number,
            self.frames / elapsed if elapsed > 0 else 0.0,
            self.dropped,
            (self.read_s / n) * 1000,
            (self.enhance_s / n) * 1000,
            (self.person_s / n) * 1000,
            (self.world_s / n) * 1000,
            (self.track_s / n) * 1000,
            (self.draw_s / n) * 1000,
            (self.encode_s / n) * 1000,
            (total_s / n) * 1000,
            self.people_sum / n,
        )
        self.reset()


class CameraWorker:
    """Owns exactly one cv2.VideoCapture for one camera and runs the
    detect/track/draw/encode pipeline in a single background thread,
    regardless of how many HTTP clients are streaming it. Viewers just
    read whatever this worker most recently produced."""

    def __init__(self, camera_id: int, video_path: Path) -> None:
        self.camera_id = camera_id
        self.video_path = video_path
        self._lock = threading.Lock()
        self._latest_jpeg: bytes | None = None
        self._latest_frame_number = -1
        self._viewer_count = 0
        self._last_viewer_seen = time.time()
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None
        self._failed_to_open = False
        # Resolved lazily on first attendance check (see _check_attendance)
        # rather than in __init__, so constructing a worker never needs a DB
        # session - only actually checking attendance does.
        self._store_id: int | None = None

    def add_viewer(self) -> None:
        with self._lock:
            self._viewer_count += 1
            self._last_viewer_seen = time.time()
            if self._thread is None or not self._thread.is_alive():
                self._stop_event.clear()
                self._thread = threading.Thread(
                    target=self._run, name=f"camera-worker-{self.camera_id}", daemon=True
                )
                self._thread.start()

    def remove_viewer(self) -> None:
        with self._lock:
            self._viewer_count = max(0, self._viewer_count - 1)
            self._last_viewer_seen = time.time()

    def snapshot(self) -> tuple[bytes | None, int]:
        with self._lock:
            return self._latest_jpeg, self._latest_frame_number

    def opened_successfully(self) -> bool:
        return not self._failed_to_open

    def _check_attendance(self, tracks: list[dict]) -> None:
        """Best-effort automatic employee attendance for whoever is
        currently tracked on this camera. Reuses the SAME tracks this
        worker's tracker already produced for the live view - this is not
        a second detection system, just a consumer of the existing one
        (see employee_identification.py for why a track_id alone doesn't
        mean "this is employee X" without an EmployeeIdentifier).

        Fully isolated from the live video pipeline: its own DB session,
        and any exception (DB down, no employees configured, identifier
        failure) is logged and swallowed here, exactly like the per-frame
        detect/draw/encode guard in _run() - attendance can never freeze or
        break the camera stream."""
        if not tracks:
            return
        db = SessionLocal()
        try:
            if self._store_id is None:
                camera = db.get(Camera, self.camera_id)
                if camera is None:
                    logger.warning("Attendance check: camera_id=%s not found in DB, skipping", self.camera_id)
                    return
                self._store_id = camera.store_id

            identifier = get_identifier()
            seen_at = datetime.now(timezone.utc)
            source = "demo" if settings.DEMO_ATTENDANCE else "auto"
            track_ids = {t["customer_id"] for t in tracks if t.get("customer_id") is not None}

            for track_id in track_ids:
                employee_id = identifier.identify(
                    db, store_id=self._store_id, camera_id=self.camera_id, track_id=track_id
                )
                if employee_id is not None:
                    attendance_service.record_employee_seen(db, employee_id, seen_at, source=source)
        except Exception:
            logger.exception(
                "Attendance check failed for camera_id=%s - live stream unaffected, will retry next tick",
                self.camera_id,
            )
        finally:
            db.close()

    def _run(self) -> None:
        cap = cv2.VideoCapture(str(self.video_path))
        if not cap.isOpened():
            logger.error("Live worker: could not open %s for camera_id=%s", self.video_path, self.camera_id)
            self._failed_to_open = True
            return

        tracker = CustomerTracker()
        frame_interval = 1.0 / TARGET_FPS
        frame_number = 0
        consecutive_read_failures = 0
        last_products: list = []
        last_shelves: list = []
        last_person_boxes: list = []
        last_attendance_check = 0.0
        window = _TimingWindow()

        logger.info(
            "Live worker started: camera_id=%s video=%s fps_target=%s", self.camera_id, self.video_path, TARGET_FPS
        )

        try:
            while not self._stop_event.is_set():
                with self._lock:
                    idle_seconds = time.time() - self._last_viewer_seen if self._viewer_count == 0 else 0.0
                if idle_seconds > IDLE_SHUTDOWN_SECONDS:
                    logger.info(
                        "Live worker stopping (idle %.0fs, no viewers): camera_id=%s", idle_seconds, self.camera_id
                    )
                    break

                loop_start = time.time()

                read_start = time.time()
                try:
                    ok, frame = cap.read()
                except Exception:
                    logger.exception("Live worker: cap.read() raised for camera_id=%s frame=%s", self.camera_id, frame_number)
                    ok, frame = False, None
                window.read_s += time.time() - read_start

                if not ok or frame is None:
                    consecutive_read_failures += 1
                    if consecutive_read_failures >= MAX_CONSECUTIVE_READ_FAILURES:
                        logger.error(
                            "Live worker: %d consecutive failed reads for camera_id=%s (video=%s) - "
                            "treating as unreadable, not just end-of-file. Stopping.",
                            consecutive_read_failures, self.camera_id, self.video_path,
                        )
                        break
                    # End of the source file (the common case) - loop back
                    # to the start automatically rather than ending, and
                    # reset tracking so ids don't carry over strangely
                    # across the seam. A genuinely corrupt file also lands
                    # here on every attempt, guarded by the counter above.
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    tracker.reset()
                    frame_number = 0
                    continue
                consecutive_read_failures = 0

                try:
                    # Downscale before preprocessing/detection (see
                    # LIVE_DETECT_SIZE) - enhance_frame's cost is roughly
                    # proportional to pixel count, so this is where most
                    # of a 4K source's extra cost actually gets paid.
                    # Boxes get scaled back up to display_size afterward,
                    # the same way app/ai/inference.py's batch pipeline
                    # already does for the exact same reason.
                    display_frame = frame
                    if frame.shape[0] > LIVE_MAX_OUTPUT_HEIGHT:
                        display_scale = LIVE_MAX_OUTPUT_HEIGHT / frame.shape[0]
                        display_frame = cv2.resize(
                            frame,
                            (max(int(frame.shape[1] * display_scale), 1), LIVE_MAX_OUTPUT_HEIGHT),
                            interpolation=cv2.INTER_LINEAR,
                        )
                    detect_input = resize_frames(display_frame, size=LIVE_DETECT_SIZE)
                    scale_x = display_frame.shape[1] / max(detect_input.shape[1], 1)
                    scale_y = display_frame.shape[0] / max(detect_input.shape[0], 1)

                    enhance_start = time.time()
                    enhanced = enhance_frame(detect_input)
                    window.enhance_s += time.time() - enhance_start

                    person_start = time.time()
                    if frame_number % PERSON_DETECT_INTERVAL == 0:
                        last_person_boxes = detect_people(enhanced, confidence=0.20)
                    people = last_person_boxes
                    window.person_s += time.time() - person_start

                    world_start = time.time()
                    if frame_number % WORLD_DETECT_INTERVAL == 0:
                        try:
                            last_products, last_shelves = detect_products_and_shelves(enhanced)
                        except Exception:
                            # A single bad frame must never take down a
                            # continuous live feed - keep showing the
                            # last-known product/shelf boxes and keep going.
                            logger.exception(
                                "Live worker: product/shelf detection failed for camera_id=%s frame=%s, reusing last boxes",
                                self.camera_id, frame_number,
                            )
                    window.world_s += time.time() - world_start

                    track_start = time.time()
                    tracks = tracker.update(frame_number, people)
                    window.track_s += time.time() - track_start

                    people_count = len({t.get("customer_id") for t in tracks})
                    _camera_live_people_count[self.camera_id] = people_count
                    _camera_live_last_update[self.camera_id] = time.time()

                    if loop_start - last_attendance_check >= ATTENDANCE_CHECK_INTERVAL_SECONDS:
                        last_attendance_check = loop_start
                        self._check_attendance(tracks)

                    draw_start = time.time()
                    scaled_tracks = []
                    for t in tracks:
                        t = dict(t)
                        bbox = t.get("bbox") or t.get("xyxy")
                        if bbox is not None:
                            x1, y1, x2, y2 = bbox
                            t["bbox"] = [x1 * scale_x, y1 * scale_y, x2 * scale_x, y2 * scale_y]
                        scaled_tracks.append(t)
                    scaled_shelf_boxes = [_scale_box(s.bbox.as_list(), scale_x, scale_y) for s in last_shelves]
                    scaled_product_boxes = [_scale_box(p.bbox.as_list(), scale_x, scale_y) for p in last_products]

                    annotated = draw_tracks(display_frame, scaled_tracks)
                    annotated = draw_shelves(annotated, scaled_shelf_boxes)
                    annotated = draw_products(annotated, scaled_product_boxes)
                    window.draw_s += time.time() - draw_start

                    encode_start = time.time()
                    encoded = _encode_frame(annotated)
                    window.encode_s += time.time() - encode_start

                    if encoded is not None:
                        with self._lock:
                            self._latest_jpeg = encoded
                            self._latest_frame_number = frame_number
                    else:
                        window.dropped += 1

                    window.frames += 1
                    window.people_sum += people_count
                    if window.frames >= LOG_EVERY_N_FRAMES:
                        window.log(self.camera_id, frame_number)
                except Exception:
                    # The single most important line in this loop: without
                    # it, ANY exception anywhere in detection/tracking/
                    # drawing/encoding for one frame would end the whole
                    # worker - every viewer's stream freezes on the last
                    # frame it received at once. Logging and moving on to
                    # the next frame is what "never freeze" requires.
                    window.dropped += 1
                    logger.exception(
                        "Live worker: frame processing failed for camera_id=%s frame=%s - skipping this frame",
                        self.camera_id, frame_number,
                    )

                frame_number += 1
                elapsed = time.time() - loop_start
                if elapsed < frame_interval:
                    time.sleep(frame_interval - elapsed)
        finally:
            cap.release()
            logger.info("Live worker stopped: camera_id=%s (VideoCapture released)", self.camera_id)
            with _registry_lock:
                if _camera_workers.get(self.camera_id) is self:
                    _camera_workers.pop(self.camera_id, None)


_camera_workers: dict[int, CameraWorker] = {}
_registry_lock = threading.Lock()


def _get_or_create_worker(camera_id: int, video_path: Path) -> CameraWorker:
    with _registry_lock:
        worker = _camera_workers.get(camera_id)
        if worker is None:
            worker = CameraWorker(camera_id, video_path)
            _camera_workers[camera_id] = worker
        return worker


def stream_camera(camera_id: int, video_path: Path) -> Generator[bytes, None, None]:
    """Public entry point for the streaming route. Registers as a viewer
    of this camera's shared worker (creating it if it isn't already
    running), then just reads whatever frame the worker most recently
    produced at a steady client-facing pace - this connection never opens
    its own VideoCapture and never calls into YOLO directly."""
    worker = _get_or_create_worker(camera_id, video_path)
    worker.add_viewer()
    frame_interval = 1.0 / TARGET_FPS
    last_sent_frame_number = -1

    try:
        # Give a brand-new worker a moment to produce its first frame
        # before giving up - opening the model/capture for the first time
        # in this process can take a few seconds (see the module docstring
        # on lazy model loading elsewhere in this codebase).
        first_frame_deadline = time.time() + 20.0
        while time.time() < first_frame_deadline:
            jpeg, frame_number = worker.snapshot()
            if jpeg is not None:
                break
            if not worker.opened_successfully():
                logger.error("Live stream: worker failed to open source for camera_id=%s", camera_id)
                return
            time.sleep(0.2)
        else:
            logger.error("Live stream: camera_id=%s produced no frame within startup deadline", camera_id)
            return

        while True:
            jpeg, frame_number = worker.snapshot()
            if jpeg is not None and frame_number != last_sent_frame_number:
                last_sent_frame_number = frame_number
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + jpeg + b"\r\n"
                )
            time.sleep(frame_interval)
    except GeneratorExit:
        pass
    finally:
        worker.remove_viewer()
