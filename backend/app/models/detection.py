from datetime import datetime
from sqlalchemy import ForeignKey, Integer, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    camera_id: Mapped[int] = mapped_column(ForeignKey("cameras.id", ondelete="CASCADE"))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    people_count: Mapped[int] = mapped_column(Integer, default=0)
    attention_score: Mapped[float] = mapped_column(Float, default=0.0)

    camera = relationship("Camera", back_populates="detections")    

    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id", ondelete="SET NULL"), nullable=True)
    zone = relationship("Zone", back_populates="detections")
    