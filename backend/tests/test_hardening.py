"""Tests for the production-hardening fixes (audit phase 1): password limits, production
settings guard, request size limits. Pure unit tests: no database or network needed."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.core.security import hash_password, verify_password, verify_password_async
from app.schemas.auth import RegisterRequest
from app.schemas.interview import InterviewConfig
from app.schemas.prep import PrepRequest

STRONG_KEY = "x" * 40


# ---------------------------------------------------------------- passwords
def test_register_rejects_password_over_72_bytes():
    # bcrypt 5 raises on > 72 bytes; this used to surface as a 500 from /register.
    with pytest.raises(ValidationError, match="too long"):
        RegisterRequest(email="a@example.com", name="A", password="a" * 73)
    # The limit is in bytes: 19 four-byte emoji = 76 bytes, although only 19 characters.
    with pytest.raises(ValidationError, match="too long"):
        RegisterRequest(email="a@example.com", name="A", password="😀" * 19)
    RegisterRequest(email="a@example.com", name="A", password="a" * 72)  # exactly 72 is fine


def test_verify_long_password_returns_false_instead_of_crashing():
    stored = hash_password("correct-horse")
    assert verify_password("x" * 200, stored) is False


async def test_async_password_check_matches_sync():
    stored = hash_password("correct-horse")
    assert await verify_password_async("correct-horse", stored) is True
    assert await verify_password_async("wrong-horse", stored) is False


# ---------------------------------------------------------------- production settings
def _prod(**overrides) -> Settings:
    values = {"app_env": "production", "secret_key": STRONG_KEY, "postgres_password": "s3cret-pw",
              "cors_origins": "https://crackit.example.com"}
    values.update(overrides)
    # _env_file=None: test only these values, never the developer's real .env
    return Settings(_env_file=None, **values)


def test_production_accepts_safe_settings():
    s = _prod()
    assert s.is_production and s.cors_origin_list == ["https://crackit.example.com"]


@pytest.mark.parametrize("override, message", [
    ({"secret_key": "change-me"}, "SECRET_KEY"),
    ({"secret_key": "short"}, "SECRET_KEY"),
    ({"postgres_password": "mockinterview"}, "POSTGRES_PASSWORD"),
    ({"cors_origins": "http://localhost:5174"}, "CORS_ORIGINS"),
    ({"cors_origins": "*"}, "CORS_ORIGINS"),
])
def test_production_refuses_unsafe_settings(override, message):
    with pytest.raises(ValidationError, match=message):
        _prod(**override)


def test_refusal_does_not_print_secrets():
    # The error ends up in container logs; pydantic used to append the whole input dict.
    with pytest.raises(ValidationError) as err:
        _prod(cors_origins="*")
    text = str(err.value)
    assert STRONG_KEY not in text and "s3cret-pw" not in text and "gsk_test" not in text


def test_development_keeps_working_with_defaults():
    s = Settings(_env_file=None, app_env="development", secret_key="change-me")
    assert not s.is_production


def test_cors_origins_parse_comma_list():
    s = Settings(_env_file=None, cors_origins=" https://a.example.com , https://b.example.com ,")
    assert s.cors_origin_list == ["https://a.example.com", "https://b.example.com"]


# ---------------------------------------------------------------- request size limits
def test_subtopic_items_are_length_limited():
    InterviewConfig(interview_type="topic", topic="SQL", subtopics=["joins"])
    with pytest.raises(ValidationError):
        InterviewConfig(interview_type="topic", topic="SQL", subtopics=["x" * 121])


def test_prep_exclude_items_are_length_limited():
    PrepRequest(topic="SQL", exclude=["What is a join?"])
    with pytest.raises(ValidationError):
        PrepRequest(topic="SQL", exclude=["x" * 601])


# ---------------------------------------------------------------- rate limits (phase 2)
def test_rate_limit_allows_up_to_the_limit_then_429():
    from fastapi import HTTPException

    from app.core import rate_limit

    rate_limit.reset()
    for i in range(3):
        rate_limit.check("t", "user-1", times=3, seconds=60, now=100 + i)
    with pytest.raises(HTTPException) as err:
        rate_limit.check("t", "user-1", times=3, seconds=60, now=103)
    assert err.value.status_code == 429
    assert err.value.headers["Retry-After"] == "57"  # the oldest call (t=100) expires at 160
    rate_limit.check("t", "user-2", times=3, seconds=60, now=103)  # other users unaffected
    rate_limit.check("t", "user-1", times=3, seconds=60, now=161)  # window slid: allowed again


def test_rate_limit_rules_are_independent():
    from app.core import rate_limit

    rate_limit.reset()
    rate_limit.check("a", "u", times=1, seconds=60, now=0)
    rate_limit.check("b", "u", times=1, seconds=60, now=0)  # a different rule has its own count


# ---------------------------------------------------------------- voice allowlist (phase 2)
async def test_tts_refuses_text_the_interviewer_never_said():
    from app.services import tts

    with pytest.raises(tts.NotAllowed):
        await tts.synthesize("Arbitrary text from a script, to keep the voice busy.", "maya")


def test_tts_allows_registered_interviewer_lines():
    from app.services import tts

    chunks = tts.presynthesize("Good answer. Now, how would you index this table?", "maya", "test")
    assert chunks and all(tts.is_allowed(c) for c in chunks)
    assert tts.is_allowed("  " + chunks[0].replace(" ", "   "))  # extra whitespace is ignored


# ---------------------------------------------------------------- bring-your-own-key
def test_groq_key_is_never_a_database_column():
    """The user's own Groq key lives only in their browser; the server keeps no copy."""
    from app.db.models import User

    assert not [c for c in User.__table__.columns if "groq" in c.name or "key" in c.name]


