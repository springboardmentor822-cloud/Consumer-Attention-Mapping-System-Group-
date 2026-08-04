import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models import Store, Zone, Session as ShopperSession, TrackingLog
from app.repositories.analytics_repository import AnalyticsRepository

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_journeys.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Create Store
    store = Store(id="store-j", name="Journey Hub", code="JH-01", address="Road 1", width=50.0, height=50.0)
    db.add(store)
    # Create Zones
    z1 = Zone(id="z-ent", store_id="store-j", name="Entrance", zone_type="entrance", x=0.0, y=0.0, width=5.0, height=5.0)
    z2 = Zone(id="z-aisle", store_id="store-j", name="Aisle", zone_type="shelf_area", x=10.0, y=10.0, width=5.0, height=5.0)
    z3 = Zone(id="z-chk", store_id="store-j", name="Checkout", zone_type="checkout", x=20.0, y=20.0, width=5.0, height=5.0)
    db.add_all([z1, z2, z3])
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def test_journey_empty_database():
    db = TestingSessionLocal()
    journeys = AnalyticsRepository.get_shopper_journey_data(db, "store-j")
    db.close()
    assert journeys == []

def test_journey_single_zone():
    db = TestingSessionLocal()
    # Shopper has only visited one zone, so transitions should be empty
    s1 = ShopperSession(id="s-1", store_id="store-j", shopper_identifier="shopper-1")
    db.add(s1)
    t1 = TrackingLog(shopper_id="shopper-1", camera_id="cam-1", zone_id="z-ent", x=1.0, y=1.0)
    db.add(t1)
    db.commit()
    
    journeys = AnalyticsRepository.get_shopper_journey_data(db, "store-j")
    db.close()
    assert journeys == []

def test_journey_multi_zone():
    db = TestingSessionLocal()
    s1 = ShopperSession(id="s-1", store_id="store-j", shopper_identifier="shopper-1")
    db.add(s1)
    t1 = TrackingLog(shopper_id="shopper-1", camera_id="cam-1", zone_id="z-ent", x=1.0, y=1.0)
    t2 = TrackingLog(shopper_id="shopper-1", camera_id="cam-1", zone_id="z-aisle", x=11.0, y=11.0)
    db.add_all([t1, t2])
    db.commit()
    
    journeys = AnalyticsRepository.get_shopper_journey_data(db, "store-j")
    db.close()
    
    assert len(journeys) == 1
    assert journeys[0]["source_zone"] == "Entrance"
    assert journeys[0]["target_zone"] == "Aisle"
    assert journeys[0]["transition_count"] == 1

def test_journey_repeated_visits():
    db = TestingSessionLocal()
    s1 = ShopperSession(id="s-1", store_id="store-j", shopper_identifier="shopper-1")
    db.add(s1)
    
    # Visit sequence: Entrance -> Aisle -> Entrance -> Aisle (repeated transitions)
    logs = [
        TrackingLog(shopper_id="shopper-1", camera_id="cam-1", zone_id="z-ent", x=1.0, y=1.0),
        TrackingLog(shopper_id="shopper-1", camera_id="cam-1", zone_id="z-aisle", x=11.0, y=11.0),
        TrackingLog(shopper_id="shopper-1", camera_id="cam-1", zone_id="z-ent", x=2.0, y=2.0),
        TrackingLog(shopper_id="shopper-1", camera_id="cam-1", zone_id="z-aisle", x=12.0, y=12.0)
    ]
    db.add_all(logs)
    db.commit()
    
    journeys = AnalyticsRepository.get_shopper_journey_data(db, "store-j")
    db.close()
    
    # Entrance -> Aisle (count 2), Aisle -> Entrance (count 1)
    assert len(journeys) == 2
    ent_to_aisle = [j for j in journeys if j["source_zone"] == "Entrance" and j["target_zone"] == "Aisle"][0]
    aisle_to_ent = [j for j in journeys if j["source_zone"] == "Aisle" and j["target_zone"] == "Entrance"][0]
    
    assert ent_to_aisle["transition_count"] == 2
    assert aisle_to_ent["transition_count"] == 1

def test_journey_multiple_shoppers():
    db = TestingSessionLocal()
    s1 = ShopperSession(id="s-1", store_id="store-j", shopper_identifier="shopper-1")
    s2 = ShopperSession(id="s-2", store_id="store-j", shopper_identifier="shopper-2")
    db.add_all([s1, s2])
    
    # Shopper 1: Entrance -> Aisle
    logs_s1 = [
        TrackingLog(shopper_id="shopper-1", camera_id="cam-1", zone_id="z-ent", x=1.0, y=1.0),
        TrackingLog(shopper_id="shopper-1", camera_id="cam-1", zone_id="z-aisle", x=11.0, y=11.0)
    ]
    # Shopper 2: Entrance -> Aisle -> Checkout
    logs_s2 = [
        TrackingLog(shopper_id="shopper-2", camera_id="cam-1", zone_id="z-ent", x=1.0, y=1.0),
        TrackingLog(shopper_id="shopper-2", camera_id="cam-1", zone_id="z-aisle", x=11.0, y=11.0),
        TrackingLog(shopper_id="shopper-2", camera_id="cam-1", zone_id="z-chk", x=21.0, y=21.0)
    ]
    db.add_all(logs_s1 + logs_s2)
    db.commit()
    
    journeys = AnalyticsRepository.get_shopper_journey_data(db, "store-j")
    db.close()
    
    # Entrance -> Aisle: count 2
    # Aisle -> Checkout: count 1
    assert len(journeys) == 2
    ent_to_aisle = [j for j in journeys if j["source_zone"] == "Entrance" and j["target_zone"] == "Aisle"][0]
    aisle_to_chk = [j for j in journeys if j["source_zone"] == "Aisle" and j["target_zone"] == "Checkout"][0]
    
    assert ent_to_aisle["transition_count"] == 2
    assert aisle_to_chk["transition_count"] == 1
