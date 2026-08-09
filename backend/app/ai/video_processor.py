"""
PART 2 - Video Processing Pipeline

Builds the "conveyor belt" that turns a raw video file into batches of
clean, resized frames without loading the whole video into memory at
once. Independent module - no DB, no frontend, no imports from other
Milestone 2 packages except `preprocessing` (pure functions).

Functions
---------
load_video(path)            -> cv2.VideoCapture
extract_frames(cap, ...)    -> Generator[tuple[int, np.ndarray], None, None]
resize_frames(frame, size)  -> np.ndarray
batch_generator(frames, n)  -> Generator[list[np.ndarray], None, None]
"""

from __future__ import annotations

from pathlib import Path
from typing import Generator, Iterable, Iterator

import cv2
import numpy as np

SUPPORTED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov"}
DEFAULT_FRAME_SIZE = (640, 640)  # matches YOLOv8 default input size


class VideoLoadError(Exception):
    """Raised when a video file cannot be opened or read."""


def load_video(path: str | Path) -> cv2.VideoCapture:
    """
    Open a video file for frame-by-frame reading.

    Raises VideoLoadError if the file is missing, has an unsupported
    extension, or OpenCV cannot open it.
    """
    path = Path(path)

    if not path.exists():
        raise VideoLoadError(f"Video file not found: {path}")

    if path.suffix.lower() not in SUPPORTED_VIDEO_EXTENSIONS:
        raise VideoLoadError(
            f"Unsupported video extension '{path.suffix}'. "
            f"Supported: {sorted(SUPPORTED_VIDEO_EXTENSIONS)}"
        )

    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        raise VideoLoadError(f"OpenCV could not open video: {path}")

    return cap


def get_video_metadata(cap: cv2.VideoCapture) -> dict:
    """Basic metadata used by callers to report processing statistics."""
    return {
        "fps": cap.get(cv2.CAP_PROP_FPS) or 0.0,
        "frame_count": int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0),
        "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0),
        "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0),
    }


def extract_frames(
    cap: cv2.VideoCapture,
    frame_skip: int = 1,
    max_frames: int | None = None,
) -> Generator[tuple[int, np.ndarray], None, None]:
    """
    Yield (frame_number, frame) pairs one at a time. Never loads the
    whole video into memory - this is the "conveyor belt".

    frame_skip: process every Nth frame (1 = every frame).
    max_frames: stop after this many *yielded* frames (None = no limit).
    """
    frame_number = 0
    yielded = 0

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            if frame_number % max(frame_skip, 1) == 0:
                yield frame_number, frame
                yielded += 1
                if max_frames is not None and yielded >= max_frames:
                    break

            frame_number += 1
    finally:
        cap.release()


def resize_frames(frame: np.ndarray, size: tuple[int, int] = DEFAULT_FRAME_SIZE) -> np.ndarray:
    """Resize a single frame to the size the AI model expects."""
    return cv2.resize(frame, size, interpolation=cv2.INTER_LINEAR)


def batch_generator(
    frames: Iterable[np.ndarray],
    batch_size: int = 8,
) -> Iterator[list[np.ndarray]]:
    """
    Group a stream of frames into batches, streaming them out instead
    of collecting everything up front. Keeps memory bounded regardless
    of video length.
    """
    batch: list[np.ndarray] = []
    for frame in frames:
        batch.append(frame)
        if len(batch) >= batch_size:
            yield batch
            batch = []

    if batch:
        yield batch
