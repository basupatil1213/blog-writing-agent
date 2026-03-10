"""FastAPI dependency-injection helpers."""
from __future__ import annotations

import uuid
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.base import get_session_factory
from app.db.models import User


# ── Database session ──────────────────────────────────────────────────────────


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session, closing it when the request finishes."""
    factory = get_session_factory()
    async with factory() as session:
        yield session


# ── Current user ──────────────────────────────────────────────────────────────


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Read the access-token httpOnly cookie and return the authenticated User."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = request.cookies.get("access_token")
    if not token:
        raise credentials_exc

    try:
        user_id_str = decode_access_token(token)
    except JWTError:
        raise credentials_exc

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exc

    user = await db.get(User, user_uuid)
    if user is None or not user.is_active:
        raise credentials_exc

    return user
