"""Schemas for Question prep: study sets of interview questions with model answers.

PrepQuestion / PrepSet are LLM output shapes handed to Groq as STRICT JSON schemas, so
every field is required (no optional fields: strict mode rejects replies that leave one
out). Field descriptions are instructions to the model.
"""

import uuid
from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator, model_validator

from app.agents.common.levels import Level, normalize_level


# ---------------------------------------------------------------- LLM output (strict)
class PrepQuestion(BaseModel):
    question: str = Field(description="One interview question, as an interviewer would ask it")
    difficulty: Literal["easy", "intermediate", "hard"] = Field(
        description="How hard THIS question is, using the same scale as the requested level"
    )
    answer: str = Field(
        description="A model answer the candidate could say out loud: 3-6 sentences, first "
        "sentence answers directly, then explain with one concrete example. Plain text."
    )
    key_points: list[str] = Field(
        description="3-4 short points an interviewer listens for (a few words each)"
    )
    tip: str = Field(
        description="One sentence: a common mistake to avoid, or how to stand out"
    )


class PrepSet(BaseModel):
    questions: list[PrepQuestion]


# ---------------------------------------------------------------- API
class PrepRequest(BaseModel):
    # Either a topic, or a resume (questions about the candidate's own work). With a resume,
    # `topic` is an optional focus such as "projects" or "the internship".
    topic: str | None = Field(None, max_length=120)
    resume_id: uuid.UUID | None = None
    track: str | None = Field(None, max_length=40)  # knowledge-base role_family, if chosen
    # With a resume: "technical" = questions about the projects and roles on it; "hr" = the HR
    # round, personalised (answers built from the resume's real projects, internships, skills).
    kind: Literal["technical", "hr"] = "technical"
    # Difficulty of the set (easy / intermediate / hard); still named `experience` for
    # compatibility, and old saved sets send "fresher", "1-3"... which are mapped.
    experience: Level = "intermediate"
    count: int = Field(6, ge=3, le=10)
    # Questions already shown, so "More questions" never repeats them.
    # Each item is limited too: they are pasted into the prompt (generous for one question; only the last 40 reach the prompt).
    exclude: list[Annotated[str, StringConstraints(max_length=600)]] = Field(default_factory=list, max_length=60)

    @field_validator("experience", mode="before")
    @classmethod
    def legacy_level(cls, value):
        return normalize_level(value)

    @model_validator(mode="after")
    def topic_or_resume(self) -> "PrepRequest":
        if not self.resume_id and len((self.topic or "").strip()) < 2:
            raise ValueError("Give a topic or choose a resume")
        return self


class PrepSetOut(BaseModel):
    topic: str
    experience: Level
    questions: list[PrepQuestion]


class PrepTrack(BaseModel):
    """A curated track from the knowledge base, with its subtopics as quick picks."""

    id: str
    label: str
    topics: list[str]
