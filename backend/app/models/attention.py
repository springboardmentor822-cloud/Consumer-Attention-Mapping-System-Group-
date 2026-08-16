import datetime as dt

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class AttentionEvent(Base):
    """
    A window of sustained visual attention toward a shelf/product, derived
    from head-pose + gaze estimation (MediaPipe Face Mesh). Note: gaze-to-
    product mapping is an approximation based on head orientation and
    camera calibration, not eye-tracking-grade precision.
    """
    __tablename__ = "attention_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("shopper_sessions.id"), nullable=False)
    shelf_id = Column(Integer, ForeignKey("shelves.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)

    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)

    head_pose_yaw = Column(Float, nullable=True)
    head_pose_pitch = Column(Float, nullable=True)
    head_pose_roll = Column(Float, nullable=True)
    gaze_vector_x = Column(Float, nullable=True)
    gaze_vector_y = Column(Float, nullable=True)

    is_repeat_attention = Column(Integer, default=0)  # count of prior look-backs in same session

    session = relationship("ShopperSession", back_populates="attention_events")
