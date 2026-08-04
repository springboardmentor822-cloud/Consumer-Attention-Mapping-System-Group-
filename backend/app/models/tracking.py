import uuid
import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime
from app.models.base import Base

class TrackingLog(Base):
    __tablename__ = "tracking_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), index=True)
    shopper_id = Column(String(50), nullable=False, index=True)
    camera_id = Column(String(36), nullable=False, index=True)
    zone_id = Column(Integer, nullable=False, index=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    gaze_facing_shelf_id = Column(String(36), nullable=True)
    dwell_time = Column(Float, default=0.0)
