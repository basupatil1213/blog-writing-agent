"""Authentication API — register, login, logout, refresh, me."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db
from app.core.security import create_access_token, generate_refresh_token
from app.db.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse
from app.services import auth_service

router = APIRouter(tags=["Auth"])

_COOKIE_KWARGS = dict(
    httponly=True,
    samesite="lax",
    secure=False,  # Set to True in production behind HTTPS
)


def _set_auth_cookies(response: Response, user_id: str, raw_refresh: str) -> None:
    response.set_cookie(
        "access_token",
        create_access_token(user_id),
        max_age=settings.access_token_expire_minutes * 60,
        **_COOKIE_KWARGS,
    )
    response.set_cookie(
        "refresh_token",
        raw_refresh,
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        **_COOKIE_KWARGS,
    )


# ── Register ──────────────────────────────────────────────────────────────────


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new account",
)
async def register(
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    if await auth_service.get_user_by_email(db, body.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    if await auth_service.get_user_by_username(db, body.username):
        raise HTTPException(status_code=409, detail="Username already taken")

    user = await auth_service.create_user(db, body.email, body.username, body.password)
    raw_refresh = generate_refresh_token()
    await auth_service.save_refresh_token(db, user.id, raw_refresh)
    _set_auth_cookies(response, str(user.id), raw_refresh)
    return UserResponse.model_validate(user)


# ── Login ─────────────────────────────────────────────────────────────────────


@router.post(
    "/login",
    response_model=UserResponse,
    summary="Log in with email and password",
)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    user = await auth_service.authenticate_user(db, body.email, body.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    raw_refresh = generate_refresh_token()
    await auth_service.save_refresh_token(db, user.id, raw_refresh)
    _set_auth_cookies(response, str(user.id), raw_refresh)
    return UserResponse.model_validate(user)


# ── Refresh ───────────────────────────────────────────────────────────────────


@router.post(
    "/refresh",
    response_model=UserResponse,
    summary="Rotate refresh token and issue a new access token",
)
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    raw = request.cookies.get("refresh_token")
    if not raw:
        raise HTTPException(status_code=401, detail="No refresh token")

    user = await auth_service.rotate_refresh_token(db, raw)
    if user is None:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="Refresh token invalid or expired")

    new_raw_refresh = generate_refresh_token()
    await auth_service.save_refresh_token(db, user.id, new_raw_refresh)
    _set_auth_cookies(response, str(user.id), new_raw_refresh)
    return UserResponse.model_validate(user)


# ── Logout ────────────────────────────────────────────────────────────────────


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke tokens and clear auth cookies",
)
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await auth_service.revoke_all_refresh_tokens(db, current_user.id)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")


# ── Me ────────────────────────────────────────────────────────────────────────


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Return the current authenticated user",
)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)
