"""
Per-customer journey reconstruction: annotates a customer's raw tracking
points (already fetched via TrackingRepository.get_customer_path()) with the
speed/direction of the step leading to each point. No new DB access here -
this is pure computation over points the repository already knows how to
fetch, per the "extend, don't duplicate tracking logic" requirement.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from app.analytics.metrics import compute_motion_sequence
from app.models.tracking_data import TrackingData


@dataclass
class JourneyPoint:
    x: float
    y: float
    timestamp: datetime
    zone_id: int | None
    camera_id: int
    speed_px_per_sec: float | None
    direction_degrees: float | None


def build_customer_journey(points: list[TrackingData]) -> list[JourneyPoint]:
    """points must already be time-ordered for a single customer_id."""
    if not points:
        return []

    motions = compute_motion_sequence(points)

    journey: list[JourneyPoint] = []
    for i, point in enumerate(points):
        motion = motions[i] if i < len(motions) else None
        journey.append(
            JourneyPoint(
                x=point.x,
                y=point.y,
                timestamp=point.timestamp,
                zone_id=point.zone_id,
                camera_id=point.camera_id,
                speed_px_per_sec=round(motion.speed_px_per_sec, 2) if motion else None,
                direction_degrees=round(motion.direction_degrees, 1) if motion and motion.direction_degrees is not None else None,
            )
        )
    return journey
