from datetime import datetime

from pydantic import BaseModel, Field

from app.models import AttentionEventType, CameraStatus, ModelTask, SessionStatus, TrainingStatus, UserRole


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserRead"


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str
    password: str = Field(min_length=8)
    role: UserRole = UserRole.store_manager


class UserRead(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}


class StoreCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    location: str = Field(min_length=2, max_length=255)
    manager_name: str = Field(min_length=2, max_length=120)
    floor_area_sqft: int = Field(ge=100)
    shopper_capacity: int = Field(ge=1)


class ZoneCreate(BaseModel):
    name: str
    category_focus: str
    expected_dwell_seconds: int = Field(ge=1)
    heatmap_weight: float = Field(ge=0, le=5)


class ShelfCreate(BaseModel):
    store_id: int
    zone_id: int | None = None
    code: str
    aisle: str
    category: str
    x_position: int = Field(ge=0, le=100)
    y_position: int = Field(ge=0, le=100)
    attention_score: float = Field(ge=0, le=100)


class ProductCreate(BaseModel):
    sku: str
    name: str
    brand: str
    category: str
    dataset_source: str = "SKU-110K"


class ProductPlacementCreate(BaseModel):
    shelf_id: int
    product_id: int
    row: int = Field(ge=1)
    column: int = Field(ge=1)
    facing_count: int = Field(ge=1)
    placement_quality: float = Field(ge=0, le=100)


class CameraFeedCreate(BaseModel):
    store_id: int
    zone_id: int | None = None
    name: str
    feed_url: str
    status: CameraStatus = CameraStatus.online
    fps: float = Field(ge=1, le=120)
    coverage: str


class ProductRead(BaseModel):
    id: int
    sku: str
    name: str
    brand: str
    category: str
    dataset_source: str

    model_config = {"from_attributes": True}


class ProductPlacementRead(BaseModel):
    id: int
    row: int
    column: int
    facing_count: int
    placement_quality: float
    product: ProductRead

    model_config = {"from_attributes": True}


class ZoneRead(BaseModel):
    id: int
    name: str
    category_focus: str
    expected_dwell_seconds: int
    heatmap_weight: float

    model_config = {"from_attributes": True}


class ShelfRead(BaseModel):
    id: int
    code: str
    aisle: str
    category: str
    x_position: int
    y_position: int
    attention_score: float
    zone: ZoneRead | None
    placements: list[ProductPlacementRead] = []

    model_config = {"from_attributes": True}


class CameraFeedRead(BaseModel):
    id: int
    name: str
    feed_url: str
    status: CameraStatus
    fps: float
    coverage: str
    last_sync_at: datetime
    zone: ZoneRead | None

    model_config = {"from_attributes": True}


class StoreRead(BaseModel):
    id: int
    name: str
    location: str
    manager_name: str
    floor_area_sqft: int
    shopper_capacity: int
    zones: list[ZoneRead] = []
    shelves: list[ShelfRead] = []
    cameras: list[CameraFeedRead] = []

    model_config = {"from_attributes": True}


class WorkflowItem(BaseModel):
    stage: str
    status: str
    owner_role: UserRole
    outcome: str


class DatasetMapping(BaseModel):
    dataset: str
    purpose: str
    milestone_1_use: str


class ShopperSessionCreate(BaseModel):
    store_id: int
    anonymous_shopper_ref: str
    status: SessionStatus = SessionStatus.active
    entry_zone_id: int | None = None
    exit_zone_id: int | None = None
    total_dwell_seconds: int = Field(default=0, ge=0)
    path_confidence: float = Field(default=0, ge=0, le=1)


class ShopperSessionClose(BaseModel):
    exit_zone_id: int | None = None
    status: SessionStatus = SessionStatus.completed
    ended_at: datetime = Field(default_factory=datetime.utcnow)


class TrackingPointCreate(BaseModel):
    session_id: int
    camera_feed_id: int | None = None
    zone_id: int | None = None
    x_position: float = Field(ge=0, le=100)
    y_position: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=1)


