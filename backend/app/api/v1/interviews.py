import uuid
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, DbSession, KeyedUser
from app.core.rate_limit import per_user
from app.schemas.interview import (
    InterviewConfig,
    InterviewSessionOut,
    InterviewSummaryOut,
    InterviewTurnOut,
    TranscriptOut,
)
from app.services import interview_service as svc
from app.services import tts

router = APIRouter(prefix="/interviews", tags=["mock interview"])


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=tts.MAX_CHARS)
    interviewer: str = "maya"


# Declared before /{session_id} routes so "tts" isn't parsed as a session id.
# Limits per user (audit H2). Sized for real use with room to spare: one interviewer line is
# 1-4 voice chunks and a candidate answers every ~20-40 s; scripts are the ones that hit them.
@router.post("/tts", responses={200: {"content": {"audio/wav": {}}}, 503: {}},
             dependencies=[per_user("tts", times=120, seconds=60)])
async def text_to_speech(body: TTSRequest, user: CurrentUser) -> Response:
    """Natural interviewer voice: Groq Orpheus on the user's key, or local Kokoro (see
    services/tts.py). 503 = use the browser voice instead.

    X-Gen-Per-Audio: local Kokoro's measured generation speed (seconds of work per second of
    audio). The browser uses it to decide when playback can start without stalling (Groq
    lines are one chunk, so it only matters for Kokoro's sentence chunks).
    X-Voice-Engine: "groq", "kokoro" or "kokoro;fallback=<why Groq was skipped>"."""
    try:
        audio = await tts.synthesize(body.text, body.interviewer)
    except tts.TTSUnavailable as exc:
        raise HTTPException(503, str(exc)) from exc
    except tts.NotAllowed as exc:
        raise HTTPException(403, str(exc)) from exc
    return Response(audio, media_type="audio/wav", headers={
        "Cache-Control": "private, no-store",
        "X-Gen-Per-Audio": str(tts.gen_per_audio()),
        "X-Voice-Engine": tts.engine_used(body.text, body.interviewer),
    })


@router.post("", response_model=InterviewSessionOut, status_code=201,
             dependencies=[per_user("interview-start", times=5, seconds=600)])
async def start_interview(config: InterviewConfig, user: KeyedUser, db: DbSession):
    """Create a session; returns the interviewer's opening line. Needs the user's own Groq
    key (KeyedUser), like every route that calls the AI."""
    return await svc.start(db, user, config)


@router.get("", response_model=list[InterviewSummaryOut])
async def list_interviews(user: CurrentUser, db: DbSession):
    return await svc.history(db, user)


@router.get("/{session_id}", response_model=InterviewSessionOut)
async def get_interview(session_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Full state: lets the interview room resume after a refresh."""
    return await svc.get(db, user, session_id)


@router.post("/{session_id}/begin", response_model=InterviewTurnOut)
async def begin_interview(session_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Start the clock when the candidate presses Start (safe to call again on resume)."""
    return await svc.begin(db, user, session_id)


@router.post("/{session_id}/transcribe", response_model=TranscriptOut,
             dependencies=[per_user("transcribe", times=40, seconds=60)])
async def transcribe(
    session_id: uuid.UUID, user: KeyedUser, db: DbSession, audio: Annotated[UploadFile, File()]
):
    """Speech-to-text only (no change to the interview). Used speculatively during pauses."""
    return await svc.transcribe_only(db, user, session_id, audio)


@router.post("/{session_id}/answer", response_model=InterviewTurnOut,
             dependencies=[per_user("answer", times=20, seconds=60)])
async def answer(
    session_id: uuid.UUID,
    user: KeyedUser,
    db: DbSession,
    audio: Annotated[UploadFile | None, File()] = None,
    text: Annotated[str | None, Form()] = None,
    duration_sec: Annotated[float | None, Form()] = None,
):
    """Send a spoken answer (`audio`) or a typed one (`text`); returns the next question."""
    return await svc.answer(db, user, session_id, audio, text, duration_sec)


@router.post("/{session_id}/end", response_model=InterviewTurnOut)
async def end_interview(session_id: uuid.UUID, user: CurrentUser, db: DbSession):
    return await svc.end(db, user, session_id)


@router.post("/{session_id}/report", dependencies=[per_user("report", times=6, seconds=60)])
async def report(session_id: uuid.UUID, user: CurrentUser, db: DbSession) -> dict:
    """Generate (once) and return the feedback report."""
    return await svc.report(db, user, session_id)
