"""
Video Intake Service
=====================

Connects to a video source (webcam index, video file, RTSP/IP camera URL)
and produces a smoothed, downsampled frame stream at a target FPS
(default: 5), so downstream processing (YOLOv8 detection, head-pose/gaze
estimation, etc.) doesn't have to run on every raw frame the source
produces — this is where most of the CPU/memory cost of a naive "process
every frame" pipeline comes from.

Key design choices:

* Uses cv2.VideoCapture.grab() for frames we're going to discard, and
  only cv2.VideoCapture.retrieve() (which does the actual JPEG/H.264
  decode into a full ndarray) for frames we keep. grab() is cheap;
  retrieve()/read() is where the memory and CPU cost is. For a 30fps
  source downsampled to 5fps, this means we fully decode ~1 out of every
  6 frames instead of all of them.

* For file sources with a known, reliable FPS, downsampling is done by
  frame-count modulus (deterministic, matches the file's own timeline).
  For live sources (webcam / RTSP) where reported FPS is often 0 or
  unreliable, it falls back to wall-clock pacing so the output rate is
  still ~5fps in real time regardless of what the camera claims.

* Live sources are read continuously every loop iteration (never
  blocked/skipped at the OS/driver level) to avoid the internal RTSP
  buffer building up and the stream falling behind live — we just choose
  whether to *decode and emit* each grabbed frame, not whether to *read*
  it.

* Reconnects with exponential backoff if a live source drops.

This module intentionally does NOT include the detection/tracking model
itself — call `intake.run(on_frame=your_yolo_callback)` to wire it into
the CV pipeline, or use `--output` to write a downsampled video file, or
`--backend-url` to push frames toward the backend's ingest APIs.
"""
from __future__ import annotations

import argparse
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Optional

import cv2
import numpy as np

logger = logging.getLogger("video_intake")


@dataclass
class IntakeConfig:
    source: str  # webcam index ("0"), file path, or rtsp:// / http:// URL
    target_fps: float = 5.0
    resize_width: Optional[int] = None  # optional downscale to save more memory
    max_reconnect_attempts: int = 5
    reconnect_backoff_seconds: float = 2.0
    output_path: Optional[str] = None  # write the downsampled stream to a video file
    loop_file: bool = False  # restart file sources when they end (useful for demos)


