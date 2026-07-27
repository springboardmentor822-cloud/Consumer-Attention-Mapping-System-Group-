from datetime import datetime
from enum import Enum
from uuid import uuid4

from sqlalchemy import JSON, Boolean, DateTime, Enum as SqlEnum, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, Enum):
    administrator = "administrator"
    store_manager = "store_manager"
    retail_analyst = "retail_analyst"
    marketing_manager = "marketing_manager"


class CameraStatus(str, Enum):
    online = "online"
    warning = "warning"
    offline = "offline"


class SessionStatus(str, Enum):
    active = "active"
    completed = "completed"
    abandoned = "abandoned"


class AttentionEventType(str, Enum):
    gaze = "gaze"
    dwell = "dwell"
    pickup = "pickup"
    pass_by = "pass_by"


class TrainingStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class ModelTask(str, Enum):
    detection = "detection"
    gaze = "gaze"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), default=UserRole.store_manager, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    manager_name: Mapped[str] = mapped_column(String(120), nullable=False)
    floor_area_sqft: Mapped[int] = mapped_column(Integer, default=0)
    shopper_capacity: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    zones: Mapped[list["Zone"]] = relationship("Zone", back_populates="store", cascade="all, delete-orphan")
    shelves: Mapped[list["Shelf"]] = relationship("Shelf", back_populates="store", cascade="all, delete-orphan")
    cameras: Mapped[list["CameraFeed"]] = relationship("CameraFeed", back_populates="store", cascade="all, delete-orphan")
    shopper_sessions: Mapped[list["ShopperSession"]] = relationship(
        "ShopperSession", back_populates="store", cascade="all, delete-orphan"
    )


class UserStoreAccess(Base):
    __tablename__ = "user_store_access"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship("User")
    store: Mapped[Store] = relationship("Store")


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category_focus: Mapped[str] = mapped_column(String(120), nullable=False)
    expected_dwell_seconds: Mapped[int] = mapped_column(Integer, default=30)
    heatmap_weight: Mapped[float] = mapped_column(Float, default=1.0)

    store: Mapped[Store] = relationship("Store", back_populates="zones")
    shelves: Mapped[list["Shelf"]] = relationship("Shelf", back_populates="zone")


class Shelf(Base):
    __tablename__ = "shelves"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id"), nullable=True)
    code: Mapped[str] = mapped_column(String(40), nullable=False)
    aisle: Mapped[str] = mapped_column(String(80), nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    x_position: Mapped[int] = mapped_column(Integer, default=0)
    y_position: Mapped[int] = mapped_column(Integer, default=0)
    attention_score: Mapped[float] = mapped_column(Float, default=0)

    store: Mapped[Store] = relationship("Store", back_populates="shelves")
    zone: Mapped[Zone | None] = relationship("Zone", back_populates="shelves")
    placements: Mapped[list["ProductPlacement"]] = relationship(
        "ProductPlacement", back_populates="shelf", cascade="all, delete-orphan"
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sku: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    brand: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    dataset_source: Mapped[str] = mapped_column(String(120), default="SKU-110K")

    placements: Mapped[list["ProductPlacement"]] = relationship("ProductPlacement", back_populates="product")


class ProductPlacement(Base):
    __tablename__ = "product_placements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    shelf_id: Mapped[int] = mapped_column(ForeignKey("shelves.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    row: Mapped[int] = mapped_column(Integer, default=1)
    column: Mapped[int] = mapped_column(Integer, default=1)
    facing_count: Mapped[int] = mapped_column(Integer, default=1)
    placement_quality: Mapped[float] = mapped_column(Float, default=0)

    shelf: Mapped[Shelf] = relationship("Shelf", back_populates="placements")
    product: Mapped[Product] = relationship("Product", back_populates="placements")


class CameraFeed(Base):
    __tablename__ = "camera_feeds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(140), nullable=False)
    feed_url: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[CameraStatus] = mapped_column(SqlEnum(CameraStatus), default=CameraStatus.online, nullable=False)
    fps: Mapped[float] = mapped_column(Float, default=24)
    coverage: Mapped[str] = mapped_column(String(160), nullable=False)
    last_sync_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    store: Mapped[Store] = relationship("Store", back_populates="cameras")
    zone: Mapped[Zone | None] = relationship("Zone")


class ShopperSession(Base):
    __tablename__ = "shopper_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    anonymous_shopper_ref: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[SessionStatus] = mapped_column(SqlEnum(SessionStatus), default=SessionStatus.active, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    entry_zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id"), nullable=True)
    exit_zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id"), nullable=True)
    total_dwell_seconds: Mapped[int] = mapped_column(Integer, default=0)
    path_confidence: Mapped[float] = mapped_column(Float, default=0)

    store: Mapped[Store] = relationship("Store", back_populates="shopper_sessions")
    entry_zone: Mapped[Zone | None] = relationship("Zone", foreign_keys=[entry_zone_id])
    exit_zone: Mapped[Zone | None] = relationship("Zone", foreign_keys=[exit_zone_id])
    path_points: Mapped[list["TrackingPoint"]] = relationship(
        "TrackingPoint", back_populates="session", cascade="all, delete-orphan"
    )
    attention_events: Mapped[list["AttentionEvent"]] = relationship(
        "AttentionEvent", back_populates="session", cascade="all, delete-orphan"
    )


