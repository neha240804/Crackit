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
              "groq_api_key": "gsk_test", "cors_origins": "https://crackit.example.com",
              "key_encryption_key": "A" * 43 + "="}
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
    ({"groq_api_key": ""}, "GROQ_API_KEY"),
    ({"cors_origins": "http://localhost:5174"}, "CORS_ORIGINS"),
    ({"cors_origins": "*"}, "CORS_ORIGINS"),
])
def test_production_refuses_unsafe_settings(override, message):
    with pytest.raises(ValidationError, match=message):
        _prod(**override)


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
def test_secret_encryption_roundtrip_and_isolation():
    import uuid as _uuid

    from app.core.crypto import DecryptionError, decrypt_secret, encrypt_secret

    alice, bob = _uuid.uuid4(), _uuid.uuid4()
    secret = "gsk_" + "a1B2" * 12
    token = encrypt_secret(secret, alice)
    assert secret not in token and token.startswith("v1:")
    assert decrypt_secret(token, alice) == secret
    assert encrypt_secret(secret, alice) != token  # fresh nonce: same key, different ciphertext
    with pytest.raises(DecryptionError):  # copied onto another user's row: refuses
        decrypt_secret(token, bob)
    tampered = token[:-4] + ("AAAA" if not token.endswith("AAAA") else "BBBB")
    with pytest.raises(DecryptionError):  # any change to the ciphertext is detected
        decrypt_secret(tampered, alice)


def test_key_hint_hides_the_key():
    from app.core.groq_key import key_hint

    hint = key_hint("gsk_" + "x" * 40 + "WXYZ")
    assert hint == "gsk_…WXYZ" and len(hint) < 12


async def test_user_key_reaches_tasks_and_threads_of_the_request():
    """LangGraph runs nodes in tasks/threads started from the request: the key must follow."""
    import asyncio

    from app.core.groq_key import current_groq_key, set_user_key, using_own_key

    async def read_later():
        await asyncio.sleep(0.01)  # let the other "request" run in between
        return current_groq_key()

    async def request(key):
        set_user_key(key)
        in_task = await asyncio.create_task(read_later())
        in_thread = await asyncio.to_thread(current_groq_key)
        return in_task, in_thread, using_own_key()

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
    err = ai_http_error(wrapped, "Test")
    assert err.status_code == 502 and "Settings" not in err.detail


async def test_own_key_skips_the_daily_budget():
    from app.core.groq_key import set_user_key
    from app.services.usage import ai_budget

    set_user_key("gsk_user")
    async with ai_budget(None, None, "interview"):  # no DB touched at all with an own key
        pass
    set_user_key(None)


def test_production_requires_key_encryption_key():
    with pytest.raises(ValidationError, match="KEY_ENCRYPTION_KEY"):
        _prod(key_encryption_key="")
