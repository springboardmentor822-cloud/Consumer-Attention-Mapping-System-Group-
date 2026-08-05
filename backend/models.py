from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text
)

from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


# ==========================
# USER TABLE
# ==========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String(100), unique=True, nullable=False)

    email = Column(String(150), unique=True, nullable=False)

    password = Column(String(255), nullable=False)

    role = Column(String(50), default="Manager")

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================
# STORE TABLE
# ==========================

class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)

    store_name = Column(String(150), nullable=False)

    manager = Column(String(100))

    location = Column(String(255))

    address = Column(String(255))

    phone = Column(String(20))

    status = Column(String(50), default="Active")

    created_at = Column(DateTime, default=datetime.utcnow)

    shelves = relationship(
        "Shelf",
        back_populates="store",
        cascade="all, delete"
    )

    cameras = relationship(
        "Camera",
        back_populates="store",
        cascade="all, delete"
    )


# ==========================
# SHELF TABLE
# ==========================

class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)

    shelf_name = Column(String(100))

    zone = Column(String(100))

    capacity = Column(Integer)

    status = Column(String(50), default="Available")

    store_id = Column(Integer, ForeignKey("stores.id"))

    store = relationship("Store", back_populates="shelves")

    products = relationship(
        "Product",
        back_populates="shelf",
        cascade="all, delete"
    )


# ==========================
# PRODUCT TABLE
# ==========================

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    product_name = Column(String(150))

    category = Column(String(100))

    brand = Column(String(100))

    sku = Column(String(100))

    barcode = Column(String(100))

    price = Column(Float)

    stock = Column(Integer)

    image = Column(String(255))

    attention_score = Column(Float, default=0)

    shelf_id = Column(Integer, ForeignKey("shelves.id"))

    shelf = relationship("Shelf", back_populates="products")


# ==========================
# CAMERA TABLE
# ==========================

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)

    camera_name = Column(String(100))

    location = Column(String(255))

    status = Column(String(50), default="Online")

    health = Column(String(50), default="Good")

    ip_address = Column(String(100))

    store_id = Column(Integer, ForeignKey("stores.id"))

    store = relationship("Store", back_populates="cameras")


# ==========================
# CONSUMER TABLE
# ==========================

class Consumer(Base):
    __tablename__ = "consumers"

    id = Column(Integer, primary_key=True, index=True)

    gender = Column(String(50))

    age_group = Column(String(50))

    visit_time = Column(DateTime, default=datetime.utcnow)

    dwell_time = Column(Float)

    attention_score = Column(Float)

    emotion = Column(String(100))

    store_name = Column(String(150))


# ==========================
# ANALYTICS TABLE
# ==========================

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)

    total_visitors = Column(Integer)

    total_sales = Column(Float)

    average_attention = Column(Float)

    engagement_score = Column(Float)

    conversion_rate = Column(Float)

    heatmap_image = Column(String(255))

    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================
# REPORT TABLE
# ==========================

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    report_name = Column(String(150))

    report_type = Column(String(100))

    generated_by = Column(String(100))

    file_path = Column(String(255))

    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================
# NOTIFICATION TABLE
# ==========================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200))

    message = Column(Text)

    notification_type = Column(String(100))

    status = Column(String(50), default="Unread")

    created_at = Column(DateTime, default=datetime.utcnow)