"""Fast unit tests: no network, no LLM, no database.

Run from the backend folder:  uv run pytest
"""

import uuid
from pathlib import Path

from app.agents.profile.graph import END, route_after_extract
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.rag.chunking import profile_to_documents
from app.schemas.profile import CandidateProfile, Experience, Project
from app.services.document_text import extract_text

FIXTURES = Path(__file__).parent / "fixtures"


# ---------------------------------------------------------------- security
def test_password_hash_roundtrip():
    hashed = hash_password("password123")
    assert hashed != "password123"
    assert verify_password("password123", hashed)
    assert not verify_password("wrong-password", hashed)


def test_jwt_roundtrip_and_tampering():
    user_id = uuid.uuid4()
    token = create_access_token(user_id)
    assert decode_access_token(token) == user_id
    assert decode_access_token(token + "x") is None
    assert decode_access_token("not-a-token") is None


# ---------------------------------------------------------------- text extraction
def test_extract_docx_reads_all_sections():
    text = extract_text(FIXTURES / "sample_resume.docx")
    for expected in ["Arjun Mehta", "FinCore Technologies", "Resume Matcher", "Apache Airflow"]:
        assert expected in text


# ---------------------------------------------------------------- chunking
def test_chunks_have_stable_source_ids_and_user_scope():
    profile = CandidateProfile(
        summary="Backend engineer",
        skills=["Python", "FastAPI"],
        experience=[
            Experience(title="SE", company="A", highlights=["Built X"]),
            Experience(title="SE2", company="B", highlights=["Built Y"]),
        ],
        projects=[Project(name="P", highlights=["Did Z"])],
    )
    docs = profile_to_documents(profile, user_id="u1", resume_id="r1")
    ids = [d.metadata["source_id"] for d in docs]
    assert ids == ["summary", "skills", "exp0", "exp1", "proj0"]
    assert all(d.metadata["user_id"] == "u1" and d.metadata["resume_id"] == "r1" for d in docs)
    assert "- Built Y" in docs[3].page_content


def test_empty_sections_produce_no_chunks():
    docs = profile_to_documents(CandidateProfile(), user_id="u1", resume_id="r1")
    assert docs == []


# ---------------------------------------------------------------- skill merging
def test_merge_skills_adds_technologies_and_dedupes_case_insensitively():
    from app.agents.profile.graph import merge_skills

    profile = CandidateProfile(
        skills=["Python", "Docker"],
        experience=[Experience(title="SE", company="A", technologies=["docker", "Redis"])],
        projects=[Project(name="P", technologies=["Qdrant", " python "])],
    )
    assert merge_skills(profile) == ["Python", "Docker", "Redis", "Qdrant"]


# ---------------------------------------------------------------- graph routing
def test_route_stops_on_extraction_error():
    assert route_after_extract({"error": "scanned pdf"}) == END
    assert route_after_extract({"raw_text": "x" * 500}) == "parse_profile"


def test_question_bank_tracks_are_labelled_and_complete():
    """Every question-bank file has a track id with a display label, and every electrical
    track exists in the bank (the Prep page groups and orders tracks by these ids)."""
    from app.rag.knowledge_base import load_documents
    from app.services.prep_service import ELECTRICAL_TRACKS, TRACK_LABELS

    docs = [d for d in load_documents() if d.metadata["doc_type"] == "questions"]
    families = {d.metadata["role_family"] for d in docs}
    assert families <= set(TRACK_LABELS), families - set(TRACK_LABELS)
    assert ELECTRICAL_TRACKS <= families
    for d in docs:  # sections stay small: the interviewer puts two of them in every turn
        assert len(d.page_content) < 1600, d.metadata["topic"]


def test_every_question_bank_line_is_tagged_by_difficulty():
    """Each question line starts with Easy:, Intermediate: or Hard: (no experience tags left)."""
    import re

    from app.rag.knowledge_base import KB_DIR

    allowed = re.compile(r"^(Easy|Intermediate|Hard): ")
    old = re.compile(r"^(Fresher|Mid|Senior|All levels|Follow-up|Numerical): ")
    for path in (KB_DIR / "questions").glob("*.md"):
        lines = path.read_text(encoding="utf-8").splitlines()
        assert not [ln for ln in lines if old.match(ln)], path.name
        assert sum(bool(allowed.match(ln)) for ln in lines) >= 4, path.name


def test_no_numerical_questions_anywhere():
    """Product decision: no question may need a calculation. The bank has no numericals and
    every prompt that writes questions forbids them (REAL_QUESTION_STYLE + the switch)."""
    import re

    from app.agents.common.levels import LEVEL_GUIDE, REAL_QUESTION_STYLE
    from app.agents.interview.prompts import INTERVIEWER_PROMPT, PLAN_PROMPT, SWITCH_PROMPT
    from app.rag.knowledge_base import KB_DIR
    from app.services import prep_service

    calc = re.compile(r"\(numerical\)|\b(calculate|find the (value|current|voltage|speed|slip|rating|equivalent|time constant)|work out|how much \w+ (do|does|is))\b", re.IGNORECASE)
    for path in (KB_DIR / "questions").glob("*.md"):
        bad = [ln for ln in path.read_text(encoding="utf-8").splitlines()
               if re.match(r"^(Easy|Intermediate|Hard): ", ln) and calc.search(ln)]
        assert not bad, (path.name, bad)
    assert "NEVER ask a numerical or calculation question" in REAL_QUESTION_STYLE
    for prompt in (PLAN_PROMPT, INTERVIEWER_PROMPT, prep_service.PREP_PROMPT):
        assert "{question_style}" in prompt
    assert "calculation" in SWITCH_PROMPT
    for text in (*LEVEL_GUIDE.values(), prep_service.PREP_PROMPT):
        assert not re.search(r"short calculation|quick calculation|numericals with|numerical problem whose", text)
