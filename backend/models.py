from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from database import Base
from pydantic import BaseModel
from typing import List
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from database import Base
class StoreZoneDB(Base):
    __tablename__ = "store_layout_zones"

    id = Column(String, primary_key=True, index=True)
    label = Column(String)
    x = Column(Float)
    y = Column(Float)
    w = Column(Float)
    h = Column(Float)
    category = Column(String)
    camera_assigned = Column(Integer)
class ProductAttractiveness(Base):
    __tablename__ = "product_attractiveness_scores"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, index=True)
    category = Column(String)
    attention_duration = Column(Float)      # Metric A
    interaction_frequency = Column(Float)   # Metric I
    pickup_rate = Column(Float)             # Metric P
    purchase_conversion = Column(Float)     # Metric C
    repeat_engagement = Column(Float)       # Metric R
    final_score = Column(Float)             # Weighted 0-100 Score
    updated_at = Column(DateTime, default=datetime.utcnow)

class ShopperSession(Base):
    __tablename__ = "shopper_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    total_path_distance = Column(Float)
    zone_dwell_time = Column(Float)
    movement_velocity = Column(Float)
    assigned_segment = Column(String)  # Explorers, Quick Buyers, Comparison Shoppers, etc.
    created_at = Column(DateTime, default=datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "diagnostic_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    priority = Column(String)
    sku = Column(String)
    action = Column(String)
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ShopperProfile(Base):
    """
    Persistent Vector Storage: Stores Re-ID embeddings long-term to recognize 
    returning customers even after the 24-hour RAM cache clears.
    """
    __tablename__ = "shopper_profiles"

    global_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, index=True, nullable=True) # Linked POS customer
    feature_vector_json = Column(String) # JSON serialized numpy array embedding
    last_seen = Column(DateTime, default=datetime.utcnow)