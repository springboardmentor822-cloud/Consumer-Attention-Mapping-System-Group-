import pytest
import numpy as np
from unittest.mock import MagicMock
import app.ml.gaze as gaze_module
from app.ml.gaze import estimate_gaze_direction

def test_gaze_no_frame():
    # If frame is None, should return None
    res = estimate_gaze_direction([0.0, 0.0, 100.0, 100.0], frame=None)
    assert res is None

def test_gaze_invalid_bbox():
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    # Bbox is outside or inverted
    res = estimate_gaze_direction([100.0, 100.0, 50.0, 50.0], frame=frame)
    assert res is None

def test_gaze_face_mesh_not_found(monkeypatch):
    # Mock FaceMesh to return no face landmarks
    mock_mesh = MagicMock()
    mock_mesh.process.return_value.multi_face_landmarks = None
    
    mock_mesh_class = MagicMock(return_value=mock_mesh)
    # Mock the context manager behavior of FaceMesh
    mock_mesh.__enter__.return_value = mock_mesh
    
    monkeypatch.setattr(gaze_module.mp.solutions.face_mesh, "FaceMesh", mock_mesh_class)
    
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    res = estimate_gaze_direction([10.0, 10.0, 100.0, 100.0], frame=frame)
    assert res is None
