import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(str, enum.Enum):
    STORE_MANAGER = "store_manager"
    RETAIL_ANALYST = "retail_analyst"
    MARKETING_MANAGER = "marketing_manager"
    ADMINISTRATOR = "administrator"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.RETAIL_ANALYST)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
