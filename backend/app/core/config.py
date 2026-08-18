from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database (main app data: Store, Zone, Camera, Shelf, users, etc.)
    DATABASE_URL: str = "postgresql://camsystem:camsystem@localhost:5432/camsystem"

    # NEW: TimescaleDB - separate container, separate port (5433), per
    # docker-compose.yml. Different DB entirely from DATABASE_URL above -
    # only ever used for time-series tracking coordinates, never for
    # Store/Zone/Camera/etc.
    TIMESCALE_DATABASE_URL: str = (
        "postgresql://camsystem:camsystem@localhost:5433/camsystem_timeseries"
    )

    # NEW: Redis - the Step 5 ingest queue. redis-py's default connection
    # format; db=0 is Redis's default logical database index (Redis
    # supports multiple numbered databases in one instance - 0 is fine
    # unless you have a reason to separate streams onto a different one
    # later).
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS / frontend
    # Comma-separated production frontend origins. Keep localhost as the
    # default for local development; deployment can override this in .env.
    CORS_ORIGINS: str = "http://localhost:3000"
    FRONTEND_URL: str = "http://localhost:3000"

    # Password reset email. When DEV_PASSWORD_RESET is true, the API keeps
    # returning the token directly for local testing. In production set it
    # false and provide SMTP_* settings.
    DEV_PASSWORD_RESET: bool = True
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_USE_TLS: bool = True

    # JWT
    JWT_SECRET_KEY: str = "change-this-in-your-env-file"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()