class AttentionEventCreate(BaseModel):
    session_id: int
    camera_feed_id: int | None = None
    zone_id: int | None = None
    shelf_id: int | None = None
    product_id: int | None = None
    event_type: AttentionEventType = AttentionEventType.dwell
    dwell_seconds: int = Field(ge=0)
    gaze_confidence: float = Field(ge=0, le=1)
    engagement_score: float = Field(ge=0, le=100)


class TrackingPointRead(BaseModel):
    id: int
    observed_at: datetime
    x_position: float
    y_position: float
    confidence: float
    zone: ZoneRead | None

    model_config = {"from_attributes": True}


class AttentionEventRead(BaseModel):
    id: int
    event_type: AttentionEventType
    observed_at: datetime
    dwell_seconds: int
    gaze_confidence: float
    engagement_score: float
    zone: ZoneRead | None
    shelf: ShelfRead | None
    product: ProductRead | None

    model_config = {"from_attributes": True}


class ShopperSessionRead(BaseModel):
    id: int
    store_id: int
    anonymous_shopper_ref: str
    status: SessionStatus
    started_at: datetime
    ended_at: datetime | None
    total_dwell_seconds: int
    path_confidence: float
    entry_zone: ZoneRead | None
    exit_zone: ZoneRead | None
    path_points: list[TrackingPointRead] = []
    attention_events: list[AttentionEventRead] = []

    model_config = {"from_attributes": True}


class ZoneAttentionSummary(BaseModel):
    zone: str
    shopper_visits: int
    total_dwell_seconds: int
    average_engagement: float


class Milestone2Summary(BaseModel):
    shopper_sessions: int
    active_sessions: int
    tracking_points: int
    attention_events: int
    average_dwell_seconds: float
    average_gaze_confidence: float
    top_zone: str


class TrackingObservationCreate(BaseModel):
    tracker_id: str = Field(min_length=1, max_length=80)
    camera_feed_id: int
    zone_id: int | None = None
    observed_at: datetime = Field(default_factory=datetime.utcnow)
    frame_index: int = Field(default=0, ge=0)
    x_position: float = Field(ge=0, le=100)
    y_position: float = Field(ge=0, le=100)
    bbox_x1: float = Field(ge=0)
    bbox_y1: float = Field(ge=0)
    bbox_x2: float = Field(ge=0)
    bbox_y2: float = Field(ge=0)
    confidence: float = Field(ge=0, le=1)
    gaze_yaw_degrees: float | None = Field(default=None, ge=-180, le=180)
    attention_probability: float | None = Field(default=None, ge=0, le=1)
    source: str = Field(default="yolo-bytetrack", max_length=40)


class TrackingIngestBatch(BaseModel):
    store_id: int
    observations: list[TrackingObservationCreate] = Field(min_length=1, max_length=1000)


class TrackingIngestResponse(BaseModel):
    store_id: int
    accepted: int
    stream_backend: str
    message_ids: list[str]


class TrackingObservationRead(TrackingObservationCreate):
    id: str
    store_id: int

    model_config = {"from_attributes": True}


class HeatmapPoint(BaseModel):
    x: float
    y: float
    value: float
    samples: int


class HeatmapResponse(BaseModel):
    store_id: int
    generated_at: datetime
    window_minutes: int
    max_value: float
    total_samples: int
    points: list[HeatmapPoint]


class StreamStatus(BaseModel):
    store_id: int
    backend: str
    pending_messages: int
    persisted_observations: int
    connected_clients: int
    worker_running: bool
    last_error: str | None = None


class CheckoutQueueStatus(BaseModel):
    store_id: int
    zone_id: int
    zone_name: str
    queue_length: int
    threshold: int
    bottleneck_alert: bool
    active_window_seconds: int


class ShelfPlaneInput(BaseModel):
    shelf_id: int
    product_id: int | None = None
    center: tuple[float, float, float]
    normal: tuple[float, float, float]
    up: tuple[float, float, float]
    width: float = Field(gt=0)
    height: float = Field(gt=0)


