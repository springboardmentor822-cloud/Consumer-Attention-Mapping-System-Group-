from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ----------------------------
    # Application
    # ----------------------------
    APP_NAME: str = "Consumer Attention Mapping System"
    ENVIRONMENT: str = "development"

    # ----------------------------
    # Database
    # ----------------------------
    # Non-secret fallback only. The real connection string comes from
    # backend/.env (gitignored) - see backend/.env.example for the template.
    # Never hardcode real credentials here: this file is committed.
    DATABASE_URL: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/consumer_attention_db"
    )

    # ----------------------------
    # JWT Authentication
    # ----------------------------
    JWT_SECRET_KEY: str = "change-this-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # ----------------------------
    # CORS
    # ----------------------------
    BACKEND_CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
    )

    # ----------------------------
    # Employee attendance
    # ----------------------------
    # There is no real employee-identification mechanism connected yet (no
    # face recognition, badge/ID scan, or embeddings - see
    # app/services/employee_identification.py). With this false (the
    # default - MUST stay false in production), automatic attendance simply
    # never fires; person detection/counting elsewhere is unaffected. Set
    # true only for local demoing, to simulate realistic attendance events
    # against real registered employees without a real identification system.
    DEMO_ATTENDANCE: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )

    @property
    def cors_origins(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.BACKEND_CORS_ORIGINS.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()