"""Unit tests for the deterministic parts of the optimizer (no LLM, no network)."""

from app.agents.optimizer.sources import build_sources, unsupported_numbers
from app.schemas.optimizer import JDAnalysis
from app.schemas.profile import CandidateProfile, Contact, Education, Experience
from app.services.ats_rules import audit_resume
from app.services.keyword_match import match_keywords, normalize, overall_score

GOOD_BULLETS = [
    "Designed FastAPI microservices handling 5M daily payment events with low latency",
    "Reduced PostgreSQL report query time by 65% through indexing and query rewrites",
    "Built ETL pipelines in Python and Airflow ingesting 200 GB of data every day",
]

RAW = (
    "EXPERIENCE\n" + "\n".join(GOOD_BULLETS) + "\nEDUCATION\nB.E.\nSKILLS\nPython, Postgres\n"
    + "filler " * 300
)


def make_profile(**overrides) -> CandidateProfile:
    data = {
        "contact": Contact(name="A", email="a@example.com", phone="123"),
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Airflow", "AWS"],
        "experience": [
            Experience(title="SE", company="X", start_date="2022", highlights=GOOD_BULLETS)
        ],
        "education": [Education(degree="B.E.", institution="Uni")],
    }
    data.update(overrides)
    return CandidateProfile(**data)


# ---------------------------------------------------------------- ATS rules
def test_good_resume_passes_every_rule():
    report = audit_resume(make_profile(), RAW)
    failed = [r.id for r in report.rules if not r.passed]
    assert failed == []
    assert report.score == 100


def test_weak_bullets_lose_points_with_reasons():
    weak = ["I worked on the backend", "my tasks included testing", "helped the team"]
    profile = make_profile(
        experience=[Experience(title="SE", company="X", highlights=weak)],  # no dates either
        contact=Contact(name="A"),
    )
    report = audit_resume(profile, RAW)
    failed = {r.id for r in report.rules if not r.passed}
    assert {"email", "phone", "metrics", "verbs", "pronouns", "dates", "bullet_length"} <= failed
    assert report.score < 50
    assert all(r.detail for r in report.rules)  # every rule explains itself


# ---------------------------------------------------------------- keyword match
def test_aliases_normalise():
    assert normalize("Postgres") == "postgresql"
    assert normalize(" React.js ") == "react"


def test_match_uses_aliases_and_whole_words():
    jd = JDAnalysis(
        must_have_skills=["PostgreSQL", "Python", "Kubernetes", "Go"],
        nice_to_have_skills=["Docker"],
        keywords=["payments"],
    )
    profile = make_profile(skills=["Python", "Postgres", "Docker"])
    m = match_keywords(jd, profile, "built payment and payments systems on google cloud")
    assert m.matched_must == ["PostgreSQL", "Python"]  # Postgres alias counts
    assert m.missing_must == ["Kubernetes", "Go"]  # 'google' must not match 'go'
    assert m.matched_nice == ["Docker"]
    assert m.matched_keywords == ["payments"]
    assert 0 < m.score < 100


def test_overall_score_weights_relevance_when_jd_given():
    jd = JDAnalysis(must_have_skills=["Rust"])
    m = match_keywords(jd, make_profile(), "")
    assert overall_score(90, None) == 90
    assert overall_score(90, m) < 90


# ---------------------------------------------------------------- fabrication guard
def test_unsupported_numbers_catches_invented_metrics():
    sources = build_sources(make_profile())
    assert sources["exp0.b1"].startswith("Reduced PostgreSQL")
    # Number present in the cited source: fine.
    assert unsupported_numbers("Cut query time 65% via indexing", ["exp0.b1"], sources) == set()
    # Invented "3x" and "10,000": caught.
    assert unsupported_numbers(
        "Cut query time 65%, 3x faster for 10,000 users", ["exp0.b1"], sources
    ) == {"3", "10000"}
    # Citing a non-existent id supports nothing.
    assert unsupported_numbers("Saved 65%", ["exp9.b9"], sources) == {"65"}


def test_expand_ids_adds_parent_entry_context_only():
    from app.agents.optimizer.sources import expand_ids

    sources = {"proj0": "Matcher using Qdrant", "proj0.tech": "Qdrant", "proj0.b0": "Indexed 50k",
               "proj1": "Other project", "exp0.b0": "Built X"}
    assert expand_ids(["proj0.b0"], sources) == ["proj0.b0", "proj0", "proj0.tech"]
    assert "proj1" not in expand_ids(["proj0.b0"], sources)  # never other entries
    assert expand_ids(["skills"], sources) == ["skills"]  # unknown parents are ignored


def test_education_table_without_heading_counts_as_education():
    """Indian resumes often head the education table "Examination | University/Board | ..."
    with no "Education" title; that once scored 0 although every degree was parsed."""
    from app.services.ats_rules import HEADINGS

    text = "PROJECTS\nBuilt a relay\n\nExamination University/Board Institute Year CPI/%\nB.E. GTU LDCE 2023-27 8.63"
    assert HEADINGS["education"].search(text)
    assert HEADINGS["education"].search("QUALIFICATIONS\nB.Tech")
    assert not HEADINGS["education"].search("Examined 40 transformers on site")


def test_fragmented_pdf_text_is_detected():
    """pypdf's default mode returns some PDFs one word per line; we then use layout mode."""
    from app.services.document_text import _fragmented

    assert _fragmented("\n \n".join(["word"] * 60))
    assert not _fragmented("\n".join(["Developed an Arduino based protection prototype"] * 60))
