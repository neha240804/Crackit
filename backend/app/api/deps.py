"""Shared FastAPI dependencies.

Add `user: CurrentUser` to any route and FastAPI will:
read the `Authorization: Bearer <token>` header -> verify the JWT -> load the User,
or reply 401 before your route code runs.
"""

import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import DecryptionError, decrypt_secret
from app.core.groq_key import set_user_key
from app.core.security import decode_access_token
from app.db.models import User
from app.db.session import get_db

# tokenUrl powers the "Authorize" button in the /docs page.
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbSession, token: Annotated[str, Depends(oauth2_scheme)]
) -> User:
    user_id = decode_access_token(token)
    user = await db.get(User, user_id) if user_id else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Bring-your-own-key: every AI call in this request uses the user's own Groq key if they
    # saved one. Decrypted here, kept only in this request's memory (core/groq_key.py).
    set_user_key(None)
    if user.groq_key_encrypted:
        try:
            set_user_key(decrypt_secret(user.groq_key_encrypted, user.id))
        except DecryptionError:
            # e.g. KEY_ENCRYPTION_KEY changed: fall back to the shared key; Settings shows
            # the key as unreadable so the user can add it again.
            logger.warning("Could not decrypt the saved Groq key of user %s", user.id)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
