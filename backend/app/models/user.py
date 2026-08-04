from sqlalchemy import Column, String, Boolean, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin

class User(Base, UUIDMixin):
    __tablename__ = "users"

    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)

    role = relationship("Role", back_populates="users")
