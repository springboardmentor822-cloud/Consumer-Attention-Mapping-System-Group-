from pydantic_settings import BaseSettings, SettingsConfigDict
from app.core.config.app import AppSettings
from app.core.config.database import DatabaseSettings
from app.core.config.redis import RedisSettings
from app.core.config.mongodb import MongoSettings
from app.core.config.security import SecuritySettings

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app: AppSettings = AppSettings()
    database: DatabaseSettings = DatabaseSettings()
    redis: RedisSettings = RedisSettings()
    mongodb: MongoSettings = MongoSettings()
    security: SecuritySettings = SecuritySettings()

    # Backward compatibility attributes for legacy references
    @property
    def PROJECT_NAME(self) -> str:
        return self.app.PROJECT_NAME

    @property
    def DATABASE_URL(self) -> str:
        return self.database.DATABASE_URL

    @property
    def REDIS_URL(self) -> str:
        return self.redis.REDIS_URL

    @property
    def MONGO_URL(self) -> str:
        return self.mongodb.MONGO_URL

    @property
    def JWT_SECRET(self) -> str:
        return self.security.JWT_SECRET

    @property
    def ACCESS_TOKEN_EXPIRE_MINUTES(self) -> int:
        return self.security.ACCESS_TOKEN_EXPIRE_MINUTES

    @property
    def ALGORITHM(self) -> str:
        return self.security.ALGORITHM

    @property
    def DEBUG(self) -> bool:
        return self.app.DEBUG

    @property
    def LOG_LEVEL(self) -> str:
        return self.app.LOG_LEVEL

    @property
    def HOST(self) -> str:
        return self.app.HOST

    @property
    def PORT(self) -> int:
        return self.app.PORT

    @property
    def CORS_ORIGINS(self) -> str:
        return self.app.CORS_ORIGINS

settings = Settings()
