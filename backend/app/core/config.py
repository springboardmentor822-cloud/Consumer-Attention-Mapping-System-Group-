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

    # JWT
    JWT_SECRET_KEY: str = "change-this-in-your-env-file"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()
