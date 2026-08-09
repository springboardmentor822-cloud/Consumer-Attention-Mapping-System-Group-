from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    store_name: Mapped[str] = mapped_column(String(160), nullable=False)
    store_code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    manager_name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="Active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    shelves = relationship("Shelf", back_populates="store", cascade="all, delete-orphan")
    cameras = relationship("Camera", back_populates="store", cascade="all, delete-orphan")
    zones = relationship("Zone", back_populates="store", cascade="all, delete-orphan")