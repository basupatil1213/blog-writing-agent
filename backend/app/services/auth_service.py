"""Authentication business logic."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    hash_password,
    hash_refresh_token,
    refresh_token_expiry,
    verify_password,
)
from app.db.models import RefreshToken, User


# ── User management ───────────────────────────────────────────────────────────


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, email: str, username: str, password: str) -> User:
    user = User(
        email=email.lower().strip(),
        username=username.strip(),
        hashed_password=hash_password(password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """Return the User if credentials are valid, else None."""
    user = await get_user_by_email(db, email.lower().strip())
    if user is None or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# ── Refresh token management ──────────────────────────────────────────────────


async def save_refresh_token(
    db: AsyncSession, user_id: uuid.UUID, raw_token: str
) -> RefreshToken:
    """Persist a hashed refresh token and return the record."""
    rt = RefreshToken(
        user_id=user_id,
        token_hash=hash_refresh_token(raw_token),
        expires_at=refresh_token_expiry(),
    )
    db.add(rt)
    await db.commit()
    await db.refresh(rt)
    return rt


async def rotate_refresh_token(
    db: AsyncSession, raw_token: str
) -> User | None:
    """
    Validate *raw_token*, revoke it, and return the owning User.
    Returns None if the token is invalid, expired, or already revoked.
    """
    token_hash = hash_refresh_token(raw_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    rt: RefreshToken | None = result.scalar_one_or_none()

    if rt is None or rt.revoked:
        return None
    if rt.expires_at < datetime.now(timezone.utc):
        return None

    # Revoke the used token (token rotation)
    rt.revoked = True
    await db.commit()

    user = await db.get(User, rt.user_id)
    return user


async def revoke_all_refresh_tokens(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Revoke all active refresh tokens for a user (logout)."""
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False,  # noqa: E712
        )
    )
    for rt in result.scalars():
        rt.revoked = True
    await db.commit()
