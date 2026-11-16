"""Interview business logic: start, answer (voice or text), end, report, history."""

import logging
import time
import uuid

import groq
from fastapi import HTTPException, UploadFile, status
from langgraph.types import Command
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.interview import runtime
from app.agents.interview.graph import answered_pairs, build_report, remaining_seconds
from app.agents.profile.sources import build_sources, format_sources
from app.db.models import InterviewSession, InterviewTurn, JobDescription, Resume, User
from app.schemas.interview import (
    PERSONAS,
    InterviewConfig,
    InterviewSessionOut,
    InterviewSummaryOut,
    InterviewTurnOut,
    Message,
    TranscriptOut,
)
from app.schemas.profile import CandidateProfile
from app.services import stt, tts

MAX_AUDIO_BYTES = 10 * 1024 * 1024
logger = logging.getLogger(__name__)


def _ai_error(exc: Exception, session: InterviewSession) -> HTTPException:
    """Turn an AI failure into an honest message, and log the real exception. (A blanket
    "rate limit" message once hid a schema bug: the cause never reached the logs.)"""
    logger.exception("Interview %s: interviewer step failed", session.id)
    cause = exc
    while cause.__cause__ is not None and not isinstance(cause, groq.RateLimitError):
        cause = cause.__cause__
    if isinstance(cause, groq.RateLimitError):
        return HTTPException(503, "The AI interviewer is busy right now (free-tier rate limit). "
                                  "Wait a few seconds and answer again.")
    return HTTPException(502, f"The AI interviewer hit an error ({exc.__class__.__name__}). "
                              "Please answer again.")


def _cfg(session: InterviewSession) -> dict:
    return {"configurable": {"thread_id": session.thread_id},
            "run_name": "mock_interview", "tags": ["interview"],
            "metadata": {"session_id": str(session.id)}}


async def _primary_or_given_resume(db: AsyncSession, user: User, resume_id) -> Resume | None:
    if resume_id:
        resume = await db.get(Resume, resume_id)
        if resume is None or resume.user_id != user.id:
            raise HTTPException(404, "Resume not found")
        return resume
    return await db.scalar(select(Resume).where(Resume.user_id == user.id, Resume.is_primary))


def _context(config: InterviewConfig, resume: Resume | None) -> str:
    """Candidate context for the agents: resume facts (resume/jd types) and/or the JD."""
    parts = []
    if config.interview_type in ("resume", "jd") and resume and resume.profile:
        profile = CandidateProfile.model_validate(resume.profile)
        sources = {k: v for k, v in build_sources(profile).items() if not k.startswith("edu")}
        parts.append("RESUME:\n" + format_sources(sources))
    if config.interview_type == "jd" and config.jd_text:
        parts.append("JOB DESCRIPTION:\n" + config.jd_text[:4000])
    return "\n\n".join(parts)


def _turn_out(
    values: dict, interrupted: dict | None, transcript: str | None = None, stream: str = "default"
) -> InterviewTurnOut:
    interviewer = values["config"]["interviewer"]
    if interrupted is not None:  # graph paused: waiting for the candidate
        return InterviewTurnOut(utterance=interrupted["utterance"], kind=interrupted["kind"],
                                done=False, remaining_seconds=remaining_seconds(values),
                                transcript=transcript,
                                # start generating the voice now, before the browser asks
                                speech_chunks=tts.presynthesize(interrupted["utterance"], interviewer, stream))
    last = values["messages"][-1]  # graph finished: the closing line
    return InterviewTurnOut(utterance=last["text"], kind=last["kind"], done=True,
                            remaining_seconds=0, transcript=transcript,
                            speech_chunks=tts.presynthesize(last["text"], interviewer, stream))


def _interrupt_value(out: dict) -> dict | None:
    pending = out.get("__interrupt__")
    return pending[0].value if pending else None


