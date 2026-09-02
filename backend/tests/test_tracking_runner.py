"""
Tests for the fix to app/services/tracking_runner.py's run() loop.

Real gap this closes: PATCH /cameras/{id}/active only ever flipped the
DB flag - the code's own comment said so explicitly ("does not confirm
it stops the actual tracking_runner process"). Nothing in the actual
long-running per-camera process ever checked is_active. The heartbeat
block already re-fetched the Camera row every ~15s (to update
last_seen_at) - this fix adds an is_active check to that same
already-happening query and breaks the detection loop when it's False,
instead of adding a new poll.

What's mocked here and why: run() calls real video decoding
(get_camera_source), a real YOLO/ByteTrack detector
(PersonDetector.detect_source), and pushes to Redis
(push_tracking_event) - none of those are what this fix changes, and
none are meaningfully testable without a real video file, a GPU-capable
environment, and a live Redis. Mocking them lets the test isolate what
actually changed: does the loop correctly stop when is_active flips to
False, and does it correctly keep going when it's still True.
"""
from sqlmodel import Session


def _make_camera(engine, is_active=True):
    from app.models.store import Store
    from app.models.zone import Zone, ZoneType
    from app.models.camera import Camera

    with Session(engine) as session:
        store = Store(name="Tracking Runner Test Store")
        session.add(store); session.commit(); session.refresh(store)
        zone = Zone(store_id=store.id, name="Aisle", zone_type=ZoneType.AISLE)
        session.add(zone); session.commit(); session.refresh(zone)
        camera = Camera(store_id=store.id, zone_id=zone.id, name="Cam1", source_path="x.mp4", is_active=is_active)
        session.add(camera); session.commit(); session.refresh(camera)
        return camera.id


class _FakeDetector:
    """Yields a controllable number of fake detection dicts, standing in
    for a real PersonDetector so this test doesn't need a real video
    file, GPU, or YOLO weights - none of which are what's being tested
    here."""

    def __init__(self, n=1000):
        self.n = n

    def detect_source(self, source):
        for i in range(self.n):
            yield {"track_id": float(i % 5), "frame_index": i, "x1": 0, "y1": 0, "x2": 1, "y2": 1}


def test_run_stops_when_camera_deactivated_mid_run(client, test_engine, monkeypatch):
    """The actual regression check: is_active flips to False WHILE the
    process is 'running' (simulated - see _FakeDetector), and the loop
    must break instead of continuing to push events forever."""
    import app.services.tracking_runner as tr
    import app.core.db as db_module

    camera_id = _make_camera(test_engine, is_active=True)

    monkeypatch.setattr(tr, "get_camera_source", lambda camera: object())
    monkeypatch.setattr(tr, "PersonDetector", lambda **kwargs: _FakeDetector(n=1000))
    pushed_ids = []
    monkeypatch.setattr(tr, "push_tracking_event", lambda det: pushed_ids.append(det) or len(pushed_ids))

    # Force the heartbeat condition to fire on the very first iteration -
    # last_heartbeat starts at 0.0, so monotonic() must return something
    # >= heartbeat_interval (15) immediately, not build up via a counter
    # that starts at 0 (that would let one event slip through before the
    # first heartbeat fires, which isn't what this test is checking).
    monkeypatch.setattr(tr.time, "monotonic", lambda: 999.0)

    # Deactivate the camera before run() starts - simulates an operator
    # having already toggled it off (e.g. via the Admin dashboard) by
    # the time the next heartbeat check happens.
    with Session(db_module.engine) as session:
        from app.models.camera import Camera
        cam = session.get(Camera, camera_id)
        cam.is_active = False
        session.add(cam)
        session.commit()

    tr.run(camera_id)

    assert len(pushed_ids) == 0, (
        "the loop must stop at the first heartbeat check once is_active is "
        "False, before pushing any further events - this is the actual fix"
    )


def test_run_keeps_going_while_camera_active(client, test_engine, monkeypatch):
    """The other half of the regression check: an active camera must NOT
    be stopped early - a naive/overzealous check could break on every
    iteration regardless of is_active, which would silently kill live
    tracking. This proves it only stops for the real reason."""
    import app.services.tracking_runner as tr

    camera_id = _make_camera(test_engine, is_active=True)

    monkeypatch.setattr(tr, "get_camera_source", lambda camera: object())
    monkeypatch.setattr(tr, "PersonDetector", lambda **kwargs: _FakeDetector(n=50))
    pushed_ids = []
    monkeypatch.setattr(tr, "push_tracking_event", lambda det: pushed_ids.append(det) or len(pushed_ids))
    # Heartbeat interval is 15s and monotonic time here never advances,
    # so the heartbeat block (and therefore the is_active check) never
    # fires at all during this run - every one of the 50 fake detections
    # should still be pushed.
    monkeypatch.setattr(tr.time, "monotonic", lambda: 0.0)

    tr.run(camera_id)

    assert len(pushed_ids) == 50, "an active camera with no heartbeat check firing must process every detection"
