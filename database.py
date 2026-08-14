from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

# The SQLite database will be created as a local file named 'cams_retail.db'
# To upgrade to PostgreSQL later, simply replace this string with:
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/cams_db"
SQLALCHEMY_DATABASE_URL = "sqlite:///./cams_retail.db"

# connect_args is needed only for SQLite to allow multiple threads (FastAPI) to access it
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# --- ADD THIS FUNCTION TO DATABASE.PY ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# ----------------------------------------
# ==========================================
# DATABASE SCHEMAS (TABLES)
# ==========================================

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String) # In a true prod environment, this would be hashed
    role = Column(String)

class POSTransaction(Base):
    __tablename__ = "pos_transactions"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    customer_id = Column(String, index=True)
    amount = Column(Float)
    product_category = Column(String)
    sku = Column(String)

class StoreZone(Base):
    __tablename__ = "store_zones"
    id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String, unique=True, index=True)
    x_coord = Column(Float)
    y_coord = Column(Float)
    width = Column(Float)
    height = Column(Float)
    is_camera_covered = Column(Integer, default=0) # 0 for False, 1 for True