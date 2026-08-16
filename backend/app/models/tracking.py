import datetime as dt

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class TrackingData(Base):
    """
    A single tracked position sample for a shopper, produced by the
    YOLOv8 + DeepSORT/ByteTrack pipeline. High-frequency table -
    downstream aggregation (heatmaps, dwell time) is computed from this.
    """
    __tablename__ = "tracking_data"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("shopper_sessions.id"), nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("store_zones.id"), nullable=True)

    timestamp = Column(DateTime, nullable=False, index=True)

    # pixel-space bounding box from the detector
    bbox_x = Column(Float, nullable=False)
    bbox_y = Column(Float, nullable=False)
    bbox_w = Column(Float, nullable=False)
    bbox_h = Column(Float, nullable=False)
    detection_confidence = Column(Float, nullable=True)

    # floor-plan coordinates after homography projection
    floor_x = Column(Float, nullable=True)
    floor_y = Column(Float, nullable=True)

    track_id = Column(Integer, nullable=False)  # DeepSORT/ByteTrack ID within the camera stream

    session = relationship("ShopperSession", back_populates="tracking_points")
