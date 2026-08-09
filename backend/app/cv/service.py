import os
from pathlib import Path

os.environ.setdefault("YOLO_CONFIG_DIR", str(Path(__file__).resolve().parent / "data"))

import numpy as np
import supervision as sv

from app.ai.detector import Detection, detect_people
from .heatmap import HeatmapGenerator


def _to_supervision_detections(people: list[Detection]) -> sv.Detections:
    if not people:
        return sv.Detections.empty()

    return sv.Detections(
        xyxy=np.array([person.bbox.as_list() for person in people], dtype=np.float32),
        confidence=np.array([person.confidence for person in people], dtype=np.float32),
        class_id=np.array([person.class_id for person in people], dtype=int),
    )


class CVService:
    def __init__(self):
        self.tracker = sv.ByteTrack()
        self.heatmap_gen = HeatmapGenerator()

    def process_frame(self, frame):
        detections = _to_supervision_detections(detect_people(frame, confidence=0.25))
        detections = self.tracker.update_with_detections(detections)

        annotated_frame = frame.copy()
        annotated_frame = sv.BoxAnnotator().annotate(annotated_frame, detections)
        annotated_frame = sv.LabelAnnotator().annotate(annotated_frame, detections)

        return {
            "detections": detections,
            "annotated_frame": annotated_frame,
            "count": len(detections)
        }

    def generate_heatmap(self, frame, detections):
        return self.heatmap_gen.generate(frame, detections)
