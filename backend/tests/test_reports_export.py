import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.models import Role, User, Store, Shelf
from app.api.auth import get_current_user

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_reports.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

client = TestClient(app)

# Create a mock user
mock_user_payload = {"email": "admin@company.com", "role": "Administrator", "id": "admin-123"}
def override_get_current_user():
    return mock_user_payload

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Add roles
    r = Role(name="Administrator")
    db.add(r)
    db.commit()
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

def test_export_pdf_success():
    db = TestingSessionLocal()
    store = Store(id="rep-store-01", name="Report Store", code="REP001", address="New York", width=10.0, height=10.0)
    db.add(store)
    db.commit()

    response = client.get("/api/reports/export/pdf?store_id=rep-store-01")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in response.headers["content-disposition"]
    assert len(response.content) > 0

def test_export_excel_success():
    response = client.get("/api/reports/export/excel?store_id=rep-store-01")
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers["content-type"]
    assert "attachment; filename=" in response.headers["content-disposition"]
    assert len(response.content) > 0