async def test_groq_key_comes_only_from_the_request_header():
    """get_current_user takes the key from X-Groq-Key for this request; junk is ignored."""
    import uuid as _uuid

    from app.api.deps import get_current_user
    from app.core.groq_key import current_groq_key, has_user_key
    from app.core.security import create_access_token
    from app.db.models import User

    user = User(id=_uuid.uuid4(), email="a@example.com", name="A", password_hash="x")

    class FakeDb:
        async def get(self, _model, _id):
            return user

    token = create_access_token(user.id)
    good = "gsk_" + "Ab3" * 10
    await get_current_user(FakeDb(), token, good)
    assert has_user_key() and current_groq_key() == good
    await get_current_user(FakeDb(), token, "not-a-key")
    assert not has_user_key()
    await get_current_user(FakeDb(), token, None)
    assert not has_user_key()


def test_key_hint_hides_the_key():
    from app.core.groq_key import key_hint

    hint = key_hint("gsk_" + "x" * 40 + "WXYZ")
    assert hint == "gsk_…WXYZ" and len(hint) < 12


async def test_user_key_reaches_tasks_and_threads_of_the_request():
    """LangGraph runs nodes in tasks/threads started from the request: the key must follow."""
    import asyncio

    from app.core.groq_key import current_groq_key, has_user_key, set_user_key

    async def read_later():
        await asyncio.sleep(0.01)  # let the other "request" run in between
        return current_groq_key()

    async def request(key):
        set_user_key(key)
        in_task = await asyncio.create_task(read_later())
        in_thread = await asyncio.to_thread(current_groq_key)
        return in_task, in_thread, has_user_key()

    a, b = await asyncio.gather(asyncio.create_task(request("gsk_userA")),
                                asyncio.create_task(request("gsk_userB")))
    assert a == ("gsk_userA", "gsk_userA", True)
    assert b == ("gsk_userB", "gsk_userB", True)  # concurrent requests never mix keys


def test_own_key_errors_point_to_settings():
    import groq
    import httpx

    from app.agents.common.errors import ai_http_error
    from app.core.groq_key import set_user_key

    req = httpx.Request("POST", "https://api.groq.com")
    auth = groq.AuthenticationError("bad key", response=httpx.Response(401, request=req), body=None)
    wrapped = RuntimeError("graph failed")
    wrapped.__cause__ = auth

    set_user_key("gsk_user")
    err = ai_http_error(wrapped, "Test")
    assert err.status_code == 400 and "Settings" in err.detail  # never 401: that logs out
    set_user_key(None)


# ---------------------------------------------------------------- bring-your-own-key only
def test_no_server_key_and_no_daily_allowance():
    """BYOK only (product decision): no shared server key, no usage table, no allowance."""
    import importlib.util

    from app.core.config import Settings
    from app.db.base import Base

    assert "groq_api_key" not in Settings.model_fields
    assert "usage_counters" not in Base.metadata.tables
    assert importlib.util.find_spec("app.services.usage") is None


def test_ai_calls_without_a_key_ask_for_one():
    """No key, no AI call: 428 with a pointer to Settings (never 401, which logs out)."""
    from app.agents.common.errors import ai_http_error
    from app.core.groq_key import GroqKeyMissing, current_groq_key, set_user_key

    set_user_key(None)
    with pytest.raises(GroqKeyMissing) as info:
        current_groq_key()
    assert info.value.status_code == 428 and "Settings" in info.value.detail
    wrapped = RuntimeError("graph failed")  # LangGraph wraps errors raised inside nodes
    wrapped.__cause__ = info.value
    assert ai_http_error(wrapped, "Test").status_code == 428


def test_every_ai_route_requires_a_key():
    """Each route that starts AI work depends on require_groq_key, so it refuses up front."""
    from fastapi.routing import APIRoute

    from app.api.deps import require_groq_key
    from app.api.v1 import interviews, optimizer, prep, resumes

    def needs_key(route: APIRoute) -> bool:
        stack = list(route.dependant.dependencies)
        while stack:
            dep = stack.pop()
            if dep.call is require_groq_key:
                return True
            stack.extend(dep.dependencies)
        return False

    ai_routes = {"/interviews", "/interviews/{session_id}/answer",
                 "/interviews/{session_id}/transcribe", "/prep/questions", "/optimizer/analyze",
                 "/optimizer/optimize", "/resumes", "/resumes/{resume_id}/reparse"}
    routes = [r for m in (interviews, optimizer, prep, resumes) for r in m.router.routes
              if isinstance(r, APIRoute) and "POST" in r.methods and r.path in ai_routes]
    assert {r.path for r in routes} == ai_routes  # all found (paths still match)
    assert all(needs_key(r) for r in routes), [r.path for r in routes if not needs_key(r)]



# ---------------------------------------------------------------- difficulty levels
def test_old_experience_values_map_to_difficulty():
    """Saved interviews and prep sets from before the change still load."""
    from app.agents.common.levels import level_guide, level_label

    assert InterviewConfig(interview_type="hr", experience="fresher").experience == "easy"
    assert InterviewConfig(interview_type="hr", experience="5+").experience == "hard"
    assert PrepRequest(topic="SQL", experience="1-3").experience == "intermediate"
    assert InterviewConfig(interview_type="hr").experience == "intermediate"  # new default
    assert level_label("3-5") == "Hard" and level_label("easy") == "Easy"
    assert "Hard" in level_guide("5+")
    with pytest.raises(ValidationError):
        InterviewConfig(interview_type="hr", experience="expert")
