"""
Tests for app/api/heatmaps.py.

This is the piece flagged earlier as untestable without a live Redis
server (heatmap_engine.py creates a real redis.from_url(...) client at
import time). conftest.py now patches that to fakeredis - see its
docstring for why the patch has to happen right after app.main's first
import, not via a normal monkeypatch fixture.

What's NOT covered here, on purpose: heatmap_engine._fetch_points() runs
a raw SQL query using %(name)s pyformat placeholders - correct for the
real Postgres/TimescaleDB this system runs on, but not portable to the
SQLite test engine. Every test below monkeypatches _fetch_points directly
to a canned pandas DataFrame, so what IS covered is the endpoint layer:
role gating, store/shelf lookup and 404s, multi-camera shelf aggregation,
the <3-points-skips-not-crashes path, and cache-hit behavior. The KDE
math and PNG rendering inside compute_density_grid/render_heatmap_png
are standard numpy/scipy/matplotlib calls exercised the same way
regardless of which database produced the points - that part is lower
risk and would need a real Postgres instance to test meaningfully anyway.
"""
import pandas as pd
from sqlmodel import Session


def _make_store_zone_shelf_camera(engine, camera_count=1):
    from app.models.store import Store, Shelf
    from app.models.zone import Zone, ZoneType
    from app.models.camera import Camera
    from app.models.shelf_camera_view import ShelfCameraView

    with Session(engine) as session:
        store = Store(name="Heatmap Test Store")
        session.add(store); session.commit(); session.refresh(store)

        zone = Zone(store_id=store.id, name="Aisle", zone_type=ZoneType.AISLE)
        session.add(zone); session.commit(); session.refresh(zone)

        shelf = Shelf(store_id=store.id, shelf_name="Clothing", zone_id=zone.id)
        session.add(shelf); session.commit(); session.refresh(shelf)

        camera_ids = []
        for i in range(camera_count):
            camera = Camera(store_id=store.id, zone_id=zone.id, name=f"Cam{i+1}", source_path=f"x{i}.mp4")
            session.add(camera); session.commit(); session.refresh(camera)
            camera_ids.append(camera.id)
            view = ShelfCameraView(shelf_id=shelf.id, camera_id=camera.id, zone_coordinates=[[0, 0], [10, 10]])
            session.add(view)
        session.commit()

        return store.id, shelf.id, camera_ids


def _patch_points(monkeypatch, n_points=10):
    """Real per-endpoint patch of the one function that needs real Postgres."""
    import app.services.heatmap_engine as hm

    def fake_fetch_points(camera_id, class_name, start_time=None, end_time=None):
        # Deliberately NOT collinear (y = f(x) exactly) - gaussian_kde
        # correctly rejects a perfectly straight line as a singular
        # covariance matrix, same as it would for real degenerate data.
        # A small pseudo-random-but-deterministic scatter avoids that
        # without needing an actual RNG import.
        return pd.DataFrame({
            "x": [float(i) for i in range(n_points)],
            "y": [float((i * 7) % 5) for i in range(n_points)],
        })

    monkeypatch.setattr(hm, "_fetch_points", fake_fetch_points)


def test_store_heatmap_requires_auth(client, test_engine):
    store_id, _, _ = _make_store_zone_shelf_camera(test_engine)
    resp = client.get(f"/api/v1/heatmaps/store/{store_id}")
    assert resp.status_code == 401


def test_store_heatmap_blocked_for_marketing_manager(client, test_engine, make_user, auth_header):
    """Heatmaps are StoreManager/Analyst/SuperAdmin - MarketingManager is not on the allowlist."""
    store_id, _, _ = _make_store_zone_shelf_camera(test_engine)
    mm, pw = make_user(email="hm-mm@test.com", role_name="MarketingManager")
    headers = auth_header(mm.email, pw)
    resp = client.get(f"/api/v1/heatmaps/store/{store_id}", headers=headers)
    assert resp.status_code == 403