async def start(db: AsyncSession, user: User, config: InterviewConfig) -> InterviewSessionOut:
    resume = await _primary_or_given_resume(db, user, config.resume_id)
    if config.interview_type in ("resume", "jd") and (resume is None or resume.status != "ready"):
        raise HTTPException(409, "Upload and parse a resume first (Resume Studio)")

    jd_row = None
    if config.interview_type == "jd":
        jd_row = JobDescription(user_id=user.id, raw_text=config.jd_text or "")
        db.add(jd_row)
        await db.flush()

    session_id = uuid.uuid4()
    session = InterviewSession(
        id=session_id, user_id=user.id, resume_id=resume.id if resume else None,
        jd_id=jd_row.id if jd_row else None, thread_id=str(session_id), status="active",
        config=config.model_dump(mode="json", exclude={"jd_text"}),
    )
    db.add(session)
    await db.commit()

    try:
        out = await runtime.get_graph().ainvoke(
            {"config": config.model_dump(mode="json"), "context": _context(config, resume)},
            _cfg(session),
        )
    except Exception as exc:
        await db.delete(session)
        await db.commit()
        raise HTTPException(502, f"Could not start the interview ({exc.__class__.__name__}). "
                                 "Please try again.") from exc

    session.config = {**session.config, "title": out["plan"]["title"]}
    await db.commit()
    return await get(db, user, session.id)


async def _get_session(db: AsyncSession, user: User, session_id: uuid.UUID) -> InterviewSession:
    session = await db.get(InterviewSession, session_id)
    if session is None or session.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
    return session


async def _ensure_waiting(session: InterviewSession) -> tuple:
    """The graph's next step(s). "listen" = waiting for an answer (normal). "interviewer" =
    a previous attempt recorded the answer but the interviewer step then failed (e.g. a
    rate limit): still recoverable, see answer() and end(). Anything else is a conflict."""
    snapshot = await runtime.get_graph().aget_state(_cfg(session))
    pending = snapshot.next or ()
    if session.status != "active" or not ({"listen", "interviewer"} & set(pending)):
        raise HTTPException(409, "This interview is not waiting for an answer")
    return pending


def _deadline(session: InterviewSession) -> float | None:
    started = session.config.get("started_at")
    return started + session.config["duration_minutes"] * 60 if started else None


async def begin(db: AsyncSession, user: User, session_id: uuid.UUID) -> InterviewTurnOut:
    """Start the interview clock when the candidate presses Start.

    Idempotent: a refresh/resume doesn't restart it. The start time lives in the DB row;
    each answer then passes the deadline into the graph via the resume value, so we never
    edit the paused graph's checkpoint (tried that: the saved state lost its pending
    interrupt, and a second call crashed with IndexError).
    """
    session = await _get_session(db, user, session_id)
    await _ensure_waiting(session)
    if not session.config.get("started_at"):
        session.config = {**session.config, "started_at": time.time()}
        await db.commit()
    snapshot = await runtime.get_graph().aget_state(_cfg(session))
    values = {**snapshot.values, "deadline": _deadline(session)}
    return _turn_out(values, snapshot.interrupts[0].value, stream=str(session.id))


async def transcribe_only(
    db: AsyncSession, user: User, session_id: uuid.UUID, audio: UploadFile
) -> TranscriptOut:
    """Speech-to-text WITHOUT touching the interview: the browser calls this speculatively
    after ~1 s of silence, so the text is ready when the 2 s auto-submit fires (if the
    candidate keeps talking, the browser just discards it)."""
    session = await _get_session(db, user, session_id)
    data = await audio.read()
    if len(data) > MAX_AUDIO_BYTES:
        raise HTTPException(413, "Recording is too long")
    cfg = session.config
    vocab = ", ".join(filter(None, [cfg.get("topic"), *cfg.get("subtopics", [])]))
    try:
        text, duration = await stt.transcribe(data, audio.filename or "answer.webm", vocab)
    except Exception as exc:
        raise HTTPException(502, f"Speech recognition failed ({exc.__class__.__name__})") from exc
    return TranscriptOut(text=text, duration_sec=duration)


