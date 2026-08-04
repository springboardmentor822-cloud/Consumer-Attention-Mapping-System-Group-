import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.models import Role, User, Store, Zone

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_zone.db"
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


def test_create_zone_success():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    response = client.post(
        "/api/zones/",
        headers=headers,
        json={"store_id": store_id, "name": "Entrance zone", "zone_type": "entrance", "x": 0.0, "y": 0.0, "width": 5.0, "height": 5.0}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Entrance zone"
    assert data["zone_type"] == "entrance"
    assert data["width"] == 5.0


def test_create_zone_invalid_dimensions():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    response = client.post(
        "/api/zones/",
        headers=headers,
        json={"store_id": store_id, "name": "Bad Width", "zone_type": "entrance", "x": 1.0, "y": 1.0, "width": -2.0, "height": 2.0}
    )
    assert response.status_code in [400, 422]


def test_create_zone_invalid_type():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    response = client.post(
        "/api/zones/",
        headers=headers,
        json={"store_id": store_id, "name": "Unknown Type", "zone_type": "invalid_type", "x": 1.0, "y": 1.0, "width": 2.0, "height": 2.0}
    )
    assert response.status_code in [400, 422]


def test_create_zone_outside_bounds():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    response = client.post(
        "/api/zones/",
        headers=headers,
        json={"store_id": store_id, "name": "Out of Bounds Zone", "zone_type": "promotional", "x": 15.0, "y": 12.0, "width": 10.0, "height": 5.0}
    )
    assert response.status_code == 400
    assert "does not fit" in response.json()["detail"]


def test_update_zone():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    res = client.post(
        "/api/zones/",
        headers=headers,
        json={"store_id": store_id, "name": "Zone D", "zone_type": "generic", "x": 2.0, "y": 2.0, "width": 3.0, "height": 3.0}
    )
    zone_id = res.json()["id"]

    response = client.put(
        f"/api/zones/{zone_id}",
        headers=headers,
        json={"name": "Zone D Updated", "width": 4.0}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Zone D Updated"
    assert response.json()["width"] == 4.0

    response_bad = client.put(
        f"/api/zones/{zone_id}",
        headers=headers,
        json={"width": 19.0}
    )
    assert response_bad.status_code == 400


def test_delete_zone():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    res = client.post(
        "/api/zones/",
        headers=headers,
        json={"store_id": store_id, "name": "Zone E", "zone_type": "checkout", "x": 1.0, "y": 1.0, "width": 2.0, "height": 2.0}
    )
    zone_id = res.json()["id"]

    response_delete = client.delete(f"/api/zones/{zone_id}", headers=headers)
    assert response_delete.status_code == 204

    response_get = client.get(f"/api/zones/{zone_id}", headers=headers)
    assert response_get.status_code == 404
