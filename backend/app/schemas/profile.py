"""CandidateProfile: the structured resume that every module builds on.

This Pydantic model does double duty:
1. It is the JSON schema we hand the LLM ("fill exactly this shape").
2. It validates what comes back, so a malformed LLM answer fails loudly, not silently.

Field descriptions are sent to the LLM, so they double as extraction instructions.
"""

from pydantic import BaseModel, Field


class Contact(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    links: list[str] = Field(default_factory=list, description="LinkedIn, GitHub, portfolio URLs")


class Experience(BaseModel):
    title: str
    company: str
    location: str | None = None
    start_date: str | None = Field(None, description="As written, e.g. 'Jun 2022'")
    end_date: str | None = Field(None, description="As written, or 'Present'")
    highlights: list[str] = Field(
        default_factory=list, description="Each bullet point copied verbatim from the resume"
    )
    technologies: list[str] = Field(default_factory=list)


class Project(BaseModel):
    name: str
    description: str | None = None
    highlights: list[str] = Field(
        default_factory=list, description="Each bullet point copied verbatim from the resume"
    )
    technologies: list[str] = Field(default_factory=list)
    link: str | None = None


class Education(BaseModel):
    degree: str
    institution: str
    start_date: str | None = None
    end_date: str | None = None
    grade: str | None = Field(None, description="CGPA / percentage if stated")


class CandidateProfile(BaseModel):
    contact: Contact = Field(default_factory=Contact)
    summary: str | None = Field(None, description="Professional summary, verbatim if present")
    total_years_experience: float | None = Field(
        None, description="Total professional experience in years, computed from dates"
    )
    skills: list[str] = Field(
        default_factory=list, description="Every skill/tool/technology explicitly mentioned"
    )
    experience: list[Experience] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