async def answer(
    db: AsyncSession, user: User, session_id: uuid.UUID,
    audio: UploadFile | None, text: str | None, duration_sec: float | None,
) -> InterviewTurnOut:
    session = await _get_session(db, user, session_id)
    pending = await _ensure_waiting(session)

    if audio is not None:
        data = await audio.read()
        if len(data) > MAX_AUDIO_BYTES:
            raise HTTPException(413, "Recording is too long")
        cfg = session.config
        vocab = ", ".join(filter(None, [cfg.get("topic"), *cfg.get("subtopics", [])]))
        try:
            text, duration_sec = await stt.transcribe(data, audio.filename or "answer.webm", vocab)
        except Exception as exc:
            raise HTTPException(502, f"Speech recognition failed ({exc.__class__.__name__})") from exc
    text = (text or "").strip()
    if not text:
        raise HTTPException(422, "We couldn't hear an answer. Please try speaking again.")
    if not session.config.get("started_at"):  # client never called /begin: start the clock now
        session.config = {**session.config, "started_at": time.time()}
        await db.commit()

    graph = runtime.get_graph()
    try:
        if "interviewer" in pending:
            # A previous attempt recorded an answer, then the interviewer step failed. Replace
            # that answer with this one and retry the step (as if `listen` had produced it).
            msgs = (await graph.aget_state(_cfg(session))).values["messages"]
            if msgs and msgs[-1]["role"] == "candidate":
                msgs = msgs[:-1]
            new = {"role": "candidate", "text": text, "kind": "answer", "duration_sec": duration_sec}
            await graph.aupdate_state(_cfg(session), {"messages": [*msgs, new],
                                                      "deadline": _deadline(session)}, as_node="listen")
            out = await graph.ainvoke(None, _cfg(session))
        else:
            out = await graph.ainvoke(
                Command(resume={"text": text, "duration_sec": duration_sec,
                                "deadline": _deadline(session)}), _cfg(session))
    except Exception as exc:
        raise _ai_error(exc, session) from exc
    if out.get("done"):
        session.status = "completed"
        await db.commit()
    return _turn_out(out, _interrupt_value(out), transcript=text, stream=str(session.id))


async def end(db: AsyncSession, user: User, session_id: uuid.UUID) -> InterviewTurnOut:
    session = await _get_session(db, user, session_id)
    pending = await _ensure_waiting(session)
    graph = runtime.get_graph()
    if "interviewer" in pending:  # stuck after a failed step: end from there
        await graph.aupdate_state(_cfg(session), {"ended_by_user": True}, as_node="listen")
        out = await graph.ainvoke(None, _cfg(session))
    else:
        out = await graph.ainvoke(Command(resume={"end": True}), _cfg(session))
    session.status = "completed"
    await db.commit()
    return _turn_out(out, None, stream=str(session.id))


async def report(db: AsyncSession, user: User, session_id: uuid.UUID) -> dict:
    session = await _get_session(db, user, session_id)
    if session.report:
        return session.report  # already generated: idempotent
    if session.status != "completed":
        raise HTTPException(409, "Finish the interview first")
    values = (await runtime.get_graph().aget_state(_cfg(session))).values
    try:
        result = await build_report(values)
    except Exception as exc:
        raise HTTPException(502, f"Report generation failed ({exc.__class__.__name__}). "
                                 "Please retry.") from exc

    # Also store each answered question as a row: queryable history beyond the JSON report.
    feedback = {q["question_index"]: q for q in result["questions"]}
    for i, (q, a) in enumerate(answered_pairs(values["messages"]), 1):
        f = feedback.get(i, {})
        db.add(InterviewTurn(
            session_id=session.id, seq=i, category=q.get("kind", "question"),
            question=q["text"], transcript=a["text"],
            scores={"score": f.get("score"), "metrics": f.get("metrics")},
            feedback="; ".join(f.get("improvements", [])) or None,
        ))
    session.report = result
    await db.commit()
    return result


async def get(db: AsyncSession, user: User, session_id: uuid.UUID) -> InterviewSessionOut:
    session = await _get_session(db, user, session_id)
    snapshot = await runtime.get_graph().aget_state(_cfg(session))
    values = snapshot.values or {}
    messages = values.get("messages", [])
    current = None
    if session.status == "active" and snapshot.interrupts:
        current = _turn_out(values, snapshot.interrupts[0].value, stream=str(session.id))
    cfg = session.config
    return InterviewSessionOut(
        id=session.id, status=session.status, title=cfg.get("title") or cfg.get("topic") or "Interview",
        created_at=session.created_at, config=cfg,
        interviewer_name=PERSONAS[cfg["interviewer"]]["name"],
        remaining_seconds=(remaining_seconds({**values, "deadline": _deadline(session)})
                           if values.get("config") else 0),
        messages=[Message(**{k: m.get(k) for k in ("role", "text", "kind", "duration_sec")})
                  for m in messages],
        current=current, report=session.report,
    )


async def history(db: AsyncSession, user: User) -> list[InterviewSummaryOut]:
    rows = await db.scalars(select(InterviewSession).where(InterviewSession.user_id == user.id)
                            .order_by(InterviewSession.created_at.desc()))
    return [InterviewSummaryOut(
        id=s.id, status=s.status, created_at=s.created_at,
        title=s.config.get("title") or s.config.get("topic") or "Interview",
        duration_minutes=s.config.get("duration_minutes", 0),
        overall_score=(s.report or {}).get("overall_score"),
    ) for s in rows]
