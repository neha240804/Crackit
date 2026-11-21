"""Shared FastAPI dependencies.

Add `user: CurrentUser` to any route and FastAPI will:
read the `Authorization: Bearer <token>` header -> verify the JWT -> load the User,
or reply 401 before your route code runs.
"""

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.groq_key import GroqKeyMissing, has_user_key, looks_like_groq_key, set_user_key
from app.core.security import decode_access_claims
from app.db.models import User
from app.db.session import get_db

# tokenUrl powers the "Authorize" button in the /docs page.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbSession,
    token: Annotated[str, Depends(oauth2_scheme)],
    x_groq_key: Annotated[str | None, Header()] = None,
) -> User:
    claims = decode_access_claims(token)
    user = await db.get(User, claims[0]) if claims else None
    # A password change (reset) signs out every token issued before it. JWT times are whole
    # seconds, so compare whole seconds: a login in the same second as the reset still works.
    if (user is not None and user.password_changed_at is not None and claims is not None
            and claims[1] < int(user.password_changed_at.timestamp())):
        user = None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Bring-your-own-key: the user's own Groq key is never stored on the server. Their browser
    # keeps it (encrypted) and sends it in the X-Groq-Key header; it lives only in this
    # request's memory (core/groq_key.py) and every AI call of the request uses it. A missing
    # or malformed header means no key: AI routes then answer 428 (see require_groq_key).
    key = (x_groq_key or "").strip()
    set_user_key(key if looks_like_groq_key(key) else None)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_groq_key(user: CurrentUser) -> User:
    """Route dependency for everything that calls Groq: refuse at once, before any work,
    when the request carries no key (bring-your-own-key only, no shared server key).
    Depends on CurrentUser so the key header has been read first."""
    if not has_user_key():
        raise GroqKeyMissing()
    return user


# Use instead of CurrentUser on AI routes: `user: KeyedUser`.
KeyedUser = Annotated[User, Depends(require_groq_key)]
