from pydantic_settings import BaseSettings, SettingsConfigDict

class SecuritySettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    JWT_SECRET: str = "super_secret_attention_key_12345!"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"
