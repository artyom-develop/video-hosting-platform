import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://xatube:xatube_secure_password_123@localhost:5432/xatube")
    
    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://:xatube_redis_pass_123@localhost:6379/0")
    
    # JWT
    secret_key: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = environment == "development"
    
    # RTMP
    rtmp_server_url: str = os.getenv("RTMP_SERVER_URL", "rtmp://rtmp:1935")
    
    # API
    api_prefix: str = "/api"
    api_title: str = "XaTube API"
    api_version: str = "1.0.0"
    
    # CORS
    cors_origins: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]
    cors_credentials: bool = True
    cors_methods: list = ["*"]
    cors_headers: list = ["*"]

    class Config:
        case_sensitive = False

settings = Settings()
