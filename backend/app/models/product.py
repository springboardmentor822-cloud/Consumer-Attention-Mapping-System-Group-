from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin

class Product(Base, UUIDMixin):
    __tablename__ = "products"

    store_id = Column(String(36), ForeignKey("stores.id"), nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    sku = Column(String(50), unique=True, nullable=False)
    price = Column(Float, nullable=False)
    attractiveness_score = Column(Float, default=0.0)

    store = relationship("Store", back_populates="products")
    product_interactions = relationship("ProductInteraction", back_populates="product", cascade="all, delete-orphan")
