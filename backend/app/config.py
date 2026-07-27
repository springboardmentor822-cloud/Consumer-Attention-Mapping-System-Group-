from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "Consumer Attention Mapping API"
    database_url: str = "postgresql://retail_admin:my_secret_password@localhost:5432/attention_mapping_db"
    cors_origins: list[str] = ["http://localhost:5173"]
    secret_key: str = "change-me-for-production"
    access_token_minutes: int = 240
    redis_url: str = "redis://localhost:6379/0"
    redis_stream_key: str = "attention:tracking"
    redis_consumer_group: str = "attention-api"
    tracking_batch_size: int = 100
    tracking_flush_seconds: float = 2.0
    allow_memory_stream_fallback: bool = True
    model_artifact_dir: str = "artifacts/models"
    checkout_queue_threshold: int = 8

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
