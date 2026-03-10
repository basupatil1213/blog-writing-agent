from __future__ import annotations

from pathlib import Path
from typing import List

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Root of the repository (blog-writing-agent/)
_REPO_ROOT = Path(__file__).resolve().parents[3]

# Default images directory lives inside the backend folder
_DEFAULT_IMAGES_DIR = str(Path(__file__).resolve().parents[2] / "images")

# Explicitly load .env into os.environ before pydantic-settings reads it.
# override=False means already-set shell variables take precedence over .env.
load_dotenv(dotenv_path=_REPO_ROOT / ".env", override=False)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        extra="ignore",
    )

    # ── LLM ──────────────────────────────────────────────────────────────────
    openai_api_key: str = Field(default="", validation_alias="OPENAI_API_KEY")
    openai_model_name: str = Field(default="gpt-4o", validation_alias="OPENAI_MODEL_NAME")

    # ── Search ────────────────────────────────────────────────────────────────
    tavily_api_key: str = Field(default="", validation_alias="TAVILY_API_KEY")

    # ── Images ────────────────────────────────────────────────────────────────
    google_api_key: str = Field(default="", validation_alias="GOOGLE_API_KEY")
    images_dir: str = Field(default=_DEFAULT_IMAGES_DIR, validation_alias="IMAGES_DIR")

    # ── Server ────────────────────────────────────────────────────────────────
    debug: bool = Field(default=False, validation_alias="DEBUG")
    cors_origins: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
        validation_alias="CORS_ORIGINS",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres_password@localhost:5432/blog_agent",
        validation_alias="DATABASE_URL",
    )

    # ── JWT ───────────────────────────────────────────────────────────────────
    jwt_secret_key: str = Field(
        default="CHANGE_ME_IN_PRODUCTION_use_openssl_rand_hex_32",
        validation_alias="JWT_SECRET_KEY",
    )
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, validation_alias="REFRESH_TOKEN_EXPIRE_DAYS")

    # ── MinIO / S3 (optional — falls back to local filesystem when unset) ─────
    minio_endpoint: str = Field(default="", validation_alias="MINIO_ENDPOINT")
    minio_access_key: str = Field(default="minioadmin", validation_alias="MINIO_ACCESS_KEY")
    minio_secret_key: str = Field(default="minioadmin123", validation_alias="MINIO_SECRET_KEY")
    minio_bucket: str = Field(default="blog-images", validation_alias="MINIO_BUCKET")
    minio_secure: bool = Field(default=False, validation_alias="MINIO_SECURE")
    # Public base URL for serving MinIO objects (e.g. http://localhost:9000)
    minio_public_url: str = Field(default="", validation_alias="MINIO_PUBLIC_URL")


settings: Settings = Settings()
