import os
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_title: str = "Intelligent Cybersecurity Log Analyzer"
    app_version: str = "1.0.0"
    app_description: str = "Backend for synthetic cybersecurity log analysis and threat detection."
    secret_key: str = "dev-secret-key-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    frontend_origins: str = "http://localhost:3000,http://localhost:5173"
    database_url: str = "sqlite:///./app.db"
    max_upload_size: int = 5 * 1024 * 1024
    max_records_per_upload: int = 5000
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


def allowed_origins() -> List[str]:
    return [origin.strip() for origin in settings.frontend_origins.split(",") if origin.strip()]
