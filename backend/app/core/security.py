"""Password hashing and JWT token utilities."""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


# ── Password ──────────────────────────────────────────────────────────────────


def hash_password(plain: str) -> str:
    """Hash a password using bcrypt directly (passlib 1.7.x incompatible with bcrypt 4+)."""
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── JWT access token ──────────────────────────────────────────────────────────


def create_access_token(subject: str) -> str:
    """Create a short-lived JWT access token (subject = user UUID as str)."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    return jwt.encode(
        {"sub": subject, "exp": expire},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> str:
    """Decode a JWT and return the subject (user UUID str). Raises JWTError on failure."""
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
    sub = payload.get("sub")
    if not sub:
        raise JWTError("Missing subject in token")
    return sub


# ── Refresh token ─────────────────────────────────────────────────────────────


def generate_refresh_token() -> str:
    """Generate a cryptographically secure random refresh token."""
    return secrets.token_urlsafe(64)


def hash_refresh_token(raw: str) -> str:
    """Return SHA-256 hex digest — stored in DB instead of the raw token."""
    return hashlib.sha256(raw.encode()).hexdigest()


def refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
