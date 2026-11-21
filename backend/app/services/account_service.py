"""Deleting an account, everywhere its data lives.

The database rows go with the user (every table's user_id has ON DELETE CASCADE). Three
things live outside those tables and would be left behind:
  - uploaded resume files and generated DOCX files on disk (data/),
  - each resume's search chunks in Qdrant,
  - each interview's LangGraph checkpoints (its own tables, keyed by thread id).
So those go first, then the user row. Backups keep a dump for up to 7 days (privacy page).
"""

import asyncio
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.interview import runtime
from app.db.models import InterviewSession, Resume, ResumeVersion, User
from app.rag.vectorstore import delete_resume_chunks

logger = logging.getLogger(__name__)


async def delete_account(db: AsyncSession, user: User) -> None:
    resumes = (await db.execute(select(Resume.id, Resume.file_path).where(Resume.user_id == user.id))).all()
    docx = (await db.scalars(
        select(ResumeVersion.docx_path).join(Resume, ResumeVersion.resume_id == Resume.id)
        .where(Resume.user_id == user.id, ResumeVersion.docx_path.is_not(None)))).all()
    threads = (await db.scalars(
        select(InterviewSession.thread_id).where(InterviewSession.user_id == user.id))).all()

    for resume_id, _ in resumes:
        await asyncio.to_thread(delete_resume_chunks, str(resume_id))
    checkpointer = runtime.get_graph().checkpointer
    for thread_id in threads:
        await checkpointer.adelete_thread(thread_id)
    for path in [*(p for _, p in resumes), *docx]:
        try:
            Path(path).unlink(missing_ok=True)
        except OSError:  # a file we can't remove must not keep the account alive
            logger.exception("Could not delete a file of a deleted account")

    await db.delete(user)  # cascades to every table with this user's rows
    await db.commit()
    logger.info("Account deleted (%d resumes, %d interviews)", len(resumes), len(threads))
