import numpy as np
from app.ml.tracking import compute_color_embedding, perform_reid_match, update_tracks, initialize_tracker

def test_compute_color_embedding():
    # Make dummy frame with random colors
    frame = np.random.randint(0, 255, (200, 200, 3), dtype=np.uint8)
    emb = compute_color_embedding(frame, [10, 10, 50, 80])
    assert isinstance(emb, np.ndarray)
    assert len(emb) == 256
    # Vector is normalized
    assert np.allclose(np.linalg.norm(emb), 1.0, atol=1e-3)

def test_perform_reid_match():
    # Create two similar embeddings
    emb1 = np.random.randn(256)
    emb1 /= np.linalg.norm(emb1)
    
    # Matching same vector should return same ID
    id1 = perform_reid_match(emb1)
    id2 = perform_reid_match(emb1)
    assert id1 == id2
    
    # Different vector should yield new ID
    emb2 = -emb1
    id3 = perform_reid_match(emb2)
    assert id3 != id1

def test_update_tracks():
    initialize_tracker()
    frame = np.zeros((100, 100, 3), dtype=np.uint8)
    detections = [
        {"bbox": [10.0, 10.0, 30.0, 30.0], "confidence": 0.95, "class": "person"}
    ]
    
    tracks = update_tracks(detections, frame)
    assert len(tracks) == 1
    assert "shopper_" in tracks[0]["id"]
    assert tracks[0]["bbox"] == [10.0, 10.0, 30.0, 30.0]
