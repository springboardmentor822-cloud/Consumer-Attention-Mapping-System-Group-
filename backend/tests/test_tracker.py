import pytest
from app.ml.tracker import ByteTracker

def test_tracker_initialization():
    tracker = ByteTracker()
    assert tracker is not None

def test_tracker_stable_ids():
    tracker = ByteTracker()
    detections = [
        {"class": "person", "confidence": 0.9, "bbox": [100.0, 100.0, 200.0, 300.0]}
    ]
    
    tracks1 = tracker.update(detections)
    assert len(tracks1) == 1
    id1 = tracks1[0]["track_id"]
    
    detections_moved = [
        {"class": "person", "confidence": 0.88, "bbox": [102.0, 101.0, 201.0, 301.0]}
    ]
    tracks2 = tracker.update(detections_moved)
    assert len(tracks2) == 1
    id2 = tracks2[0]["track_id"]
    
    assert id1 == id2

def test_tracker_crossing_shoppers():
    # Setup two shoppers moving in opposite directions crossing each other
    # Match thresh needs to be high enough to match small overlaps
    tracker = ByteTracker(track_thresh=0.4, match_thresh=0.9)
    
    # Path left-to-right
    p1 = [
        [10.0, 100.0, 30.0, 150.0],
        [20.0, 100.0, 40.0, 150.0],
        [30.0, 100.0, 50.0, 150.0],
        [40.0, 100.0, 60.0, 150.0], # Crossing point
        [50.0, 100.0, 70.0, 150.0],
        [60.0, 100.0, 80.0, 150.0],
        [70.0, 100.0, 90.0, 150.0]
    ]
    
    # Path right-to-left
    p2 = [
        [70.0, 100.0, 90.0, 150.0],
        [60.0, 100.0, 80.0, 150.0],
        [50.0, 100.0, 70.0, 150.0],
        [40.0, 100.0, 60.0, 150.0], # Crossing point
        [30.0, 100.0, 50.0, 150.0],
        [20.0, 100.0, 40.0, 150.0],
        [10.0, 100.0, 30.0, 150.0]
    ]
    
    id_left = None
    id_right = None
    
    for i in range(len(p1)):
        dets = [
            {"class": "person", "confidence": 0.9, "bbox": p1[i]},
            {"class": "person", "confidence": 0.9, "bbox": p2[i]}
        ]
        tracks = tracker.update(dets)
        assert len(tracks) == 2
        
        if i == 0:
            id_left = next(t["track_id"] for t in tracks if t["bbox"][0] == 10.0)
            id_right = next(t["track_id"] for t in tracks if t["bbox"][0] == 70.0)
        elif i == len(p1) - 1:
            id_left_end = next(t["track_id"] for t in tracks if t["bbox"][0] == 70.0)
            id_right_end = next(t["track_id"] for t in tracks if t["bbox"][0] == 10.0)
            
            assert id_left == id_left_end
            assert id_right == id_right_end

def test_tracker_occlusion_recovery():
    tracker = ByteTracker(max_time_lost=5)
    
    # Frame 1: Shopper active
    dets1 = [{"class": "person", "confidence": 0.9, "bbox": [10.0, 10.0, 30.0, 50.0]}]
    tracks1 = tracker.update(dets1)
    assert len(tracks1) == 1
    original_id = tracks1[0]["track_id"]
    
    # Frame 2-3: Shopper occluded (no detections)
    tracks2 = tracker.update([])
    assert len(tracks2) == 0
    tracks3 = tracker.update([])
    assert len(tracks3) == 0
    
    # Frame 4: Shopper reappears close to last known location
    dets4 = [{"class": "person", "confidence": 0.9, "bbox": [12.0, 11.0, 32.0, 51.0]}]
    tracks4 = tracker.update(dets4)
    assert len(tracks4) == 1
    recovered_id = tracks4[0]["track_id"]
    
    assert original_id == recovered_id

def test_tracker_expiration():
    tracker = ByteTracker(max_time_lost=2)
    
    # Frame 1: Shopper active
    dets1 = [{"class": "person", "confidence": 0.9, "bbox": [10.0, 10.0, 30.0, 50.0]}]
    tracks1 = tracker.update(dets1)
    assert len(tracks1) == 1
    original_id = tracks1[0]["track_id"]
    
    # Frame 2-3: Shopper lost (no detections)
    tracker.update([])
    tracker.update([])
    
    # Frame 4: Exceeded max_time_lost (2 frames), shopper should expire
    tracker.update([])
    
    # Reappear in same spot. Since track expired, it should be treated as a brand new track with a new ID
    dets5 = [{"class": "person", "confidence": 0.9, "bbox": [10.0, 10.0, 30.0, 50.0]}]
    tracks5 = tracker.update(dets5)
    assert len(tracks5) == 1
    new_id = tracks5[0]["track_id"]
    
    assert original_id != new_id
