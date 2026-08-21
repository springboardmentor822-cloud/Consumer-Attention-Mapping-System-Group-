import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.db import Base

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    stores = relationship("Store", back_populates="organization")

class Store(Base):
    __tablename__ = "stores"
    id = Column(String, primary_key=True, index=True)
    org_id = Column(String, ForeignKey("organizations.id"))
    name = Column(String, nullable=False)
    location = Column(String)
    map_width = Column(Float, default=1000.0)
    map_height = Column(Float, default=800.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="stores")
    cameras = relationship("Camera", back_populates="store")
    zones = relationship("Zone", back_populates="store")
    shelves = relationship("Shelf", back_populates="store")
    sessions = relationship("ShopperSession", back_populates="store")
    campaigns = relationship("Campaign", back_populates="store")

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False) # STORE_MANAGER, RETAIL_ANALYST, MARKETING_MANAGER, ADMINISTRATOR
    store_id = Column(String, ForeignKey("stores.id"), nullable=True)
    is_active = Column(Boolean, default=True)

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    name = Column(String, nullable=False)
    status = Column(String, default="ONLINE") # ONLINE, OFFLINE, DEGRADED
    ip_address = Column(String)
    resolution = Column(String, default="1920x1080")
    homography_matrix = Column(JSON, nullable=True) # 3x3 array

    store = relationship("Store", back_populates="cameras")

class Zone(Base):
    __tablename__ = "zones"
    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    polygon_coords = Column(JSON, nullable=False) # [[x1, y1], [x2, y2], ...]

    store = relationship("Store", back_populates="zones")
    shelves = relationship("Shelf", back_populates="zone")

class Shelf(Base):
    __tablename__ = "shelves"
    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    zone_id = Column(String, ForeignKey("zones.id"))
    name = Column(String, nullable=False)
    planogram_coords = Column(JSON, nullable=False) # {x, y, width, height}
    level = Column(String, default="EYE_LEVEL") # EYE_LEVEL, BOTTOM, TOP, MIDDLE

    store = relationship("Store", back_populates="shelves")
    zone = relationship("Zone", back_populates="shelves")
    products = relationship("Product", back_populates="shelf")

class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    shelf_id = Column(String, ForeignKey("shelves.id"))
    position_on_shelf = Column(String, default="MIDDLE")

    shelf = relationship("Shelf", back_populates="products")

class ShopperSession(Base):
    __tablename__ = "shopper_sessions"
    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    shopper_id = Column(String, index=True, nullable=False)
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    total_dwell = Column(Float, default=0.0) # seconds
    path_distance = Column(Float, default=0.0) # meters / units
    segment = Column(String, nullable=True) # Explorers, Quick Buyers, Comparison Shoppers, Impulse Buyers, Brand Loyal Customers

    store = relationship("Store", back_populates="sessions")
    trajectory_points = relationship("TrajectoryPoint", back_populates="session", cascade="all, delete-orphan")
    zone_visits = relationship("ZoneVisit", back_populates="session", cascade="all, delete-orphan")
    interactions = relationship("ProductInteraction", back_populates="session", cascade="all, delete-orphan")
    purchases = relationship("Purchase", back_populates="session", cascade="all, delete-orphan")

class TrajectoryPoint(Base):
    __tablename__ = "trajectory_points"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("shopper_sessions.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    camera_id = Column(String, nullable=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    smoothed_x = Column(Float, nullable=False)
    smoothed_y = Column(Float, nullable=False)
    velocity = Column(Float, default=0.0)
    zone_id = Column(String, nullable=True)
    event_type = Column(String, default="TRACK")

    session = relationship("ShopperSession", back_populates="trajectory_points")

class ZoneVisit(Base):
    __tablename__ = "zone_visits"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("shopper_sessions.id"))
    zone_id = Column(String, ForeignKey("zones.id"))
    entry_time = Column(DateTime, default=datetime.datetime.utcnow)
    exit_time = Column(DateTime, nullable=True)
    dwell_seconds = Column(Float, default=0.0)

    session = relationship("ShopperSession", back_populates="zone_visits")

class ProductInteraction(Base):
    __tablename__ = "product_interactions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("shopper_sessions.id"))
    product_id = Column(String, ForeignKey("products.id"))
    shelf_id = Column(String, ForeignKey("shelves.id"))
    interaction_type = Column(String, nullable=False) # VIEW, PICKUP, RETURN, COMPARE
    duration = Column(Float, default=0.0) # seconds
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("ShopperSession", back_populates="interactions")

class Purchase(Base):
    __tablename__ = "purchases"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("shopper_sessions.id"))
    product_id = Column(String, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("ShopperSession", back_populates="purchases")

class ShopperSegment(Base):
    __tablename__ = "shopper_segments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("shopper_sessions.id"))
    segment_name = Column(String, nullable=False)
    confidence = Column(Float, default=0.95)
    feature_snapshot = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class ProductAttractivenessScore(Base):
    __tablename__ = "product_attractiveness_scores"
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String, ForeignKey("products.id"))
    sku = Column(String, nullable=False)
    raw_metrics = Column(JSON, nullable=False) # {A, I, P, C, R}
    normalized_metrics = Column(JSON, nullable=False) # {A_norm, I_norm, P_norm, C_norm, R_norm}
    final_score = Column(Float, nullable=False)
    calculation_timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class HeatmapSnapshot(Base):
    __tablename__ = "heatmap_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(String, ForeignKey("stores.id"))
    shelf_id = Column(String, nullable=True)
    layer_type = Column(String, nullable=False) # TRAFFIC, ZONE_DENSITY, GAZE_FOCUS, SHELF_HOTSPOT
    grid_matrix = Column(JSON, nullable=False) # 2D array matrix
    resolution = Column(String, default="100x80")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    name = Column(String, nullable=False)
    target_category = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String, default="ACTIVE")
    lift_percentage = Column(Float, default=0.0)

    store = relationship("Store", back_populates="campaigns")

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(String, primary_key=True, index=True)
    priority = Column(String, default="HIGH") # HIGH, MEDIUM, LOW
    store_id = Column(String, ForeignKey("stores.id"))
    sku = Column(String, nullable=False)
    shelf_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    expected_conversion_uplift = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    endpoint = Column(String, nullable=False)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class SystemMetric(Base):
    __tablename__ = "system_metrics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    cpu_usage = Column(Float, nullable=False)
    memory_usage = Column(Float, nullable=False)
    gpu_usage = Column(Float, nullable=False)
    active_streams = Column(Integer, nullable=False)
    request_rate = Column(Float, default=120.0)
    avg_latency_ms = Column(Float, default=14.2)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, nullable=True)
    type = Column(String, nullable=False) # SHELF_PERFORMANCE, PRODUCT_VISIBILITY, TRAFFIC_ANOMALY, CAMERA_HEALTH
    level = Column(String, default="WARNING") # WARNING, INFO, ALERT, CRITICAL
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    source_id = Column(String, nullable=True)
    acknowledged = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

