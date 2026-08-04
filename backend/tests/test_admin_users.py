import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.models import Role, User
from app.api.auth import get_current_user

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_admin_users.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

client = TestClient(app)

class MockRole:
    name = "Administrator"

class MockUser:
    id = "admin-123"
    email = "admin@company.com"
    role = MockRole()
    is_active = True

def override_get_current_user():
    return MockUser()

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Add roles
    r1 = Role(id=1, name="Store Manager")
    r4 = Role(id=4, name="Administrator")
    db.add_all([r1, r4])
    db.commit()
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

def test_list_users():
    db = TestingSessionLocal()
    user = User(id="user-01", email="test@store.com", hashed_password="pwd", role_id=1, is_active=True)
    db.add(user)
    db.commit()

    response = client.get("/api/auth/users")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["email"] == "test@store.com"

def test_update_user():
    db = TestingSessionLocal()
    user = User(id="user-02", email="update@store.com", hashed_password="pwd", role_id=1, is_active=True)
    db.add(user)
    db.commit()

    response = client.put("/api/auth/users/user-02", json={"role_id": 4, "is_active": False})
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "Administrator"
    assert data["is_active"] is False

def test_delete_user():
    db = TestingSessionLocal()
    user = User(id="user-03", email="delete@store.com", hashed_password="pwd", role_id=1, is_active=True)
    db.add(user)
    db.commit()

    response = client.delete("/api/auth/users/user-03")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
