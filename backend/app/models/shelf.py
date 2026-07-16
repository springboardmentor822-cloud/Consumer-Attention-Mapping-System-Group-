from sqlalchemy import Column, String, JSON, ForeignKey, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.core.database import Base

class Shelf(Base):
    __tablename__ = "shelves"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    name = Column(String, nullable=False)
    zone_coordinates = Column(JSON, nullable=False)
    shelf_level = Column(String, nullable=True)
    category = Column(String, nullable=True)
    product_list = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)