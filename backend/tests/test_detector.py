import pytest
import numpy as np
from app.ml.detector import PersonDetector

def test_detector_initialization():
    detector = PersonDetector()
    assert detector is not None

def test_detector_output_format():
    detector = PersonDetector()
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    detections = detector.detect(frame)
    
    assert isinstance(detections, list)
    if len(detections) > 0:
        det = detections[0]
        assert det["class"] == "person"
        assert "bbox" in det
        assert len(det["bbox"]) == 4
        assert "confidence" in det
