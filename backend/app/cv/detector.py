import os
from pathlib import Path

os.environ.setdefault("YOLO_CONFIG_DIR", str(Path(__file__).resolve().parent / "data"))

import cv2

from app.ai.detector import detect_people

def detect_shoppers(frame):
    people = detect_people(frame)
    detections = [
        {
            "bbox": person.bbox.as_list(),
            "confidence": person.confidence,
            "class_id": person.class_id,
            "class_name": person.class_name,
            "center": [person.center_x, person.center_y],
        }
        for person in people
    ]

    annotated = frame.copy()
    for person in people:
        x1, y1, x2, y2 = person.bbox.as_list()
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (59, 130, 246), 2)
        cv2.putText(
            annotated,
            f"{person.class_name} {person.confidence:.2f}",
            (x1, max(y1 - 8, 0)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (59, 130, 246),
            2,
            cv2.LINE_AA,
        )

    return detections, annotated
