"""Resume business logic: store the upload, run the profile graph, save the result.

The route stays thin (HTTP in/out); this service owns the steps. For the MVP the graph
runs inside the request: Groq answers in a few seconds. If it gets slow we can move it
to a background task without changing the route's contract (status is already tracked).
"""

import asyncio
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.profile.graph import profile_graph
from app.core.config import DATA_DIR
from app.db.models import Resume, User
from app.rag.vectorstore import delete_resume_chunks
from app.services.document_text import SUPPORTED_EXTENSIONS

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
UPLOAD_DIR = DATA_DIR / "uploads"


async def create_resume(db: AsyncSession, user: User, upload: UploadFile) -> Resume:
    filename = Path(upload.filename or "resume").name  # drop any client-supplied path
    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Upload a PDF, DOCX or TXT file"
        )
    data = await upload.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File is larger than 5 MB")

    resume_id = uuid.uuid4()
    path = UPLOAD_DIR / str(user.id) / f"{resume_id}{ext}"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)

    existing = await db.scalar(select(func.count()).where(Resume.user_id == user.id))
    resume = Resume(
        id=resume_id,
        user_id=user.id,
        filename=filename,
        file_path=str(path),
        raw_text="",
        status="processing",
        is_primary=existing == 0,  # the first resume becomes the default
    )
    db.add(resume)
    await db.commit()

    await _run_profile_graph(db, resume)
    return resume


async def _run_profile_graph(db: AsyncSession, resume: Resume) -> None:
    try:
        result = await profile_graph.ainvoke(
            {
                "file_path": resume.file_path,
                "user_id": str(resume.user_id),
                "resume_id": str(resume.id),
            },
            # Shows up in LangSmith: name the run and tag it so traces are easy to find.
            config={"run_name": "profile_graph", "tags": ["profile"],
                    "metadata": {"resume_id": str(resume.id)}},
        )
        resume.raw_text = result.get("raw_text", "")
        if result.get("error"):
            resume.status, resume.error = "failed", result["error"]
        else:
            resume.profile, resume.status, resume.error = result["profile"], "ready", None
    except Exception as exc:  # noqa: BLE001 - LLM/network failure: record it, don't crash the request
        resume.status, resume.error = "failed", f"Parsing failed: {exc.__class__.__name__}"
    await db.commit()
    await db.refresh(resume)


async def list_resumes(db: AsyncSession, user: User) -> list[Resume]:
    rows = await db.scalars(
        select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc())
    )
    return list(rows)


async def get_resume(db: AsyncSession, user: User, resume_id: uuid.UUID) -> Resume:
    resume = await db.get(Resume, resume_id)
    if resume is None or resume.user_id != user.id:  # never reveal other users' resumes
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resume not found")
    return resume


async def reparse_resume(db: AsyncSession, user: User, resume_id: uuid.UUID) -> Resume:
    """Run the profile graph again on the stored file (e.g. after the parser improves)."""
    resume = await get_resume(db, user, resume_id)
    resume.status, resume.error = "processing", None
    await db.commit()
    await _run_profile_graph(db, resume)
    return resume


async def set_primary(db: AsyncSession, user: User, resume_id: uuid.UUID) -> Resume:
    """Exactly one primary resume per user: clear the flag on all, then set it on one."""
    resume = await get_resume(db, user, resume_id)
    await db.execute(update(Resume).where(Resume.user_id == user.id).values(is_primary=False))
    resume.is_primary = True
    await db.commit()
    await db.refresh(resume)
    return resume


async def delete_resume(db: AsyncSession, user: User, resume_id: uuid.UUID) -> None:
    """Delete everywhere it lives: Qdrant chunks, the file on disk, then the DB row.
    If it was primary, the newest remaining resume becomes primary."""
    resume = await get_resume(db, user, resume_id)
    was_primary = resume.is_primary

    await asyncio.to_thread(delete_resume_chunks, str(resume.id))  # sync client -> thread
    Path(resume.file_path).unlink(missing_ok=True)
    await db.delete(resume)
    await db.commit()

    if was_primary:
        newest = await db.scalar(
            select(Resume)
            .where(Resume.user_id == user.id)
            .order_by(Resume.created_at.desc())
            .limit(1)
        )
        if newest:
            newest.is_primary = True
            await db.commit()
