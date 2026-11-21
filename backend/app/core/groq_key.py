"""The Groq API key of the current request: always the user's own (bring-your-own-key only).

Product decision (Nov 2026): Crackit has no shared server key and no free daily allowance.
Every AI feature (interviewer, plan, report, prep, ATS check, resume parsing, Whisper) runs on
the user's own free Groq key. Before, users without a key shared one server key with small
daily limits (a `usage_counters` table, dropped in migration `b7c1d2e3f4a5`); the shared key
only fitted ~3-4 interviews at a time.

Where the key lives: ONLY in the user's browser (encrypted there, see the frontend's
features/account/groqKey.ts). It arrives with each request in the X-Groq-Key header (HTTPS in
production) and is never written to the database, logs or traces.

How the key reaches the AI calls: a ContextVar, set once per request when the user is loaded
(api/deps.py). LLM clients are built at call time (agents/common/llm.py, services/stt.py) and
read it there. A ContextVar is per request (each request runs in its own asyncio task with
its own context) and is copied into tasks and worker threads started from it, so it reaches
LangGraph nodes too.

Why not pass the key through the LangGraph state: the interview state is checkpointed to
Postgres after every step, which would store the key.
"""

import re
from contextvars import ContextVar

from fastapi import HTTPException

_user_key: ContextVar[str | None] = ContextVar("user_groq_key", default=None)

KEY_PATTERN = re.compile(r"^gsk_[A-Za-z0-9]{20,200}$")

# 428 Precondition Required: the request is fine, the account isn't set up yet. Not 401 (the
# frontend logs out on 401) and not 403 (nothing is forbidden). The frontend checks for 428 to
# show "Add your key" with a link to Settings.
KEY_REQUIRED_STATUS = 428
KEY_REQUIRED = ("Add your free Groq API key in Settings to use Crackit's AI features. "
                "It takes two minutes and is kept only in your browser.")


class GroqKeyMissing(HTTPException):
    def __init__(self) -> None:
        super().__init__(KEY_REQUIRED_STATUS, KEY_REQUIRED)


def looks_like_groq_key(key: str) -> bool:
    return bool(KEY_PATTERN.match(key))


def set_user_key(key: str | None) -> None:
    _user_key.set(key)


def current_groq_key() -> str:
    """The user's key. Routes that use AI check for it up front (`require_groq_key` in
    api/deps.py); raising here too means no AI call can ever run without one."""
    key = _user_key.get()
    if not key:
        raise GroqKeyMissing()
    return key


def has_user_key() -> bool:
    return _user_key.get() is not None


def key_hint(key: str) -> str:
    """What the app shows instead of the key: enough to recognise it, useless to anyone else."""
    return f"{key[:4]}…{key[-4:]}"
