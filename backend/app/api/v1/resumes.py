import uuid

from fastapi import APIRouter, UploadFile

from app.api.deps import CurrentUser, DbSession, KeyedUser
from app.core.rate_limit import per_user
from app.schemas.resume import ResumeOut
from app.services import resume_service
from app.services.resume_service import Purpose

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("", response_model=ResumeOut, status_code=201,
             dependencies=[per_user("resume-parse", times=5, seconds=60)])
async def upload_resume(
    file: UploadFile, user: KeyedUser, db: DbSession, purpose: Purpose = "interview"
):
    """purpose=interview (resume-/JD-based interviews) or ats (the ATS checker): two lists."""
    return await resume_service.create_resume(db, user, file, purpose)


@router.get("", response_model=list[ResumeOut])
async def list_resumes(user: CurrentUser, db: DbSession, purpose: Purpose | None = None):
    return await resume_service.list_resumes(db, user, purpose)


@router.get("/{resume_id}", response_model=ResumeOut)
async def get_resume(resume_id: uuid.UUID, user: CurrentUser, db: DbSession):
    return await resume_service.get_resume(db, user, resume_id)


@router.post("/{resume_id}/reparse", response_model=ResumeOut,
             dependencies=[per_user("resume-parse", times=5, seconds=60)])
async def reparse_resume(resume_id: uuid.UUID, user: KeyedUser, db: DbSession):
    return await resume_service.reparse_resume(db, user, resume_id)


@router.post("/{resume_id}/primary", response_model=ResumeOut)
async def set_primary(resume_id: uuid.UUID, user: CurrentUser, db: DbSession):
    return await resume_service.set_primary(db, user, resume_id)


@router.delete("/{resume_id}", status_code=204)
async def delete_resume(resume_id: uuid.UUID, user: CurrentUser, db: DbSession) -> None:
    await resume_service.delete_resume(db, user, resume_id)
