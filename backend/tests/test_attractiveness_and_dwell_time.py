"""
Tests for app/api/attractiveness.py and app/api/dwell_time.py.

These endpoints used to have ZERO auth (see the ROLE CHECK ADDED comments
in the source) - both routers were reachable by anyone with the URL. The
role-gating tests here are the regression check for that.

We only test the "no tracking data yet" paths, not full score computation
- computing a real score needs actual TrackingEvent rows in TimescaleDB,
which is a much bigger fixture (see NOTE at the bottom of this file for
why heatmaps aren't tested at all).
"""
from sqlmodel import Session


def _make_store_zone_camera(engine, store_name="Test Store"):
    from app.models.store import Store
    from app.models.zone import Zone, ZoneType
    from app.models.camera import Camera

    with Session(engine) as session:
        store = Store(name=store_name)
        session.add(store)
        session.commit()
        session.refresh(store)

        zone = Zone(store_id=store.id, name="Entrance", zone_type=ZoneType.ENTRANCE)
        session.add(zone)
        session.commit()
        session.refresh(zone)

        camera = Camera(store_id=store.id, zone_id=zone.id, name="Cam1", source_path="x.mp4")
        session.add(camera)
        session.commit()
        session.refresh(camera)

        return store.id, camera.id


def test_attractiveness_requires_auth(client, test_engine):
    _, camera_id = _make_store_zone_camera(test_engine)
    resp = client.get(f"/api/stores/00000000-0000-0000-0000-000000000000/cameras/{camera_id}/attractiveness")
    assert resp.status_code == 401


def test_attractiveness_blocked_for_wrong_role(client, test_engine, make_user, auth_header):
    """Attractiveness is allowed for StoreManager/Analyst/MarketingManager/
    SuperAdmin - there's no 5th role in this system to prove a 403 with, so
    this instead proves an inactive/unrecognized role state is rejected via
    a user with no role assigned at all."""
    from app.models.user import User
    from app.core.security import hash_password

    store_id, camera_id = _make_store_zone_camera(test_engine)

    with Session(test_engine) as session:
        user = User(email="norole@test.com", hashed_password=hash_password("NoRolePass1!"), role_id=None)
        session.add(user)
        session.commit()

    headers = auth_header("norole@test.com", "NoRolePass1!")
    resp = client.get(f"/api/stores/{store_id}/cameras/{camera_id}/attractiveness", headers=headers)
    assert resp.status_code == 403


def test_attractiveness_no_shelf_camera_view_returns_404(client, test_engine, make_user, auth_header):
    """No ShelfCameraView rows configured for the camera yet -> a clean
    404 with an explanatory message, not a 500."""
    store_id, camera_id = _make_store_zone_camera(test_engine)
    admin, pw = make_user(email="attr-admin@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)

    resp = client.get(f"/api/stores/{store_id}/cameras/{camera_id}/attractiveness", headers=headers)
    assert resp.status_code == 404
    assert "ShelfCameraView" in resp.json()["detail"]


def test_attractiveness_history_empty_is_200_not_404(client, test_engine, make_user, auth_header):
    """Unlike the snapshot endpoint above, history with zero rows is a
    normal empty list, not an error - a trend chart handles that fine."""
    store_id, camera_id = _make_store_zone_camera(test_engine)
    admin, pw = make_user(email="attr-admin2@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)

    resp = client.get(f"/api/stores/{store_id}/cameras/{camera_id}/attractiveness/history", headers=headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_dwell_time_requires_auth(client, test_engine):
    store_id, camera_id = _make_store_zone_camera(test_engine)
    resp = client.get(f"/api/stores/{store_id}/cameras/{camera_id}/dwell-time")
    assert resp.status_code == 401


def test_dwell_time_wrong_store_for_camera_is_404(client, test_engine, make_user, auth_header):
    store_id, camera_id = _make_store_zone_camera(test_engine)
    other_store_id, _ = _make_store_zone_camera(test_engine, store_name="Other Store")
    admin, pw = make_user(email="dwell-admin@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)

    # camera belongs to store_id, not other_store_id
    resp = client.get(f"/api/stores/{other_store_id}/cameras/{camera_id}/dwell-time", headers=headers)
    assert resp.status_code == 404


def test_dwell_time_no_data_returns_empty_list_not_error(client, test_engine, make_user, auth_header):
    store_id, camera_id = _make_store_zone_camera(test_engine)
    admin, pw = make_user(email="dwell-admin2@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)

    resp = client.get(f"/api/stores/{store_id}/cameras/{camera_id}/dwell-time", headers=headers)
    assert resp.status_code == 200
    assert resp.json() == []


# NOTE: heatmap endpoints (app/api/heatmaps.py) are NOT tested here.
# app/services/heatmap_engine.py creates a real `redis.from_url(...)`
# client at module import time and uses it unconditionally - there is no
# code path that skips Redis, even for a camera with zero tracking data.
# I confirmed this by actually running a probe test against it: it throws
# `redis.exceptions.ConnectionError: Error 111 connecting to localhost:6379`
# in a plain test environment with no Redis running. Testing this
# endpoint for real needs either a live Redis instance in CI (e.g. a
# docker service container) or swapping in a fake Redis client
# (the `fakeredis` package) for tests - neither is set up in this
# project yet. Flagging as a real gap rather than skipping it silently.
