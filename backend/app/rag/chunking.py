"""Turn a CandidateProfile into retrievable chunks.

We chunk by *meaning* (one job, one project, the skills list...) instead of every N
characters. Each chunk gets a stable `source_id` (e.g. "exp0", "proj1") so later agents
can cite exactly which part of the resume a claim comes from: the basis of the
"never fabricate" guarantee in the Resume Optimizer.
"""

from langchain_core.documents import Document

from app.schemas.profile import CandidateProfile


def profile_to_documents(
    profile: CandidateProfile, user_id: str, resume_id: str
) -> list[Document]:
    base = {"user_id": user_id, "resume_id": resume_id}
    docs: list[Document] = []

    def add(section: str, source_id: str, text: str) -> None:
        if text.strip():
            meta = {**base, "section": section, "source_id": source_id}
            docs.append(Document(page_content=text.strip(), metadata=meta))

    if profile.summary:
        add("summary", "summary", f"Summary: {profile.summary}")

    if profile.skills:
        add("skills", "skills", "Skills: " + ", ".join(profile.skills))

    for i, exp in enumerate(profile.experience):
        dates = " - ".join(d for d in [exp.start_date, exp.end_date] if d)
        lines = [f"{exp.title} at {exp.company} ({dates})"]
        lines += [f"- {h}" for h in exp.highlights]
        if exp.technologies:
            lines.append("Technologies: " + ", ".join(exp.technologies))
        add("experience", f"exp{i}", "\n".join(lines))

    for i, proj in enumerate(profile.projects):
        lines = [f"Project: {proj.name}"]
        if proj.description:
            lines.append(proj.description)
        lines += [f"- {h}" for h in proj.highlights]
        if proj.technologies:
            lines.append("Technologies: " + ", ".join(proj.technologies))
        add("project", f"proj{i}", "\n".join(lines))

    if profile.education:
        add(
            "education",
            "education",
            "\n".join(
                f"{e.degree}, {e.institution}" + (f" ({e.grade})" if e.grade else "")
                for e in profile.education
            ),
        )

    extras = [f"Certification: {c}" for c in profile.certifications]
    extras += [f"Achievement: {a}" for a in profile.achievements]
    add("other", "other", "\n".join(extras))

    return docs
