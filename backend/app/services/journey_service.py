"""
Consumer Behaviour Intelligence: Data Ingestion & Trajectory Analysis.

Turns a session's raw tracking_data points (bbox positions, projected to
floor-plan (x, y) meters via each camera's homography - see
ai_models/calibration) into the journey metrics the spec calls for:

  - Total path distance: sum of consecutive Euclidean distances.
  - Zone dwell times: time spent inside each zone the shopper visited.
  - Movement velocity: overall average, used downstream to help
    distinguish browsing/stopping from passing straight through.

Raw tracked positions are jittery frame to frame (detector/tracker noise),
which would inflate path distance if summed directly - a shopper standing
still can still "wobble" a few centimeters per frame. A small constant-
velocity Kalman filter smooths the (x, y) stream per axis before distance
is computed, same idea the spec's own pipeline diagram calls for
(`[Raw Stream] -> [Kalman Filter] -> [Metrics Calculation]`).
"""
from __future__ import annotations

import datetime as dt
import math
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.models.session import ShopperSession
from app.models.tracking import TrackingData


class Kalman1D:
    """Minimal constant-velocity Kalman filter for a single scalar axis.

    State is [position, velocity]. Process/measurement noise are fixed,
    reasonable defaults for meter-scale indoor foot-traffic smoothing
    rather than values fitted to a specific camera - tune per deployment
    if the tracker's real noise characteristics are known.
    """

    def __init__(self, initial_value: float, process_var: float = 0.01, measurement_var: float = 0.5):
        self.x = initial_value  # position estimate
        self.v = 0.0  # velocity estimate
        self.p = [[1.0, 0.0], [0.0, 1.0]]  # 2x2 error covariance
        self.q = process_var
        self.r = measurement_var

    def update(self, measurement: float, dt_seconds: float) -> float:
        dt_seconds = max(dt_seconds, 1e-3)

        # Predict
        x_pred = self.x + self.v * dt_seconds
        v_pred = self.v
        p00, p01 = self.p[0]
        p10, p11 = self.p[1]
        p00 += dt_seconds * (p10 + p01 + dt_seconds * p11) + self.q
        p01 += dt_seconds * p11
        p10 += dt_seconds * p11
        p11 += self.q

        # Update (measurement is position only)
        y = measurement - x_pred
        s = p00 + self.r
        k0 = p00 / s
        k1 = p10 / s

        self.x = x_pred + k0 * y
        self.v = v_pred + k1 * y
        self.p = [
            [p00 - k0 * p00, p01 - k0 * p01],
            [p10 - k1 * p00, p11 - k1 * p01],
        ]
        return self.x


def _smooth_track(points: list[TrackingData]) -> list[tuple[float, float]]:
    """Applies an independent Kalman filter per axis across a
    chronologically-ordered list of tracking points, returning the
    smoothed (x, y) sequence."""
    if not points:
        return []

    kx = Kalman1D(points[0].floor_x or 0.0)
    ky = Kalman1D(points[0].floor_y or 0.0)
    smoothed = [(kx.x, ky.x)]

    prev_ts = points[0].timestamp
    for p in points[1:]:
        dt_seconds = (p.timestamp - prev_ts).total_seconds()
        sx = kx.update(p.floor_x or 0.0, dt_seconds)
        sy = ky.update(p.floor_y or 0.0, dt_seconds)
        smoothed.append((sx, sy))
        prev_ts = p.timestamp

    return smoothed


@dataclass
class JourneyMetrics:
    total_distance_m: float = 0.0
    avg_velocity_mps: float = 0.0
    zones_visited_count: int = 0
    entry_zone_id: int | None = None
    exit_zone_id: int | None = None
    zone_dwell_seconds: dict[int, float] = field(default_factory=dict)


def compute_journey_metrics(db: Session, session: ShopperSession) -> JourneyMetrics:
    """Computes trajectory metrics for one session from its tracking_data
    points. Does not persist - call apply_journey_metrics to write the
    results onto the ShopperSession row."""
    points = (
        db.query(TrackingData)
        .filter(TrackingData.session_id == session.id)
        .filter(TrackingData.floor_x.isnot(None), TrackingData.floor_y.isnot(None))
        .order_by(TrackingData.timestamp.asc())
        .all()
    )
    if len(points) < 2:
        return JourneyMetrics(
            zones_visited_count=len({p.zone_id for p in points if p.zone_id is not None}),
            entry_zone_id=points[0].zone_id if points else None,
            exit_zone_id=points[-1].zone_id if points else None,
        )

    smoothed = _smooth_track(points)

    total_distance = 0.0
    for (x1, y1), (x2, y2) in zip(smoothed, smoothed[1:]):
        total_distance += math.hypot(x2 - x1, y2 - y1)

    total_seconds = (points[-1].timestamp - points[0].timestamp).total_seconds()
    avg_velocity = (total_distance / total_seconds) if total_seconds > 0 else 0.0

    # Zone dwell time: attribute the time between consecutive samples to
    # whichever zone the shopper was in at the start of that interval.
    dwell: dict[int, float] = {}
    for p1, p2 in zip(points, points[1:]):
        if p1.zone_id is None:
            continue
        delta = (p2.timestamp - p1.timestamp).total_seconds()
        dwell[p1.zone_id] = dwell.get(p1.zone_id, 0.0) + max(0.0, delta)

    distinct_zones = {p.zone_id for p in points if p.zone_id is not None}

    return JourneyMetrics(
        total_distance_m=round(total_distance, 2),
        avg_velocity_mps=round(avg_velocity, 3),
        zones_visited_count=len(distinct_zones),
        entry_zone_id=points[0].zone_id,
        exit_zone_id=points[-1].zone_id,
        zone_dwell_seconds={k: round(v, 1) for k, v in dwell.items()},
    )


def apply_journey_metrics(db: Session, session: ShopperSession) -> ShopperSession:
    """Computes and writes journey metrics onto a session, e.g. when it's
    closed out on exit detection. Only overwrites entry/exit zone if they
    weren't already supplied by the caller (some pipelines report those
    directly from entry/exit-zone detection rather than from raw tracks)."""
    metrics = compute_journey_metrics(db, session)

    session.total_distance_m = metrics.total_distance_m
    session.avg_velocity_mps = metrics.avg_velocity_mps
    if metrics.zones_visited_count:
        session.zones_visited_count = metrics.zones_visited_count
    if session.entry_zone_id is None:
        session.entry_zone_id = metrics.entry_zone_id
    if session.exit_zone_id is None:
        session.exit_zone_id = metrics.exit_zone_id

    db.commit()
    db.refresh(session)
    return session
