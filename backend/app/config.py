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
    # CORS origins as comma-separated string, will be parsed
    cors_origins: str = "http://127.0.0.1:5173,http://localhost:5173"
    max_file_size_bytes: int = 100 * 1024 * 1024
    # Allowed file extensions ("*" allows all file types)
    allowed_file_extensions: tuple[str, ...] = ("*",)
    storage_dir: Path = STORAGE_DIR

    def is_file_extension_allowed(self, ext: str) -> bool:
        """Check if file extension is allowed. Empty tuple or '*' allows any extension."""
        if not self.allowed_file_extensions or "*" in self.allowed_file_extensions:
            return True
        return ext.lower() in (e.lower() for e in self.allowed_file_extensions)

    def get_cors_origins(self) -> tuple[str, ...]:
        """Parse comma-separated CORS origins string into tuple"""
        return tuple(origin.strip() for origin in self.cors_origins.split(","))


settings = Settings()
