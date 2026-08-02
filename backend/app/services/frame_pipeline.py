"""
Step 1: Data Pipeline Foundation & Preprocessing
Reads frames from either a video file (via a Camera DB row) or an MOT17-style
image sequence, resizes + augments, and yields GPU-resident batches.
"""

from __future__ import annotations

import re
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

import cv2
import numpy as np
import torch

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# MOT17's ground-truth class is a single generic "objects" class (see
# mot17_data.yml: nc=1, names=[objects]). It is NOT aligned with COCO's
# 80-class taxonomy used by yolov8n.pt/yolov8s.pt. Only use this constant
# when reading MOT17's own labels - never mix it with COCO class indices.
MOT17_GT_CLASS = 0  # single-class: person (per this dataset only)


@dataclass
class Frame:
    index: int
    image_bgr: np.ndarray  # raw frame, HWC, BGR (OpenCV convention)
    # source_id used to be a plain zone string ("zone_1"). It's now the
    # Camera row's UUID for real camera sources, so a frame can be traced
    # back to the exact camera that produced it - important now that a
    # single zone (e.g. the main aisle) can have more than one camera.
    # MOT17 validation frames aren't tied to a Camera row, so they keep
    # a plain string id ("mot17-04-val") instead of a UUID.
    source_id: "uuid.UUID | str"


class FrameSource(ABC):
    """Common interface so the rest of the pipeline doesn't care whether
    frames come from a video file or an image sequence."""

    source_id: "uuid.UUID | str"

    @abstractmethod
    def __iter__(self) -> Iterator[Frame]:
        ...

    @abstractmethod
    def __len__(self) -> int:
        ...


class VideoFrameSource(FrameSource):
    """Reads frames from an .mp4/.avi via OpenCV. Use for camera-backed
    video sources (Zone_1/2/3.mp4 today, real RTSP streams later)."""

    def __init__(self, video_path: Path, source_id: "uuid.UUID | str"):
        if not video_path.exists():
            raise FileNotFoundError(f"Video not found: {video_path}")
        self.video_path = video_path
        self.source_id = source_id
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise RuntimeError(f"OpenCV could not open {video_path}")
        self._frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self._fps = cap.get(cv2.CAP_PROP_FPS)
        cap.release()

    def __len__(self) -> int:
        return self._frame_count

    def __iter__(self) -> Iterator[Frame]:
        cap = cv2.VideoCapture(str(self.video_path))
        idx = 0
        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                yield Frame(index=idx, image_bgr=frame, source_id=self.source_id)
                idx += 1
        finally:
            cap.release()


class ImageSequenceFrameSource(FrameSource):
    """Reads frames from a flat, filename-prefixed image folder, e.g.
    MOT17's train_FRCNN/images/MOT17-04-FRCNN_000001.jpg style layout.
    Filters to one sequence prefix and sorts by the numeric suffix
    (not lexicographic string sort)."""

    _frame_num_re = re.compile(r"_(\d+)\.jpg$", re.IGNORECASE)

    def __init__(self, images_dir: Path, sequence_prefix: str, source_id: str):
        if not images_dir.exists():
            raise FileNotFoundError(f"Images dir not found: {images_dir}")
        candidates = list(images_dir.glob(f"{sequence_prefix}_*.jpg"))
        if not candidates:
            raise FileNotFoundError(
                f"No frames matching '{sequence_prefix}_*.jpg' in {images_dir}"
            )

        def frame_num(p: Path) -> int:
            m = self._frame_num_re.search(p.name)
            if not m:
                raise ValueError(f"Unexpected filename, no frame number: {p.name}")
            return int(m.group(1))

        self.paths = sorted(candidates, key=frame_num)
        self.source_id = source_id

    def __len__(self) -> int:
        return len(self.paths)

    def __iter__(self) -> Iterator[Frame]:
        for idx, path in enumerate(self.paths):
            image = cv2.imread(str(path))
            if image is None:
                raise RuntimeError(f"Failed to read {path}")
            yield Frame(index=idx, image_bgr=image, source_id=self.source_id)


