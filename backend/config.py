from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:mansi@localhost:5432/consumer_attention"

    SECRET_KEY: str = "consumer_attention_secret_key"

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    PROJECT_NAME: str = "AI Consumer Attention Mapping System"

    API_VERSION: str = "v1"


settings = Settings()