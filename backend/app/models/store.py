from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
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
