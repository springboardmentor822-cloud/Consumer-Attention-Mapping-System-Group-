import datetime as dt

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    timezone = Column(String(50), default="UTC")

    floor_width_m = Column(Float, nullable=True)   # for spatial heatmap scaling
    floor_height_m = Column(Float, nullable=True)
    max_capacity = Column(Integer, nullable=True)  # overcrowding alert threshold (people)

    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    manager = relationship("User", back_populates="stores_managed")
    zones = relationship("StoreZone", back_populates="store", cascade="all, delete-orphan")
    cameras = relationship("Camera", back_populates="store", cascade="all, delete-orphan")
    shelves = relationship("Shelf", back_populates="store", cascade="all, delete-orphan")


class StoreZone(Base):
    __tablename__ = "store_zones"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    name = Column(String(150), nullable=False)
    # polygon coordinates in floor-plan space, stored as JSON-encoded string
    polygon_coordinates = Column(Text, nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=dt.datetime.utcnow)

    store = relationship("Store", back_populates="zones")
