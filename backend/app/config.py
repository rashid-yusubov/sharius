from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Sharius Backend API"
    database_url: str
    session_ttl_minutes: int = 15
    session_cleanup_interval_seconds: int = 30
    jwt_secret: str = "change-me-for-production"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 60
    max_file_size_bytes: int = 100 * 1024 * 1024
    allowed_file_extensions: tuple[str, ...] = (
        "txt",
        "docx",
        "pdf",
        "png",
        "jpg",
        "jpeg",
    )
    storage_dir: Path = STORAGE_DIR


settings = Settings()
