import datetime as dt

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import CameraStatusEnum, CameraTypeEnum


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("store_zones.id"), nullable=True)

    name = Column(String(150), nullable=False)
    camera_type = Column(Enum(CameraTypeEnum), nullable=False, default=CameraTypeEnum.WEBCAM)
    status = Column(Enum(CameraStatusEnum), nullable=False, default=CameraStatusEnum.CONFIGURING)

    stream_url = Column(String(500), nullable=True)  # RTSP / IP camera URL
    resolution_width = Column(Integer, nullable=True)
    resolution_height = Column(Integer, nullable=True)
    fps = Column(Integer, nullable=True)

    # homography / calibration info mapping camera pixels -> floor coordinates (JSON string)
    calibration_data = Column(Text, nullable=True)

    last_heartbeat_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    store = relationship("Store", back_populates="cameras")
    shelves = relationship("Shelf", back_populates="camera")
