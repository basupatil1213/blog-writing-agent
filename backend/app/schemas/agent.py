"""Pydantic models used internally by the LangGraph agent."""
from __future__ import annotations

import operator
from typing import Annotated, List, Literal, Optional

from pydantic import BaseModel, Field


# ── Blog plan building-blocks ──────────────────────────────────────────────────


class Task(BaseModel):
    id: int
    title: str
    goal: str = Field(
        ...,
        description="One sentence describing what the reader should understand after this section.",
    )
    bullets: List[str] = Field(
        ...,
        min_length=3,
        max_length=6,
        description="3-6 concrete, non-overlapping subpoints to cover.",
    )
    target_words: int = Field(..., description="Target word count for this section (120-550).")
    tags: List[str] = Field(default_factory=list)
    requires_research: bool = False
    requires_citations: bool = False
    requires_code: bool = False


class Plan(BaseModel):
    blog_title: str
    audience: str
    tone: str
    blog_kind: Literal["explainer", "tutorial", "news_roundup", "comparison", "system_design"] = (
        "explainer"
    )
    constraints: List[str] = Field(default_factory=list)
    tasks: List[Task]


# ── Research ───────────────────────────────────────────────────────────────────


class EvidenceItem(BaseModel):
    title: str
    url: str
    published_at: Optional[str] = None
    snippet: Optional[str] = None
    source: Optional[str] = None


class RouterDecision(BaseModel):
    needs_research: bool
    mode: Literal["closed_book", "hybrid", "open_book"]
    reason: str
    queries: List[str] = Field(default_factory=list)
    max_results_per_query: int = Field(5, description="How many results to fetch per query (3-8).")


class EvidencePack(BaseModel):
    evidence: List[EvidenceItem] = Field(default_factory=list)


# ── Images ────────────────────────────────────────────────────────────────────


class ImageSpec(BaseModel):
    placeholder: str = Field(..., description="e.g. [[IMAGE_1]]")
    filename: str = Field(..., description="Filename to save under images/, e.g. qkv_flow.png")
    alt: str
    caption: str
    prompt: str = Field(..., description="Prompt to send to the image model.")
    size: Literal["1024x1024", "1024x1536", "1536x1024"] = "1024x1024"
    quality: Literal["high", "medium", "low"] = "medium"


class GlobalImagePlan(BaseModel):
    md_with_placeholders: str
    images: List[ImageSpec] = Field(default_factory=list)


# ── LangGraph State ───────────────────────────────────────────────────────────


from typing import TypedDict  # noqa: E402 – placed after models to avoid circular refs


class State(TypedDict):
    topic: str

    # routing / research
    mode: str
    needs_research: bool
    queries: List[str]
    evidence: List[EvidenceItem]
    plan: Optional[Plan]

    # recency control
    as_of: str         # ISO date, e.g. "2026-01-29"
    recency_days: int  # 7 for weekly news, 30 for hybrid, etc.

    # parallel worker sections — uses operator.add to accumulate
    sections: Annotated[List[tuple[int, str]], operator.add]

    # reducer / image pipeline
    merged_md: str
    md_with_placeholders: str
    image_specs: List[dict]
    final: str
