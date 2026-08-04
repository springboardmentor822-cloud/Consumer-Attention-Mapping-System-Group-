import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.models import Role, User, Store, Shelf, Product, Session as ShopperSession, ProductInteraction

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_interaction.db"
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
        json={"name": "West Mall", "code": "WM-01", "address": "West Side", "width": 30.0, "height": 30.0}
    )
    store_id = res_store.json()["id"]

    res_shelf = client.post(
        "/api/shelves/",
        headers=headers,
        json={"store_id": store_id, "name": "Shelf 01", "x": 1.0, "y": 1.0, "width": 5.0, "height": 5.0}
    )
    shelf_id = res_shelf.json()["id"]

    db = TestingSessionLocal()
    prod = Product(id="prod-001", store_id=store_id, name="Energy Drink", category="Beverages", sku="ENG-001", price=2.99)
    db.add(prod)
    db.commit()
    db.close()

    res_sess = client.post(
        "/api/sessions/",
        headers=headers,
        json={"store_id": store_id, "shopper_identifier": "shopper-001"}
    )
    session_id = res_sess.json()["id"]

    return session_id, "prod-001", shelf_id


def test_create_interaction_success():
    headers = get_auth_headers()
    session_id, product_id, shelf_id = setup_mock_store_and_references(headers)

    response = client.post(
        "/api/interactions/",
        headers=headers,
        json={
            "session_id": session_id,
            "product_id": product_id,
            "shelf_id": shelf_id,
            "interaction_type": "pickup"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["interaction_type"] == "pickup"
    assert data["product_id"] == product_id
    assert "id" in data


def test_create_interaction_invalid_session():
    headers = get_auth_headers()
    _, product_id, shelf_id = setup_mock_store_and_references(headers)

    response = client.post(
        "/api/interactions/",
        headers=headers,
        json={
            "session_id": "nonexistent-session",
            "product_id": product_id,
            "shelf_id": shelf_id,
            "interaction_type": "view"
        }
    )
    assert response.status_code == 404
    assert "Session" in response.json()["detail"]


def test_create_interaction_invalid_product():
    headers = get_auth_headers()
    session_id, _, shelf_id = setup_mock_store_and_references(headers)

    response = client.post(
        "/api/interactions/",
        headers=headers,
        json={
            "session_id": session_id,
            "product_id": "nonexistent-product",
            "shelf_id": shelf_id,
            "interaction_type": "view"
        }
    )
    assert response.status_code == 404
    assert "Product" in response.json()["detail"]


def test_create_interaction_invalid_shelf():
    headers = get_auth_headers()
    session_id, product_id, _ = setup_mock_store_and_references(headers)

    response = client.post(
        "/api/interactions/",
        headers=headers,
        json={
            "session_id": session_id,
            "product_id": product_id,
            "shelf_id": "nonexistent-shelf",
            "interaction_type": "view"
        }
    )
    assert response.status_code == 404
    assert "Shelf" in response.json()["detail"]


def test_create_interaction_invalid_type():
    headers = get_auth_headers()
    session_id, product_id, shelf_id = setup_mock_store_and_references(headers)

    response = client.post(
        "/api/interactions/",
        headers=headers,
        json={
            "session_id": session_id,
            "product_id": product_id,
            "shelf_id": shelf_id,
            "interaction_type": "invalid_action_type"
        }
    )
    assert response.status_code in [400, 422]


def test_update_interaction():
    headers = get_auth_headers()
    session_id, product_id, shelf_id = setup_mock_store_and_references(headers)

    res = client.post(
        "/api/interactions/",
        headers=headers,
        json={
            "session_id": session_id,
            "product_id": product_id,
            "shelf_id": shelf_id,
            "interaction_type": "view"
        }
    )
    interaction_id = res.json()["id"]

    response = client.put(
        f"/api/interactions/{interaction_id}",
        headers=headers,
        json={"interaction_type": "compare"}
    )
    assert response.status_code == 200
    assert response.json()["interaction_type"] == "compare"


def test_delete_interaction():
    headers = get_auth_headers()
    session_id, product_id, shelf_id = setup_mock_store_and_references(headers)

    res = client.post(
        "/api/interactions/",
        headers=headers,
        json={
            "session_id": session_id,
            "product_id": product_id,
            "shelf_id": shelf_id,
            "interaction_type": "purchase"
        }
    )
    interaction_id = res.json()["id"]

    response_delete = client.delete(f"/api/interactions/{interaction_id}", headers=headers)
    assert response_delete.status_code == 204

    response_get = client.get(f"/api/interactions/{interaction_id}", headers=headers)
    assert response_get.status_code == 404
