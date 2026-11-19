"""Daily budget for AI-backed actions on the shared Groq key.

Per-minute limits (core/rate_limit.py) stop floods; they don't stop one user from slowly
spending the whole day's shared free quota (Groq caps tokens per model PER DAY). This caps
each user's AI-backed actions per UTC day, counted in Postgres so a restart doesn't reset it.

What counts: the actions that START AI work. An interview counts once when it starts; its
answers and report don't count separately, because cutting someone off halfway through an
interview is the worst possible experience. (Answers are still rate-limited per minute.)

Charged only on success: a failed AI call (rate limit, Groq outage) doesn't use up the
user's allowance. Check-then-charge isn't atomic, so two simultaneous requests could both
pass the check at the limit; the per-minute limits keep that overshoot to a request or two.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import UsageCounter, User

# Per user per UTC day. Sized for a serious day of practice, far below what would drain the
# shared key: one interview is ~40k tokens, the free tier gives ~200k-ish per model per day.
DAILY_LIMITS: dict[str, int] = {
    "interview": 5,   # mock interviews started
    "prep": 20,       # question-prep sets generated
    "ats": 15,        # ATS checks (analyze) and rewrites
    "resume": 10,     # resumes parsed (upload or reparse)
}

LABELS = {"interview": "mock interviews", "prep": "question-prep sets",
          "ats": "ATS checks", "resume": "resume uploads"}


def today():
    return datetime.now(UTC).date()


async def used_today(db: AsyncSession, user: User) -> dict[str, int]:
    rows = await db.execute(
        select(UsageCounter.action, UsageCounter.count)
        .where(UsageCounter.user_id == user.id, UsageCounter.day == today())
    )
    return {action: count for action, count in rows.all()}


async def summary(db: AsyncSession, user: User) -> dict[str, dict[str, int]]:
    used = await used_today(db, user)
    return {action: {"used": used.get(action, 0), "limit": limit}
            for action, limit in DAILY_LIMITS.items()}


async def check(db: AsyncSession, user: User, action: str) -> None:
    limit = DAILY_LIMITS[action]
    used = (await used_today(db, user)).get(action, 0)
    if used >= limit:
        raise HTTPException(
            429,
            f"You've used today's {limit} free {LABELS[action]}. "
            "Your allowance resets at midnight UTC.",
        )


async def charge(db: AsyncSession, user: User, action: str) -> None:
    """Add one use: a single upsert, so concurrent increments never lose a count."""
    stmt = insert(UsageCounter).values(user_id=user.id, day=today(), action=action, count=1)
    stmt = stmt.on_conflict_do_update(
        index_elements=[UsageCounter.user_id, UsageCounter.day, UsageCounter.action],
        set_={"count": UsageCounter.count + 1},
    )
    await db.execute(stmt)
    await db.commit()


@asynccontextmanager
async def ai_budget(db: AsyncSession, user: User, action: str) -> AsyncIterator[None]:
    """Wrap one AI-backed action: refuse it when today's allowance is used up, and count it
    only if it succeeds.

        async with ai_budget(db, user, "prep"):
            return await prep_service.generate(db, user, req)
    """
    await check(db, user, action)
    yield  # an exception here skips the charge: failures are free
    await charge(db, user, action)
