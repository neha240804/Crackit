"""Password hashing and JWT tokens.

- Passwords are never stored. We store a bcrypt hash: slow on purpose, salted, one-way.
- After login the client gets a JWT: a signed token holding the user id ("sub") and an
  expiry ("exp"). The server verifies the signature on each request, so no session table.
"""

import asyncio
import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings

ALGORITHM = "HS256"


# bcrypt only uses the first 72 bytes, and bcrypt 5 raises ValueError beyond that (an
# 80-character password once crashed /register with a 500). The schema enforces this limit.
MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    if len(password.encode()) > MAX_PASSWORD_BYTES:  # can't match a stored hash; don't crash
        return False
    return bcrypt.checkpw(password.encode(), password_hash.encode())


# bcrypt is slow ON PURPOSE (~200 ms of CPU here). Called directly inside an async route it
# froze the whole event loop: measured, 20 simultaneous logins took 6.7 s and an unrelated
# request waited 6.65 s behind them. The async versions run it in a worker thread instead
# (bcrypt releases the GIL, so threads really run in parallel).
async def hash_password_async(password: str) -> str:
    return await asyncio.to_thread(hash_password, password)


async def verify_password_async(password: str, password_hash: str) -> bool:
    return await asyncio.to_thread(verify_password, password, password_hash)


def create_access_token(user_id: uuid.UUID) -> str:
    now = datetime.now(UTC)
    expires = now + timedelta(minutes=settings.access_token_expire_minutes)
    # iat (issued at): lets a password reset refuse every token issued before it (deps.py).
    payload = {"sub": str(user_id), "exp": expires, "iat": now}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> uuid.UUID | None:
    """Return the user id, or None if the token is invalid or expired."""
    claims = decode_access_claims(token)
    return claims[0] if claims else None


def decode_access_claims(token: str) -> tuple[uuid.UUID, float] | None:
    """(user id, issued-at as a Unix time; 0 for tokens from before iat was added), or None."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return uuid.UUID(payload["sub"]), float(payload.get("iat", 0))
    except (jwt.PyJWTError, KeyError, ValueError, TypeError):
        return None


def new_reset_token() -> tuple[str, str]:
    """(token for the emailed link, its SHA-256 for the database). 256 bits of randomness."""
    token = secrets.token_urlsafe(32)
    return token, hash_reset_token(token)


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
