import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from app.core.database import Base
from app.models import Store, Zone, Camera, Product, Shelf, Session as ShopperSession, AttentionEvent, ProductInteraction
from app.repositories.analytics_repository import AnalyticsRepository

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_analytics_repo.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    store = Store(id="store-x", name="Analytics Hub", code="AH-01", address="Silicon Valley", width=40.0, height=40.0)
    db.add(store)

    z1 = Zone(id="zone-entrance", store_id="store-x", name="Entrance Aisle", zone_type="entrance", x=0.0, y=0.0, width=10.0, height=10.0)
    z2 = Zone(id="zone-checkout", store_id="store-x", name="Checkout Desk", zone_type="checkout", x=20.0, y=20.0, width=5.0, height=5.0)
    db.add_all([z1, z2])

    shelf = Shelf(id="shelf-01", store_id="store-x", name="Promo Stand", x=10.0, y=10.0, width=4.0, height=4.0)
    db.add(shelf)

    cam = Camera(id="cam-01", store_id="store-x", name="Dome Cam", stream_url="rtsp://localhost", location_name="Entrance", x=1.0, y=1.0)
    db.add(cam)

    p1 = Product(id="prod-a", store_id="store-x", name="Soda Pop", category="Beverages", sku="SDA-01", price=1.50)
    p2 = Product(id="prod-b", store_id="store-x", name="Chips", category="Snacks", sku="CHP-01", price=3.00)
    db.add_all([p1, p2])

    s1 = ShopperSession(id="sess-1", store_id="store-x", shopper_identifier="shopper-1", entry_time=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), duration_seconds=120.0, zone_sequence=["Entrance Aisle", "Checkout Desk"])
    s2 = ShopperSession(id="sess-2", store_id="store-x", shopper_identifier="shopper-2", entry_time=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), duration_seconds=60.0, zone_sequence=["Entrance Aisle", "Checkout Desk", "Entrance Aisle"])
    db.add_all([s1, s2])

    ae1 = AttentionEvent(id="ae-1", session_id="sess-1", camera_id="cam-01", zone_id="zone-entrance", attention_score=0.9, gaze_duration_ms=4000.0, confidence=0.95)
    ae2 = AttentionEvent(id="ae-2", session_id="sess-2", camera_id="cam-01", zone_id="zone-entrance", attention_score=0.7, gaze_duration_ms=2000.0, confidence=0.85)
    db.add_all([ae1, ae2])

    pi1 = ProductInteraction(id="pi-1", session_id="sess-1", product_id="prod-a", shelf_id="shelf-01", interaction_type="view")
    pi2 = ProductInteraction(id="pi-2", session_id="sess-1", product_id="prod-a", shelf_id="shelf-01", interaction_type="purchase")
    pi3 = ProductInteraction(id="pi-3", session_id="sess-2", product_id="prod-b", shelf_id="shelf-01", interaction_type="view")
    db.add_all([pi1, pi2, pi3])

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


def test_zone_attention_metrics():
    db = TestingSessionLocal()
    metrics = AnalyticsRepository.get_zone_attention_metrics(db, "store-x")
    db.close()

    assert len(metrics) == 1
    assert metrics[0]["zone_name"] == "Entrance Aisle"
    assert metrics[0]["total_attention_events"] == 2
    assert pytest.approx(metrics[0]["average_attention_score"]) == 0.8
    assert metrics[0]["total_gaze_duration_ms"] == 6000.0


def test_store_heatmap_data():
    db = TestingSessionLocal()
    heatmap = AnalyticsRepository.get_store_heatmap_data(db, "store-x")
    db.close()

    assert len(heatmap) == 1
    assert heatmap[0]["zone_id"] == "zone-entrance"
    assert heatmap[0]["x"] == 0.0
    assert heatmap[0]["attention_count"] == 2


def test_dwell_time_metrics():
    db = TestingSessionLocal()
    dwell = AnalyticsRepository.get_dwell_time_metrics(db, "store-x")
    db.close()

    assert dwell["total_sessions"] == 2
    assert dwell["average_duration_seconds"] == 90.0
    assert dwell["longest_session"] == 120.0
    assert dwell["shortest_session"] == 60.0


def test_product_interaction_metrics():
    db = TestingSessionLocal()
    metrics = AnalyticsRepository.get_product_interaction_metrics(db, "store-x")
    db.close()

    assert len(metrics) == 2
    soda = [m for m in metrics if m["product_name"] == "Soda Pop"][0]
    assert soda["views"] == 1
    assert soda["purchases"] == 1

    chips = [m for m in metrics if m["product_name"] == "Chips"][0]
    assert chips["views"] == 1
    assert chips["purchases"] == 0


def test_conversion_metrics():
    db = TestingSessionLocal()
    conversions = AnalyticsRepository.get_conversion_metrics(db, "store-x")
    db.close()

    assert len(conversions) == 2
    soda = [c for c in conversions if c["product_name"] == "Soda Pop"][0]
    assert soda["conversion_rate"] == 1.0

    chips = [c for c in conversions if c["product_name"] == "Chips"][0]
    assert chips["conversion_rate"] == 0.0


def test_shopper_journey_data():
    db = TestingSessionLocal()
    journeys = AnalyticsRepository.get_shopper_journey_data(db, "store-x")
    db.close()

    assert len(journeys) == 2
    t1 = [j for j in journeys if j["source_zone"] == "Entrance Aisle" and j["target_zone"] == "Checkout Desk"][0]
    assert t1["transition_count"] == 2

    t2 = [j for j in journeys if j["source_zone"] == "Checkout Desk" and j["target_zone"] == "Entrance Aisle"][0]
    assert t2["transition_count"] == 1
