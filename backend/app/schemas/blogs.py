"""Pydantic schemas for saved-blog endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class SaveBlogRequest(BaseModel):
    title: str
    topic: str
    blog_kind: str
    mode: str
    needs_research: bool = False
    evidence_count: int = 0
    section_count: int = 0
    content: str
    image_urls: List[str] = []
    generation_time_ms: Optional[int] = None


class SavedBlogSummary(BaseModel):
    """Lightweight representation for list view (no content)."""
    id: uuid.UUID
    title: str
    topic: str
    blog_kind: str
    mode: str
    needs_research: bool
    evidence_count: int
    section_count: int
    generation_time_ms: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SavedBlogResponse(SavedBlogSummary):
    """Full representation including markdown content."""
    content: str
    image_urls: List[str]
