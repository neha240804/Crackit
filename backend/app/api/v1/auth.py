"""Auth routes: register, login (JSON for the React app), token (form, for /docs), me."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


async def _authenticate(db: DbSession, email: str, password: str) -> User:
    user = await db.scalar(select(User).where(User.email == email.lower()))
    if user is None or not verify_password(password, user.password_hash):
        # Same message for both cases, so attackers can't probe which emails exist.
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    return user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: DbSession) -> User:
    email = body.email.lower()
    if await db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(email=email, name=body.name, password_hash=hash_password(body.password))
    db.add(user)
    await db.commit()
    return user


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: DbSession) -> TokenResponse:
    user = await _authenticate(db, body.email, body.password)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/token", response_model=TokenResponse, include_in_schema=False)
async def token(
    form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession
) -> TokenResponse:
    """Form-based login used by the Authorize button in /docs (username = email)."""
    user = await _authenticate(db, form.username, form.password)
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> User:
    return user
