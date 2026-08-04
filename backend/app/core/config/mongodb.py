from pydantic_settings import BaseSettings

class MongoSettings(BaseSettings):
    MONGO_URL: str = "mongodb://localhost:27017/attention_analytics"
