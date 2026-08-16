import datetime as dt

from app.models.attention import AttentionEvent
from app.models.tracking import TrackingData
from app.services.retention_service import purge_expired_tracking_data


def _register_and_login(client, email="retention-admin@example.com"):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Retention Admin",
            "email": email,
            "password": "RetentionPass123",
            "role": "administrator",
        },
    )
    resp = client.post(
        "/api/v1/auth/login", data={"username": email, "password": "RetentionPass123"}
    )
    return resp.json()["access_token"]


def _setup_store_camera_session(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    store_id = client.post("/api/v1/stores", json={"name": "Retention Store"}, headers=headers).json()["id"]
    camera_id = client.post(
        "/api/v1/cameras",
        json={"store_id": store_id, "name": "Cam", "camera_type": "webcam"},
        headers=headers,
    ).json()["id"]
    session_id = client.post(
        "/api/v1/sessions",
        json={
            "store_id": store_id,
            "shopper_uid": "retention-test-shopper",
            "entry_time": dt.datetime.utcnow().isoformat(),
        },
        headers=headers,
    ).json()["id"]
    return store_id, camera_id, session_id


def test_purge_deletes_old_tracking_and_attention_rows(client, db_session):
    token = _register_and_login(client)
    _, camera_id, session_id = _setup_store_camera_session(client, token)

    old_time = dt.datetime.utcnow() - dt.timedelta(days=60)
    recent_time = dt.datetime.utcnow() - dt.timedelta(days=1)

    db_session.add(
        TrackingData(
            session_id=session_id, camera_id=camera_id, timestamp=old_time,
            bbox_x=0, bbox_y=0, bbox_w=10, bbox_h=10, track_id=1,
        )
    )
    db_session.add(
        TrackingData(
            session_id=session_id, camera_id=camera_id, timestamp=recent_time,
            bbox_x=0, bbox_y=0, bbox_w=10, bbox_h=10, track_id=1,
        )
    )
    db_session.add(
        AttentionEvent(
            session_id=session_id, camera_id=camera_id, start_time=old_time, duration_seconds=2.0,
        )
    )
    db_session.add(
        AttentionEvent(
            session_id=session_id, camera_id=camera_id, start_time=recent_time, duration_seconds=2.0,
        )
    )
    db_session.commit()

    assert db_session.query(TrackingData).count() == 2
    assert db_session.query(AttentionEvent).count() == 2

    summary = purge_expired_tracking_data(db_session, retention_days=30)

    assert summary["tracking_data_deleted"] == 1
    assert summary["attention_events_deleted"] == 1
    assert db_session.query(TrackingData).count() == 1
    assert db_session.query(AttentionEvent).count() == 1
    # the surviving row should be the recent one
    assert db_session.query(TrackingData).first().timestamp == recent_time


def test_retention_endpoints_require_admin(client):
    token = _register_and_login(client, email="non-admin@example.com")
    # register as a non-admin role instead
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Analyst",
            "email": "analyst-retention@example.com",
            "password": "AnalystPass123",
            "role": "retail_analyst",
        },
    )
    login = client.post(
        "/api/v1/auth/login",
        data={"username": "analyst-retention@example.com", "password": "AnalystPass123"},
    )
    analyst_token = login.json()["access_token"]

    resp = client.get(
        "/api/v1/retention/policy", headers={"Authorization": f"Bearer {analyst_token}"}
    )
    assert resp.status_code == 403


def test_retention_policy_endpoint_returns_config(client):
    token = _register_and_login(client, email="retention-admin2@example.com")
    resp = client.get("/api/v1/retention/policy", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert "tracking_data_retention_days" in body
    assert "tracking_data" in body["applies_to"]


def test_retention_purge_endpoint_triggers_purge(client, db_session):
    token = _register_and_login(client, email="retention-admin3@example.com")
    _, camera_id, session_id = _setup_store_camera_session(client, token)

    old_time = dt.datetime.utcnow() - dt.timedelta(days=100)
    db_session.add(
        TrackingData(
            session_id=session_id, camera_id=camera_id, timestamp=old_time,
            bbox_x=0, bbox_y=0, bbox_w=10, bbox_h=10, track_id=1,
        )
    )
    db_session.commit()

    resp = client.post(
        "/api/v1/retention/purge?retention_days=30",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["tracking_data_deleted"] == 1
