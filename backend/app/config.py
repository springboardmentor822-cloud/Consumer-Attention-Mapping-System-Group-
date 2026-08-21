import os

class Settings:
    PROJECT_NAME: str = "AI Consumer Attention Mapping & Retail Intelligence Platform"
    VERSION: str = "3.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-ai-retail-intelligence-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    # PostgreSQL as primary default URL, configurable via DATABASE_URL env var
    POSTGRES_URL: str = "postgresql://postgres:postgres@localhost:5432/mydatabase"
    SQLITE_URL: str = "sqlite:///./retail_intelligence.db"
    
    @property
    def DATABASE_URL(self) -> str:
        env_url = os.getenv("DATABASE_URL")
        if env_url:
            return env_url
        return self.POSTGRES_URL

settings = Settings()
