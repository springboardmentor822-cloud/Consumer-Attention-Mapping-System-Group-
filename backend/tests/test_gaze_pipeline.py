import pytest
import numpy as np
from unittest.mock import MagicMock
import app.ml.gaze as gaze_module
from app.ml.gaze import calculate_gaze_overlap, is_gaze_overlapping_shelf

def test_gaze_overlap_math():
    # Nose at center (320, 240) looking straight ahead (yaw = 0.0)
    gaze_vector = {
        "yaw": 0.0,
        "pitch": 0.0,
        "nose_x": 320.0,
        "nose_y": 240.0
    }
    shopper_bbox = [300.0, 200.0, 340.0, 300.0]
    
    # Shelf is directly ahead
    shelf_ahead = {"x1": 400.0, "y1": 200.0, "width": 50.0, "height": 50.0}
    # Shelf is behind or out of way
    shelf_away = {"x1": 100.0, "y1": 100.0, "width": 50.0, "height": 50.0}
    
    assert is_gaze_overlapping_shelf(gaze_vector, shopper_bbox, shelf_ahead) is True
    assert is_gaze_overlapping_shelf(gaze_vector, shopper_bbox, shelf_away) is False

def test_calculate_gaze_overlap_mocked(monkeypatch):
    # Mock landmarks
    # Spaced out coordinates for: nose, chin, left eye, right eye, left mouth, right mouth
    positions = {
        1: (0.5, 0.5),
        152: (0.5, 0.8),
        33: (0.3, 0.3),
        263: (0.7, 0.3),
        61: (0.4, 0.6),
        291: (0.6, 0.6)
    }
    
    mock_landmarks_list = []
    for i in range(500):
        mock_landmark = MagicMock()
        if i in positions:
            mock_landmark.x = positions[i][0]
            mock_landmark.y = positions[i][1]
        else:
            mock_landmark.x = 0.5
            mock_landmark.y = 0.5
        mock_landmarks_list.append(mock_landmark)
    
    mock_face_landmarks = MagicMock()
    mock_face_landmarks.landmark = mock_landmarks_list
    
    mock_mesh = MagicMock()
    mock_mesh.process.return_value.multi_face_landmarks = [mock_face_landmarks]
    mock_mesh.__enter__.return_value = mock_mesh
    
    monkeypatch.setattr(gaze_module.mp.solutions.face_mesh, "FaceMesh", MagicMock(return_value=mock_mesh))
    
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    shopper = [10.0, 10.0, 100.0, 100.0]
    shelf = {"x1": 50.0, "y1": 50.0, "width": 20.0, "height": 20.0}
    
    res = calculate_gaze_overlap(shopper, shelf, frame=frame)
    assert res is not None
    assert "yaw" in res
    assert "pitch" in res
    assert "roll" in res
    assert "looking_at_shelf" in res
    assert res["confidence"] == 0.90
