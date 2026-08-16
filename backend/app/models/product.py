import datetime as dt

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    brand = Column(String(150), nullable=True)
    price = Column(Float, nullable=True)

    category_id = Column(Integer, ForeignKey("product_categories.id"), nullable=True)
    shelf_id = Column(Integer, ForeignKey("shelves.id"), nullable=True)

    # position of the product's facing on the shelf, JSON-encoded {x, y, w, h}
    shelf_position = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    category = relationship("ProductCategory", back_populates="products")
    shelf = relationship("Shelf", back_populates="products")
    interactions = relationship("ProductInteraction", back_populates="product")
    attractiveness_scores = relationship("ProductAttractivenessScore", back_populates="product")
