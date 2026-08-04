from sqlalchemy import Column, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class Shelf(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "shelves"

    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    width = Column(Float, nullable=False)
    height = Column(Float, nullable=False)

    store = relationship("Store", back_populates="shelves")
    product_interactions = relationship("ProductInteraction", back_populates="shelf", cascade="all, delete-orphan")
