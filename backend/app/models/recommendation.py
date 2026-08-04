from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class Recommendation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "recommendations"

    store_id = Column(String(36), ForeignKey("stores.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=True)
    shelf_id = Column(String(36), ForeignKey("shelves.id"), nullable=True)
    recommendation_text = Column(String(500), nullable=False)

    store = relationship("Store")
    product = relationship("Product")
    shelf = relationship("Shelf")
