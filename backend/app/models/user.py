from sqlalchemy import Column, String, Boolean, DateTime, Integer
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="analyst")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)