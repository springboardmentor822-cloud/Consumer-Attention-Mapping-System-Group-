import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = BASE_DIR / "attention_mapping.db"

class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Consumer Attention Mapping System"
    
    # Security
    JWT_SECRET_KEY: str = "b24d7756f4d22da8e1548e64c39c8112574041b3152636eb01da86815cdab6bb"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # Standard local SQLite database using absolute path to avoid cwd mismatch.
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")
    
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
