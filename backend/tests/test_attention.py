import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.models import Role, User, Store, Zone, Camera, Session as ShopperSession, AttentionEvent

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_attention.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    r1 = Role(id=1, name="Store Manager")
    db.add_all([r1])
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)


def get_auth_headers(email="manager@store.com", role_id=1):
    client.post(
        "/api/auth/register",
        json={"email": email, "password": "password123", "role_id": role_id}
    )
    login_res = client.post(
        "/api/auth/login",
        data={"username": email, "password": "password123"}
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def setup_mock_store_and_references(headers):
    res_store = client.post(
        "/api/stores/",
        headers=headers,
        json={"name": "North Store", "code": "NS-01", "address": "North Side", "width": 30.0, "height": 30.0}
    )
    store_id = res_store.json()["id"]

    res_zone = client.post(
        "/api/zones/",
        headers=headers,
        json={"store_id": store_id, "name": "Entrance Zone", "zone_type": "entrance", "x": 0.0, "y": 0.0, "width": 10.0, "height": 10.0}
    )
    zone_id = res_zone.json()["id"]

    res_cam = client.post(
        "/api/cameras/",
        headers=headers,
        json={"store_id": store_id, "name": "Entrance Cam", "stream_url": "rtsp://192.168.1.100/feed", "location_name": "Entrance", "x": 2.0, "y": 2.0}
    )
    camera_id = res_cam.json()["id"]

    res_sess = client.post(
        "/api/sessions/",
        headers=headers,
        json={"store_id": store_id, "shopper_identifier": "shopper-attention-01"}
    )
    session_id = res_sess.json()["id"]

    return session_id, camera_id, zone_id


def test_create_attention_success():
    headers = get_auth_headers()
    session_id, camera_id, zone_id = setup_mock_store_and_references(headers)

    response = client.post(
        "/api/attention/",
        headers=headers,
        json={
            "session_id": session_id,
            "camera_id": camera_id,
            "zone_id": zone_id,
            "attention_score": 0.85,
            "gaze_duration_ms": 3500.0,
            "confidence": 0.95
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["attention_score"] == 0.85
    assert data["confidence"] == 0.95
    assert "id" in data


def test_create_attention_invalid_session():
    headers = get_auth_headers()
    _, camera_id, zone_id = setup_mock_store_and_references(headers)

    response = client.post(
        "/api/attention/",
        headers=headers,
        json={
            "session_id": "nonexistent-session",
            "camera_id": camera_id,
            "zone_id": zone_id,
            "attention_score": 0.5,
            "gaze_duration_ms": 1000.0
        }
    )
    assert response.status_code == 404


def test_create_attention_invalid_camera():
    headers = get_auth_headers()
    session_id, _, zone_id = setup_mock_store_and_references(headers)

    response = client.post(
        "/api/attention/",
        headers=headers,
        json={
            "session_id": session_id,
            "camera_id": "nonexistent-camera",
            "zone_id": zone_id,
            "attention_score": 0.5,
            "gaze_duration_ms": 1000.0
        }
    )
    assert response.status_code == 404


def test_create_attention_invalid_zone():
    headers = get_auth_headers()
    session_id, camera_id, _ = setup_mock_store_and_references(headers)

    response = client.post(
        "/api/attention/",
        headers=headers,
        json={
            "session_id": session_id,
            "camera_id": camera_id,
            "zone_id": "nonexistent-zone",
            "attention_score": 0.5,
            "gaze_duration_ms": 1000.0
        }
    )
    assert response.status_code == 404


def test_create_attention_invalid_score():
    headers = get_auth_headers()
    session_id, camera_id, zone_id = setup_mock_store_and_references(headers)

    response = client.post(
        "/api/attention/",
        headers=headers,
        json={
            "session_id": session_id,
            "camera_id": camera_id,
            "zone_id": zone_id,
            "attention_score": 1.25,
            "gaze_duration_ms": 1000.0
        }
    )
    assert response.status_code in [400, 422]


def test_create_attention_invalid_confidence():
    headers = get_auth_headers()
    session_id, camera_id, zone_id = setup_mock_store_and_references(headers)

    response = client.post(
        "/api/attention/",
        headers=headers,
        json={
            "session_id": session_id,
            "camera_id": camera_id,
            "zone_id": zone_id,
            "attention_score": 0.5,
            "gaze_duration_ms": 1000.0,
            "confidence": -0.1
        }
    )
    assert response.status_code in [400, 422]


def test_update_attention():
    headers = get_auth_headers()
    session_id, camera_id, zone_id = setup_mock_store_and_references(headers)

    res = client.post(
        "/api/attention/",
        headers=headers,
        json={
            "session_id": session_id,
            "camera_id": camera_id,
            "zone_id": zone_id,
            "attention_score": 0.5,
            "gaze_duration_ms": 1000.0
        }
    )
    event_id = res.json()["id"]

    response = client.put(
        f"/api/attention/{event_id}",
        headers=headers,
        json={"attention_score": 0.99}
    )
    assert response.status_code == 200
    assert response.json()["attention_score"] == 0.99


def test_delete_attention():
    headers = get_auth_headers()
    session_id, camera_id, zone_id = setup_mock_store_and_references(headers)

    res = client.post(
        "/api/attention/",
        headers=headers,
        json={
            "session_id": session_id,
            "camera_id": camera_id,
            "zone_id": zone_id,
            "attention_score": 0.5,
            "gaze_duration_ms": 1000.0
        }
    )
    event_id = res.json()["id"]

    response_delete = client.delete(f"/api/attention/{event_id}", headers=headers)
    assert response_delete.status_code == 204

    response_get = client.get(f"/api/attention/{event_id}", headers=headers)
    assert response_get.status_code == 404


def test_list_attention_filtering():
    headers = get_auth_headers()
    session_id, camera_id, zone_id = setup_mock_store_and_references(headers)

    client.post(
        "/api/attention/",
        headers=headers,
        json={
            "session_id": session_id,
            "camera_id": camera_id,
            "zone_id": zone_id,
            "attention_score": 0.3,
            "gaze_duration_ms": 1000.0
        }
    )
    client.post(
        "/api/attention/",
        headers=headers,
        json={
            "session_id": session_id,
            "camera_id": camera_id,
            "zone_id": zone_id,
            "attention_score": 0.8,
            "gaze_duration_ms": 2000.0
        }
    )

    response = client.get(f"/api/attention/?min_attention_score=0.5", headers=headers)
    assert response.status_code == 200
    events = response.json()
    assert len(events) == 1
    assert events[0]["attention_score"] == 0.8
