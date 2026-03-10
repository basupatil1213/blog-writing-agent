"""Saved-blog CRUD API — list, save, get, delete."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.db.models import User
from app.schemas.blogs import SaveBlogRequest, SavedBlogResponse, SavedBlogSummary
from app.services import blogs_service

router = APIRouter(tags=["Saved Blogs"])


# ── Save ──────────────────────────────────────────────────────────────────────


@router.post(
    "/",
    response_model=SavedBlogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a generated blog post",
)
async def save_blog(
    body: SaveBlogRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavedBlogResponse:
    blog = await blogs_service.save_blog(
        db,
        user_id=current_user.id,
        title=body.title,
        topic=body.topic,
        blog_kind=body.blog_kind,
        mode=body.mode,
        needs_research=body.needs_research,
        evidence_count=body.evidence_count,
        section_count=body.section_count,
        content=body.content,
        image_urls=body.image_urls,
        generation_time_ms=body.generation_time_ms,
    )
    return SavedBlogResponse.model_validate(blog)


# ── List ──────────────────────────────────────────────────────────────────────


@router.get(
    "/",
    response_model=list[SavedBlogSummary],
    summary="List saved blog posts (most recent first)",
)
async def list_blogs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SavedBlogSummary]:
    blogs = await blogs_service.list_blogs(db, current_user.id, limit=limit, offset=offset)
    return [SavedBlogSummary.model_validate(b) for b in blogs]


# ── Get ───────────────────────────────────────────────────────────────────────


@router.get(
    "/{blog_id}",
    response_model=SavedBlogResponse,
    summary="Fetch a single saved blog post",
)
async def get_blog(
    blog_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavedBlogResponse:
    blog = await blogs_service.get_blog(db, blog_id, current_user.id)
    if blog is None:
        raise HTTPException(status_code=404, detail="Blog not found")
    return SavedBlogResponse.model_validate(blog)


# ── Delete ────────────────────────────────────────────────────────────────────


@router.delete(
    "/{blog_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a saved blog post",
)
async def delete_blog(
    blog_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    deleted = await blogs_service.delete_blog(db, blog_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Blog not found")
