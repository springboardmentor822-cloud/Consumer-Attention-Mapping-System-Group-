import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models import Store, Product, Zone
from app.workers.analytics_worker import start_analytics_worker, execution_stats
import app.workers.analytics_worker as aw_module

# Override SessionLocal for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_analytics_worker.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_db(monkeypatch):
    # Monkeypatch the SessionLocal in the worker module to use our test database
    monkeypatch.setattr(aw_module, "SessionLocal", TestingSessionLocal)
    
    Base.metadata.create_all(bind=engine)
    
    # Reset execution statistics
    execution_stats["run_count"] = 0
    execution_stats["success_count"] = 0
    execution_stats["error_count"] = 0
    execution_stats["last_run_time"] = None
    execution_stats["last_error"] = None
    execution_stats["processed_stores"] = 0
    execution_stats["updated_products"] = 0
    
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.mark.anyio
async def test_analytics_worker_empty_database():
    # Run worker for exactly 1 run with empty database
    await start_analytics_worker(interval=0.01, max_runs=1)
    
    assert execution_stats["run_count"] == 1
    assert execution_stats["success_count"] == 1
    assert execution_stats["error_count"] == 0
    assert execution_stats["processed_stores"] == 0

@pytest.mark.anyio
async def test_analytics_worker_aggregation_execution():
    db = TestingSessionLocal()
    store = Store(id="store-w1", name="Worker Store 1", code="WS-01", address="Road A", width=20.0, height=20.0)
    db.add(store)
    
    p1 = Product(id="p-w1", store_id="store-w1", name="Product W1", category="Beverages", sku="PW1", price=1.0)
    db.add(p1)
    db.commit()
    db.close()
    
    # Run worker for 1 execution
    await start_analytics_worker(interval=0.01, max_runs=1)
    
    assert execution_stats["run_count"] == 1
    assert execution_stats["success_count"] == 1
    assert execution_stats["processed_stores"] == 1
    assert execution_stats["updated_products"] == 1

@pytest.mark.anyio
async def test_analytics_worker_multiple_runs():
    db = TestingSessionLocal()
    store = Store(id="store-w2", name="Worker Store 2", code="WS-02", address="Road B", width=20.0, height=20.0)
    db.add(store)
    db.commit()
    db.close()
    
    # Run worker for 3 executions
    await start_analytics_worker(interval=0.01, max_runs=3)
    
    assert execution_stats["run_count"] == 3
    assert execution_stats["success_count"] == 3
    assert execution_stats["processed_stores"] == 1

@pytest.mark.anyio
async def test_analytics_worker_restart_recovery(monkeypatch):
    # Simulate DB error during execution by raising an exception when querying Store
    def mock_query(*args, **kwargs):
        raise Exception("Simulated DB Connection Error")
        
    # We monkeypatch the query method during the first run
    # To test recovery, we can run multiple runs, where the first fails and the second succeeds.
    # Let's mock SessionLocal to throw once, then recover.
    fail_count = 0
    def mock_session_local():
        nonlocal fail_count
        if fail_count < 1:
            fail_count += 1
            raise Exception("DB Connection Lost")
        return TestingSessionLocal()
        
    monkeypatch.setattr(aw_module, "SessionLocal", mock_session_local)
    
    # Run worker for 2 executions. 1st will fail, 2nd will succeed.
    await start_analytics_worker(interval=0.01, max_runs=2)
    
    assert execution_stats["run_count"] == 2
    assert execution_stats["success_count"] == 1
    assert execution_stats["error_count"] == 1
    assert execution_stats["last_error"] == "DB Connection Lost"
