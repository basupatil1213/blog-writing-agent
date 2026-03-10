"""Saved-blog CRUD business logic."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import SavedBlog


async def save_blog(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    title: str,
    topic: str,
    blog_kind: str,
    mode: str,
    needs_research: bool,
    evidence_count: int,
    section_count: int,
    content: str,
    image_urls: list[str] | None = None,
    generation_time_ms: int | None = None,
) -> SavedBlog:
    blog = SavedBlog(
        user_id=user_id,
        title=title,
        topic=topic,
        blog_kind=blog_kind,
        mode=mode,
        needs_research=needs_research,
        evidence_count=evidence_count,
        section_count=section_count,
        content=content,
        image_urls=image_urls or [],
        generation_time_ms=generation_time_ms,
    )
    db.add(blog)
    await db.commit()
    await db.refresh(blog)
    return blog


async def list_blogs(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
) -> list[SavedBlog]:
    result = await db.execute(
        select(SavedBlog)
        .where(SavedBlog.user_id == user_id)
        .order_by(SavedBlog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars())


async def get_blog(
    db: AsyncSession, blog_id: uuid.UUID, user_id: uuid.UUID
) -> SavedBlog | None:
    result = await db.execute(
        select(SavedBlog).where(
            SavedBlog.id == blog_id,
            SavedBlog.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def delete_blog(
    db: AsyncSession, blog_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    """Delete the blog and return True if it existed, False otherwise."""
    blog = await get_blog(db, blog_id, user_id)
    if blog is None:
        return False
    await db.delete(blog)
    await db.commit()
    return True
