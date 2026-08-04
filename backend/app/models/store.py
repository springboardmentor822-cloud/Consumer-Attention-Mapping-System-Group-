from sqlalchemy import Column, String, Float, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class Store(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "stores"

    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    address = Column(String(255), nullable=False)
    width = Column(Float, nullable=False)
    height = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)

    shelves = relationship("Shelf", back_populates="store", cascade="all, delete-orphan")
    cameras = relationship("Camera", back_populates="store", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="store", cascade="all, delete-orphan")
    zones = relationship("Zone", back_populates="store", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="store", cascade="all, delete-orphan")
