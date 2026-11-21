"""5 interviews per rolling 24 hours (what a free Groq key carries), and the Feedback page."""

import time
import uuid

import pytest
from fastapi import HTTPException
from pydantic import ValidationError


class FakeDb:
    """Returns the given start times, as the real query would for this user's last 24 hours."""

    def __init__(self, starts):
        self.starts = starts

    async def scalars(self, _query):
        class Rows:
            def __init__(self, rows):
                self.rows = rows

            def all(self):
                return self.rows
        return Rows(self.starts)


def _user():
    from app.db.models import User

    return User(id=uuid.uuid4(), email="a@example.com", name="A", password_hash="x")


async def test_four_started_leaves_one_and_five_blocks_until_the_oldest_drops_out():
    from app.services.interview_allowance import WINDOW_SECONDS, check_allowance, get_allowance

    now = time.time()
    four = [now - 5 * 3600, now - 4 * 3600, now - 3 * 3600, now - 600]
    a = await get_allowance(FakeDb(four), _user())
    assert (a.limit, a.used, a.remaining, a.next_available_at) == (5, 4, 1, None)
    await check_allowance(FakeDb(four), _user())  # the 5th may start

    five = sorted([*four, now - 60])
    a = await get_allowance(FakeDb(five), _user())
    assert a.remaining == 0
    assert abs(a.next_available_at.timestamp() - (five[0] + WINDOW_SECONDS)) < 1  # oldest + 24 h
    with pytest.raises(HTTPException) as info:
        await check_allowance(FakeDb(five), _user())
    # the oldest start was 5 h ago, so 19 h are left (18 h 59 min once the test's seconds pass)
    assert info.value.status_code == 429 and "available in 18 h 59 min" in info.value.detail


def test_the_limit_is_five_and_checked_when_setting_up_and_when_starting():
    import inspect

    from app.core.config import Settings
    from app.services import interview_service

    assert Settings(_env_file=None).daily_interview_limit == 5
    assert "check_allowance" in inspect.getsource(interview_service.start)
    assert "check_allowance" in inspect.getsource(interview_service.begin)


def test_feedback_needs_a_category_and_a_message():
    from app.api.v1.feedback import FeedbackIn, router

    assert FeedbackIn(category="idea", message="Add a timer").rating is None
    for bad in ({"category": "spam", "message": "hello"}, {"category": "bug", "message": ""},
                {"category": "bug", "message": "ok then", "rating": 6}):
        with pytest.raises(ValidationError):
            FeedbackIn(**bad)
    assert {r.path for r in router.routes} == {"/feedback"}


def test_feedback_is_deleted_with_the_account():
    from app.db.models import SiteFeedback

    fk = next(iter(SiteFeedback.__table__.c.user_id.foreign_keys))
    assert fk.ondelete == "CASCADE"
