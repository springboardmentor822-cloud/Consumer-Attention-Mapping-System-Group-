import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
# Import all schemas to ensure full metadata registration
from app.models import Role, User, Store, Shelf, Camera, Product, ProductInteraction, AttentionEvent

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
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
    # Seed roles into test db
    db = TestingSessionLocal()
    roles = ["Store Manager", "Retail Analyst", "Marketing Manager", "Administrator"]
    for idx, role_name in enumerate(roles):
        r = Role(id=idx+1, name=role_name)
        db.add(r)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)


def test_register_user():
    # Test valid registration
    response = client.post(
        "/api/auth/register",
        json={"email": "new_manager@store.com", "password": "password123", "role_id": 1}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "new_manager@store.com"
    assert data["role"] == "Store Manager"

    # Test duplicate email registration
    response2 = client.post(
        "/api/auth/register",
        json={"email": "new_manager@store.com", "password": "password123", "role_id": 1}
    )
    assert response2.status_code == 400
    assert response2.json()["detail"] == "Email already registered"


def test_login_user():
    # Register first
    client.post(
        "/api/auth/register",
        json={"email": "test_user@store.com", "password": "password123", "role_id": 1}
    )

    # Valid login
    response = client.post(
        "/api/auth/login",
        data={"username": "test_user@store.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "Store Manager"
    assert data["email"] == "test_user@store.com"

    # Invalid login password
    response_bad_pw = client.post(
        "/api/auth/login",
        data={"username": "test_user@store.com", "password": "wrongpassword"}
    )
    assert response_bad_pw.status_code == 400
    assert response_bad_pw.json()["detail"] == "Incorrect email or password"
