"""Account settings: checking a user's own Groq API key (bring-your-own-key), and deleting
the account.

The server never stores the key. The browser keeps it (encrypted) and sends it with each
request in the X-Groq-Key header (api/deps.py). This module only offers a check, so a typo
fails with a clear message when the key is added, not later in the middle of an interview.
The key is never logged.
"""

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, DbSession
from app.core.groq_key import key_hint, looks_like_groq_key
from app.core.http import groq_http_client
from app.core.rate_limit import per_user
from app.core.security import verify_password_async
from app.services import account_service

router = APIRouter(prefix="/account", tags=["account"])

GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models"


class GroqKeyIn(BaseModel):
    api_key: str = Field(min_length=10, max_length=256)


class GroqKeyChecked(BaseModel):
    valid: bool
    hint: str  # "gsk_…a1b2": what the app shows instead of the key


async def verify_with_groq(api_key: str) -> None:
    """Ask Groq whether the key works (listing models costs no tokens)."""
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


@router.post("/groq-key/check", response_model=GroqKeyChecked,
             dependencies=[per_user("groq-key", times=5, seconds=60)])
async def check_groq_key(body: GroqKeyIn, user: CurrentUser) -> GroqKeyChecked:
    """Validate a key with Groq and return its hint. Nothing is stored."""
    api_key = body.api_key.strip()
    if not looks_like_groq_key(api_key):
        raise HTTPException(400, "That doesn't look like a Groq API key. Groq keys start with "
                                 "\"gsk_\": copy it from console.groq.com/keys.")
    await verify_with_groq(api_key)
    return GroqKeyChecked(valid=True, hint=key_hint(api_key))


# ---------------------------------------------------------------- delete account
class DeleteAccountIn(BaseModel):
    password: str = Field(min_length=1, max_length=256)


@router.post("/delete", status_code=204, dependencies=[per_user("account-delete", times=5, seconds=900)])
async def delete_account(body: DeleteAccountIn, user: CurrentUser, db: DbSession) -> None:
    """Delete the account and everything in it (resumes and their files, interviews, reports,
    prep data). The password is asked again: a forgotten open laptop must not be enough."""
    if not await verify_password_async(body.password, user.password_hash):
        # 400, not 401: the frontend treats 401 as "logged out" and would sign the user out.
        raise HTTPException(400, "That password isn't right.")
    await account_service.delete_account(db, user)
