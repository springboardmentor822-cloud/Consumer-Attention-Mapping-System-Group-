from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.base import Base

class Camera(Base):
    __tablename__ = "cameras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"))
    camera_name: Mapped[str] = mapped_column(String(100), nullable=False)
    camera_ip: Mapped[str] = mapped_column(String(80), nullable=False)
    camera_location: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Online")
    description: Mapped[str | None] = mapped_column(String(255))
    # Filename (in uploads/videos/) of the last video processed for this
    # camera - durable backing for the simulated live feed (see
    # app/ai/live_stream.py). The in-memory registration there is lost on
    # every backend restart; this column lets it self-heal instead of
    # silently reverting every camera to REPLAY until someone reprocesses it.
    last_processed_video_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    store = relationship("Store", back_populates="cameras")
    detections = relationship("Detection", back_populates="camera", cascade="all, delete-orphan")
