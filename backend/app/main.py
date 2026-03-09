"""FastAPI application entry-point."""
from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import blog as blog_router
from app.core.config import settings
from app.schemas.api import HealthResponse


# ── Lifespan ──────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Create the images directory on startup."""
    Path(settings.images_dir).mkdir(parents=True, exist_ok=True)
    yield


# ── Application factory ───────────────────────────────────────────────────────


def create_app() -> FastAPI:
    application = FastAPI(
        title="Blog Writing Agent",
        description=(
            "AI-powered technical blog generator built with LangGraph, "
            "LangChain, OpenAI and Gemini."
        ),
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Static files – generated images ───────────────────────────────────────
    images_path = Path(settings.images_dir)
    images_path.mkdir(parents=True, exist_ok=True)
    application.mount("/images", StaticFiles(directory=str(images_path)), name="images")

    # ── API routes ────────────────────────────────────────────────────────────
    application.include_router(
        blog_router.router,
        prefix="/api/v1/blog",
        tags=["Blog"],
    )

    # ── Health check ──────────────────────────────────────────────────────────
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
