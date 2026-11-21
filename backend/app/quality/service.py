"""Run the online evaluation when an interview's report is built, and store the result.

Called from interview_service.report() right after the report is saved: by then the whole
interview (every turn, every live verdict) and the report exist, so both can be checked once.

- Code checks run inline: pure Python over the saved messages, a few milliseconds.
- The AI judge runs in a background task AFTER the response, on the site owner's key, for a
  sample of interviews (settings.online_eval_*). The student never waits for it.

Nothing here may break the report: every failure is logged and swallowed. A missing quality
row only means one interview less in the summary.
"""

import asyncio
import logging
import random
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.groq_key import looks_like_groq_key, set_user_key
from app.db.models import InterviewQuality
from app.db.session import SessionLocal
from app.quality.checks import interview_checks
from app.quality.judge import judge_interview

logger = logging.getLogger(__name__)
_running: set[asyncio.Task] = set()  # keep a reference, or asyncio may drop the task mid-run


async def _judge_wanted(db: AsyncSession) -> bool:
    key = settings.online_eval_groq_key.strip().strip("'\"")
    if not looks_like_groq_key(key) or random.random() >= settings.online_eval_sample_rate:
        return False
    since = datetime.now(UTC) - timedelta(hours=24)
    judged = await db.scalar(select(func.count()).select_from(InterviewQuality).where(
        InterviewQuality.judge_status != "skipped", InterviewQuality.created_at >= since))
    return (judged or 0) < settings.online_eval_daily_max


async def record(db: AsyncSession, session_id: uuid.UUID, values: dict, report: dict) -> None:
    """Check a finished interview in code, store it, and maybe start the AI judge."""
    try:
        result = interview_checks(values["messages"], report)
        judge = await _judge_wanted(db)
        row = InterviewQuality(session_id=session_id, checks=result,
                               judge_status="pending" if judge else "skipped")
        db.add(row)
        await db.commit()
    except Exception:  # never let quality bookkeeping fail the report
        logger.exception("online eval: code checks failed for interview %s", session_id)
        await db.rollback()
        return
    if judge:
        task = asyncio.create_task(_run_judge(row.id, values["messages"], values["config"], report))
        _running.add(task)
        task.add_done_callback(_running.discard)


async def _run_judge(row_id: uuid.UUID, messages: list[dict], cfg: dict, report: dict) -> None:
    # This task has its own copy of the request's context, so setting the key here changes
    # nothing for the student's request: the judge runs on the owner's key, theirs is untouched.
    set_user_key(settings.online_eval_groq_key.strip().strip("'\""))
    try:
        result, status = await judge_interview(messages, cfg, report), "done"
    except Exception as exc:  # noqa: BLE001 - rate limit on the owner key, Groq down: not judged
        logger.warning("online eval: judge failed for %s: %s: %s", row_id, type(exc).__name__, str(exc)[:200])
        result, status = None, "failed"
    finally:
        set_user_key(None)
    try:
        async with SessionLocal() as db:
            row = await db.get(InterviewQuality, row_id)
            if row is not None:  # gone if the user deleted the interview or account meanwhile
                row.judge, row.judge_status = result, status
                await db.commit()
    except Exception:
        logger.exception("online eval: could not save the judge result for %s", row_id)
