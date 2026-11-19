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
              "groq_api_key": "gsk_test", "cors_origins": "https://crackit.example.com"}
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
