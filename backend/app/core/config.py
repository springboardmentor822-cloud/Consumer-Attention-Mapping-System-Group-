"""
Central application configuration.
All values are overridable via environment variables / .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- General ---
    PROJECT_NAME: str = "Consumer Attention Mapping System"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # --- Database ---
    DATABASE_URL: str = (
        "postgresql+psycopg2://attention_user:attention_pass@db:5432/attention_mapping"
    )

    # --- Security / JWT ---
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_SECRET_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24

    # --- Data retention (privacy) ---
    # How long raw tracking positions and attention/gaze events are kept
    # before automatic deletion. Aggregate records (sessions, purchases,
    # scores) are NOT covered by this - only the raw positional data that
    # could be used to reconstruct where a specific person was.
    TRACKING_DATA_RETENTION_DAYS: int = 30

    # --- OAuth2 (Google) - optional third-party login ---
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/oauth/google/callback"

    # --- CORS ---
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
    ]

    # --- Rate limiting ---
    RATE_LIMIT_DEFAULT: str = "100/minute"

    # --- Redis (tracking ingestion queue + live occupancy state) ---
    # Redis Streams sits between the (simulated or real) camera/tracker
    # pipeline and Postgres: the pipeline pushes raw points here instantly
    # and moves on to the next frame; a background consumer drains the
    # stream, batches rows, and bulk-writes to `tracking_data` - see
    # app/services/tracking_consumer.py for why this matters at 30fps.
    REDIS_URL: str = "redis://redis:6379/0"

    # --- Live camera wall (Store Manager "Live Cameras" panel) ---
    # Path to the JSON file describing the 8 camera feeds (id, display name,
    # video source). Source can be a local file path (sample footage, used
    # as a stand-in when no physical camera is wired up yet), an RTSP URL
    # (rtsp://...), or an HTTP(S) MJPEG/video URL - anything cv2.VideoCapture
    # can open. Swap this file (or point LIVE_CAMERAS_CONFIG_PATH at a real
    # one) to wire in actual CCTV/IP cameras without touching any code.
    LIVE_CAMERAS_CONFIG_PATH: str = "app/config/live_cameras.json"
    # How often (seconds) each camera worker retries opening its source
    # after a failed/dropped connection - the "automatic reconnect" behavior.
    LIVE_CAMERA_RECONNECT_SECONDS: float = 5.0
    # Cap on the MJPEG stream's frame rate (per client). Keeps CPU/bandwidth
    # bounded regardless of how many browser tabs are watching a feed.
    LIVE_CAMERA_STREAM_FPS: float = 12.0
    # Run YOLO person-detection on every Nth captured frame (still redrawn
    # every frame using the last known boxes) - full-frame YOLO on 8
    # simultaneous CPU streams would be far slower than real time otherwise.
    LIVE_CAMERA_DETECT_EVERY_N_FRAMES: int = 3

    # --- Email (stubbed by default; wire to real SMTP/SES in production) ---
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "no-reply@attention-mapping.local"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
