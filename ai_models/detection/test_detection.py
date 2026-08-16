import os
import sys
from pathlib import Path

import cv2
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ai_models.detection.detector import Detection, HOGPersonDetector
from ai_models.detection.tracker import CentroidTracker

SAMPLE_VIDEO = os.path.join(
    os.path.dirname(__file__), "..", "video_intake", "sample_data", "vtest.avi"
)


@pytest.mark.skipif(not os.path.exists(SAMPLE_VIDEO), reason="sample video not downloaded")
def test_hog_detector_finds_people_in_sample_frame():
    cap = cv2.VideoCapture(SAMPLE_VIDEO)
    ok, frame = cap.read()
    cap.release()
    assert ok

    detector = HOGPersonDetector()
    detections = detector.detect(frame)

    assert len(detections) > 0
    for d in detections:
        assert isinstance(d, Detection)
        assert d.w > 0 and d.h > 0


def test_centroid_tracker_assigns_consistent_ids_across_frames():
    tracker = CentroidTracker(max_disappeared=3, max_distance=50)

    frame1 = [Detection(x=100, y=100, w=50, h=100, confidence=0.9)]
    active1 = tracker.update(frame1)
    assert len(active1) == 1
    track_id = next(iter(active1.keys()))

    # small movement -> should keep the same track id
    frame2 = [Detection(x=105, y=102, w=50, h=100, confidence=0.9)]
    active2 = tracker.update(frame2)
    assert list(active2.keys()) == [track_id]


def test_centroid_tracker_creates_new_id_for_distant_detection():
    tracker = CentroidTracker(max_disappeared=3, max_distance=30)

    tracker.update([Detection(x=0, y=0, w=20, h=40, confidence=0.9)])
    active = tracker.update([Detection(x=500, y=500, w=20, h=40, confidence=0.9)])

    # far away -> can't be the same track, and old one hasn't expired yet
    assert len(active) == 2


def test_centroid_tracker_drops_track_after_max_disappeared():
    tracker = CentroidTracker(max_disappeared=2, max_distance=50)

    tracker.update([Detection(x=0, y=0, w=20, h=40, confidence=0.9)])
    tracker.update([])  # disappear frame 1
    tracker.update([])  # disappear frame 2
    active = tracker.update([])  # disappear frame 3 -> should be dropped

    assert len(active) == 0
