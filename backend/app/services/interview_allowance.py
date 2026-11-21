"""How many mock interviews a user may still start: settings.daily_interview_limit per rolling
24 hours (5: what a free Groq key's daily quota carries at ~40k tokens per 15-minute interview).

An interview counts once its clock STARTS (the Start button, /begin stores config.started_at),
not when it is set up: a set-up that is never started used only the plan (~2k tokens). Both
setting one up and starting it are checked, so nobody prepares several and starts them all.
Resuming an interview that already started never counts again.
"""

import time
from datetime import UTC, datetime

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import InterviewSession, User

WINDOW_SECONDS = 24 * 3600


class InterviewAllowance(BaseModel):
    limit: int
    used: int  # interviews started in the last 24 hours
    remaining: int
    next_available_at: datetime | None  # when one frees up (only when none remain)


async def get_allowance(db: AsyncSession, user: User) -> InterviewAllowance:
    now = time.time()
    started = InterviewSession.config["started_at"].as_float()
    times = sorted((await db.scalars(
        select(started).where(InterviewSession.user_id == user.id, started.is_not(None),
                              started > now - WINDOW_SECONDS))).all())
    limit = settings.daily_interview_limit
    remaining = max(0, limit - len(times))
    next_at = None
    if remaining == 0 and times:
        # The oldest start that has to drop out of the 24 h window for one to free up.
        next_at = datetime.fromtimestamp(times[len(times) - limit] + WINDOW_SECONDS, UTC)
    return InterviewAllowance(limit=limit, used=len(times), remaining=remaining, next_available_at=next_at)


async def check_allowance(db: AsyncSession, user: User) -> None:
    """429 when the user has started their limit of interviews in the last 24 hours."""
    allowance = await get_allowance(db, user)
    if allowance.remaining > 0:
        return
    wait = ""
    if allowance.next_available_at:
        minutes = max(1, int((allowance.next_available_at.timestamp() - time.time()) // 60))
        wait = f" Your next one is available in {minutes // 60} h {minutes % 60} min." if minutes >= 60 \
            else f" Your next one is available in {minutes} min."
    raise HTTPException(429, f"You've done {allowance.limit} interviews in the last 24 hours, the most a "
                             f"free Groq key can carry in a day.{wait}")
