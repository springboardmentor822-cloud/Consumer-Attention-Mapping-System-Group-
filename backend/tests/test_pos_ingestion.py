"""
Tests for the real-POS-integration hardening of POST /pos/purchases
(app/api/completion_analytics.py's ingest_purchase()).

This endpoint already existed and already worked for a manual/JWT-
authenticated caller. What an integration audit found missing, fixed
here:

1. transaction_id had no uniqueness constraint. Real payment/POS
   webhooks (Stripe, Square, etc.) retry on timeout as standard
   practice - without a uniqueness constraint, a single retried webhook
   call would silently create a second PurchaseEvent row, double-
   counting revenue and purchase-conversion figures.
2. The endpoint only accepted a StoreManager/SuperAdmin JWT. A real POS
   system is a server calling this on its own schedule, not a person
   logging in - it needs a long-lived machine credential
   (X-POS-API-Key), not a human's expiring JWT.

Neither of these connects to an actual live POS system - this project
doesn't have one to connect to. What's real and tested here is that the
receiving side is now correctly hardened for whenever a real POS
integration calls it.
"""
from sqlmodel import Session, select


def _make_store(engine, name="POS Test Store"):
    from app.models.store import Store

    with Session(engine) as session:
        store = Store(name=name)
        session.add(store)
        session.commit()
        session.refresh(store)
        return store.id


def test_pos_ingest_requires_some_auth(client):
    resp = client.post(
        "/api/v1/completion/pos/purchases",
        json={"store_id": "00000000-0000-0000-0000-000000000000", "sku": "SKU1", "transaction_id": "t1"},
    )
    assert resp.status_code == 401


def test_pos_ingest_rejects_wrong_api_key(client, monkeypatch):
    import app.core.config as config_module
    monkeypatch.setattr(config_module.settings, "POS_WEBHOOK_API_KEY", "real-secret-key")

    resp = client.post(
        "/api/v1/completion/pos/purchases",
        headers={"X-POS-API-Key": "wrong-key"},
        json={"store_id": "00000000-0000-0000-0000-000000000000", "sku": "SKU1", "transaction_id": "t1"},
    )
    assert resp.status_code == 401


def test_pos_ingest_accepts_correct_api_key_no_human_login_needed(client, test_engine, monkeypatch):
    """The actual point of the API-key path: a real POS system can call
    this with zero StoreManager/SuperAdmin account or JWT involved."""
    import app.core.config as config_module
    monkeypatch.setattr(config_module.settings, "POS_WEBHOOK_API_KEY", "real-secret-key")
    store_id = _make_store(test_engine)

    resp = client.post(
        "/api/v1/completion/pos/purchases",
        headers={"X-POS-API-Key": "real-secret-key"},
        json={"store_id": str(store_id), "sku": "SKU1", "transaction_id": "t-api-key-1", "amount": 12.5},
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["sku"] == "SKU1"


def test_pos_ingest_still_accepts_storemanager_jwt(client, test_engine, make_user, auth_header):
    """The API-key path is additive - the original JWT-based access for
    manual/admin use still works when no API key is configured."""
    store_id = _make_store(test_engine)
    manager, pw = make_user(email="pos-mgr@test.com", role_name="StoreManager")
    headers = auth_header(manager.email, pw)

    resp = client.post(
        "/api/v1/completion/pos/purchases",
        headers=headers,
        json={"store_id": str(store_id), "sku": "SKU1", "transaction_id": "t-jwt-1", "amount": 8.0},
    )
    assert resp.status_code == 201, resp.text


def test_pos_ingest_rejects_analyst_jwt(client, test_engine, make_user, auth_header):
    """Role restriction on the JWT path is unchanged - Analyst still
    isn't allowed to record purchases."""
    store_id = _make_store(test_engine)
    analyst, pw = make_user(email="pos-analyst@test.com", role_name="Analyst")
    headers = auth_header(analyst.email, pw)

    resp = client.post(
        "/api/v1/completion/pos/purchases",
        headers=headers,
        json={"store_id": str(store_id), "sku": "SKU1", "transaction_id": "t-jwt-2", "amount": 8.0},
    )
    assert resp.status_code == 403


def test_pos_ingest_duplicate_transaction_id_is_idempotent_not_500(client, test_engine, monkeypatch):
    """The core regression check: a retried webhook (same
    transaction_id) must return the already-recorded purchase, not
    crash and not create a second row."""
    import app.core.config as config_module
    monkeypatch.setattr(config_module.settings, "POS_WEBHOOK_API_KEY", "real-secret-key")
    store_id = _make_store(test_engine)

    body = {"store_id": str(store_id), "sku": "SKU2", "transaction_id": "t-retry-1", "amount": 19.99}
    headers = {"X-POS-API-Key": "real-secret-key"}

    first = client.post("/api/v1/completion/pos/purchases", headers=headers, json=body)
    assert first.status_code == 201
    first_id = first.json()["id"]

    retry = client.post("/api/v1/completion/pos/purchases", headers=headers, json=body)
    assert retry.status_code == 200, "a duplicate transaction_id should return 200 (already recorded), not a new 201 or a 500"
    assert retry.json()["id"] == first_id, "must return the SAME row, not a new one"


def test_pos_ingest_duplicate_retries_leave_exactly_one_row_in_db(client, test_engine, monkeypatch):
    """Checks the actual database, not just the HTTP response - the
    real risk this fix closes is silent double-counted revenue."""
    import app.core.config as config_module
    monkeypatch.setattr(config_module.settings, "POS_WEBHOOK_API_KEY", "real-secret-key")
    store_id = _make_store(test_engine)

    body = {"store_id": str(store_id), "sku": "SKU3", "transaction_id": "t-retry-2", "amount": 5.0}
    headers = {"X-POS-API-Key": "real-secret-key"}

    for _ in range(3):
        client.post("/api/v1/completion/pos/purchases", headers=headers, json=body)

    import app.core.db as db_module
    from app.models.purchase_event import PurchaseEvent

    with Session(db_module.engine) as session:
        rows = session.exec(
            select(PurchaseEvent).where(PurchaseEvent.transaction_id == "t-retry-2")
        ).all()
    assert len(rows) == 1
