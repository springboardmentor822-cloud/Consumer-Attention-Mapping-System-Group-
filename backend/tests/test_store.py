import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.models import Role, User, Store

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_store.db"
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
    r2 = Role(id=4, name="Administrator")
    db.add_all([r1, r2])
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


def test_create_store():
    headers = get_auth_headers()
    
    response = client.post(
        "/api/stores/",
        headers=headers,
        json={"name": "Oxford Street Flagship", "code": "OXF-001", "address": "123 Oxford St, London", "width": 50.0, "height": 30.0}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Oxford Street Flagship"
    assert data["code"] == "OXF-001"
    assert data["width"] == 50.0
    assert "id" in data

    response_dup = client.post(
        "/api/stores/",
        headers=headers,
        json={"name": "Oxford Street Copy", "code": "OXF-001", "address": "456 Oxford St, London", "width": 10.0, "height": 10.0}
    )
    assert response_dup.status_code == 400
    assert "already exists" in response_dup.json()["detail"]

    response_bounds = client.post(
        "/api/stores/",
        headers=headers,
        json={"name": "Tiny Store", "code": "TNY-001", "address": "London", "width": 0.0, "height": 5.0}
    )
    assert response_bounds.status_code in [400, 422]


def test_list_stores():
    headers = get_auth_headers()
    client.post(
        "/api/stores/",
        headers=headers,
        json={"name": "Store A", "code": "STA", "address": "Address A", "width": 10.0, "height": 10.0}
    )
    client.post(
        "/api/stores/",
        headers=headers,
        json={"name": "Store B", "code": "STB", "address": "Address B", "width": 20.0, "height": 20.0}
    )

    response = client.get("/api/stores/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_store_by_id():
    headers = get_auth_headers()
    res = client.post(
        "/api/stores/",
        headers=headers,
        json={"name": "Store C", "code": "STC", "address": "Address C", "width": 15.0, "height": 15.0}
    )
    store_id = res.json()["id"]

    response = client.get(f"/api/stores/{store_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Store C"

    response_missing = client.get("/api/stores/nonexistent-id", headers=headers)
    assert response_missing.status_code == 404


def test_update_store():
    headers = get_auth_headers()
    res = client.post(
        "/api/stores/",
        headers=headers,
        json={"name": "Store D", "code": "STD", "address": "Address D", "width": 25.0, "height": 25.0}
    )
    store_id = res.json()["id"]

    response = client.put(
        f"/api/stores/{store_id}",
        headers=headers,
        json={"name": "Store D Updated", "width": 30.0}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Store D Updated"
    assert response.json()["width"] == 30.0


def test_delete_store():
    headers = get_auth_headers()
    res = client.post(
        "/api/stores/",
        headers=headers,
        json={"name": "Store E", "code": "STE", "address": "Address E", "width": 5.0, "height": 5.0}
    )
    store_id = res.json()["id"]

    response_delete = client.delete(f"/api/stores/{store_id}", headers=headers)
    assert response_delete.status_code == 204

    response_get = client.get(f"/api/stores/{store_id}", headers=headers)
    assert response_get.status_code == 404
