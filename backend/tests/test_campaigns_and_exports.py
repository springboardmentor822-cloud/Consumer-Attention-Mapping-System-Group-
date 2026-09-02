"""
Tests for app/api/campaigns.py and app/api/reports.py (PDF/Excel export).
"""
from datetime import date, datetime, timedelta, UTC

from sqlmodel import Session

# NOTE: use UTC "today" everywhere in this file, matching campaigns.py's
# own _sync_status(), which compares against datetime.now(UTC).date() -
# NOT date.today() (local time). Confirmed as a real bug when a user in
# IST (UTC+5:30) ran these tests: local date.today() had already rolled
# over to the next calendar day while the server's UTC date hadn't yet,
# so a campaign meant to start "today" looked like it started tomorrow
# from the app's point of view -> status came back "upcoming" instead of
# "active", failing test_create_campaign_succeeds_for_marketing_manager.
# Using the same UTC clock as the app removes that timezone dependency.
def _today() -> date:
    return datetime.now(UTC).date()


def _make_store_shelf_zone(engine):
    from app.models.store import Store, Shelf
    from app.models.zone import Zone, ZoneType

    with Session(engine) as session:
        store = Store(name="Campaign Test Store")
        session.add(store)
        session.commit()
        session.refresh(store)

        zone = Zone(store_id=store.id, name="Aisle", zone_type=ZoneType.AISLE)
        session.add(zone)
        session.commit()
        session.refresh(zone)

        shelf = Shelf(store_id=store.id, shelf_name="Clothing", zone_id=zone.id)
        session.add(shelf)
        session.commit()
        session.refresh(shelf)

        return store.id, shelf.id


def test_create_campaign_requires_marketing_or_superadmin_role(client, test_engine, make_user, auth_header):
    store_id, shelf_id = _make_store_shelf_zone(test_engine)
    manager, pw = make_user(email="mgr-campaign@test.com", role_name="StoreManager")
    headers = auth_header(manager.email, pw)

    resp = client.post(
        "/api/campaigns",
        json={
            "store_id": str(store_id),
            "shelf_id": str(shelf_id),
            "name": "Summer Sale",
            "start_date": str(_today()),
            "end_date": str(_today() + timedelta(days=7)),
        },
        headers=headers,
    )
    assert resp.status_code == 403


def test_create_campaign_succeeds_for_marketing_manager(client, test_engine, make_user, auth_header):
    store_id, shelf_id = _make_store_shelf_zone(test_engine)
    mm, pw = make_user(email="mm@test.com", role_name="MarketingManager")
    headers = auth_header(mm.email, pw)

    resp = client.post(
        "/api/campaigns",
        json={
            "store_id": str(store_id),
            "shelf_id": str(shelf_id),
            "name": "Summer Sale",
            "start_date": str(_today()),
            "end_date": str(_today() + timedelta(days=7)),
        },
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["name"] == "Summer Sale"
    assert body["status"] == "active"  # today falls within start/end -> synced to active


def test_create_campaign_rejects_end_before_start(client, test_engine, make_user, auth_header):
    store_id, shelf_id = _make_store_shelf_zone(test_engine)
    mm, pw = make_user(email="mm2@test.com", role_name="MarketingManager")
    headers = auth_header(mm.email, pw)

    resp = client.post(
        "/api/campaigns",
        json={
            "store_id": str(store_id),
            "shelf_id": str(shelf_id),
            "name": "Backwards Campaign",
            "start_date": str(_today()),
            "end_date": str(_today() - timedelta(days=1)),
        },
        headers=headers,
    )
    assert resp.status_code == 400


def test_get_nonexistent_campaign_is_404(client, make_user, auth_header):
    mm, pw = make_user(email="mm3@test.com", role_name="MarketingManager")
    headers = auth_header(mm.email, pw)
    resp = client.get(
        "/api/campaigns/00000000-0000-0000-0000-000000000000", headers=headers
    )
    assert resp.status_code == 404


def test_list_campaigns_filters_by_store(client, test_engine, make_user, auth_header):
    store_a, shelf_a = _make_store_shelf_zone(test_engine)
    store_b, shelf_b = _make_store_shelf_zone(test_engine)
    mm, pw = make_user(email="mm4@test.com", role_name="MarketingManager")
    headers = auth_header(mm.email, pw)

    client.post(
        "/api/campaigns",
        json={"store_id": str(store_a), "shelf_id": str(shelf_a), "name": "A Campaign",
              "start_date": str(_today()), "end_date": str(_today() + timedelta(days=1))},
        headers=headers,
    )
    client.post(
        "/api/campaigns",
        json={"store_id": str(store_b), "shelf_id": str(shelf_b), "name": "B Campaign",
              "start_date": str(_today()), "end_date": str(_today() + timedelta(days=1))},
        headers=headers,
    )

    resp = client.get(f"/api/campaigns?store_id={store_a}", headers=headers)
    assert resp.status_code == 200
    names = [c["name"] for c in resp.json()]
    assert names == ["A Campaign"]


# --- PDF/Excel export (app/api/reports.py) ---

def test_export_requires_store_manager_or_superadmin(client, make_user, auth_header):
    from app.models.store import Store
    import app.core.db as db_module

    with Session(db_module.engine) as session:
        store = Store(name="Export Store")
        session.add(store)
        session.commit()
        session.refresh(store)
        store_id = store.id

    analyst, pw = make_user(email="analyst-export@test.com", role_name="Analyst")
    headers = auth_header(analyst.email, pw)
    resp = client.get(f"/api/stores/{store_id}/reports/export?format=pdf", headers=headers)
    assert resp.status_code == 403


def test_export_pdf_returns_real_pdf_bytes(client, make_user, auth_header):
    from app.models.store import Store
    import app.core.db as db_module

    with Session(db_module.engine) as session:
        store = Store(name="Export Store PDF")
        session.add(store)
        session.commit()
        session.refresh(store)
        store_id = store.id

    admin, pw = make_user(email="export-admin@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.get(f"/api/stores/{store_id}/reports/export?format=pdf", headers=headers)

    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content.startswith(b"%PDF"), "response body should be a real PDF, not just a 200 status"
    assert "attachment" in resp.headers["content-disposition"]


def test_export_excel_returns_real_xlsx_bytes(client, make_user, auth_header):
    from app.models.store import Store
    import app.core.db as db_module

    with Session(db_module.engine) as session:
        store = Store(name="Export Store XLSX")
        session.add(store)
        session.commit()
        session.refresh(store)
        store_id = store.id

    admin, pw = make_user(email="export-admin2@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.get(f"/api/stores/{store_id}/reports/export?format=excel", headers=headers)

    assert resp.status_code == 200
    # .xlsx files are zip archives - real ones start with the PK zip signature.
    assert resp.content[:2] == b"PK", "response body should be a real .xlsx (zip), not just a 200 status"


def test_export_rejects_invalid_format(client, make_user, auth_header):
    from app.models.store import Store
    import app.core.db as db_module

    with Session(db_module.engine) as session:
        store = Store(name="Export Store Bad Format")
        session.add(store)
        session.commit()
        session.refresh(store)
        store_id = store.id

    admin, pw = make_user(email="export-admin3@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.get(f"/api/stores/{store_id}/reports/export?format=csv", headers=headers)
    assert resp.status_code == 400


def test_export_nonexistent_store_is_404(client, make_user, auth_header):
    admin, pw = make_user(email="export-admin4@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.get(
        "/api/stores/00000000-0000-0000-0000-000000000000/reports/export?format=pdf",
        headers=headers,
    )
    assert resp.status_code == 404
