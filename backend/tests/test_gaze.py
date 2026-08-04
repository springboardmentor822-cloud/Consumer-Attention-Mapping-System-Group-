import pytest
from app.ml.gaze import estimate_gaze_direction, is_gaze_overlapping_shelf, calculate_gaze_overlap

def test_gaze_directly_ahead():
    # Shopper is at (100, 100) to (140, 200). Head is at (120, 110)
    # Gaze direction yaw points toward center (320, 240) which is roughly 33 degrees
    shopper = [100.0, 100.0, 140.0, 200.0]
    
    # Shelf is placed directly along the gaze path (e.g. at (200, 150))
    shelf = {"x1": 180.0, "y1": 140.0, "x2": 220.0, "y2": 180.0}
    
    res = calculate_gaze_overlap(shopper, shelf)
    assert res["looking_at_shelf"] is True
    assert res["confidence"] > 0.0

def test_gaze_outside_cone():
    shopper = [100.0, 100.0, 140.0, 200.0]
    
    # Shelf is behind the shopper or far off to the side (e.g. at (0, 0))
    shelf = {"x1": 0.0, "y1": 0.0, "x2": 30.0, "y2": 30.0}
    
    res = calculate_gaze_overlap(shopper, shelf)
    assert res["looking_at_shelf"] is False

def test_gaze_multiple_shelves():
    shopper = [100.0, 100.0, 140.0, 200.0]
    
    # One shelf is directly along path, one is far off
    shelf_ahead = {"x1": 180.0, "y1": 140.0, "x2": 220.0, "y2": 180.0}
    shelf_away = {"x1": 0.0, "y1": 0.0, "x2": 30.0, "y2": 30.0}
    
    res_ahead = calculate_gaze_overlap(shopper, shelf_ahead)
    res_away = calculate_gaze_overlap(shopper, shelf_away)
    
    assert res_ahead["looking_at_shelf"] is True
    assert res_away["looking_at_shelf"] is False

def test_gaze_edge_cases():
    # Extreme/zero bounds box
    shopper = [0.0, 0.0, 0.0, 0.0]
    shelf = {"x1": 320.0, "y1": 240.0, "x2": 340.0, "y2": 260.0}
    
    res = calculate_gaze_overlap(shopper, shelf)
    # Head at (0, 0), looking towards center (320, 240), shelf is at center. Should match.
    assert res["looking_at_shelf"] is True
