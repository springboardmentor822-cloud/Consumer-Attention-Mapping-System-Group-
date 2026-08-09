from pydantic import BaseModel


class VideoUploadResponse(BaseModel):
    filename: str
    stored_path: str
    size_bytes: int
    content_type: str | None = None


class VideoProcessRequest(BaseModel):
    filename: str
    camera_id: int
    zone_id: int | None = None
    frame_skip: int = 5
    max_frames: int | None = None


class VideoMetadata(BaseModel):
    fps: float
    frame_count: int
    width: int
    height: int


class VideoProcessStats(BaseModel):
    video_path: str
    camera_id: int
    zone_id: int | None
    video_metadata: VideoMetadata
    frames_processed: int
    frame_skip: int
    total_people_detections: int
    total_product_detections: int = 0
    total_shelf_detections: int = 0
    unique_products_tracked: int = 0
    unique_customers_tracked: int
    coordinate_records_generated: int
    records_saved_to_db: int


class VideoProcessResponse(BaseModel):
    message: str
    stats: VideoProcessStats
