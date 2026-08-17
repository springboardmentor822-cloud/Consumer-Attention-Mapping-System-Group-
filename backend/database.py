from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
import os
import os
import urllib.parse

# If your password is 'abc@100', encode it so SQLAlchemy doesn't get confused by the '@'
_raw_password = "Pass@100"  # Put your exact password here (special characters are fine)
_encoded_password = urllib.parse.quote_plus(_raw_password)

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    f"postgresql://postgres:{_encoded_password}@localhost:5432/cams_db" 
)

# SQLite's "check_same_thread" is removed because Postgres natively supports multi-threading
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# DATABASE SCHEMAS
# ==========================================

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String) 
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
    is_camera_covered = Column(Integer, default=0)