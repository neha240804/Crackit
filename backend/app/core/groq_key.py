"""Which Groq API key the current request uses: the user's own, or the shared server key.

Bring-your-own-key: each user can save their own free Groq key, so every user gets their own
free-tier quota instead of everyone sharing one (the shared key only fits ~3-4 interviews at
a time). Requests from a user with a saved key run entirely on that key: interviewer, plan,
report, prep, ATS check, resume parsing and Whisper.

How the key reaches the AI calls: a ContextVar, set once per request when the user is loaded
(api/deps.py). LLM clients are built at call time (agents/common/llm.py, services/stt.py) and
read it there. A ContextVar is per request (each request runs in its own asyncio task with
its own context) and is copied into tasks and worker threads started from it, so it reaches
LangGraph nodes too.

Why not pass the key through the LangGraph state: the interview state is checkpointed to
Postgres after every step, which would store the key in plain text.
"""

from contextvars import ContextVar

from app.core.config import settings

_user_key: ContextVar[str | None] = ContextVar("user_groq_key", default=None)


def set_user_key(key: str | None) -> None:
    _user_key.set(key)


def current_groq_key() -> str:
    return _user_key.get() or settings.groq_api_key


def using_own_key() -> bool:
    return _user_key.get() is not None


def key_hint(key: str) -> str:
    """What the app shows instead of the key: enough to recognise it, useless to anyone else."""
    return f"{key[:4]}…{key[-4:]}"
