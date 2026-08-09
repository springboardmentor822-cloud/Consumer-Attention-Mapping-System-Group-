"""
PART 4 - Tracking Module (ByteTrack)
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field

import numpy as np
import supervision as sv

from app.ai.detector import Detection


@dataclass
class TrackPoint:
    frame_number: int
    x: float
    y: float
    confidence: float
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {
            "frame": self.frame_number,
            "x": round(self.x, 2),
            "y": round(self.y, 2),
            "confidence": round(self.confidence, 4),
            "timestamp": self.timestamp,
        }


class CustomerTracker:
    def __init__(self) -> None:
        self._byte_track = sv.ByteTrack()
        self._history: dict[int, list[TrackPoint]] = {}

    def reset(self) -> None:
        self._byte_track.reset()
        self._history.clear()

    def update(self, frame_number: int, people: list[Detection]) -> list[dict]:
        if not people:
            self._byte_track.update_with_detections(sv.Detections.empty())
            return []

        xyxy = np.array([p.bbox.as_list() for p in people], dtype=np.float32)
        confidence = np.array([p.confidence for p in people], dtype=np.float32)
        class_id = np.array([p.class_id for p in people], dtype=int)

        sv_detections = sv.Detections(xyxy=xyxy, confidence=confidence, class_id=class_id)
        tracked = self._byte_track.update_with_detections(sv_detections)

        frame_results: list[dict] = []
        for i in range(len(tracked)):
            if tracked.tracker_id is None:
                continue

            customer_id = int(tracked.tracker_id[i])
            x1, y1, x2, y2 = tracked.xyxy[i]
            center_x = float((x1 + x2) / 2.0)
            center_y = float((y1 + y2) / 2.0)
            conf = float(tracked.confidence[i]) if tracked.confidence is not None else 0.0

            point = TrackPoint(
                frame_number=frame_number,
                x=center_x,
                y=center_y,
                confidence=conf,
            )
            self._history.setdefault(customer_id, []).append(point)

            frame_results.append(
                {
                    "customer_id": customer_id,
                    "frame": frame_number,
                    "x": round(center_x, 2),
                    "y": round(center_y, 2),
                    "confidence": round(conf, 4),
                    "bbox": [float(x1), float(y1), float(x2), float(y2)],
                }
            )

        return frame_results

    def history_for(self, customer_id: int) -> list[dict]:
        return [p.to_dict() for p in self._history.get(customer_id, [])]

    def all_customer_ids(self) -> list[int]:
        return list(self._history.keys())

    def full_history(self) -> dict[int, list[dict]]:
        return {cid: [p.to_dict() for p in points] for cid, points in self._history.items()}

    def unique_customer_count(self) -> int:
        return len(self._history)


class ProductTracker(CustomerTracker):
    """Tracks detected products across frames using the same ByteTrack setup
    as CustomerTracker, with its own independent tracker/history state -
    product IDs and customer IDs are separate id spaces, never mixed. The
    tracking mechanics (ByteTrack update, per-frame history, centroid calc)
    are identical to person tracking, so they're reused via subclassing
    rather than reimplemented; only the output key is renamed so a caller
    handling both kinds of tracks can't mistake one for the other.

    track_activation_threshold is set much lower than ByteTrack's default
    (0.25). This was found necessary by testing: ByteTrack only seeds a NEW
    track when a detection's confidence clears an internal det_thresh, which
    supervision always computes as track_activation_threshold + 0.1 (verified
    directly: default params measured det_thresh=0.35). YOLO-World's real
    open-vocabulary product confidences run much lower than a typical
    closed-set detector's (observed 0.10-0.45 on real store footage) - with
    the default threshold, unique_product_count() came back 0 on a real
    25-frame test despite 60 raw per-frame product detections, because
    almost none of them cleared 0.35. Lowering this to 0.05 (det_thresh=0.15)
    fixed it - verified against the same real footage."""

    def __init__(self) -> None:
        super().__init__()
        self._byte_track = sv.ByteTrack(track_activation_threshold=0.05)

    def update(self, frame_number: int, products: list) -> list[dict]:
        results = super().update(frame_number, products)
        for result in results:
            result["product_id"] = result.pop("customer_id")
        return results

    def unique_product_count(self) -> int:
        return self.unique_customer_count()