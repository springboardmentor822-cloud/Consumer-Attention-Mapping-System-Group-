import os
from pathlib import Path

os.environ.setdefault("YOLO_CONFIG_DIR", str(Path(__file__).resolve().parent / "data"))

import numpy as np
import supervision as sv

from app.ai.detector import Detection, detect_people


def _to_supervision_detections(people: list[Detection]) -> sv.Detections:
    if not people:
        return sv.Detections.empty()

    return sv.Detections(
        xyxy=np.array([person.bbox.as_list() for person in people], dtype=np.float32),
        confidence=np.array([person.confidence for person in people], dtype=np.float32),
        class_id=np.array([person.class_id for person in people], dtype=int),
    )


tracker = sv.ByteTrack()

def process_video_frame(frame):
    # Detect + Track
    detections = _to_supervision_detections(detect_people(frame, confidence=0.25))
    
    # Update tracker
    detections = tracker.update_with_detections(detections)
    
    # Annotate
    annotated_frame = frame.copy()
    annotated_frame = sv.BoxAnnotator().annotate(annotated_frame, detections)
    annotated_frame = sv.LabelAnnotator().annotate(annotated_frame, detections)
    
    return detections, annotated_frame
