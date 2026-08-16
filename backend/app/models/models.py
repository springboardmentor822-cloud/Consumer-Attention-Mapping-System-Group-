import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, Mapped
from app.core.database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    email: Mapped[str] = Column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = Column(String, nullable=False)
    full_name: Mapped[str] = Column(String, nullable=False)
    # Roles can be: "Store Manager", "Retail Analyst", "Marketing Manager", "Administrator"
    role: Mapped[str] = Column(String, nullable=False, default="Retail Analyst") 
    is_active: Mapped[bool] = Column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = Column(DateTime, default=utc_now)

class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)


    shelves = relationship("Shelf", back_populates="store", cascade="all, delete-orphan")
    cameras = relationship("Camera", back_populates="store", cascade="all, delete-orphan")

class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    name = Column(String, nullable=False)
    zone_name = Column(String, nullable=False)  # e.g., Snacks, Drinks, Apparel
    width = Column(Float, default=1.0)           # in meters
    height = Column(Float, default=2.0)          # in meters
    coordinates_json = Column(Text, nullable=True)  # Visual layout coordinates stored as JSON string
    created_at = Column(DateTime, default=utc_now)

    store = relationship("Store", back_populates="shelves")
    shelf_products = relationship("ShelfProduct", back_populates="shelf", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    price = Column(Float, default=0.0)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    shelf_products = relationship("ShelfProduct", back_populates="product", cascade="all, delete-orphan")

class ShelfProduct(Base):
    __tablename__ = "shelf_products"

    id = Column(Integer, primary_key=True, index=True)
    shelf_id = Column(Integer, ForeignKey("shelves.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    position_x = Column(Float, default=0.0)  # Horizontal position on shelf (meters or relative)
    position_y = Column(Float, default=0.0)  # Vertical position on shelf (meters or relative)
    min_stock = Column(Integer, default=5)
    current_stock = Column(Integer, default=10)

    shelf = relationship("Shelf", back_populates="shelf_products")
    product = relationship("Product", back_populates="shelf_products")

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    name = Column(String, nullable=False)
    stream_url = Column(String, nullable=True)
    status = Column(String, default="active")  # active, inactive, maintenance
    position_x = Column(Float, default=0.0)    # Floor plan coordinates
    position_y = Column(Float, default=0.0)
    angle = Column(Float, default=0.0)         # Field of view/rotation angle
    created_at = Column(DateTime, default=utc_now)

    store = relationship("Store", back_populates="cameras")

class ShopperPosition(Base):
    __tablename__ = "shopper_positions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, default=utc_now)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    shopper_id = Column(Integer, nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    dwell_time = Column(Integer, default=0)
    gaze_target = Column(String, nullable=True)
    gaze_x = Column(Float, nullable=True)
    gaze_y = Column(Float, nullable=True)

    camera = relationship("Camera")

class ShopperSession(Base):
    __tablename__ = "shopper_sessions"

    id = Column(Integer, primary_key=True, index=True)
    shopper_id = Column(Integer, nullable=False, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    entry_time = Column(DateTime, default=utc_now)
    exit_time = Column(DateTime, nullable=True)
    total_path_distance = Column(Float, default=0.0)  # Euclidean distance
    avg_velocity = Column(Float, default=0.0)        # speed in pixels/sec or m/s
    total_dwell_time = Column(Integer, default=0)    # seconds
    zone_dwell_json = Column(Text, nullable=True)     # JSON dict of zone dwell times
    interaction_count = Column(Integer, default=0)
    shopper_segment = Column(String, default="Explorer") # Persona: Explorer, Quick Buyer, etc.
    created_at = Column(DateTime, default=utc_now)

    store = relationship("Store")

class ProductAttractivenessScore(Base):
    __tablename__ = "product_attractiveness_scores"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    shelf_id = Column(Integer, ForeignKey("shelves.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    timestamp = Column(DateTime, default=utc_now, index=True)
    passing_traffic = Column(Float, default=0.0)     # Scaled 0-100
    dwell_time = Column(Float, default=0.0)          # Scaled 0-100
    interaction_count = Column(Float, default=0.0)   # Scaled 0-100
    stockout_rate = Column(Float, default=0.0)       # Scaled 0-100
    attention_duration = Column(Float, default=0.0)  # Raw seconds
    pickup_rate = Column(Float, default=0.0)         # Pickups/Views
    conversion_rate = Column(Float, default=0.0)     # Purchases/Pickups
    repeat_engagement = Column(Float, default=0.0)   # % returning
    attractiveness_score = Column(Float, default=0.0) # Weighted Composite Score 0-100
    calculation_window = Column(String, default="daily") # hourly, daily, weekly

    store = relationship("Store")
    shelf = relationship("Shelf")
    product = relationship("Product")

class OptimizationRecommendation(Base):
    __tablename__ = "optimization_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    shelf_id = Column(Integer, ForeignKey("shelves.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    issue_type = Column(String, nullable=False)     # high_attention_low_pickup, dead_zone, eye_level_relocate, etc.
    priority = Column(String, default="medium")     # high, medium, low
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    expected_uplift = Column(String, default="+15% Conversion")
    status = Column(String, default="active")       # active, acknowledged, resolved

    store = relationship("Store")
    shelf = relationship("Shelf")
    product = relationship("Product")


