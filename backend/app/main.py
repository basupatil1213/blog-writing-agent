"""FastAPI application entry-point."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import auth as auth_router
from app.api.v1 import blog as blog_router
from app.api.v1 import blogs as blogs_router
from app.core.config import settings
from app.schemas.api import HealthResponse

logger = logging.getLogger(__name__)


# ── Lifespan ───────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(application: FastAPI):
    # ── Database — create tables (idempotent; use Alembic for prod migrations) ─
    try:
        from app.db.base import Base, get_engine
        from app.db import models  # noqa: F401 — registers all ORM models

        async with get_engine().begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified / created")
    except Exception as exc:
        logger.warning("Database init skipped (running without DB?) — %s", exc)

    # ── Object storage ─────────────────────────────────────────────────────────
    try:
        from app.services.storage import init_storage
        init_storage()
    except Exception as exc:
        logger.warning("Storage backend init failed — %s", exc)

    # ── Local images directory (always kept for fallback) ──────────────────────
    Path(settings.images_dir).mkdir(parents=True, exist_ok=True)

    yield


# ── Application factory ────────────────────────────────────────────────────────


def create_app() -> FastAPI:
    application = FastAPI(
        title="Blog Writing Agent",
        description=(
            "AI-powered technical blog generator built with LangGraph, "
            "LangChain, OpenAI and Gemini."
        ),
        version="2.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ────────────────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Static files — generated images (local filesystem fallback) ─────────────
    images_path = Path(settings.images_dir)
    images_path.mkdir(parents=True, exist_ok=True)
    application.mount("/images", StaticFiles(directory=str(images_path)), name="images")

    # ── API routes ──────────────────────────────────────────────────────────────
    application.include_router(blog_router.router, prefix="/api/v1/blog", tags=["Blog"])
    application.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Auth"])
    application.include_router(blogs_router.router, prefix="/api/v1/blogs", tags=["Saved Blogs"])

    # ── Health check ────────────────────────────────────────────────────────────
    @application.get(
        "/api/health",
        response_model=HealthResponse,
        tags=["Health"],
        summary="Health check",
    )
    async def health() -> HealthResponse:
        return HealthResponse(status="ok")

    return application


app = create_app()
