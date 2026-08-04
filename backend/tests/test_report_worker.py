import os
import shutil
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models import Store
from app.workers.report_worker import generate_daily_reports, generate_weekly_reports, start_report_worker
import app.workers.report_worker as rw_module

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_reports.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

TEST_REPORTS_DIR = "test_reports_output"

@pytest.fixture(autouse=True)
def setup_db(monkeypatch):
    monkeypatch.setattr(rw_module, "SessionLocal", TestingSessionLocal)
    Base.metadata.create_all(bind=engine)
    
    # Ensure fresh test directory
    if os.path.exists(TEST_REPORTS_DIR):
        shutil.rmtree(TEST_REPORTS_DIR)
    os.makedirs(TEST_REPORTS_DIR, exist_ok=True)
    
    yield
    
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_REPORTS_DIR):
        shutil.rmtree(TEST_REPORTS_DIR)

def test_report_generation_empty_database():
    db = TestingSessionLocal()
    store = Store(id="store-r1", name="Report Store 1", code="RS1", address="Road 1", width=10.0, height=10.0)
    db.add(store)
    db.commit()
    
    # Generate daily and weekly reports
    generate_daily_reports(db, "store-r1", TEST_REPORTS_DIR)
    generate_weekly_reports(db, "store-r1", TEST_REPORTS_DIR)
    db.close()
    
    # Check that directories and files are created
    daily_files = os.listdir(os.path.join(TEST_REPORTS_DIR, "daily"))
    weekly_files = os.listdir(os.path.join(TEST_REPORTS_DIR, "weekly"))
    
    assert len(daily_files) > 0
    assert len(weekly_files) > 0
    
    # Check traffic json exists
    traffic_json = [f for f in daily_files if f.endswith(".json") and "traffic" in f]
    assert len(traffic_json) == 1
    
    # Check traffic csv exists
    traffic_csv = [f for f in daily_files if f.endswith(".csv") and "traffic" in f]
    assert len(traffic_csv) == 1

@pytest.mark.anyio
async def test_report_worker_execution():
    db = TestingSessionLocal()
    store = Store(id="store-r2", name="Report Store 2", code="RS2", address="Road 2", width=10.0, height=10.0)
    db.add(store)
    db.commit()
    db.close()
    
    # Run the worker once
    await start_report_worker(interval=0.01, base_dir=TEST_REPORTS_DIR, max_runs=1)
    
    daily_path = os.path.join(TEST_REPORTS_DIR, "daily")
    weekly_path = os.path.join(TEST_REPORTS_DIR, "weekly")
    
    assert os.path.exists(daily_path)
    assert os.path.exists(weekly_path)
    assert len(os.listdir(daily_path)) > 0
    assert len(os.listdir(weekly_path)) > 0
