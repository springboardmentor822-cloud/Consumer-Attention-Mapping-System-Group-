import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from app.core.database import Base
from app.models import Store, Zone, Camera, Product, Shelf, Session as ShopperSession, AttentionEvent, ProductInteraction
from app.services.analytics_service import AnalyticsService

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_analytics_service.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    store = Store(id="store-y", name="Analytics Service Depot", code="ASD-01", address="Silicon Valley", width=40.0, height=40.0)
    db.add(store)

    z1 = Zone(id="z-ent", store_id="store-y", name="Entrance", zone_type="entrance", x=0.0, y=0.0, width=10.0, height=10.0)
    z2 = Zone(id="z-chk", store_id="store-y", name="Checkout", zone_type="checkout", x=20.0, y=20.0, width=5.0, height=5.0)
    db.add_all([z1, z2])

    shelf = Shelf(id="s-shelf", store_id="store-y", name="Aisle Shelf", x=10.0, y=10.0, width=4.0, height=4.0)
    db.add(shelf)

    cam = Camera(id="c-cam", store_id="store-y", name="Ceiling Cam", stream_url="rtsp://localhost", location_name="Entrance", x=1.0, y=1.0)
    db.add(cam)

    p1 = Product(id="p-soda", store_id="store-y", name="Soda Pop", category="Beverages", sku="SDA-02", price=1.50)
    p2 = Product(id="p-chips", store_id="store-y", name="Chips", category="Snacks", sku="CHP-02", price=3.00)
    db.add_all([p1, p2])

    s1 = ShopperSession(id="s-sess1", store_id="store-y", shopper_identifier="shopper-1", entry_time=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), duration_seconds=120.0, zone_sequence=["Entrance", "Checkout"])
    s2 = ShopperSession(id="s-sess2", store_id="store-y", shopper_identifier="shopper-2", entry_time=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), duration_seconds=60.0, zone_sequence=["Entrance", "Checkout", "Entrance"])
    db.add_all([s1, s2])

    ae1 = AttentionEvent(id="ae-y1", session_id="s-sess1", camera_id="c-cam", zone_id="z-ent", attention_score=0.8, gaze_duration_ms=4000.0, confidence=0.9)
    ae2 = AttentionEvent(id="ae-y2", session_id="s-sess2", camera_id="c-cam", zone_id="z-ent", attention_score=0.6, gaze_duration_ms=2000.0, confidence=0.8)
    db.add_all([ae1, ae2])

    pi1 = ProductInteraction(id="pi-y1", session_id="s-sess1", product_id="p-soda", shelf_id="s-shelf", interaction_type="view")
    pi2 = ProductInteraction(id="pi-y2", session_id="s-sess2", product_id="p-soda", shelf_id="s-shelf", interaction_type="view")
    pi3 = ProductInteraction(id="pi-y3", session_id="s-sess1", product_id="p-soda", shelf_id="s-shelf", interaction_type="purchase")
    pi4 = ProductInteraction(id="pi-y4", session_id="s-sess2", product_id="p-chips", shelf_id="s-shelf", interaction_type="view")
    db.add_all([pi1, pi2, pi3, pi4])

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


def test_get_heatmap_metrics():
    db = TestingSessionLocal()
    metrics = AnalyticsService.get_heatmap_metrics(db, "store-y")
    db.close()

    assert len(metrics["points"]) == 1
    assert metrics["points"][0]["intensity"] == 1.0


def test_get_dwell_metrics():
    db = TestingSessionLocal()
    dwell = AnalyticsService.get_dwell_metrics(db, "store-y")
    db.close()

    assert dwell["total_sessions"] == 2
    assert dwell["average_duration_seconds"] == 90.0


def test_get_product_metrics():
    db = TestingSessionLocal()
    metrics = AnalyticsService.get_product_metrics(db, "store-y")
    db.close()

    assert len(metrics) == 2
    soda = [m for m in metrics if m["product_name"] == "Soda Pop"][0]
    assert soda["views"] == 2
    assert soda["purchases"] == 1
    assert soda["conversion_rate"] == 0.5


def test_get_zone_metrics():
    db = TestingSessionLocal()
    zones = AnalyticsService.get_zone_metrics(db, "store-y")
    db.close()

    assert len(zones) >= 1
    ent = [z for z in zones if z["zone_id"] == "z-ent"][0]
    assert ent["zone_attractiveness_score"] == 0.82


def test_get_product_attractiveness():
    db = TestingSessionLocal()
    products = AnalyticsService.get_product_attractiveness(db, "store-y")
    db.close()

    assert len(products) == 2
    soda = [p for p in products if p["product_name"] == "Soda Pop"][0]
    assert soda["attractiveness_score"] == 100.0
