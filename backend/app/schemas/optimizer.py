"""Schemas for the ATS Resume Optimizer.

Two kinds of models live here:
- LLM output shapes (JDAnalysis, GapAnalysis, OptimizedResume, VerificationReport):
  handed to Groq as strict JSON schemas, so field descriptions are instructions.
- Code-computed results (AtsReport, KeywordMatch) and API request/response models.
"""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------- job description (LLM)
class JDAnalysis(BaseModel):
    title: str | None = Field(None, description="Job title as written")
    company: str | None = None
    seniority: Literal["intern", "entry", "mid", "senior", "lead", "unknown"] = "unknown"
    min_years_experience: float | None = Field(None, description="Only if explicitly stated")
    must_have_skills: list[str] = Field(
        default_factory=list,
        description="Skills/tools explicitly required (required, must have, you have...). "
        "Short canonical names, e.g. 'PostgreSQL', 'REST APIs', 'Docker'.",
    )
    nice_to_have_skills: list[str] = Field(
        default_factory=list, description="Skills marked preferred, bonus, nice to have, plus"
    )
    responsibilities: list[str] = Field(default_factory=list, description="Main duties, short")
    keywords: list[str] = Field(
        default_factory=list,
        description="Other important domain terms an ATS would scan for (e.g. 'microservices', "
        "'payments', 'CI/CD'), excluding the skills above",
    )


# ---------------------------------------------------------------- ATS audit (code)
class AtsRuleResult(BaseModel):
    id: str
    label: str
    passed: bool
    weight: int
    detail: str


class AtsReport(BaseModel):
    score: float  # 0-100, weighted share of passed rules
    rules: list[AtsRuleResult]


# ---------------------------------------------------------------- keyword match (code)
class KeywordMatch(BaseModel):
    score: float  # 0-100
    matched_must: list[str]
    missing_must: list[str]
    matched_nice: list[str]
    missing_nice: list[str]
    matched_keywords: list[str]
    missing_keywords: list[str]


# ---------------------------------------------------------------- gap analysis (LLM)
class GapItem(BaseModel):
    skill: str
    status: Literal["implied", "missing"] = Field(
        description="'implied' = the resume shows this skill through related experience "
        "but never names it; 'missing' = no evidence anywhere in the resume"
    )
    evidence_source_ids: list[str] = Field(
        default_factory=list, description="For 'implied': source ids that prove it"
    )
    explanation: str = Field(description="One sentence: the evidence, or why it is missing")
    suggestion: str = Field(
        description="'implied': how to state it honestly; 'missing': how to learn/build it"
    )


class GapAnalysis(BaseModel):
    gaps: list[GapItem] = Field(default_factory=list)
    strengths: list[str] = Field(
        default_factory=list, description="2-4 ways the candidate already fits this job well"
    )
    summary: str = Field(description="2-3 sentence overall fit assessment, honest and specific")


# ---------------------------------------------------------------- rewrite (LLM)
class OptimizedBullet(BaseModel):
    text: str
    source_ids: list[str] = Field(
        description="Ids of the original resume lines this bullet is based on. Required."
    )


class OptimizedEntry(BaseModel):
    """A job or a project in the optimized resume."""

    source_id: str = Field(description="Id of the original entry, e.g. 'exp0' or 'proj1'")
    heading: str = Field(description="Job title / project name, unchanged from the original")
    subheading: str | None = Field(None, description="Company, location and dates, unchanged")
    bullets: list[OptimizedBullet]


class OptimizedResume(BaseModel):
    summary: str = Field(description="Tailored 2-3 sentence professional summary")
    summary_source_ids: list[str] = Field(description="Ids supporting every claim in summary")
    skills: list[str] = Field(description="Skills ordered by relevance to the job")
    experience: list[OptimizedEntry] = Field(default_factory=list)
    projects: list[OptimizedEntry] = Field(default_factory=list)


# ---------------------------------------------------------------- verification (LLM + code)
class VerificationIssue(BaseModel):
    location: str = Field(description="'summary', or the bullet's position like 'exp0.bullet2'")
    text: str = Field(description="The rewritten text that has the problem")
    problem: str = Field(description="Exactly which claim is not supported by the sources")


class VerificationReport(BaseModel):
    issues: list[VerificationIssue] = Field(default_factory=list)


# ---------------------------------------------------------------- API
class OptimizeRequest(BaseModel):
    resume_id: uuid.UUID
    jd_text: str | None = Field(None, max_length=20_000)


class AnalysisResult(BaseModel):
    """Fast ATS check: format audit + (if a JD was given) keyword match and gaps."""

    ats: AtsReport
    jd: JDAnalysis | None = None
    match: KeywordMatch | None = None
    gaps: GapAnalysis | None = None
    overall_score: float


class ResumeVersionOut(BaseModel):
    id: uuid.UUID
    resume_id: uuid.UUID
    created_at: datetime
    job_title: str | None
    overall_score: float | None
    verified: bool
    content: OptimizedResume
    analysis: AnalysisResult
    verification: dict  # attempts, issues found/fixed, bullets reverted
