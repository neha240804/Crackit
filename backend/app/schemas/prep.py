"""Schemas for Question prep: study sets of interview questions with model answers.

PrepQuestion / PrepSet are LLM output shapes handed to Groq as STRICT JSON schemas, so
every field is required (no optional fields: strict mode rejects replies that leave one
out). Field descriptions are instructions to the model.
"""

import uuid
from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, model_validator

Experience = Literal["fresher", "1-3", "3-5", "5+"]


# ---------------------------------------------------------------- LLM output (strict)
class PrepQuestion(BaseModel):
    question: str = Field(description="One interview question, as an interviewer would ask it")
    difficulty: Literal["easy", "medium", "hard"]
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
    experience: Experience = "fresher"
    count: int = Field(6, ge=3, le=10)
    # Questions already shown, so "More questions" never repeats them.
    # Each item is limited too: they are pasted into the prompt (generous for one question; only the last 40 reach the prompt).
    exclude: list[Annotated[str, StringConstraints(max_length=600)]] = Field(default_factory=list, max_length=60)

    @model_validator(mode="after")
    def topic_or_resume(self) -> "PrepRequest":
        if not self.resume_id and len((self.topic or "").strip()) < 2:
            raise ValueError("Give a topic or choose a resume")
        return self


class PrepSetOut(BaseModel):
    topic: str
    experience: Experience
    questions: list[PrepQuestion]


class PrepTrack(BaseModel):
    """A curated track from the knowledge base, with its subtopics as quick picks."""

    id: str
    label: str
    topics: list[str]