def test_store_heatmap_no_cameras_is_404(client, make_user, auth_header):
    from app.models.store import Store
    import app.core.db as db_module
    with Session(db_module.engine) as session:
        store = Store(name="Empty Store")
        session.add(store); session.commit(); session.refresh(store)
        store_id = store.id

    admin, pw = make_user(email="hm-admin1@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.get(f"/api/v1/heatmaps/store/{store_id}", headers=headers)
    assert resp.status_code == 404


def test_store_heatmap_real_points_returns_image(client, test_engine, make_user, auth_header, monkeypatch):
    _patch_points(monkeypatch, n_points=10)
    store_id, _, _ = _make_store_zone_shelf_camera(test_engine)
    admin, pw = make_user(email="hm-admin2@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)

    resp = client.get(f"/api/v1/heatmaps/store/{store_id}", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["heatmaps"]) == 1
    entry = next(iter(body["heatmaps"].values()))
    assert entry["point_count"] == 10
    assert entry["cached"] is False
    assert len(entry["image_base64"]) > 0


def test_store_heatmap_caches_on_second_call(client, test_engine, make_user, auth_header, monkeypatch):
    _patch_points(monkeypatch, n_points=10)
    store_id, _, _ = _make_store_zone_shelf_camera(test_engine)
    admin, pw = make_user(email="hm-admin3@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)

    first = client.get(f"/api/v1/heatmaps/store/{store_id}", headers=headers)
    second = client.get(f"/api/v1/heatmaps/store/{store_id}", headers=headers)
    first_entry = next(iter(first.json()["heatmaps"].values()))
    second_entry = next(iter(second.json()["heatmaps"].values()))
    assert first_entry["cached"] is False
    assert second_entry["cached"] is True, "second call within the TTL should hit the fakeredis cache"


def test_store_heatmap_too_few_points_is_skipped_not_500(client, test_engine, make_user, auth_header, monkeypatch):
    _patch_points(monkeypatch, n_points=2)  # compute_density_grid needs >= 3
    store_id, _, _ = _make_store_zone_shelf_camera(test_engine)
    admin, pw = make_user(email="hm-admin4@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)

    resp = client.get(f"/api/v1/heatmaps/store/{store_id}", headers=headers)
    assert resp.status_code == 200, "one thin camera must not 500 the whole store response"
    body = resp.json()
    assert body["heatmaps"] == {}
    assert len(body["skipped"]) == 1


def test_shelf_heatmap_not_found(client, make_user, auth_header):
    admin, pw = make_user(email="hm-admin5@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.get(
        "/api/v1/heatmaps/shelf/00000000-0000-0000-0000-000000000000", headers=headers
    )
    assert resp.status_code == 404


def test_shelf_heatmap_no_camera_view_is_404(client, test_engine, make_user, auth_header):
    from app.models.store import Store, Shelf
    from app.models.zone import Zone, ZoneType
    import app.core.db as db_module

    with Session(db_module.engine) as session:
        store = Store(name="No View Store")
        session.add(store); session.commit(); session.refresh(store)
        zone = Zone(store_id=store.id, name="Aisle", zone_type=ZoneType.AISLE)
        session.add(zone); session.commit(); session.refresh(zone)
        shelf = Shelf(store_id=store.id, shelf_name="Unwired Shelf", zone_id=zone.id)
        session.add(shelf); session.commit(); session.refresh(shelf)
        shelf_id = shelf.id

    admin, pw = make_user(email="hm-admin6@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.get(f"/api/v1/heatmaps/shelf/{shelf_id}", headers=headers)
    assert resp.status_code == 404


def test_shelf_heatmap_aggregates_every_camera_that_sees_it(client, test_engine, make_user, auth_header, monkeypatch):
    """The real reason /shelf exists instead of just reusing /camera: a
    shelf seen by 2 cameras (Zone 2's real setup - see ShelfCameraView's
    docstring) must return both, not just one."""
    _patch_points(monkeypatch, n_points=10)
    _, shelf_id, camera_ids = _make_store_zone_shelf_camera(test_engine, camera_count=2)
    admin, pw = make_user(email="hm-admin7@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)

    resp = client.get(f"/api/v1/heatmaps/shelf/{shelf_id}", headers=headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["shelf_name"] == "Clothing"
    assert len(body["heatmaps"]) == 2
    assert set(body["heatmaps"].keys()) == {str(c) for c in camera_ids}


def test_camera_heatmap_single_camera(client, test_engine, make_user, auth_header, monkeypatch):
    _patch_points(monkeypatch, n_points=10)
    _, _, camera_ids = _make_store_zone_shelf_camera(test_engine, camera_count=1)
    admin, pw = make_user(email="hm-admin8@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)

    resp = client.get(f"/api/v1/heatmaps/camera/{camera_ids[0]}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["point_count"] == 10
