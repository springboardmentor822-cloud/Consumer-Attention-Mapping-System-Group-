"""
Proves the DetectionPipeline <-> AttentionPipeline wiring itself is
correct: a tracked person, held in front of a calibrated camera and a
known shelf for several frames, should produce exactly one AttentionEvent
routed to that shelf. Uses SyntheticFacePoseEstimator (not a real face
detector - see face_pose_estimator.py) so this test doesn't depend on
the blocked MediaPipe model download; it verifies the glue code, not
real-world gaze accuracy.
"""
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ai_models.attention.attention_pipeline import AttentionPipeline
from ai_models.attention.face_pose_estimator import SyntheticFacePoseEstimator, crop_head_region
from ai_models.attention.gaze_mapping import ShelfTarget
from ai_models.calibration.homography import CameraCalibration, PointCorrespondence
from ai_models.detection.detector import Detection
from ai_models.detection.pipeline import DetectionPipeline


class _FakeBackend:
    """Records what would have been sent to the real backend, without any network calls."""

    def __init__(self):
        self.sessions_created: list[str] = []
        self.attention_events: list[dict] = []
        self._next_session_id = 100

    def create_session(self, store_id, shopper_uid, entry_time):
        self.sessions_created.append(shopper_uid)
        self._next_session_id += 1
        return self._next_session_id

    def close_session(self, session_id, exit_time):
        pass

    def push_tracking_batch(self, points):
        pass

    def get_camera_calibration(self, camera_id):
        # A simple, well-conditioned calibration: pixel (0,0)-(800,600) maps
        # roughly onto a 10x8 meter floor area.
        points = [
            PointCorrespondence(pixel_x=0, pixel_y=600, floor_x=0.0, floor_y=0.0),
            PointCorrespondence(pixel_x=800, pixel_y=600, floor_x=10.0, floor_y=0.0),
            PointCorrespondence(pixel_x=800, pixel_y=0, floor_x=10.0, floor_y=8.0),
            PointCorrespondence(pixel_x=0, pixel_y=0, floor_x=0.0, floor_y=8.0),
        ]
        return CameraCalibration.from_correspondences(points)

    def create_attention_event(self, **kwargs):
        self.attention_events.append(kwargs)
        return len(self.attention_events)


class _EmptyDetector:
    """Simulates nobody being detected - used to trigger track expiry."""

    def detect(self, frame):
        return []


class _FixedDetector:
    """Always returns one detection at a fixed position - simulates a
    person standing still in front of a shelf for several frames."""

    def __init__(self, x, y, w, h):
        self.x, self.y, self.w, self.h = x, y, w, h

    def detect(self, frame):
        return [Detection(x=self.x, y=self.y, w=self.w, h=self.h, confidence=0.95)]


def _make_uniform_frame(width=800, height=600, brightness=50, bright_side="left"):
    """A synthetic frame with a horizontal brightness gradient so
    SyntheticFacePoseEstimator produces a consistent, non-zero fake yaw."""
    frame = np.full((height, width, 3), brightness, dtype=np.uint8)
    half = width // 2
    if bright_side == "left":
        frame[:, :half] = 220
    else:
        frame[:, half:] = 220
    return frame


def test_sustained_gaze_produces_one_attention_event():
    shelf = ShelfTarget(shelf_id=42, floor_x=5.0, floor_y=8.0)  # roughly "north" of center
    backend = _FakeBackend()

    attention_pipeline = AttentionPipeline(
        camera_id=1,
        camera_mount_angle_degrees=90,  # camera facing "north" (+y) in floor coords
        shelves=[shelf],
        backend=backend,
        dry_run=False,
        min_duration_seconds=1.0,
        max_angle_deviation=45.0,
        max_distance_m=10.0,
    )

    # Person standing roughly in the middle of the frame, facing the shelf
    # (bright_side chosen so the synthetic yaw comes out near 0 -> combined
    # with a 90 degree camera mount, facing angle ~90 -> toward the shelf).
    detector = _FixedDetector(x=380, y=250, w=60, h=300)
    pipeline = DetectionPipeline(
        camera_id=1,
        store_id=1,
        detector=detector,
        backend=backend,
        dry_run=False,
        attention_pipeline=attention_pipeline,
        face_pose_estimator=SyntheticFacePoseEstimator(),
    )

    frame = _make_uniform_frame(bright_side="left")  # roughly centered brightness -> yaw ~ -small
    # Zero out asymmetry in the head-crop region specifically so the fake yaw is ~0
    frame[:] = 128  # flat gray frame -> center of mass exactly centered -> yaw == 0

    base_ts = 1000.0
    for i in range(20):  # 20 frames @ 5fps = 4 seconds of sustained "gaze"
        pipeline.on_frame(frame, index=i, timestamp=base_ts + i * 0.2)

    assert len(backend.sessions_created) == 1
    # Attention is still accumulating - it only finalizes on gaze-target
    # change or session end, so no event has been emitted mid-gaze yet.
    assert len(backend.attention_events) == 0

    # Now the person walks away (detector stops finding them). After
    # max_disappeared_frames of empty detections, DetectionPipeline closes
    # the session, which flushes the accumulated attention as a real event.
    empty_detector = _EmptyDetector()
    pipeline.detector = empty_detector
    for i in range(20, 35):
        pipeline.on_frame(frame, index=i, timestamp=base_ts + i * 0.2)

    assert len(backend.attention_events) == 1
    event = backend.attention_events[0]
    assert event["shelf_id"] == 42
    assert event["duration_seconds"] >= 1.0


def test_no_attention_events_without_calibration():
    """If a camera has no calibration, floor_x/floor_y are None, so the
    attention pipeline must never be called (no valid position to map)."""

    class _NoCalibrationBackend(_FakeBackend):
        def get_camera_calibration(self, camera_id):
            return None

    backend = _NoCalibrationBackend()
    shelf = ShelfTarget(shelf_id=1, floor_x=5.0, floor_y=5.0)
    attention_pipeline = AttentionPipeline(
        camera_id=1, camera_mount_angle_degrees=0, shelves=[shelf], backend=backend
    )

    detector = _FixedDetector(x=380, y=250, w=60, h=300)
    pipeline = DetectionPipeline(
        camera_id=1,
        store_id=1,
        detector=detector,
        backend=backend,
        dry_run=False,
        attention_pipeline=attention_pipeline,
        face_pose_estimator=SyntheticFacePoseEstimator(),
    )

    frame = _make_uniform_frame()
    for i in range(10):
        pipeline.on_frame(frame, index=i, timestamp=1000.0 + i * 0.2)

    assert len(backend.attention_events) == 0


def test_crop_head_region_is_top_slice_of_bbox():
    frame = np.zeros((600, 800, 3), dtype=np.uint8)
    crop = crop_head_region(frame, bbox_x=100, bbox_y=200, bbox_w=60, bbox_h=300)
    assert crop.shape[0] == int(300 * 0.22)
    assert crop.shape[1] == 60
