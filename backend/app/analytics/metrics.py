"""
Shared, vectorized primitives used by every other module in app/analytics/.

Kept separate from app.services.tracking_repository (which only does DB
access) - this module is pure computation over already-fetched points, so it
has no DB session dependency and is trivially unit-testable.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.models.tracking_data import TrackingData

# A customer standing still still drifts a few pixels per frame from
# detection-box jitter - this floor separates real walking from that noise.
STANDING_SPEED_THRESHOLD_PX_PER_SEC = 15.0

# A gap this large between two consecutive points for the same customer_id
# is treated as a new visit rather than one continuous session - guards
# against the known limitation that ByteTrack customer_id is not globally
# unique across separate processing runs (documented in
# tracking_repository.py), so two unrelated sessions hours apart never get
# merged into one nonsensical multi-hour visit.
MAX_VISIT_GAP_SECONDS = 300.0

# A standing period shorter than this doesn't count as a deliberate pause
# (e.g. waiting for someone to pass) - only sustained stops count as
# "interaction" with whatever is at that position.
MIN_INTERACTION_SECONDS = 3.0


@dataclass
class PointMotion:
    """Derived motion between two consecutive tracking_data rows for the same customer."""

    from_point: TrackingData
    to_point: TrackingData
    distance_px: float
    duration_seconds: float
    speed_px_per_sec: float
    direction_degrees: float | None  # None when distance is ~0 (no defined heading)


def compute_motion_sequence(points: list[TrackingData]) -> list[PointMotion]:
    """Vectorized speed/direction between consecutive points, assumed already
    sorted by timestamp for a single customer. Returns len(points) - 1 entries."""
    if len(points) < 2:
        return []

    xs = np.array([p.x for p in points], dtype=np.float64)
    ys = np.array([p.y for p in points], dtype=np.float64)
    ts = np.array([p.timestamp.timestamp() for p in points], dtype=np.float64)

    dx = np.diff(xs)
    dy = np.diff(ys)
    dt = np.diff(ts)
    dt_safe = np.where(dt <= 0, np.nan, dt)  # avoid div-by-zero on duplicate/out-of-order timestamps

    distances = np.hypot(dx, dy)
    speeds = distances / dt_safe
    directions = np.degrees(np.arctan2(dy, dx))

    motions: list[PointMotion] = []
    for i in range(len(distances)):
        speed = speeds[i]
        motions.append(
            PointMotion(
                from_point=points[i],
                to_point=points[i + 1],
                distance_px=float(distances[i]),
                duration_seconds=float(dt[i]) if dt[i] > 0 else 0.0,
                speed_px_per_sec=float(speed) if np.isfinite(speed) else 0.0,
                direction_degrees=float(directions[i]) if distances[i] > 0.5 else None,
            )
        )
    return motions


def is_standing(motion: PointMotion, threshold: float = STANDING_SPEED_THRESHOLD_PX_PER_SEC) -> bool:
    return motion.speed_px_per_sec <= threshold


def normalize(value: float, min_value: float, max_value: float) -> float:
    """Min-max normalize to [0, 1]; a degenerate (flat) range maps everything to 0."""
    span = max_value - min_value
    if span <= 0:
        return 0.0
    return max(0.0, min(1.0, (value - min_value) / span))
