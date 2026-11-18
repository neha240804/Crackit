"""Question prep: curated tracks, and study sets of questions with model answers."""

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.prep import PrepRequest, PrepSetOut, PrepTrack
from app.services import prep_service

router = APIRouter(prefix="/prep", tags=["question prep"])


@router.get("/tracks", response_model=list[PrepTrack])
async def tracks(user: CurrentUser):
    """Curated tracks (backend, ML, HR...) with their subtopics, from the question bank."""
    return prep_service.list_tracks()


@router.post("/questions", response_model=PrepSetOut)
async def questions(req: PrepRequest, user: CurrentUser, db: DbSession):
    """A study set: questions with model answers, key points and a tip (~3-10 s).
    With resume_id: the questions an interviewer is likely to ask about that resume."""
    return await prep_service.generate(db, user, req)
