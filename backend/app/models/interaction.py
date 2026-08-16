import datetime as dt

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import InteractionTypeEnum


class ProductInteraction(Base):
    __tablename__ = "product_interactions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("shopper_sessions.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    attention_event_id = Column(Integer, ForeignKey("attention_events.id"), nullable=True)

    interaction_type = Column(Enum(InteractionTypeEnum), nullable=False)
    timestamp = Column(DateTime, nullable=False)

    session = relationship("ShopperSession", back_populates="interactions")
    product = relationship("Product", back_populates="interactions")
