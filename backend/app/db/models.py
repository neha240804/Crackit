"""Database tables for Crackit (SQLAlchemy 2.0 typed ORM).

Users, their resumes (to personalise interviews), pasted job descriptions, interview sessions
and per-question turns, and Question-prep data (starred questions, the current
study set). LLM output (parsed profiles, reports, scores) is stored as JSONB.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedBase


def user_fk() -> Mapped[uuid.UUID]:
    return mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)


class User(TimestampedBase):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120))
    # Login tokens (JWT) issued before this moment are refused (api/deps.py): a password reset
    # signs out every other device, which matters if the account was taken over. Tokens are
    # stateless, so without this a stolen token kept working until it expired (24 h).
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # No Groq API key here, on purpose: a user's own key stays in their browser (encrypted
    # there) and arrives with each request in the X-Groq-Key header, used for that request only
    # (api/deps.py). A database leak or backup can never expose it.


class PasswordResetToken(TimestampedBase):
    """A one-time password-reset link. Only the SHA-256 of the token is stored, so a database
    leak can't be used to reset anyone's password; the token itself exists only in the email."""

    __tablename__ = "password_reset_tokens"

    user_id: Mapped[uuid.UUID] = user_fk()
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Resume(TimestampedBase):
    """Uploaded resume, parsed into a CandidateProfile.

    `purpose` keeps two separate lists: resumes for interviews (resume-/JD-based questions)
    and resumes checked in the ATS tool. Users asked for them not to be mixed: trying a draft
    in the ATS checker must not change which resume the interviewer asks about."""

    __tablename__ = "resumes"

    user_id: Mapped[uuid.UUID] = user_fk()
    filename: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(String(500))
    raw_text: Mapped[str] = mapped_column(Text)
    profile: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String(20), default="processing")  # processing|ready|failed
    error: Mapped[str | None] = mapped_column(Text)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)  # default within its purpose
    purpose: Mapped[str] = mapped_column(
        String(20), default="interview", server_default="interview", index=True
    )  # interview | ats


class JobDescription(TimestampedBase):
    """A job description pasted for a JD-based interview or an ATS check."""

    __tablename__ = "job_descriptions"

    user_id: Mapped[uuid.UUID] = user_fk()
    title: Mapped[str | None] = mapped_column(String(255))
    company: Mapped[str | None] = mapped_column(String(255))
    raw_text: Mapped[str] = mapped_column(Text)
    parsed: Mapped[dict | None] = mapped_column(JSONB)


class ResumeVersion(TimestampedBase):
    """One ATS-optimized rewrite of a resume (optionally tailored to a job description)."""

    __tablename__ = "resume_versions"

    resume_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("resumes.id", ondelete="CASCADE"), index=True
    )
    jd_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("job_descriptions.id", ondelete="SET NULL")
    )
    content: Mapped[dict] = mapped_column(JSONB)  # rewritten resume; each bullet has source_ids
    ats_score: Mapped[float | None] = mapped_column(Float)
    analysis: Mapped[dict | None] = mapped_column(JSONB)  # rule results, gaps, verification
    docx_path: Mapped[str | None] = mapped_column(String(500))
    verified: Mapped[bool] = mapped_column(Boolean, default=False)


class InterviewSession(TimestampedBase):
    __tablename__ = "interview_sessions"

    user_id: Mapped[uuid.UUID] = user_fk()
    # Optional: topic and HR interviews don't need a resume.
    resume_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("resumes.id", ondelete="SET NULL")
    )
    jd_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("job_descriptions.id", ondelete="SET NULL")
    )
    config: Mapped[dict] = mapped_column(JSONB)  # type, topic, level, duration, interviewer, started_at
    thread_id: Mapped[str] = mapped_column(String(64))  # LangGraph checkpoint thread
    status: Mapped[str] = mapped_column(String(20), default="active")  # active|completed
    report: Mapped[dict | None] = mapped_column(JSONB)
    # The candidate's own rating of the interview, asked as it ends: {"rating": 1-5 (emoji
    # scale), "comment": str | None, "at": ISO time}. Product feedback, not shown in reports.
    user_feedback: Mapped[dict | None] = mapped_column(JSONB)

    turns: Mapped[list["InterviewTurn"]] = relationship(
        back_populates="session", order_by="InterviewTurn.seq"
    )


class InterviewTurn(TimestampedBase):
    __tablename__ = "interview_turns"

    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True
    )
    seq: Mapped[int] = mapped_column(Integer)
    category: Mapped[str] = mapped_column(String(30))  # question|follow_up|opening
    question: Mapped[str] = mapped_column(Text)
    transcript: Mapped[str | None] = mapped_column(Text)
    scores: Mapped[dict | None] = mapped_column(JSONB)
    feedback: Mapped[str | None] = mapped_column(Text)

    session: Mapped[InterviewSession] = relationship(back_populates="turns")


class StarredQuestion(TimestampedBase):
    """A Question-prep question the user starred to revise later.

    A full copy (question, model answer, key points, tip) so it survives the study set being
    replaced. Stored per account so stars follow the user to any device (they used to live in
    one browser's localStorage). `key` = normalised question text: one star per question."""

    __tablename__ = "starred_questions"
    __table_args__ = (UniqueConstraint("user_id", "key", name="uq_starred_user_key"),)

    user_id: Mapped[uuid.UUID] = user_fk()
    key: Mapped[str] = mapped_column(String(600))
    question: Mapped[dict] = mapped_column(JSONB)  # PrepQuestion as JSON
    topic: Mapped[str] = mapped_column(String(255))
    experience: Mapped[str] = mapped_column(String(20))  # difficulty of the set it came from


class PrepCurrentSet(TimestampedBase):
    """The user's current Question-prep study set (questions, answers, Got it / Review marks),
    one per user, so a set in progress is there on any device. JSONB: it is only ever read and
    written whole, by the Prep page."""

    __tablename__ = "prep_current_sets"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    data: Mapped[dict] = mapped_column(JSONB)
