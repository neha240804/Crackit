"""The resume as numbered "sources": a compact, line-by-line candidate context.

    exp0        Software Engineer II at FinCore Technologies (Aug 2023 - Present)
    exp0.b1     Cut PostgreSQL report query time by 65% through indexing...
    exp0.tech   FastAPI, PostgreSQL, Docker
    skills      Python, FastAPI, ...

Resume- and JD-based interviews give this to the interviewer, so questions can refer to the
candidate's real projects and experience.
"""

from app.schemas.profile import CandidateProfile


def build_sources(profile: CandidateProfile) -> dict[str, str]:
    src: dict[str, str] = {}
    if profile.summary:
        src["summary"] = profile.summary
    if profile.skills:
        src["skills"] = ", ".join(profile.skills)
    if profile.total_years_experience is not None:
        src["years"] = f"{profile.total_years_experience} years of professional experience"

    for i, e in enumerate(profile.experience):
        dates = " - ".join(d for d in [e.start_date, e.end_date] if d)
        src[f"exp{i}"] = f"{e.title} at {e.company}" + (f" ({dates})" if dates else "")
        for j, h in enumerate(e.highlights):
            src[f"exp{i}.b{j}"] = h
        if e.technologies:
            src[f"exp{i}.tech"] = ", ".join(e.technologies)

    for i, p in enumerate(profile.projects):
        src[f"proj{i}"] = p.name + (f": {p.description}" if p.description else "")
        for j, h in enumerate(p.highlights):
            src[f"proj{i}.b{j}"] = h
        if p.technologies:
            src[f"proj{i}.tech"] = ", ".join(p.technologies)

    for i, ed in enumerate(profile.education):
        src[f"edu{i}"] = f"{ed.degree}, {ed.institution}" + (f" ({ed.grade})" if ed.grade else "")
    for i, c in enumerate(profile.certifications):
        src[f"cert{i}"] = c
    for i, a in enumerate(profile.achievements):
        src[f"ach{i}"] = a
    return src


def format_sources(sources: dict[str, str]) -> str:
    return "\n".join(f"[{sid}] {text}" for sid, text in sources.items())
