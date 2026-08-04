import pytest
import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.models import Role, User, Store, Session as ShopperSession

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_session.db"
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


def test_create_session_success():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    response = client.post(
        "/api/sessions/",
        headers=headers,
        json={"store_id": store_id, "shopper_identifier": "shopper_anon_01", "zone_sequence": ["entrance", "aisle_1"]}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["shopper_identifier"] == "shopper_anon_01"
    assert data["zone_sequence"] == ["entrance", "aisle_1"]
    assert "id" in data
    assert data["duration_seconds"] is None


def test_create_session_invalid_store():
    headers = get_auth_headers()

    response = client.post(
        "/api/sessions/",
        headers=headers,
        json={"store_id": "nonexistent-store", "shopper_identifier": "shopper_anon_02"}
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_update_session():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    res = client.post(
        "/api/sessions/",
        headers=headers,
        json={"store_id": store_id, "shopper_identifier": "shopper_anon_03"}
    )
    session_id = res.json()["id"]

    response = client.put(
        f"/api/sessions/{session_id}",
        headers=headers,
        json={"shopper_identifier": "shopper_anon_03_updated", "zone_sequence": ["promotional"]}
    )
    assert response.status_code == 200
    assert response.json()["shopper_identifier"] == "shopper_anon_03_updated"
    assert response.json()["zone_sequence"] == ["promotional"]


def test_close_session_and_duration():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    entry = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) - datetime.timedelta(seconds=120)
    res = client.post(
        "/api/sessions/",
        headers=headers,
        json={"store_id": store_id, "shopper_identifier": "shopper_anon_04", "entry_time": entry.isoformat()}
    )
    session_id = res.json()["id"]

    response = client.post(
        f"/api/sessions/{session_id}/close",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["exit_time"] is not None
    assert data["duration_seconds"] is not None
    assert data["duration_seconds"] >= 118.0


def test_delete_session():
    headers = get_auth_headers()
    store_id = create_mock_store(headers)

    res = client.post(
        "/api/sessions/",
        headers=headers,
        json={"store_id": store_id, "shopper_identifier": "shopper_anon_05"}
    )
    session_id = res.json()["id"]

    response_delete = client.delete(f"/api/sessions/{session_id}", headers=headers)
    assert response_delete.status_code == 204

    response_get = client.get(f"/api/sessions/{session_id}", headers=headers)
    assert response_get.status_code == 404