class TrackingPoint(Base):
    __tablename__ = "tracking_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("shopper_sessions.id"), nullable=False)
    camera_feed_id: Mapped[int | None] = mapped_column(ForeignKey("camera_feeds.id"), nullable=True)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id"), nullable=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    x_position: Mapped[float] = mapped_column(Float, default=0)
    y_position: Mapped[float] = mapped_column(Float, default=0)
    confidence: Mapped[float] = mapped_column(Float, default=0)

    session: Mapped[ShopperSession] = relationship("ShopperSession", back_populates="path_points")
    camera_feed: Mapped[CameraFeed | None] = relationship("CameraFeed")
    zone: Mapped[Zone | None] = relationship("Zone")


class AttentionEvent(Base):
    __tablename__ = "attention_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("shopper_sessions.id"), nullable=False)
    camera_feed_id: Mapped[int | None] = mapped_column(ForeignKey("camera_feeds.id"), nullable=True)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id"), nullable=True)
    shelf_id: Mapped[int | None] = mapped_column(ForeignKey("shelves.id"), nullable=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True)
    event_type: Mapped[AttentionEventType] = mapped_column(
        SqlEnum(AttentionEventType), default=AttentionEventType.dwell, nullable=False
    )
    observed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    dwell_seconds: Mapped[int] = mapped_column(Integer, default=0)
    gaze_confidence: Mapped[float] = mapped_column(Float, default=0)
    engagement_score: Mapped[float] = mapped_column(Float, default=0)

    session: Mapped[ShopperSession] = relationship("ShopperSession", back_populates="attention_events")
    camera_feed: Mapped[CameraFeed | None] = relationship("CameraFeed")
    zone: Mapped[Zone | None] = relationship("Zone")
    shelf: Mapped[Shelf | None] = relationship("Shelf")
    product: Mapped[Product | None] = relationship("Product")


class TrackingObservation(Base):
    """High-frequency, tenant-scoped tracker output.

    The timestamp is part of the primary key so this table can be converted into
    a TimescaleDB hypertable without weakening uniqueness constraints.
    """

    __tablename__ = "tracking_observations"
    __table_args__ = (
        Index("ix_tracking_observations_store_time", "store_id", "observed_at"),
        Index("ix_tracking_observations_store_tracker", "store_id", "tracker_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    observed_at: Mapped[datetime] = mapped_column(DateTime, primary_key=True, default=datetime.utcnow)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    camera_feed_id: Mapped[int] = mapped_column(ForeignKey("camera_feeds.id"), nullable=False)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id"), nullable=True)
    tracker_id: Mapped[str] = mapped_column(String(80), nullable=False)
    frame_index: Mapped[int] = mapped_column(Integer, default=0)
    x_position: Mapped[float] = mapped_column(Float, nullable=False)
    y_position: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_x1: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_y1: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_x2: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_y2: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    gaze_yaw_degrees: Mapped[float | None] = mapped_column(Float, nullable=True)
    attention_probability: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(40), default="yolo-bytetrack")

    store: Mapped[Store] = relationship("Store")
    camera_feed: Mapped[CameraFeed] = relationship("CameraFeed")
    zone: Mapped[Zone | None] = relationship("Zone")


class TrainingRun(Base):
    __tablename__ = "training_runs"
    __table_args__ = (Index("ix_training_runs_store_created", "store_id", "created_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    task: Mapped[ModelTask] = mapped_column(SqlEnum(ModelTask), default=ModelTask.detection, nullable=False)
    status: Mapped[TrainingStatus] = mapped_column(
        SqlEnum(TrainingStatus), default=TrainingStatus.queued, nullable=False
    )
    dataset_name: Mapped[str] = mapped_column(String(160), nullable=False)
    dataset_yaml: Mapped[str] = mapped_column(Text, nullable=False)
    base_model: Mapped[str] = mapped_column(String(160), default="yolov8n.pt")
    epochs: Mapped[int] = mapped_column(Integer, default=1)
    batch_size: Mapped[int] = mapped_column(Integer, default=4)
    image_size: Mapped[int] = mapped_column(Integer, default=640)
    device: Mapped[str] = mapped_column(String(40), default="cpu")
    seed: Mapped[int] = mapped_column(Integer, default=42)
    current_epoch: Mapped[int] = mapped_column(Integer, default=0)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    metrics: Mapped[dict] = mapped_column(JSON, default=dict)
    artifact_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    store: Mapped[Store] = relationship("Store")
