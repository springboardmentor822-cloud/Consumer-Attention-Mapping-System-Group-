"""
Regression tests for a real bug found while writing a load test (not
found by the existing test suite, because that suite only ever checked
status_code on these endpoints, never response body content).

The bug: log_event() defaults to commit=True. Every one of the
endpoints below creates (or updates) an object, calls log_event() for
the audit trail, and then returns that same object directly. The
second commit inside log_event() expires every attribute SQLAlchemy had
cached on the object. The database write itself was always fine - a
subsequent GET showed the row correctly - but by the time FastAPI
serialized the returned object for the HTTP response, the request-scoped
session had already torn down and the expired attributes could no
longer be lazily reloaded, so the client received `{}` instead of the
created/updated object on every one of these endpoints. Fixed by
re-refreshing the object (while the session is still open) right before
each return.

Every test here asserts on actual response body fields, not just
status_code - that's the whole point, since status_code alone is
exactly what let this bug ship unnoticed.
"""
from sqlmodel import Session


def test_create_store_response_has_real_fields(client, make_user, auth_header):
    manager, pw = make_user(email="logbug-mgr@test.com", role_name="StoreManager")
    headers = auth_header(manager.email, pw)
    resp = client.post("/api/stores", json={"name": "Real Store", "location": "Indore"}, headers=headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body != {}, "log_event()'s commit must not wipe the response body"
    assert body["name"] == "Real Store"
    assert body["location"] == "Indore"
    assert "id" in body and body["id"]


def test_create_camera_response_has_real_fields(client, test_engine, make_user, auth_header):
    from app.models.store import Store
    from app.models.zone import Zone, ZoneType
    import app.core.db as db_module

    with Session(db_module.engine) as session:
        store = Store(name="Camera Bug Store")
        session.add(store); session.commit(); session.refresh(store)
        zone = Zone(store_id=store.id, name="Aisle", zone_type=ZoneType.AISLE)
        session.add(zone); session.commit(); session.refresh(zone)
        store_id, zone_id = store.id, zone.id

    admin, pw = make_user(email="logbug-admin1@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.post(
        f"/api/stores/{store_id}/cameras",
        json={"name": "Cam1", "zone_id": str(zone_id), "source_path": "x.mp4"},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body != {}
    assert body["name"] == "Cam1"
    assert "id" in body and body["id"]


def test_camera_active_toggle_response_has_real_fields(client, test_engine, make_user, auth_header):
    from app.models.store import Store
    from app.models.zone import Zone, ZoneType
    from app.models.camera import Camera
    import app.core.db as db_module

    with Session(db_module.engine) as session:
        store = Store(name="Toggle Bug Store")
        session.add(store); session.commit(); session.refresh(store)
        zone = Zone(store_id=store.id, name="Aisle", zone_type=ZoneType.AISLE)
        session.add(zone); session.commit(); session.refresh(zone)
        camera = Camera(store_id=store.id, zone_id=zone.id, name="Cam1", source_path="x.mp4", is_active=True)
        session.add(camera); session.commit(); session.refresh(camera)
        store_id, camera_id = store.id, camera.id

    admin, pw = make_user(email="logbug-admin2@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.patch(
        f"/api/stores/{store_id}/cameras/{camera_id}/active",
        json={"is_active": False},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body != {}
    assert body["is_active"] is False


def test_create_shelf_response_has_real_fields(client, test_engine, make_user, auth_header):
    from app.models.store import Store
    from app.models.zone import Zone, ZoneType
    import app.core.db as db_module

    with Session(db_module.engine) as session:
        store = Store(name="Shelf Bug Store")
        session.add(store); session.commit(); session.refresh(store)
        zone = Zone(store_id=store.id, name="Aisle", zone_type=ZoneType.AISLE)
        session.add(zone); session.commit(); session.refresh(zone)
        store_id, zone_id = store.id, zone.id

    admin, pw = make_user(email="logbug-admin3@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.post(
        f"/api/stores/{store_id}/shelves",
        json={"shelf_name": "Aisle 3", "zone_id": str(zone_id)},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body != {}
    assert body["shelf_name"] == "Aisle 3"
    assert "id" in body and body["id"]


def test_create_shelf_camera_view_response_has_real_fields(client, test_engine, make_user, auth_header):
    from app.models.store import Store, Shelf
    from app.models.zone import Zone, ZoneType
    from app.models.camera import Camera
    import app.core.db as db_module

    with Session(db_module.engine) as session:
        store = Store(name="View Bug Store")
        session.add(store); session.commit(); session.refresh(store)
        zone = Zone(store_id=store.id, name="Aisle", zone_type=ZoneType.AISLE)
        session.add(zone); session.commit(); session.refresh(zone)
        shelf = Shelf(store_id=store.id, shelf_name="Clothing", zone_id=zone.id)
        session.add(shelf); session.commit(); session.refresh(shelf)
        camera = Camera(store_id=store.id, zone_id=zone.id, name="Cam1", source_path="x.mp4")
        session.add(camera); session.commit(); session.refresh(camera)
        store_id, shelf_id, camera_id = store.id, shelf.id, camera.id

    admin, pw = make_user(email="logbug-admin4@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.post(
        f"/api/shelves/{shelf_id}/camera-views",
        json={"camera_id": str(camera_id), "zone_coordinates": [[0, 0], [10, 10]]},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body != {}
    assert body["camera_id"] == str(camera_id)
    assert "id" in body and body["id"]
