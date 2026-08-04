import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from app.main import app
from app.core.database import get_db, Base
from app.models import Role, User, Store, Zone, Camera, Product, Shelf, Session as ShopperSession, AttentionEvent, ProductInteraction

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_analytics_api.db"
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


def setup_mock_data():
    db = TestingSessionLocal()
    
    store = Store(id="store-z", name="Depot", code="DEP-01", address="Silicon Valley", width=40.0, height=40.0)
    db.add(store)

    z1 = Zone(id="z-ent", store_id="store-z", name="Entrance", zone_type="entrance", x=0.0, y=0.0, width=10.0, height=10.0)
    db.add(z1)

    shelf = Shelf(id="s-shelf", store_id="store-z", name="Aisle Shelf", x=10.0, y=10.0, width=4.0, height=4.0)
    db.add(shelf)

    cam = Camera(id="c-cam", store_id="store-z", name="Ceiling Cam", stream_url="rtsp://localhost", location_name="Entrance", x=1.0, y=1.0)
    db.add(cam)

    p1 = Product(id="p-soda", store_id="store-z", name="Soda Pop", category="Beverages", sku="SDA-02", price=1.50)
    db.add(p1)

    s1 = ShopperSession(id="s-sess1", store_id="store-z", shopper_identifier="shopper-1", entry_time=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), duration_seconds=120.0, zone_sequence=["Entrance"])
    db.add(s1)

    ae1 = AttentionEvent(id="ae-y1", session_id="s-sess1", camera_id="c-cam", zone_id="z-ent", attention_score=0.8, gaze_duration_ms=4000.0, confidence=0.9)
    db.add(ae1)

    pi1 = ProductInteraction(id="pi-y1", session_id="s-sess1", product_id="p-soda", shelf_id="s-shelf", interaction_type="view")
    pi2 = ProductInteraction(id="pi-y2", session_id="s-sess1", product_id="p-soda", shelf_id="s-shelf", interaction_type="purchase")
    db.add_all([pi1, pi2])

    db.commit()
    db.close()


def test_endpoints_success_and_schemas():
    headers = get_auth_headers()
    setup_mock_data()

    res = client.get("/api/analytics/heatmap/store-z", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["store_id"] == "store-z"
    assert len(data["points"]) == 1
    assert data["points"][0]["intensity"] == 1.0

    res_dwell = client.get("/api/analytics/dwell/store-z", headers=headers)
    assert res_dwell.status_code == 200
    assert res_dwell.json()["total_sessions"] == 1

    res_prod = client.get("/api/analytics/products/store-z", headers=headers)
    assert res_prod.status_code == 200
    assert len(res_prod.json()) == 1
    assert res_prod.json()[0]["views"] == 1
    assert res_prod.json()[0]["purchases"] == 1

    res_zone = client.get("/api/analytics/zones/store-z", headers=headers)
    assert res_zone.status_code == 200
    assert len(res_zone.json()) == 1
    assert res_zone.json()[0]["zone_visits"] == 1

    res_conv = client.get("/api/analytics/conversion/store-z", headers=headers)
    assert res_conv.status_code == 200
    assert len(res_conv.json()) == 1
    assert res_conv.json()[0]["conversion_rate"] == 1.0


def test_authorization_behavior():
    setup_mock_data()
    res = client.get("/api/analytics/heatmap/store-z")
    assert res.status_code == 401


def test_empty_dataset_handling():
    headers = get_auth_headers()
    res = client.get("/api/analytics/heatmap/nonexistent-store", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["points"]) == 0

    res_dwell = client.get("/api/analytics/dwell/nonexistent-store", headers=headers)
    assert res_dwell.status_code == 200
    assert res_dwell.json()["total_sessions"] == 0


def test_pagination_behavior():
    headers = get_auth_headers()
    setup_mock_data()

    res = client.get("/api/analytics/products/store-z?skip=0&limit=1", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1

    res_empty = client.get("/api/analytics/products/store-z?skip=1&limit=1", headers=headers)
    assert res_empty.status_code == 200
    assert len(res_empty.json()) == 0
