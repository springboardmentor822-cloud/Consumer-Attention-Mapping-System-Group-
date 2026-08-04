from pydantic_settings import BaseSettings, SettingsConfigDict

class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Consumer Attention Mapping System"
    ENABLE_GAZE: bool = True
    ENABLE_RECOMMENDATIONS: bool = True
    ENABLE_NOTIFICATIONS: bool = True
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: str = "*"
