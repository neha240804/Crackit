"""Database tables for Crackit (SQLAlchemy 2.0 typed ORM).

Only what the mock interview needs: users, their resumes (to personalise interviews),
pasted job descriptions, interview sessions and per-question turns. LLM output (parsed
profiles, reports, scores) is stored as JSONB.
"""

import uuid
from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampedBase


def user_fk() -> Mapped[uuid.UUID]:
    return mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)


class User(TimestampedBase):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120))


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


class UsageCounter(Base):
    """How many AI-backed actions a user ran on one day (UTC), per action.

    Enforces the daily budget on the shared Groq key (services/usage.py). In the database,
    not in memory, so a restart doesn't hand everyone a fresh allowance. One small row per
    user, day and action; the composite primary key makes the increment a single upsert."""

    __tablename__ = "usage_counters"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    day: Mapped[date] = mapped_column(Date, primary_key=True)
    action: Mapped[str] = mapped_column(String(30), primary_key=True)
    count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
