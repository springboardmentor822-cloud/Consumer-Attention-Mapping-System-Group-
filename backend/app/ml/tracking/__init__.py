import numpy as np
from app.ml.tracker import ByteTracker
from typing import List, Dict, Any

# Globally cached ByteTracker instance
_tracker = ByteTracker(track_thresh=0.4, match_thresh=0.8)

# Registry of camera-cross shopper feature vectors to match profiles
# Maps global_shopper_id -> embedding_vector
_reid_embeddings: Dict[str, np.ndarray] = {}
SIM_THRESHOLD = 0.85

def initialize_tracker():
    global _tracker
    _tracker = ByteTracker(track_thresh=0.4, match_thresh=0.8)

def compute_color_embedding(frame: np.ndarray, bbox: List[float]) -> np.ndarray:
    """
    Computes a lightweight 256-dimensional spatial-color feature vector (embedding) 
    of the cropped bounding box to identify identical shoppers across overlapping camera views.
    """
    if frame is None or len(bbox) < 4:
        return np.random.randn(256)
    
    h, w, _ = frame.shape
    x1, y1, x2, y2 = map(int, bbox)
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    
    if x2 <= x1 or y2 <= y1:
        return np.random.randn(256)
        
    crop = frame[y1:y2, x1:x2]
    # Resize crop to standard ReID dimension
    resized = np.zeros((128, 64, 3), dtype=np.uint8)
    try:
        import cv2
        resized = cv2.resize(crop, (64, 128))
    except Exception:
        pass
        
    # Split into 4 horizontal stripes and compute mean color vectors
    stripes = np.array_split(resized, 4, axis=0)
    feat = []
    for s in stripes:
        # Compute histogram values or simple channel means + stds
        for c in range(3):
            ch = s[:, :, c]
            feat.append(float(np.mean(ch)))
            feat.append(float(np.std(ch)))
            
    # Pad to 256 dimensions
    feat = np.array(feat, dtype=np.float32)
    feat_pad = np.pad(feat, (0, 256 - len(feat)), mode='constant')
    norm = np.linalg.norm(feat_pad)
    if norm > 0:
        feat_pad /= norm
    return feat_pad

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))

def perform_reid_match(embedding: np.ndarray) -> str:
    """
    Performs cosine similarity matching against the global shopper embeddings database.
    If similarity is above threshold, returns matching shopper ID.
    Otherwise, registers embedding under a new shopper ID.
    """
    best_sim = 0.0
    best_id = None
    
    for shopper_id, saved_emb in _reid_embeddings.items():
        sim = cosine_similarity(embedding, saved_emb)
        if sim > best_sim:
            best_sim = sim
            best_id = shopper_id
            
    if best_id and best_sim >= SIM_THRESHOLD:
        return best_id
        
    # Generate new global shopper identifier
    new_id = f"shopper_{len(_reid_embeddings) + 101}"
    _reid_embeddings[new_id] = embedding
    return new_id

def update_tracks(detections: List[Dict[str, Any]], frame: np.ndarray) -> List[Dict[str, Any]]:
    """
    Inputs bounding box detections, processes them via ByteTracker,
    extracts color embeddings, performs shopper Re-ID matching, and returns tracks.
    """
    global _tracker
    # Format inputs for ByteTracker
    formatted_detections = []
    for det in detections:
        # Expecting det keys: bbox, confidence, class
        formatted_detections.append({
            "bbox": det.get("bbox", [0.0, 0.0, 0.0, 0.0]),
            "confidence": det.get("confidence", 0.9),
            "class": det.get("class", "person")
        })
        
    tracker_outputs = _tracker.update(formatted_detections)
    
    # Enrich outputs with Re-ID cross-camera persistent match IDs
    results = []
    for track in tracker_outputs:
        bbox = track["bbox"]
        emb = compute_color_embedding(frame, bbox)
        global_id = perform_reid_match(emb)
        results.append({
            "id": global_id,
            "bbox": bbox,
            "class": track["class"]
        })
        
    return results