def resize_and_augment(
    image_bgr: np.ndarray,
    target_size: int = 640,
    augment: bool = False,
) -> np.ndarray:
    """Resize to a square target_size (YOLOv8 default input), letterboxed
    to preserve aspect ratio. Optional flip/brightness jitter for training."""
    h, w = image_bgr.shape[:2]
    scale = target_size / max(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(image_bgr, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    canvas = np.full((target_size, target_size, 3), 114, dtype=np.uint8)
    top = (target_size - new_h) // 2
    left = (target_size - new_w) // 2
    canvas[top : top + new_h, left : left + new_w] = resized

    if augment:
        if np.random.rand() < 0.5:
            canvas = cv2.flip(canvas, 1)
        if np.random.rand() < 0.3:
            brightness = np.random.uniform(0.8, 1.2)
            canvas = np.clip(canvas.astype(np.float32) * brightness, 0, 255).astype(
                np.uint8
            )

    return canvas


def frame_batches(
    source: FrameSource,
    batch_size: int = 8,
    target_size: int = 640,
    augment: bool = False,
) -> Iterator[torch.Tensor]:
    """The conveyor belt: pulls frames, preprocesses, and yields
    GPU-resident batches shaped (B, 3, target_size, target_size), float32,
    normalized to [0, 1]. Never materializes the whole video at once."""
    batch: list[np.ndarray] = []
    for frame in source:
        processed = resize_and_augment(frame.image_bgr, target_size, augment)
        rgb = cv2.cvtColor(processed, cv2.COLOR_BGR2RGB)
        batch.append(rgb)
        if len(batch) == batch_size:
            yield _to_gpu_tensor(batch)
            batch = []
    if batch:
        yield _to_gpu_tensor(batch)


def _to_gpu_tensor(batch: list[np.ndarray]) -> torch.Tensor:
    arr = np.stack(batch).astype(np.float32) / 255.0  # (B, H, W, C)
    tensor = torch.from_numpy(arr).permute(0, 3, 1, 2).contiguous()  # (B, C, H, W)
    return tensor.to(DEVICE, non_blocking=True)


# --- Camera-backed source factory ---
# REPLACES the old hardcoded ZONE_VIDEOS dict + get_zone_source(zone: str).
# That version never touched the database - it was a static mapping baked
# into this module, disconnected from the Camera table added this
# session. This version takes an actual Camera row and resolves its
# source_path, so the DB registration you build (Camera model + router)
# is the real source of truth, not a hardcoded dict living in a second
# place that could drift out of sync with it.

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def get_camera_source(camera: "Camera") -> VideoFrameSource:
    """
    Build a VideoFrameSource from a Camera DB row.

    camera.source_path is expected to be a path relative to backend/data/
    (matching how Zone_1.mp4 etc. are currently stored), e.g. "Zone_1.mp4".
    If your Camera rows end up storing full/absolute paths instead, drop
    the DATA_DIR join below and use Path(camera.source_path) directly -
    flagging this now since which convention you use isn't settled yet
    and this function encodes an assumption about it.
    """
    video_path = DATA_DIR / camera.source_path
    return VideoFrameSource(video_path, source_id=camera.id)


def get_mot17_validation_source() -> ImageSequenceFrameSource:
    images_dir = DATA_DIR / "mot17" / "MOT17" / "train_FRCNN" / "images"
    return ImageSequenceFrameSource(
        images_dir, sequence_prefix="MOT17-04-FRCNN", source_id="mot17-04-val"
    )


if __name__ == "__main__":
    # Smoke test: confirm each active Camera's video opens and yields one
    # batch. Needs a live DB with Camera rows populated (the four model
    # files from earlier + at least one Camera row inserted) - this will
    # fail with an empty/no-rows result until that data exists.
    from sqlmodel import Session, select

    from app.core.db import engine
    from app.models.camera import Camera

    with Session(engine) as session:
        cameras = session.exec(select(Camera).where(Camera.is_active == True)).all()

    if not cameras:
        print("No active Camera rows found - insert Camera data before running this smoke test.")
    else:
        for camera in cameras:
            src = get_camera_source(camera)
            print(f"{camera.name} ({camera.id}): {len(src)} frames")
            first_batch = next(frame_batches(src, batch_size=4))
            print(f"  batch shape: {tuple(first_batch.shape)}, device: {first_batch.device}")

    mot17_src = get_mot17_validation_source()
    print(f"mot17-04: {len(mot17_src)} frames")
    first_batch = next(frame_batches(mot17_src, batch_size=4))
    print(f"  batch shape: {tuple(first_batch.shape)}, device: {first_batch.device}")
