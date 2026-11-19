"""Account settings: the user's own Groq API key (bring-your-own-key).

The key is write-only from the browser's point of view:
- PUT checks it with Groq, encrypts it (AES-256-GCM, core/crypto.py) and stores only the
  ciphertext plus a short hint ("gsk_…a1b2").
- GET returns whether a key is saved and its hint, NEVER the key itself. Not even its owner
  can read it back: if someone gets into the account (or the browser is shared), they can
  use Crackit, but they can't copy the key out to use elsewhere.
- DELETE removes it.
The key is never logged and never stored in the browser.
"""

import logging
import re
from datetime import UTC, datetime

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, DbSession
from app.core.crypto import DecryptionError, decrypt_secret, encrypt_secret
from app.core.groq_key import key_hint
from app.core.http import groq_http_client
from app.core.rate_limit import per_user

router = APIRouter(prefix="/account", tags=["account"])
logger = logging.getLogger(__name__)

GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models"
KEY_PATTERN = re.compile(r"^gsk_[A-Za-z0-9]{20,200}$")


class GroqKeyIn(BaseModel):
    api_key: str = Field(min_length=10, max_length=256)


class GroqKeyStatus(BaseModel):
    saved: bool
    hint: str | None = None
    added_at: datetime | None = None
    readable: bool = True  # False if it can't be decrypted any more (encryption key changed)


def _status(user) -> GroqKeyStatus:
    if not user.groq_key_encrypted:
        return GroqKeyStatus(saved=False)
    try:
        decrypt_secret(user.groq_key_encrypted, user.id)
        readable = True
    except DecryptionError:
        readable = False
    return GroqKeyStatus(saved=True, hint=user.groq_key_hint, added_at=user.groq_key_added_at,
                         readable=readable)


async def verify_with_groq(api_key: str) -> None:
    """Ask Groq whether the key works (listing models costs no tokens), before saving it:
    a typo should fail here with a clear message, not later in the middle of an interview."""
    try:
        response = await groq_http_client().get(
            GROQ_MODELS_URL, headers={"Authorization": f"Bearer {api_key}"}, timeout=15)
    except httpx.HTTPError as exc:
        raise HTTPException(502, "Couldn't reach Groq to check the key. Try again.") from exc
    if response.status_code in (401, 403):
        raise HTTPException(400, "Groq didn't accept this key. Copy it again from "
                                 "console.groq.com/keys and paste the whole key.")
    if response.status_code != 200:
        raise HTTPException(502, f"Groq couldn't check the key right now ({response.status_code}). "
                                 "Try again in a minute.")


@router.get("/groq-key", response_model=GroqKeyStatus)
async def get_groq_key(user: CurrentUser) -> GroqKeyStatus:
    return _status(user)


@router.put("/groq-key", response_model=GroqKeyStatus,
            dependencies=[per_user("groq-key", times=5, seconds=60)])
async def save_groq_key(body: GroqKeyIn, user: CurrentUser, db: DbSession) -> GroqKeyStatus:
    api_key = body.api_key.strip()
    if not KEY_PATTERN.match(api_key):
        raise HTTPException(400, "That doesn't look like a Groq API key. Groq keys start with "
                                 "\"gsk_\": copy it from console.groq.com/keys.")
    await verify_with_groq(api_key)
    user.groq_key_encrypted = encrypt_secret(api_key, user.id)
    user.groq_key_hint = key_hint(api_key)
    user.groq_key_added_at = datetime.now(UTC)
    await db.commit()
    logger.info("User %s saved a Groq key", user.id)  # never the key itself
    return _status(user)


@router.delete("/groq-key", status_code=204)
async def delete_groq_key(user: CurrentUser, db: DbSession) -> None:
    user.groq_key_encrypted = user.groq_key_hint = user.groq_key_added_at = None
    await db.commit()