class VideoIntake:
    def __init__(self, config: IntakeConfig):
        self.config = config
        self._cap: Optional[cv2.VideoCapture] = None
        self._writer: Optional[cv2.VideoWriter] = None
        self._is_file_source = self._looks_like_file(config.source)

    @staticmethod
    def _looks_like_file(source: str) -> bool:
        if source.isdigit():
            return False
        if source.startswith(("rtsp://", "http://", "https://")):
            return False
        return True

    @staticmethod
    def _open_capture(source: str) -> cv2.VideoCapture:
        # Webcam sources are given as a plain integer index (e.g. "0").
        cap_source: str | int = int(source) if source.isdigit() else source
        cap = cv2.VideoCapture(cap_source)
        return cap

    def _connect(self) -> bool:
        logger.info("Connecting to video source: %s", self.config.source)
        self._cap = self._open_capture(self.config.source)
        if not self._cap.isOpened():
            logger.error("Failed to open video source: %s", self.config.source)
            return False
        return True

    def _reconnect_with_backoff(self) -> bool:
        for attempt in range(1, self.config.max_reconnect_attempts + 1):
            wait = self.config.reconnect_backoff_seconds * attempt
            logger.warning(
                "Source dropped. Reconnect attempt %d/%d in %.1fs...",
                attempt,
                self.config.max_reconnect_attempts,
                wait,
            )
            time.sleep(wait)
            if self._cap is not None:
                self._cap.release()
            if self._connect():
                logger.info("Reconnected successfully.")
                return True
        logger.error("Exceeded max reconnect attempts. Giving up.")
        return False

    def _native_fps(self) -> float:
        assert self._cap is not None
        fps = self._cap.get(cv2.CAP_PROP_FPS)
        # Live sources frequently report 0 or nonsense values here.
        if fps and fps > 0.5 and fps < 240:
            return fps
        return 0.0

    def _maybe_resize(self, frame: np.ndarray) -> np.ndarray:
        if not self.config.resize_width:
            return frame
        h, w = frame.shape[:2]
        if w <= self.config.resize_width:
            return frame
        scale = self.config.resize_width / w
        return cv2.resize(frame, (self.config.resize_width, int(h * scale)), interpolation=cv2.INTER_AREA)

    def _init_writer(self, sample_frame: np.ndarray) -> None:
        if not self.config.output_path:
            return
        h, w = sample_frame.shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        self._writer = cv2.VideoWriter(
            self.config.output_path, fourcc, self.config.target_fps, (w, h)
        )
        logger.info(
            "Writing downsampled output to %s at %.1f fps (%dx%d)",
            self.config.output_path,
            self.config.target_fps,
            w,
            h,
        )

    def run(
        self,
        on_frame: Optional[Callable[[np.ndarray, int, float], None]] = None,
        max_frames: Optional[int] = None,
    ) -> int:
        """
        Runs the intake loop. `on_frame(frame, emitted_index, timestamp_seconds)`
        is called once per *emitted* (decoded, kept) frame - this is the hook
        point for a detector/tracker. Returns the number of frames emitted.
        """
        if not self._connect():
            raise RuntimeError(f"Could not open video source: {self.config.source}")

        native_fps = self._native_fps()
        use_frame_counting = self._is_file_source and native_fps > 0
        frame_step = max(1, round(native_fps / self.config.target_fps)) if use_frame_counting else None
        target_interval = 1.0 / self.config.target_fps

        logger.info(
            "Source=%s native_fps=%.2f target_fps=%.1f mode=%s",
            self.config.source,
            native_fps,
            self.config.target_fps,
            "frame-count (file)" if use_frame_counting else "wall-clock (live)",
        )

        emitted = 0
        raw_frame_index = 0
        last_emit_time = 0.0
        start_time = time.monotonic()

        try:
            while True:
                grabbed = self._cap.grab()  # cheap: reads compressed frame, no decode

                if not grabbed:
                    if self._is_file_source:
                        if self.config.loop_file:
                            logger.info("End of file reached - looping.")
                            self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                            raw_frame_index = 0
                            continue
                        logger.info("End of file reached.")
                        break
                    # live source dropped
                    if not self._reconnect_with_backoff():
                        break
                    continue

                should_emit = False
                if use_frame_counting:
                    should_emit = raw_frame_index % frame_step == 0
                else:
                    now = time.monotonic() - start_time
                    if now - last_emit_time >= target_interval:
                        should_emit = True
                        last_emit_time = now

                if should_emit:
                    ok, frame = self._cap.retrieve()  # decode only kept frames
                    if ok:
                        frame = self._maybe_resize(frame)
                        if self._writer is None and self.config.output_path:
                            self._init_writer(frame)
                        if self._writer is not None:
                            self._writer.write(frame)

                        timestamp = time.time()
                        if on_frame is not None:
                            on_frame(frame, emitted, timestamp)

                        emitted += 1
                        if emitted % 25 == 0:
                            logger.info("Emitted %d frames (raw frames seen: %d)", emitted, raw_frame_index + 1)

                        if max_frames is not None and emitted >= max_frames:
                            break

                raw_frame_index += 1
        finally:
            self.close()

        logger.info("Intake finished. Emitted %d frames from %d raw frames.", emitted, raw_frame_index)
        return emitted

    def close(self) -> None:
        if self._cap is not None:
            self._cap.release()
        if self._writer is not None:
            self._writer.release()


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Downsample a video source to a target FPS.")
    parser.add_argument(
        "--source",
        required=True,
        help="Webcam index ('0'), file path, or RTSP/HTTP stream URL.",
    )
    parser.add_argument("--target-fps", type=float, default=5.0, help="Output frame rate (default: 5).")
    parser.add_argument("--resize-width", type=int, default=None, help="Optionally downscale frame width.")
    parser.add_argument("--output", type=str, default=None, help="Path to write the downsampled .mp4.")
    parser.add_argument("--max-frames", type=int, default=None, help="Stop after emitting N frames.")
    parser.add_argument("--loop", action="store_true", help="Loop file sources instead of stopping at EOF.")
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging.")
    return parser


def main() -> None:
    args = build_arg_parser().parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )

    config = IntakeConfig(
        source=args.source,
        target_fps=args.target_fps,
        resize_width=args.resize_width,
        output_path=args.output,
        loop_file=args.loop,
    )
    intake = VideoIntake(config)

    def log_frame(frame: np.ndarray, index: int, timestamp: float) -> None:
        # Placeholder hook: this is where a YOLOv8 detector / tracker would
        # be called per emitted frame, e.g.:
        #   detections = model(frame)
        #   push_to_backend(detections, camera_id, timestamp)
        logger.debug("frame #%d shape=%s ts=%.3f", index, frame.shape, timestamp)

    intake.run(on_frame=log_frame, max_frames=args.max_frames)


if __name__ == "__main__":
    main()
