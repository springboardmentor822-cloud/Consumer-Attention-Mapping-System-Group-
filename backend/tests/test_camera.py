import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.models import Role, User, Store, Camera

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_camera.db"
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


def create_mock_store(headers):
    res = client.post(
        "/api/stores/",
        headers=headers,
        json={"name": "Flagship Store", "code": "FLG", "address": "London", "width": 20.0, "height": 15.0}
    )
    return res.json()["id"]


def test_create_camera_success():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    response = client.post(
        "/api/cameras/",
        headers=headers,
        json={"store_id": store_id, "name": "Cam 01", "stream_url": "rtsp://192.168.1.100/stream1", "location_name": "Aisle 1", "x": 10.0, "y": 8.0, "rotation_angle": 90.0}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Cam 01"
    assert data["stream_url"] == "rtsp://192.168.1.100/stream1"
    assert data["x"] == 10.0


def test_create_camera_invalid_url():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    response = client.post(
        "/api/cameras/",
        headers=headers,
        json={"store_id": store_id, "name": "Cam 02", "stream_url": "ftp://bad-url", "location_name": "Aisle 2", "x": 5.0, "y": 5.0}
    )
    assert response.status_code in [400, 422]


def test_create_camera_duplicate_name():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    client.post(
        "/api/cameras/",
        headers=headers,
        json={"store_id": store_id, "name": "Cam 01", "stream_url": "rtsp://192.168.1.100/stream1", "location_name": "Aisle 1", "x": 10.0, "y": 8.0}
    )

    response = client.post(
        "/api/cameras/",
        headers=headers,
        json={"store_id": store_id, "name": "Cam 01", "stream_url": "rtsp://192.168.1.101/stream1", "location_name": "Aisle 2", "x": 5.0, "y": 5.0}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_create_camera_out_of_bounds():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    response = client.post(
        "/api/cameras/",
        headers=headers,
        json={"store_id": store_id, "name": "Cam Out", "stream_url": "rtsp://192.168.1.100/stream1", "location_name": "Backyard", "x": 25.0, "y": 5.0}
    )
    assert response.status_code == 400
    assert "boundaries" in response.json()["detail"]


def test_update_camera():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    res = client.post(
        "/api/cameras/",
        headers=headers,
        json={"store_id": store_id, "name": "Cam D", "stream_url": "http://192.168.1.100/stream", "location_name": "Aisle 4", "x": 2.0, "y": 2.0}
    )
    camera_id = res.json()["id"]

    response = client.put(
        f"/api/cameras/{camera_id}",
        headers=headers,
        json={"name": "Cam D Updated", "x": 3.0}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Cam D Updated"
    assert response.json()["x"] == 3.0


def test_delete_camera():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    res = client.post(
        "/api/cameras/",
        headers=headers,
        json={"store_id": store_id, "name": "Cam E", "stream_url": "https://192.168.1.100/stream", "location_name": "Aisle 5", "x": 1.0, "y": 1.0}
    )
    camera_id = res.json()["id"]

    response_delete = client.delete(f"/api/cameras/{camera_id}", headers=headers)
    assert response_delete.status_code == 204

    response_get = client.get(f"/api/cameras/{camera_id}", headers=headers)
    assert response_get.status_code == 404


def test_verify_camera_connection():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    res = client.post(
        "/api/cameras/",
        headers=headers,
        json={"store_id": store_id, "name": "Cam Verify", "stream_url": "rtsp://192.168.1.100/stream", "location_name": "Front Door", "x": 1.0, "y": 1.0}
    )
    camera_id = res.json()["id"]

    response = client.post(f"/api/cameras/{camera_id}/verify", headers=headers)
    assert response.status_code == 200
    assert response.json()["connected"] is True
    assert "connection verified successfully" in response.json()["details"]
