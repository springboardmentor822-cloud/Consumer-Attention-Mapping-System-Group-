from pydantic_settings import BaseSettings

class MLConfig(BaseSettings):
    YOLO_MODEL_PATH: str = "datasets/weights/yolov8n.pt"
    DETECTION_CONFIDENCE: float = 0.25
    TRACKER_MATCH_THRESHOLD: float = 0.7
    INFERENCE_FPS: int = 5
    FRAME_WIDTH: int = 1920
    FRAME_HEIGHT: int = 1080
    DEVICE: str = "cpu"  # cpu, cuda, or mps

ml_settings = MLConfig()
