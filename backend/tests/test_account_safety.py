"""Password reset, account deletion and monitoring: the rules that keep accounts safe.

The full flows (email link, reset, old session signed out, link reuse; deletion removing rows,
checkpoints, files and Qdrant chunks) were run against a live server; these tests pin the
rules without a database.
"""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException, Response


class FakeDb:
    def __init__(self, user):
        self.user = user

    async def get(self, _model, _id):
        return self.user


def _user(**kw):
    from app.db.models import User

    return User(id=uuid.uuid4(), email="a@example.com", name="A", password_hash="x", **kw)


def test_reset_tokens_are_random_and_only_their_hash_is_stored():
    from app.core.security import hash_reset_token, new_reset_token

    token, stored = new_reset_token()
    assert len(token) >= 40 and stored == hash_reset_token(token) and token not in stored
    assert new_reset_token()[0] != token


async def test_a_password_reset_signs_out_older_sessions():
    from app.api.deps import get_current_user
    from app.core.security import create_access_token

    user = _user()
    token = create_access_token(user.id)
    assert await get_current_user(FakeDb(user), token, None) is user
    user.password_changed_at = datetime.now(UTC) + timedelta(seconds=2)  # reset after login
    with pytest.raises(HTTPException) as info:
        await get_current_user(FakeDb(user), token, None)
    assert info.value.status_code == 401
    user.password_changed_at = datetime.now(UTC) - timedelta(seconds=5)  # login after reset
    assert await get_current_user(FakeDb(user), token, None) is user


async def test_email_without_smtp_logs_in_dev_and_refuses_in_production(monkeypatch):
    from app.services import email

    monkeypatch.setattr(email.settings, "smtp_host", "")
    monkeypatch.setattr(email.settings, "app_env", "development")
    await email.send("a@example.com", "Subject", "Body")  # logged, no exception
    monkeypatch.setattr(email.settings, "app_env", "production")
    with pytest.raises(email.EmailNotConfigured):
        await email.send("a@example.com", "Subject", "Body")


def test_account_routes_exist_and_never_answer_401_for_a_wrong_password():
    """Wrong password on delete is 400: the frontend logs out on 401."""
    import inspect

    from app.api.v1 import account, auth

    paths = {r.path for r in auth.router.routes} | {r.path for r in account.router.routes}
    assert {"/auth/forgot-password", "/auth/reset-password", "/account/delete"} <= paths
    assert "HTTPException(400" in inspect.getsource(account.delete_account)


async def test_health_answers_503_when_a_dependency_is_down(monkeypatch):
    from app.api.v1 import health

    class DownDb:
        async def execute(self, _q):
            raise ConnectionError("database down")

    class FakeQdrant:
        def __init__(self, url):
            pass

        async def get_collections(self):
            return []

        async def close(self):
            pass

    monkeypatch.setattr(health, "AsyncQdrantClient", FakeQdrant)
    response = Response()
    body = await health.health(DownDb(), response)
    assert response.status_code == 503 and body["status"] == "degraded"


def test_error_reports_carry_no_request_or_user_data():
    from app.core.monitoring import scrub

    event = {"exception": {"values": [{"type": "ValueError"}]},
             "request": {"headers": {"X-Groq-Key": "gsk_secret"}, "data": "my resume"},
             "user": {"email": "a@example.com"}, "breadcrumbs": {"values": [{"message": "answer text"}]},
             "extra": {"x": 1}, "contexts": {"trace": {}}}
    cleaned = scrub(event, {})
    assert set(cleaned) == {"exception"}
