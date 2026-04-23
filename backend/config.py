from pydantic_settings import BaseSettings
from functools import lru_cache
 
 
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/recruitai"
    SECRET_KEY: str = "change-this-secret-key-in-production-minimum-32-chars!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 1 week
 
    APP_ENV: str = "development"
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
 
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
 
    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]
 
 
@lru_cache()
def get_settings() -> Settings:
    return Settings()
 
 
settings = get_settings()
 