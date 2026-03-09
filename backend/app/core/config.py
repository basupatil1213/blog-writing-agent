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


settings: Settings = Settings()
