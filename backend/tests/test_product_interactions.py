"""
Tests for the fix to app/services/completion_analytics.py's
derive_interactions() and app/services/product_interactions.py's
get_product_interactions().

Real bug this closes: ProductInteractionEvent.event_type's own docstring
already listed "pickup_candidate / return_candidate" as expected values,
and derive_interactions() already computed pickup/return candidates per
product internally - but only ever returned them as aggregate counts,
never persisted per-product. get_product_interactions() then hardcoded
pickup_count/return_count/comparison_count to None on every product with
a comment saying visibility alone isn't evidence of interaction - true,
but the real per-product candidate data existed one function away and
was just never wired through. This is the fix + the regression test for
it: run derive_interactions() once (as the completion-interactions
endpoint would), then confirm get_product_interactions() picks up real,
non-null, correctly-attributed counts for the exact products that were
picked up, returned, and compared in the synthetic scenario below.
"""
from datetime import datetime, timedelta, UTC

from sqlmodel import Session


def _make_store_shelf_camera_with_view(engine):
    from app.models.store import Store, Shelf
    from app.models.zone import Zone, ZoneType
    from app.models.camera import Camera
    from app.models.shelf_camera_view import ShelfCameraView

    with Session(engine) as session:
        store = Store(name="Interaction Test Store")
        session.add(store); session.commit(); session.refresh(store)
        zone = Zone(store_id=store.id, name="Aisle", zone_type=ZoneType.AISLE)
        session.add(zone); session.commit(); session.refresh(zone)
        shelf = Shelf(store_id=store.id, shelf_name="Clothing", zone_id=zone.id)
        session.add(shelf); session.commit(); session.refresh(shelf)
        camera = Camera(store_id=store.id, zone_id=zone.id, name="Cam1", source_path="x.mp4")
        session.add(camera); session.commit(); session.refresh(camera)
        # A simple 20x20 square shelf polygon.
        view = ShelfCameraView(shelf_id=shelf.id, camera_id=camera.id, zone_coordinates=[[0, 0], [20, 0], [20, 20], [0, 20]])
        session.add(view); session.commit()
        return store.id, camera.id


def _seed_pickup_return_and_comparison_events(ts_engine, camera_id):
    """
    Shirt: inside the shelf polygon at frames 0-2, outside at frames 3-4
    (pickup, with a person contact at frame 2), back inside at frame 5
    (return, with a person contact at frame 5).
    Pants: a single observation at frame 2, at the same place and time as
    the Shirt contact, so the same shopper "compares" both SKUs at once.
    """
    from app.models.tracking_event import TrackingEvent

    base = datetime.now(UTC)

    def t(frame):
        return base + timedelta(seconds=frame)

    with Session(ts_engine) as ts:
        # Shirt product track "1"
        shirt_frames = [(0, 10, 10), (1, 10, 10), (2, 10, 10), (3, 100, 100), (4, 100, 100), (5, 10, 10)]
        for frame, x, y in shirt_frames:
            ts.add(TrackingEvent(
                camera_id=str(camera_id), frame_index=frame, track_id=1.0,
                x1=x - 1, y1=y - 1, x2=x + 1, y2=y + 1, class_name="Shirt",
                event_time=t(frame),
            ))
        # Pants product track "2" - single observation, doesn't need to be
        # inside/outside the shelf for this test (only comparison depends
        # on it, not pickup/return).
        ts.add(TrackingEvent(
            camera_id=str(camera_id), frame_index=2, track_id=2.0,
            x1=9, y1=9, x2=11, y2=11, class_name="Pants",
            event_time=t(2),
        ))
        # Person track 1: present at frame 2 (near both products - triggers
        # the pickup contact AND the comparison) and frame 5 (near the
        # returning Shirt - triggers the return contact).
        ts.add(TrackingEvent(
            camera_id=str(camera_id), frame_index=2, track_id=100.0,
            x1=9, y1=9, x2=11, y2=11, class_name=None,
            event_time=t(2),
        ))
        ts.add(TrackingEvent(
            camera_id=str(camera_id), frame_index=5, track_id=100.0,
            x1=9, y1=9, x2=11, y2=11, class_name=None,
            event_time=t(5),
        ))
        ts.commit()


def test_derive_interactions_persists_pickup_return_and_comparison(client, test_engine):
    """Direct check on the service function: pickup/return/comparison
    events must actually land in ProductInteractionEvent with the right
    product_name, not just show up as aggregate counts."""
    import app.core.db as db_module
    import app.core.timescale_db as ts_module
    import app.services.completion_analytics as ca
    from app.models.product_interaction_event import ProductInteractionEvent

    store_id, camera_id = _make_store_shelf_camera_with_view(db_module.engine)
    _seed_pickup_return_and_comparison_events(ts_module.timescale_engine, camera_id)

    result = ca.derive_interactions(store_id, camera_id)
    assert result["pickup_candidates"] >= 1
    assert result["return_candidates"] >= 1
    assert result["comparison_events"] >= 1

    with Session(db_module.engine) as session:
        rows = session.exec(
            __import__("sqlmodel").select(ProductInteractionEvent).where(ProductInteractionEvent.camera_id == camera_id)
        ).all()

    event_types = {r.event_type for r in rows}
    assert "pickup_candidate" in event_types
    assert "return_candidate" in event_types
    assert "comparison" in event_types

    pickup_rows = [r for r in rows if r.event_type == "pickup_candidate"]
    assert any(r.product_name == "Shirt" for r in pickup_rows), "the pickup candidate must be attributed to Shirt, not left product-less"


def test_product_interactions_shows_real_counts_after_derive(client, test_engine, make_user, auth_header):
    """End-to-end through the real HTTP API: after completion-interactions
    has run once, /product-interactions must show real, non-null pickup/
    return/comparison counts - not the old hardcoded None placeholders."""
    import app.core.db as db_module
    import app.core.timescale_db as ts_module
    import app.services.completion_analytics as ca

    store_id, camera_id = _make_store_shelf_camera_with_view(db_module.engine)
    _seed_pickup_return_and_comparison_events(ts_module.timescale_engine, camera_id)

    # This is the real derive step /api/v1/completion/{store}/{camera}/interactions
    # would trigger - calling it directly here to avoid needing that whole
    # router wired into this test's client for something already covered
    # by the unit test above.
    ca.derive_interactions(store_id, camera_id)

    admin, pw = make_user(email="interactions-admin@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.get(f"/api/stores/{store_id}/cameras/{camera_id}/product-interactions", headers=headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()

    shirt = next((p for p in body["products"] if p["product_name"] == "Shirt"), None)
    assert shirt is not None, "Shirt should appear in product visibility results"
    assert shirt["pickup_count"] is not None, "pickup_count must no longer be a hardcoded None once candidates exist"
    assert shirt["pickup_count"] >= 1
    assert shirt["return_count"] is not None
    assert shirt["return_count"] >= 1
    assert shirt["comparison_count"] is not None
    assert shirt["comparison_count"] >= 1
    assert body["data_quality"]["pickup"] != "placeholder"


def test_product_interactions_still_placeholder_before_derive_ever_runs(client, test_engine, make_user, auth_header):
    """If completion-interactions has never been run for this camera, the
    honest answer is still 'placeholder', not a fabricated zero."""
    store_id, camera_id = _make_store_shelf_camera_with_view(test_engine)

    admin, pw = make_user(email="interactions-admin2@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.get(f"/api/stores/{store_id}/cameras/{camera_id}/product-interactions", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["products"] == []  # no tracking events at all yet either
    assert body["data_quality"]["pickup"] == "placeholder_run_completion_interactions_first"
