import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class ProductInteraction(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "product_interactions"

    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    shelf_id = Column(String(36), ForeignKey("shelves.id", ondelete="CASCADE"), nullable=False)
    interaction_type = Column(String(50), nullable=False)  # view, pickup, compare, return, purchase
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), nullable=False, index=True)

    session = relationship("Session", back_populates="product_interactions")
    product = relationship("Product", back_populates="product_interactions")
    shelf = relationship("Shelf", back_populates="product_interactions")
