import pytest
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.store import Store
from app.models.session import Session as ShopperSession
from app.services.session_service import SessionService
from app.schemas.session import SessionCreate, SessionUpdate

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_session_duration.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed a store
    store = Store(id="store-dur-test", name="Duration Test Store", code="DTS-01", address="Test St", width=10.0, height=10.0)
    db.add(store)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def test_session_duration_calculation():
    db = TestingSessionLocal()
    
    # Base timestamp
    base_time = datetime.datetime(2026, 8, 2, 12, 0, 0)
    fps = 30.0
    
    first_frame = 30  # seen at 1.0 second
    last_frame = 150  # seen at 5.0 seconds
    
    entry_time = base_time + datetime.timedelta(seconds=first_frame / fps)
    exit_time = base_time + datetime.timedelta(seconds=last_frame / fps)
    
    expected_duration = (last_frame - first_frame) / fps  # 4.0 seconds
    
    sess_in = SessionCreate(
        store_id="store-dur-test",
        shopper_identifier="shopper-dur-1",
        entry_time=entry_time,
        exit_time=exit_time
    )
    
    sess = SessionService.create_session(db, sess_in)
    assert sess.duration_seconds == expected_duration
    assert sess.duration_seconds == 4.0
    
    # Test update session duration
    new_last_frame = 300  # seen at 10.0 seconds
    new_exit_time = base_time + datetime.timedelta(seconds=new_last_frame / fps)
    new_expected_duration = (new_last_frame - first_frame) / fps  # 9.0 seconds
    
    sess_update = SessionUpdate(
        exit_time=new_exit_time
    )
    
    updated_sess = SessionService.update_session(db, sess.id, sess_update)
    assert updated_sess.duration_seconds == new_expected_duration
    assert updated_sess.duration_seconds == 9.0
    
    db.close()
