from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class CameraCalibration(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "camera_calibrations"

    camera_id = Column(String(36), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    src_points = Column(JSON, nullable=False)  # List of 4 points [[x,y], ...]
    dst_points = Column(JSON, nullable=False)  # List of 4 points [[x,y], ...]
    homography_matrix = Column(JSON, nullable=True)  # List of lists (3x3 matrix)

    camera = relationship("Camera")
