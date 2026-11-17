"""Optimizer business logic: run the graph, save results, export DOCX."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.optimizer.graph import optimizer_graph
from app.core.config import DATA_DIR
from app.db.models import JobDescription, Resume, ResumeVersion, User
from app.schemas.optimizer import (
    AnalysisResult,
    AtsReport,
    GapAnalysis,
    JDAnalysis,
    KeywordMatch,
    OptimizedResume,
    OptimizeRequest,
    ResumeVersionOut,
)
from app.schemas.profile import CandidateProfile
from app.services.docx_render import render_docx
from app.services.keyword_match import overall_score
from app.services.resume_service import get_resume

EXPORT_DIR = DATA_DIR / "exports"


async def _ready_resume(db: AsyncSession, user: User, resume_id: uuid.UUID) -> Resume:
    resume = await get_resume(db, user, resume_id)
    if resume.status != "ready" or not resume.profile:
        raise HTTPException(status.HTTP_409_CONFLICT, "This resume hasn't been parsed successfully")
    return resume


async def _run(resume: Resume, jd_text: str | None, mode: str) -> dict:
    try:
        return await optimizer_graph.ainvoke(
            {
                "mode": mode,
                "profile": resume.profile,
                "raw_text": resume.raw_text,
                "jd_text": (jd_text or "").strip() or None,
            },
            config={"run_name": f"optimizer_{mode}", "tags": ["optimizer", mode],
                    "metadata": {"resume_id": str(resume.id)}},
        )
    except Exception as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, f"The AI service failed ({exc.__class__.__name__}). "
            "Please try again."
        ) from exc


def _analysis(out: dict) -> AnalysisResult:
    ats = AtsReport.model_validate(out["ats"])
    match = KeywordMatch.model_validate(out["match"]) if out.get("match") else None
    return AnalysisResult(
        ats=ats,
        jd=JDAnalysis.model_validate(out["jd"]) if out.get("jd") else None,
        match=match,
        gaps=GapAnalysis.model_validate(out["gaps"]) if out.get("gaps") else None,
        overall_score=overall_score(ats.score, match),
    )


async def analyze(db: AsyncSession, user: User, req: OptimizeRequest) -> AnalysisResult:
    resume = await _ready_resume(db, user, req.resume_id)
    return _analysis(await _run(resume, req.jd_text, "analyze"))


async def optimize(db: AsyncSession, user: User, req: OptimizeRequest) -> ResumeVersionOut:
    resume = await _ready_resume(db, user, req.resume_id)
    out = await _run(resume, req.jd_text, "optimize")
    analysis = _analysis(out)

    jd_row = None
    if analysis.jd:
        jd_row = JobDescription(
            user_id=user.id, title=analysis.jd.title, company=analysis.jd.company,
            raw_text=req.jd_text or "", parsed=analysis.jd.model_dump(),
        )
        db.add(jd_row)
        await db.flush()  # assigns jd_row.id without committing yet

    version = ResumeVersion(
        resume_id=resume.id,
        jd_id=jd_row.id if jd_row else None,
        content=out["final"],
        ats_score=analysis.overall_score,
        analysis={**analysis.model_dump(), "verification": out["verification"]},
        verified=out["verification"]["verified"],
    )
    db.add(version)
    await db.flush()

    path = EXPORT_DIR / str(user.id) / f"{version.id}.docx"
    render_docx(
        OptimizedResume.model_validate(out["final"]),
        CandidateProfile.model_validate(resume.profile),
        path,
    )
    version.docx_path = str(path)
    await db.commit()
    await db.refresh(version)
    return to_out(version)


def to_out(v: ResumeVersion) -> ResumeVersionOut:
    data = dict(v.analysis or {})
    verification = data.pop("verification", {})
    analysis = AnalysisResult.model_validate(data)
    return ResumeVersionOut(
        id=v.id, resume_id=v.resume_id, created_at=v.created_at,
        job_title=analysis.jd.title if analysis.jd else None,
        overall_score=v.ats_score, verified=v.verified,
        content=OptimizedResume.model_validate(v.content),
        analysis=analysis, verification=verification,
    )


async def get_version(db: AsyncSession, user: User, version_id: uuid.UUID) -> ResumeVersion:
    version = await db.get(ResumeVersion, version_id)
    if version is not None:
        resume = await db.get(Resume, version.resume_id)
        if resume and resume.user_id == user.id:
            return version
    raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")


async def list_versions(db: AsyncSession, user: User, resume_id: uuid.UUID) -> list[ResumeVersion]:
    await get_resume(db, user, resume_id)  # ownership check
    rows = await db.scalars(
        select(ResumeVersion)
        .where(ResumeVersion.resume_id == resume_id)
        .order_by(ResumeVersion.created_at.desc())
    )
    return list(rows)