class GazeEstimateRequest(BaseModel):
    store_id: int
    camera_feed_id: int
    shopper_ref: str = Field(min_length=1, max_length=80)
    yaw_degrees: float = Field(ge=-180, le=180)
    pitch_degrees: float = Field(ge=-90, le=90)
    roll_degrees: float = Field(default=0, ge=-180, le=180)
    head_pose_confidence: float = Field(default=1, ge=0, le=1)
    ray_origin: tuple[float, float, float]
    shelf_planes: list[ShelfPlaneInput] = Field(min_length=1, max_length=200)
    max_distance: float | None = Field(default=None, gt=0)
    margin: float = Field(default=0, ge=0)


class GazeHitRead(BaseModel):
    shelf_id: int
    product_id: int | None
    point: tuple[float, float, float]
    distance: float
    incidence: float
    horizontal_offset: float
    vertical_offset: float
    confidence: float


class GazeEstimateResponse(BaseModel):
    store_id: int
    shopper_ref: str
    ray_direction: tuple[float, float, float]
    hit: GazeHitRead | None


class TrainingRunCreate(BaseModel):
    store_id: int
    task: ModelTask = ModelTask.detection
    dataset_name: str = Field(min_length=1, max_length=160)
    dataset_yaml: str = Field(min_length=1)
    base_model: str = Field(default="yolov8n.pt", min_length=1, max_length=160)
    epochs: int = Field(default=1, ge=1, le=500)
    batch_size: int = Field(default=4, ge=1, le=256)
    image_size: int = Field(default=640, ge=128, le=2048)
    device: str = Field(default="cpu", max_length=40)
    seed: int = Field(default=42, ge=0)
    workers: int = Field(default=0, ge=0, le=32)
    freeze: int | None = Field(default=None, ge=0)
    smoke: bool = False
    validate_dataset: bool = True


class TrainingRunRead(BaseModel):
    id: str
    store_id: int
    task: ModelTask
    status: TrainingStatus
    dataset_name: str
    dataset_yaml: str
    base_model: str
    epochs: int
    batch_size: int
    image_size: int
    device: str
    seed: int
    current_epoch: int
    config: dict
    metrics: dict
    artifact_path: str | None
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class ShopperTrajectoryRequest(BaseModel):
    store_id: int
    shopper_id: str
    points: list[tuple[float, float]]
    timestamps: list[float] = []
    pickup_count: int = Field(default=0, ge=0)
    purchase_count: int = Field(default=0, ge=0)
    distinct_zones_visited: int = Field(default=1, ge=1)


class ShopperTrajectoryResponse(BaseModel):
    store_id: int
    shopper_id: str
    total_path_distance: float
    avg_movement_velocity: float
    total_dwell_seconds: float
    segment: str
    smoothed_points: list[tuple[float, float]]


class HomographyCalibrationRequest(BaseModel):
    src_camera_points: list[tuple[float, float]] = Field(min_length=4)
    dst_planogram_points: list[tuple[float, float]] = Field(min_length=4)


class HomographyCalibrationResponse(BaseModel):
    success: bool
    homography_matrix: list[list[float]]


class AttractivenessCalculateRequest(BaseModel):
    store_id: int
    product_sku: str
    product_name: str
    category: str
    shelf_location: str = "Shelf A"
    attention_duration_seconds: float = Field(ge=0)
    interaction_count: int = Field(ge=0)
    pickup_rate: float = Field(ge=0, le=1)
    purchase_conversion_rate: float = Field(ge=0, le=1)
    repeat_engagement_rate: float = Field(ge=0, le=1)


class AttractivenessScoreResponse(BaseModel):
    store_id: int
    product_sku: str
    product_name: str
    category: str
    shelf_location: str
    attention_duration_seconds: float
    interaction_count: int
    pickup_rate: float
    purchase_conversion_rate: float
    repeat_engagement_rate: float
    normalized_attention: float
    normalized_interaction: float
    normalized_pickup: float
    normalized_conversion: float
    normalized_repeat: float
    attractiveness_score: float

    model_config = {"from_attributes": True}


class OptimizationRecommendationResponse(BaseModel):
    id: str
    store_id: int
    target_sku: str
    product_name: str
    priority_level: str
    rule_type: str
    action_item: str
    expected_conversion_uplift: str
    status: str

    model_config = {"from_attributes": True}


TokenResponse.model_rebuild()

