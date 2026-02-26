"""
JobShield AI — Application Configuration
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment or defaults."""

    APP_NAME: str = "JobShield AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Ollama / LLM
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:1.5b"
    OLLAMA_TIMEOUT: int = 60  # seconds

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Upload limits
    MAX_PDF_SIZE_MB: int = 10
    MAX_TEXT_LENGTH: int = 3_000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
