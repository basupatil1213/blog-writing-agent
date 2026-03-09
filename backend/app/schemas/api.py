"""API-level request/response Pydantic schemas."""
from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class BlogGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=5, max_length=500, description="Blog topic or title.")
    as_of: Optional[str] = Field(
        default=None,
        description="ISO date string (YYYY-MM-DD) used as the knowledge cut-off. Defaults to today.",
        examples=["2026-03-08"],
    )

    def resolved_as_of(self) -> str:
        return self.as_of or date.today().isoformat()


class BlogGenerateResponse(BaseModel):
    """Returned when a blog is generated synchronously (non-streaming)."""

    title: str
    blog_kind: str
    mode: str
    needs_research: bool
    evidence_count: int
    section_count: int
    content: str  # Full markdown


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
