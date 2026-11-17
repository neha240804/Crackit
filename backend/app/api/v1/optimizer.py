import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.api.deps import CurrentUser, DbSession
from app.schemas.optimizer import AnalysisResult, OptimizeRequest, ResumeVersionOut
from app.services import optimizer_service as svc

router = APIRouter(prefix="/optimizer", tags=["resume optimizer"])


@router.post("/analyze", response_model=AnalysisResult)
async def analyze(req: OptimizeRequest, user: CurrentUser, db: DbSession):
    """Fast ATS check (~5 s): format rules, and with a JD, keyword match + gap analysis."""
    return await svc.analyze(db, user, req)


@router.post("/optimize", response_model=ResumeVersionOut, status_code=201)
async def optimize(req: OptimizeRequest, user: CurrentUser, db: DbSession):
    """Full rewrite with fact verification (~30-90 s). Saves a new resume version."""
    return await svc.optimize(db, user, req)


@router.get("/resumes/{resume_id}/versions", response_model=list[ResumeVersionOut])
async def list_versions(resume_id: uuid.UUID, user: CurrentUser, db: DbSession):
    return [svc.to_out(v) for v in await svc.list_versions(db, user, resume_id)]


@router.get("/versions/{version_id}", response_model=ResumeVersionOut)
async def get_version(version_id: uuid.UUID, user: CurrentUser, db: DbSession):
    return svc.to_out(await svc.get_version(db, user, version_id))


@router.get("/versions/{version_id}/docx")
async def download_docx(version_id: uuid.UUID, user: CurrentUser, db: DbSession):
    version = await svc.get_version(db, user, version_id)
    if not version.docx_path or not Path(version.docx_path).exists():
        raise HTTPException(404, "DOCX not available for this version")
    return FileResponse(
        version.docx_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="resume_optimized.docx",
        # Private file: never let the browser cache it. Without this, FileResponse's
        # ETag/Last-Modified let the browser reuse an authenticated download for a later
        # request without a token (seen in testing), and keep resumes on shared machines.
        headers={"Cache-Control": "private, no-store"},
    )
