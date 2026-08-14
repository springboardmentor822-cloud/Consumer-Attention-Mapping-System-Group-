from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    location = Column(String(255), nullable=False)
    manager_name = Column(String(150), default="Store Manager")
    contact_number = Column(String(50), default="+1 (555) 019-2834")
    status = Column(String(50), default="Active")
    opening_hours = Column(String(100), default="08:00 AM - 10:00 PM")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    zones = relationship("Zone", back_populates="store", cascade="all, delete-orphan")
    shelves = relationship("Shelf", back_populates="store", cascade="all, delete-orphan")
    cameras = relationship("Camera", back_populates="store", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="store", cascade="all, delete-orphan")


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    assigned_camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    status = Column(String(50), default="Optimal")  # Green (Optimal) / Orange (Busy) / Red (High Traffic)

    store = relationship("Store", back_populates="zones")
    assigned_camera = relationship("Camera", foreign_keys=[assigned_camera_id])
    shelves = relationship("Shelf", back_populates="zone", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="zone", cascade="all, delete-orphan")


class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(120), nullable=False)
    shelf_name = Column(String(120), nullable=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    assigned_camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    
    occupancy_percentage = Column(Float, default=75.0)
    visitors_count = Column(Integer, default=0)
    average_dwell_time = Column(Float, default=0.0)
    attention_score = Column(Float, default=0.0)
    shelf_status = Column(String(50), default="Healthy")  # Healthy / Low Stock / Shelf Full

    store = relationship("Store", back_populates="shelves")
    zone = relationship("Zone", back_populates="shelves")
    assigned_camera = relationship("Camera", foreign_keys=[assigned_camera_id])
    products = relationship("Product", back_populates="shelf", cascade="all, delete-orphan")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(120), nullable=False)
    location = Column(String(255), nullable=False)
    stream_url = Column(String(500), nullable=False)
    status = Column(String(20), default="online")  # online / offline / unknown
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)

    store = relationship("Store", back_populates="cameras")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(150), default="Product")
    shelf_id = Column(Integer, ForeignKey("shelves.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)

    current_count = Column(Integer, default=0)
    detected_count = Column(Integer, default=0)
    available_count = Column(Integer, default=50)
    detection_time = Column(DateTime(timezone=True), server_default=func.now())
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    stock_status = Column(String(50), default="Healthy")  # Healthy / Low Stock / Out of Stock
    product_health = Column(String(50), default="Optimal")

    store = relationship("Store", back_populates="products")
    zone = relationship("Zone", back_populates="products")
    shelf = relationship("Shelf", back_populates="products")
    camera = relationship("Camera")


class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)


class AttentionLog(Base):
    __tablename__ = "attention_logs"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    attention_score = Column(Integer, nullable=False)  # 0-100
    dwell_time = Column(Integer, nullable=False)  # seconds

    zone = relationship("Zone")


class ShopperSession(Base):
    __tablename__ = "shopper_sessions"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, default=1)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    track_id = Column(Integer, nullable=False)
    entry_time = Column(DateTime(timezone=True), server_default=func.now())
    exit_time = Column(DateTime(timezone=True), nullable=True)
    total_dwell = Column(Float, default=0.0)  # seconds
    attention_duration = Column(Float, default=0.0)  # seconds
    visited_zones = Column(String(500), default="[]")  # JSON list string
    visited_shelves = Column(String(500), default="[]")  # JSON list string
    product_pickups = Column(Integer, default=0)
    purchases = Column(Integer, default=0)
    switching_count = Column(Integer, default=0)
    promo_zone_visited = Column(String(10), default="false")  # "true" / "false"
    shopper_segment = Column(String(100), default="Explorer")  # Explorer, Quick Buyer, Comparison Shopper, Impulse Buyer, Brand Loyal Customer

    store = relationship("Store")
    camera = relationship("Camera")
    trajectories = relationship("ShopperTrajectory", back_populates="session", cascade="all, delete-orphan")


class ShopperTrajectory(Base):
    __tablename__ = "shopper_trajectories"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("shopper_sessions.id"), nullable=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)
    focus_x = Column(Integer, nullable=True)
    focus_y = Column(Integer, nullable=True)
    zone_name = Column(String(120), default="Main Floor")
    shelf_name = Column(String(120), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    dwell_time = Column(Float, default=1.0)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    session = relationship("ShopperSession", back_populates="trajectories")
    product = relationship("Product")


class ProductMetric(Base):
    __tablename__ = "product_metrics"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, unique=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, default=1)
    
    attention_duration = Column(Float, default=0.0)  # seconds
    interaction_frequency = Column(Float, default=0.0)  # count
    pickup_rate = Column(Float, default=0.0)  # percentage 0-100
    conversion_rate = Column(Float, default=0.0)  # percentage 0-100
    repeat_engagement = Column(Float, default=0.0)  # percentage 0-100
    
    attractiveness_score = Column(Float, default=0.0)  # 0.35*attn + 0.25*inter + 0.20*pick + 0.15*conv + 0.05*rep
    visibility_score = Column(Float, default=0.0)
    engagement_score = Column(Float, default=0.0)
    conversion_potential_score = Column(Float, default=0.0)
    marketing_effectiveness_score = Column(Float, default=0.0)
    rank = Column(Integer, default=1)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    product = relationship("Product")
    store = relationship("Store")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, default=1)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    
    category = Column(String(100), nullable=False)  # Underperforming High Attention, Low Visibility High Conversion, Promotional Placement, Traffic Optimization
    target_name = Column(String(150), nullable=False)  # Product or Zone name
    current_problem = Column(String(500), nullable=False)
    supporting_metric = Column(String(255), nullable=False)
    recommendation_text = Column(String(500), nullable=False)
    reason = Column(String(500), nullable=False)
    priority = Column(String(20), default="MEDIUM")  # HIGH / MEDIUM / LOW
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product")
    zone = relationship("Zone")
    store = relationship("Store")


class MarketingCampaign(Base):
    __tablename__ = "marketing_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, default=1)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    promoted_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    
    name = Column(String(150), nullable=False)
    promoted_products = Column(String(255), default="")
    duration = Column(String(100), default="Current Month")
    reach = Column(Integer, default=0)
    attention_score = Column(Float, default=0.0)
    visitors = Column(Integer, default=0)
    product_engagement = Column(String(50), default="0.0%")
    sales_lift = Column(String(50), default="0.0%")
    roi = Column(String(50), default="0%")
    status = Column(String(50), default="Active")

    store = relationship("Store")
    zone = relationship("Zone")
    product = relationship("Product")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, default=1)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    shelf_id = Column(Integer, ForeignKey("shelves.id"), nullable=True)
    
    alert_type = Column(String(50), nullable=False)  # shelf_performance, product_visibility, traffic_anomaly, camera_health
    severity = Column(String(20), default="HIGH")     # CRITICAL, HIGH, MEDIUM, LOW
    message = Column(String(500), nullable=False)
    status = Column(String(20), default="active")     # active, acknowledged, resolved
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    store = relationship("Store")
    zone = relationship("Zone")
    camera = relationship("Camera")
    product = relationship("Product")
    shelf = relationship("Shelf")


