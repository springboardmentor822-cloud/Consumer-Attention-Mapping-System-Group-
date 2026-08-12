"""
consumer_tracking.py (detector module)
---------------------------------------
Person Detection using YOLOv8 (COCO weights).
Dataset: COCO Dataset - used for person class detection.
Purpose: Detect customers/shoppers in retail store video frames.
"""
from ultralytics import YOLO

# Load YOLOv8 nano model (COCO pre-trained) — detects 80 classes including "person"
_model = None


def get_model():
    global _model
    if _model is None:
        _model = YOLO("yolov8n.pt")
    return _model


def detect_persons(frame):
    """
    Detect persons in a retail store frame using YOLOv8 (COCO).
    Returns only class 0 (person) detections relevant for customer tracking.
    """
    model = get_model()
    results = model(frame, classes=[0], verbose=False)  # class 0 = person (COCO)
    return results


def detect_objects(frame):
    """
    General object detection wrapper (backward compatible).
    Used by video_loader for full annotated frame output.
    """
    model = get_model()
    results = model(frame, classes=[0], verbose=False)
    return results


def detect_shelf_products(frame):
    """
    Shelf product detection placeholder.
    In production: use SKU-110K fine-tuned YOLOv8 weights.
    Dataset: SKU-110K Dataset - retail shelf product detection.
    Falls back to general detection with COCO weights.
    """
    model = get_model()
    results = model(frame, verbose=False)
    return results
