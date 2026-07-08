from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[3]
ENV_FILE = BASE_DIR / ".env"


load_dotenv(ENV_FILE)


class Settings(BaseSettings):
    app_name: str = "Consumer Attention Mapping System"
    api_v1_prefix: str = "/api"
    database_url: str = Field(
        default="postgresql+psycopg2://postgres:Velan%40cs108@localhost:5432/consumer_attention_db",
        alias="DATABASE_URL",
    )
    jwt_secret_key: str = Field(default="change-me-in-production", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    default_video_source: str = Field(default="0", alias="DEFAULT_VIDEO_SOURCE")
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
