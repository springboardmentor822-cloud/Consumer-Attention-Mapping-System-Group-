import datetime as dt
import math

from app.models.session import ShopperSession
from app.models.tracking import TrackingData
from app.services.journey_service import (
    Kalman1D,
    _smooth_track,
    apply_journey_metrics,
    compute_journey_metrics,
)


def _make_session(db_session, **kwargs):
    session = ShopperSession(
        store_id=1,
        shopper_uid="shopper-1",
        entry_time=kwargs.pop("entry_time", dt.datetime(2026, 1, 1, 10, 0, 0)),
        **kwargs,
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)
    return session


def _add_point(db_session, session, x, y, offset_seconds, zone_id=None):
    base = dt.datetime(2026, 1, 1, 10, 0, 0)
    point = TrackingData(
        session_id=session.id,
        camera_id=1,
        zone_id=zone_id,
        track_id=1,
        floor_x=x,
        floor_y=y,
        bbox_x=0,
        bbox_y=0,
        bbox_w=10,
        bbox_h=10,
        detection_confidence=0.9,
        timestamp=base + dt.timedelta(seconds=offset_seconds),
    )
    db_session.add(point)
    db_session.commit()
    return point


def test_kalman1d_converges_toward_measurements():
    k = Kalman1D(initial_value=0.0)
    # constant true position with small noise - filter should track it
    # closely rather than diverging.
    for _ in range(20):
        k.update(measurement=5.0, dt_seconds=1.0)
    assert abs(k.x - 5.0) < 0.5


def test_smooth_track_reduces_jitter_distance():
    base = dt.datetime(2026, 1, 1, 10, 0, 0)

    class FakePoint:
        def __init__(self, x, y, t):
            self.floor_x = x
            self.floor_y = y
            self.timestamp = t

    # straight-line walk with alternating +/-0.15m jitter
    pts = []
    for i in range(20):
        jitter = 0.15 if i % 2 == 0 else -0.15
        pts.append(FakePoint(i * 1.0 + jitter, jitter, base + dt.timedelta(seconds=i)))

    smoothed = _smooth_track(pts)

    raw_dist = sum(
        math.hypot(pts[i + 1].floor_x - pts[i].floor_x, pts[i + 1].floor_y - pts[i].floor_y)
        for i in range(len(pts) - 1)
    )
    smooth_dist = sum(
        math.hypot(smoothed[i + 1][0] - smoothed[i][0], smoothed[i + 1][1] - smoothed[i][1])
        for i in range(len(smoothed) - 1)
    )

    # Smoothing should pull the summed distance closer to the true ~19m
    # path than the jitter-inflated raw sum.
    true_path = 19.0
    assert abs(smooth_dist - true_path) < abs(raw_dist - true_path)


def test_compute_journey_metrics_distance_and_velocity(db_session):
    session = _make_session(db_session)
    # 9 meters over 90 seconds, straight line -> distance 9m, velocity 0.1 m/s
    for i in range(10):
        _add_point(db_session, session, x=float(i), y=0.0, offset_seconds=i * 10)

    metrics = compute_journey_metrics(db_session, session)

    assert metrics.total_distance_m == 9.0
    assert abs(metrics.avg_velocity_mps - 0.1) < 1e-6


def test_compute_journey_metrics_zone_dwell_and_entry_exit(db_session):
    session = _make_session(db_session)
    for i in range(10):
        zone = 1 if i < 5 else 2
        _add_point(db_session, session, x=float(i), y=0.0, offset_seconds=i * 10, zone_id=zone)

    metrics = compute_journey_metrics(db_session, session)

    assert metrics.zones_visited_count == 2
    assert metrics.entry_zone_id == 1
    assert metrics.exit_zone_id == 2
    assert metrics.zone_dwell_seconds[1] == 50.0
    assert metrics.zone_dwell_seconds[2] == 40.0


def test_compute_journey_metrics_handles_zero_or_one_points(db_session):
    session = _make_session(db_session)
    metrics = compute_journey_metrics(db_session, session)
    assert metrics.total_distance_m == 0.0
    assert metrics.zones_visited_count == 0

    _add_point(db_session, session, x=1.0, y=1.0, offset_seconds=0, zone_id=3)
    metrics = compute_journey_metrics(db_session, session)
    assert metrics.entry_zone_id == 3
    assert metrics.exit_zone_id == 3


def test_apply_journey_metrics_writes_to_session(db_session):
    session = _make_session(db_session)
    for i in range(5):
        _add_point(db_session, session, x=float(i) * 2, y=0.0, offset_seconds=i * 5, zone_id=1)

    updated = apply_journey_metrics(db_session, session)

    assert updated.total_distance_m == 8.0
    assert updated.avg_velocity_mps is not None
    assert updated.zones_visited_count == 1
    assert updated.entry_zone_id == 1
    assert updated.exit_zone_id == 1


def test_apply_journey_metrics_does_not_override_explicit_entry_exit_zone(db_session):
    session = _make_session(db_session, entry_zone_id=99, exit_zone_id=98)
    for i in range(5):
        _add_point(db_session, session, x=float(i), y=0.0, offset_seconds=i * 5, zone_id=1)

    updated = apply_journey_metrics(db_session, session)

    # Explicit values supplied by the caller (e.g. dedicated entry/exit
    # zone detection) should win over what raw tracking points imply.
    assert updated.entry_zone_id == 99
    assert updated.exit_zone_id == 98
