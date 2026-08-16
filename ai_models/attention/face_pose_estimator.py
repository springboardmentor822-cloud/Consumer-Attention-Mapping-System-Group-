"""
This is the missing link flagged in earlier work: something that takes a
whole video frame plus a tracked person's body bounding box and returns
a HeadPose for that person, so `detection/pipeline.py` (which tracks
bodies) and `attention_pipeline.py` (which turns head yaw into shelf
attention) can be wired into one pipeline instead of two separate ones.

Two implementations, same interface:

* MediaPipeFacePoseEstimator - the real production path. Wraps
  head_pose.MediaPipeFaceLandmarker (landmark extraction) +
  head_pose.estimate_head_pose (the geometry) into a single call. Needs
  `face_landmarker.task`, which this sandbox can't download
  (storage.googleapis.com is blocked - see head_pose.py's docstring for
  the confirmed error). Complete, correct integration code; just not
  runnable here.

* SyntheticFacePoseEstimator - NOT a face detector. It's a deterministic
  stand-in used to prove the *wiring* between DetectionPipeline and
  AttentionPipeline is correct without needing a real model: given a
  head-region crop, it derives a fake-but-repeatable "yaw" from the
  crop's pixel content (its horizontal center of mass), purely so the
  same input produces the same output across a test run. It has no
  relationship to a real person's actual head orientation and must never
  be used for anything except integration testing.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional, Protocol

import numpy as np

from ai_models.attention.head_pose import HeadPose, estimate_head_pose


class FacePoseEstimator(Protocol):
    def estimate(self, head_crop: np.ndarray) -> Optional[HeadPose]: ...


class MediaPipeFacePoseEstimator:
    """Production estimator. Requires `pip install mediapipe` and a
    downloaded `face_landmarker.task` model file alongside this script."""

    def __init__(self, model_path: str = "face_landmarker.task"):
        from ai_models.attention.head_pose import MediaPipeFaceLandmarker

        if not Path(model_path).exists():
            raise FileNotFoundError(
                f"'{model_path}' not found. Download it from MediaPipe's model zoo "
                f"on a machine with normal internet access, then place it alongside "
                f"this script (see this package's README for the exact URL)."
            )
        self._landmarker = MediaPipeFaceLandmarker(model_path=model_path)

    def estimate(self, head_crop: np.ndarray) -> Optional[HeadPose]:
        h, w = head_crop.shape[:2]
        if h == 0 or w == 0:
            return None

        faces = self._landmarker.extract(head_crop)
        if not faces:
            return None

        return estimate_head_pose(faces[0], frame_width=w, frame_height=h)


class SyntheticFacePoseEstimator:
    """
    Integration-testing stand-in — NOT a face detector. See module
    docstring. Derives a deterministic fake yaw from the crop's
    horizontal intensity center-of-mass, scaled to +/-45 degrees.
    Always "detects" (never returns None, unless the crop is empty) so
    pipeline wiring can be exercised without depending on real face
    presence or a downloaded model.
    """

    def estimate(self, head_crop: np.ndarray) -> Optional[HeadPose]:
        if head_crop.size == 0:
            return None
        gray = head_crop.mean(axis=2) if head_crop.ndim == 3 else head_crop
        col_indices = np.arange(gray.shape[1])
        weights = gray.sum(axis=0) + 1e-6
        center_of_mass = float((col_indices * weights).sum() / weights.sum())
        normalized = (center_of_mass / gray.shape[1]) - 0.5  # -0.5..0.5
        fake_yaw = normalized * 90.0  # -45..45 degrees
        return HeadPose(yaw=fake_yaw, pitch=0.0, roll=0.0)


def crop_head_region(
    frame: np.ndarray, bbox_x: float, bbox_y: float, bbox_w: float, bbox_h: float
) -> np.ndarray:
    """
    A person-detector's bounding box covers the whole body; a face
    estimator needs just the head. Approximates the head region as the
    top ~22% of the body box (a reasonable ratio for a standing adult),
    clamped to the frame bounds.
    """
    frame_h, frame_w = frame.shape[:2]
    x1 = max(0, int(bbox_x))
    y1 = max(0, int(bbox_y))
    x2 = min(frame_w, int(bbox_x + bbox_w))
    y2 = min(frame_h, int(bbox_y + bbox_h * 0.22))
    if x2 <= x1 or y2 <= y1:
        return frame[0:0, 0:0]
    return frame[y1:y2, x1:x2]
