"""
Tests for app/services/completion_analytics.py's journey_data().

This function used to sort sessions from DIFFERENT cameras by
frame_index and treat adjacency as a "flow" - frame_index is camera-
local (every camera's own video starts at frame 0), so comparing frame
numbers across two different cameras' videos was comparing incomparable
numbers, not a real chronology. Fixed to use event_time (a real
wall-clock timestamp) with an explicit timing-proximity window instead.
These tests exist specifically to pin that fix down - the two tests that
compare a real link forming inside the window against no link forming
outside it are the actual regression check for the bug described above.
"""
from datetime import datetime, timedelta, UTC

from sqlmodel import Session


def _make_store_with_two_zones(engine):
    from app.models.store import Store
    from app.models.zone import Zone, ZoneType
    from app.models.camera import Camera

    with Session(engine) as session:
        store = Store(name="Journey Test Store")
        session.add(store); session.commit(); session.refresh(store)
        entrance = Zone(store_id=store.id, name="Entrance", zone_type=ZoneType.ENTRANCE)
        aisle = Zone(store_id=store.id, name="Aisle", zone_type=ZoneType.AISLE)
        session.add(entrance); session.add(aisle); session.commit()
        session.refresh(entrance); session.refresh(aisle)
        cam1 = Camera(store_id=store.id, zone_id=entrance.id, name="Cam1", source_path="a.mp4")
        cam2 = Camera(store_id=store.id, zone_id=aisle.id, name="Cam2", source_path="b.mp4")
        session.add(cam1); session.add(cam2); session.commit()
        session.refresh(cam1); session.refresh(cam2)
        return store.id, cam1, cam2


def _add_track_events(ts_engine, camera_id, track_id, start_time, count=5, step_seconds=2):
    from app.models.tracking_event import TrackingEvent

    with Session(ts_engine) as ts:
        for i in range(count):
            ts.add(TrackingEvent(
                camera_id=str(camera_id), frame_index=i, track_id=track_id,
                x1=0, y1=0, x2=1, y2=1,
                event_time=start_time + timedelta(seconds=i * step_seconds),
            ))
        ts.commit()


def test_journey_links_within_timing_window(client, test_engine):
    """The core regression check: two sessions on DIFFERENT cameras,
    ordered correctly by real event_time, within the transition window,
    must link."""
    import app.core.timescale_db as ts_module
    import app.services.completion_analytics as ca

    store_id, cam1, cam2 = _make_store_with_two_zones(test_engine)
    base = datetime.now(UTC)
    _add_track_events(ts_module.timescale_engine, cam1.id, 1.0, base)
    # Track ends at base+8s (5 events, step 2s -> last at +8s). Start
    # the next track 30s after that - well inside the 120s window.
    _add_track_events(ts_module.timescale_engine, cam2.id, 2.0, base + timedelta(seconds=38))

    result = ca.journey_data(store_id)
    assert result["sessions"] == 2
    assert result["matched_transitions"] == 1
    assert result["links"] == [{"source": "Entrance", "target": "Aisle", "value": 1}]
    assert result["data_quality"] == "timing_proximity_heuristic_no_visual_reidentification"
    assert "not confirmed" in result["disclosure"]


def test_journey_no_link_outside_timing_window(client, test_engine):
    """Same shape as above, but the second session starts 500s later -
    outside the window - so it must NOT link. This is what would have
    silently passed under the old frame_index-based bug (frame_index
    resets to 0 per camera regardless of real elapsed time)."""
    import app.core.timescale_db as ts_module
    import app.services.completion_analytics as ca

    store_id, cam1, cam2 = _make_store_with_two_zones(test_engine)
    base = datetime.now(UTC)
    _add_track_events(ts_module.timescale_engine, cam1.id, 1.0, base)
    _add_track_events(ts_module.timescale_engine, cam2.id, 2.0, base + timedelta(seconds=500))

    result = ca.journey_data(store_id)
    assert result["matched_transitions"] == 0
    assert result["links"] == []


def test_journey_no_link_backwards_in_zone_order(client, test_engine):
    """A session in the Aisle ending before a session in the Entrance
    starts must not link Aisle -> Entrance - store layout order is
    Entrance -> Aisle -> Checkout, not the reverse."""
    import app.core.timescale_db as ts_module
    import app.services.completion_analytics as ca

    store_id, cam1, cam2 = _make_store_with_two_zones(test_engine)
    base = datetime.now(UTC)
    _add_track_events(ts_module.timescale_engine, cam2.id, 1.0, base)  # Aisle first
    _add_track_events(ts_module.timescale_engine, cam1.id, 2.0, base + timedelta(seconds=30))  # Entrance after

    result = ca.journey_data(store_id)
    assert result["matched_transitions"] == 0
    assert result["links"] == []


def test_journey_empty_store_returns_zero_sessions(client, test_engine):
    from app.models.store import Store
    import app.core.db as db_module
    import app.services.completion_analytics as ca

    with Session(db_module.engine) as session:
        store = Store(name="No Cameras Store")
        session.add(store); session.commit(); session.refresh(store)
        store_id = store.id

    result = ca.journey_data(store_id)
    assert result["sessions"] == 0
    assert result["matched_transitions"] == 0
    assert result["links"] == []
