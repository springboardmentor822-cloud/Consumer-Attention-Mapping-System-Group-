import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
# Import all schemas to ensure full metadata registration
from app.models import Role, User, Store, Shelf, Camera

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_layout.db"
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
    # Localize override to prevent cross-file pollution
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed roles
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


def test_create_store_unauthorized():
    response = client.get("/api/stores")
    assert response.status_code == 401


def test_create_store_authorized():
    headers = get_auth_headers()
    
    # Register store
    res_store = client.post(
        "/api/stores/",
        headers=headers,
        json={"name": "West End Mall", "code": "WEM-001", "address": "West London", "width": 100.0, "height": 80.0}
    )
    assert res_store.status_code == 201
    store_data = res_store.json()
    assert store_data["name"] == "West End Mall"
    
    # Get stores list
    res_list = client.get("/api/stores/", headers=headers)
    assert len(res_list.json()) == 1

    # Create Shelf inside store
    store_id = store_data["id"]
    res_shelf = client.post(
        "/api/shelves/",
        headers=headers,
        json={"store_id": store_id, "name": "Aisle 1 Beverages", "x": 5.0, "y": 5.0, "width": 10.0, "height": 10.0}
    )
    assert res_shelf.status_code == 201
    assert res_shelf.json()["name"] == "Aisle 1 Beverages"
