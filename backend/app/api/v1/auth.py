"""Auth routes: register, login (JSON for the React app), token (form, for /docs), me,
and password reset (forgot-password emails a one-time link, reset-password uses it)."""

import asyncio
import logging
from datetime import UTC, datetime, timedelta
from html import escape
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.core import rate_limit
from app.core.config import settings
from app.core.rate_limit import per_ip
from app.core.security import (
    create_access_token,
    hash_password_async,
    hash_reset_token,
    new_reset_token,
    verify_password_async,
)
from app.db.models import PasswordResetToken, User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
)
from app.services import email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


async def _authenticate(db: DbSession, email: str, password: str) -> User:
    # Per account as well as per IP: guessing one person's password from many IPs is still
    # capped at 10 tries per 15 minutes.
    rate_limit.check("login-account", email.lower(), times=10, seconds=900)
    user = await db.scalar(select(User).where(User.email == email.lower()))
    if user is None or not await verify_password_async(password, user.password_hash):
        # Same message for both cases, so attackers can't probe which emails exist.
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    return user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED,
             dependencies=[per_ip("register", times=5, seconds=3600)])
async def register(body: RegisterRequest, db: DbSession) -> User:
    email = body.email.lower()
    if await db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(email=email, name=body.name, password_hash=await hash_password_async(body.password))
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        # Two sign-ups with the same email at the same moment both pass the check above; the
        # database's unique index stops the second. Answer 409 like the check does, not 500.
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered") from None
    return user


@router.post("/login", response_model=TokenResponse, dependencies=[per_ip("login", times=10, seconds=60)])
async def login(body: LoginRequest, db: DbSession) -> TokenResponse:
    user = await _authenticate(db, body.email, body.password)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/token", response_model=TokenResponse, include_in_schema=False,
             dependencies=[per_ip("login", times=10, seconds=60)])
async def token(
    form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession
) -> TokenResponse:
    """Form-based login used by the Authorize button in /docs (username = email)."""
    user = await _authenticate(db, form.username, form.password)
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> User:
    return user


# ---------------------------------------------------------------- password reset
RESET_SENT = "If an account exists for that email, we've sent a link to reset the password."
RESET_INVALID = "This reset link is invalid or has expired. Request a new one."
_email_tasks: set[asyncio.Task] = set()  # keep references so sends aren't garbage-collected


async def _send_reset_email(to: str, name: str, token: str) -> None:
    link = f"{settings.app_url.rstrip('/')}/reset-password?token={token}"
    minutes = settings.password_reset_minutes
    text = (f"Hi {name},\n\nSomeone (hopefully you) asked to reset your Crackit password. Open this "
            f"link within {minutes} minutes to choose a new one:\n\n{link}\n\nIf it wasn't you, "
            "ignore this email: your password stays the same.\n\nCrackit")
    html = (f"<p>Hi {escape(name)},</p><p>Someone (hopefully you) asked to reset your Crackit "
            f"password. This link works once, for {minutes} minutes:</p>"
            f'<p><a href="{escape(link)}">Choose a new password</a></p>'
            "<p>If it wasn't you, ignore this email: your password stays the same.</p><p>Crackit</p>")
    try:
        await email.send(to, "Reset your Crackit password", text, html)
    except Exception:
        logger.exception("Password reset email failed")  # no token or address in the log


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED,
             dependencies=[per_ip("forgot-password", times=5, seconds=3600)])
async def forgot_password(body: ForgotPasswordRequest, db: DbSession) -> dict:
    """Email a one-time reset link. The answer is the same whether or not the email has an
    account, and the email is sent after answering, so neither the message nor the response
    time tells anyone which emails are registered."""
    if settings.is_production and not email.configured():
        raise HTTPException(503, "Password reset by email isn't set up on this server yet. "
                                 "Contact the site operator.")
    address = body.email.lower()
    rate_limit.check("forgot-password-account", address, times=3, seconds=3600)
    user = await db.scalar(select(User).where(User.email == address))
    if user is not None:
        now = datetime.now(UTC)
        # One live link at a time: older unused links stop working.
        await db.execute(update(PasswordResetToken)
                         .where(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None))
                         .values(used_at=now))
        token, token_hash = new_reset_token()
        db.add(PasswordResetToken(user_id=user.id, token_hash=token_hash,
                                  expires_at=now + timedelta(minutes=settings.password_reset_minutes)))
        await db.commit()
        task = asyncio.create_task(_send_reset_email(user.email, user.name, token))
        _email_tasks.add(task)
        task.add_done_callback(_email_tasks.discard)
    return {"message": RESET_SENT}


@router.post("/reset-password", dependencies=[per_ip("reset-password", times=10, seconds=3600)])
async def reset_password(body: ResetPasswordRequest, db: DbSession) -> dict:
    """Set a new password with a reset link's token. The link works once, and every login
    from before (other devices, or an attacker's) is signed out."""
    now = datetime.now(UTC)
    row = await db.scalar(select(PasswordResetToken).where(
        PasswordResetToken.token_hash == hash_reset_token(body.token)))
    if row is None or row.used_at is not None or row.expires_at <= now:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, RESET_INVALID)
    user = await db.get(User, row.user_id)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, RESET_INVALID)
    user.password_hash = await hash_password_async(body.password)
    user.password_changed_at = now
    row.used_at = now
    await db.commit()
    return {"message": "Password changed. Log in with your new password."}
