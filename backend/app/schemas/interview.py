"""Schemas for the voice mock interview."""

import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator, model_validator

from app.agents.common.levels import Level, normalize_level

InterviewType = Literal["topic", "resume", "jd", "hr"]

# Our own interviewer personas (names + style only; no real people's likenesses).
PERSONAS: dict[str, dict[str, str]] = {
    "maya": {"name": "Maya", "style": "warm and encouraging, but still precise"},
    "arjun": {"name": "Arjun", "style": "direct and technical; asks probing follow-ups"},
    "sara": {"name": "Sara", "style": "calm, structured and friendly; HR-style conversation"},
}

# ---------------------------------------------------------------- API input
class InterviewConfig(BaseModel):
    interview_type: InterviewType
    topic: str | None = Field(None, max_length=120, description="Domain/role, e.g. 'Bias-Variance'")
    # Limit the length of each item too, not just how many: these go into every prompt, so
    # an unbounded string would inflate token use (and cost) on every interviewer turn.
    subtopics: list[Annotated[str, StringConstraints(max_length=120)]] = Field(default_factory=list, max_length=10)
    # The question difficulty (easy / intermediate / hard). Still called `experience` so saved
    # interviews and the API stay compatible; old values ("fresher", "1-3"...) are mapped.
    experience: Level = "intermediate"
    duration_minutes: Literal[5, 10, 15] = 5
    interviewer: Literal["maya", "arjun", "sara"] = "maya"
    resume_id: uuid.UUID | None = None  # resume / jd types; defaults to the primary resume
    jd_text: str | None = Field(None, max_length=20_000)

    @field_validator("experience", mode="before")
    @classmethod
    def legacy_level(cls, value):
        return normalize_level(value)

    @model_validator(mode="after")
    def check_required_fields(self):
        if self.interview_type == "topic" and not (self.topic or "").strip():
            raise ValueError("A topic is required for a topic interview")
        if self.interview_type == "jd" and not (self.jd_text or "").strip():
            raise ValueError("Paste a job description for a JD-based interview")
        return self


# ---------------------------------------------------------------- LLM outputs
class InterviewPlan(BaseModel):
    focus_areas: list[str] = Field(
        description="4-6 specific, interview-worthy themes to cover, in order; never vague "
                    "areas like basics or fundamentals. Short labels."
    )
    title: str = Field(description="Short display title for this interview, max 6 words, "
                                   "naming the topic (no words like Basics or Fundamentals)")


class InterviewerTurn(BaseModel):
    """One interviewer turn: assess the last answer, react to it, then ask the next question."""

    assessment: Literal["correct", "partially_correct", "incorrect", "unclear", "not_applicable"]
    reaction: str = Field(
        description="1-2 short spoken sentences reacting specifically to what the candidate said"
    )
    # "hint" replaced "correct_and_probe": the interviewer no longer corrects by giving the
    # answer; it hints and lets the candidate retry the same question once.
    next_move: Literal["dig_deeper", "clarify", "hint", "new_topic"]
    question: str = Field(description="Exactly ONE spoken question, max 35 words")
    focus_area: str = Field(description="Focus area this question belongs to (reuse the exact "
                                        "label when staying on the same thread)")


class InterviewerTurnWithSwitch(InterviewerTurn):
    """Used only when the candidate is already struggling: the same call also drafts what to
    say if we move on, so code can switch topics without a second LLM call.

    A SEPARATE schema with REQUIRED fields: Groq's strict mode treats every field as
    required, so optional "fill only if instructed" fields on InterviewerTurn made it reject
    replies that left them out (HTTP 400 json_validate_failed), which broke a live interview.
    """

    switch_reaction: str = Field(description="Warm encouragement WITHOUT giving the answer, "
                                             "then a transition to the next topic")
    switch_question: str = Field(description="ONE clear, concrete question about the next "
                                             "topic, at the candidate's level (not a definition)")


class QuestionFeedback(BaseModel):
    question_index: int = Field(description="1-based index of the question in the transcript")
    score: int = Field(ge=0, le=10)
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    ideal_answer: str = Field(description="2-4 sentence outline of a strong answer")


class InterviewReport(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    technical_score: int = Field(ge=0, le=100, description="Knowledge and correctness")
    communication_score: int = Field(ge=0, le=100, description="Clarity, pace, conciseness")
    structure_score: int = Field(ge=0, le=100, description="Organisation; STAR for behavioral")
    summary: str = Field(description="3-4 sentence overall assessment, honest and specific")
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    next_steps: list[str] = Field(default_factory=list, description="Concrete practice actions")
    questions: list[QuestionFeedback] = Field(default_factory=list)


# ---------------------------------------------------------------- API output
class Message(BaseModel):
    role: Literal["interviewer", "candidate"]
    text: str
    kind: str | None = None  # opening | question | follow_up | closing | answer
    duration_sec: float | None = None


class InterviewFeedbackIn(BaseModel):
    """How the interview felt, asked as it ends: an emoji scale, 1 (bad) to 5 (great)."""

    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(None, max_length=1000)


class InterviewTurnOut(BaseModel):
    """What the client needs after each step."""

    utterance: str | None  # interviewer's next line to speak (None while nothing is pending)
    kind: str | None
    done: bool
    remaining_seconds: int
    transcript: str | None = None  # the candidate's transcribed answer (on /answer)
    # The utterance split for the voice (already being generated on the server, in order).
    # Empty with the browser voice: the server voices nothing.
    speech_chunks: list[str] = []
    # Which voice the room uses for this line: the student's browser voice, or the server
    # voice (/tts). From settings.tts_engine, so the whole interview keeps one voice.
    voice: Literal["browser", "server"] = "browser"


class TranscriptOut(BaseModel):
    text: str
    duration_sec: float | None


class InterviewSessionOut(BaseModel):
    id: uuid.UUID
    status: str
    title: str
    created_at: datetime
    config: dict
    interviewer_name: str
    remaining_seconds: int
    messages: list[Message]
    current: InterviewTurnOut | None
    report: dict | None


class InterviewSummaryOut(BaseModel):
    id: uuid.UUID
    status: str
    title: str
    created_at: datetime
    duration_minutes: int
    overall_score: int | None
