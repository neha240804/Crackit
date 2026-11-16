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
