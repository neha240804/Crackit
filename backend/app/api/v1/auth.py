"""Auth routes: register, login (JSON for the React app), token (form, for /docs), me."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.core import rate_limit
from app.core.rate_limit import per_ip
from app.core.security import create_access_token, hash_password_async, verify_password_async
from app.db.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut

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
