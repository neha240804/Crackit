"""Profile graph: resume file -> structured CandidateProfile -> searchable chunks in Qdrant.

LangGraph in four ideas:
1. STATE   A typed dict that flows through the graph. Each node reads it and returns only
           the keys it wants to update; LangGraph merges them in.
2. NODES   Plain Python functions (sync or async), each doing one job.
3. EDGES   Fixed arrows ("after A, run B") or conditional ones (a function picks the next node).
4. COMPILE Turns the definition into a runnable you call with .ainvoke(state).

    START -> extract_text --(text ok?)--> parse_profile -> index_chunks -> END
                              \\--(empty/scanned)--> END (with error)
"""

import uuid
from pathlib import Path
from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.agents.common.llm import get_structured_llm
from app.rag.chunking import profile_to_documents
from app.rag.vectorstore import RESUME_CHUNKS, delete_resume_chunks, get_vectorstore
from app.schemas.profile import CandidateProfile
from app.services.document_text import extract_text

MIN_TEXT_CHARS = 200  # less than this usually means a scanned/image-only PDF

PARSE_PROMPT = """You are a precise resume parser. Extract the candidate's information into \
the given JSON schema.

Rules:
- Use ONLY information written in the resume. Never guess, infer or add anything.
- Copy bullet points verbatim into `highlights`; do not rephrase or merge them.
- `skills`: every skill, tool, language, framework or platform explicitly mentioned anywhere.
- `technologies` on an experience/project: only those mentioned for that entry.
- If something is missing, leave it null or empty.
- PDF text extraction sometimes splits words written in small capitals or wide letter \
spacing, e.g. "S HARMA R AHUL" or "J OHN  D OE". Rejoin such fragments into normal words \
with normal capitalisation ("Sharma Rahul", "John Doe"), keeping the words in exactly the \
order written: never reorder name parts. Fix only these extraction artefacts; never change \
the wording itself.
- `total_years_experience`: sum of professional (non-internship-overlapping) job durations, \
or null if dates are unclear."""


class ProfileState(TypedDict, total=False):
    # inputs
    file_path: str
    user_id: str
    resume_id: str
    # produced by nodes
    raw_text: str
    profile: dict
    chunks_indexed: int
    error: str


# ------------------------------------------------------------------ nodes
def extract_text_node(state: ProfileState) -> dict:
    text = extract_text(Path(state["file_path"]))
    if len(text) < MIN_TEXT_CHARS:
        return {
            "raw_text": text,
            "error": "Could not read enough text. Is this a scanned/image PDF? "
            "Please upload a text-based PDF or DOCX.",
        }
    return {"raw_text": text}


async def parse_profile_node(state: ProfileState) -> dict:
    # Strong tier: parsing runs once per resume and everything downstream depends on it.
    llm = get_structured_llm(CandidateProfile, tier="strong")
    profile: CandidateProfile = await llm.ainvoke(
        [SystemMessage(PARSE_PROMPT), HumanMessage(f"RESUME:\n\n{state['raw_text']}")]
    )
    profile.skills = merge_skills(profile)
    return {"profile": profile.model_dump()}


def merge_skills(profile: CandidateProfile) -> list[str]:
    """Skills = skills section + every technology named in experience/projects.

    Done in code, not by the LLM: in testing, the LLM sometimes included project
    technologies in `skills` and sometimes didn't (39 vs 57 on the same resume).
    Deterministic rules belong in code. Order is kept; duplicates are dropped
    case-insensitively ("Docker" == "docker").
    """
    candidates = list(profile.skills)
    for item in [*profile.experience, *profile.projects]:
        candidates += item.technologies
    seen: set[str] = set()
    merged: list[str] = []
    for skill in candidates:
        key = skill.strip().lower()
        if key and key not in seen:
            seen.add(key)
            merged.append(skill.strip())
    return merged


def index_chunks_node(state: ProfileState) -> dict:
    profile = CandidateProfile.model_validate(state["profile"])
    docs = profile_to_documents(profile, state["user_id"], state["resume_id"])

    # Deterministic ids: re-processing the same resume overwrites its chunks, no duplicates.
    ids = [
        str(uuid.uuid5(uuid.NAMESPACE_URL, f"{state['resume_id']}:{d.metadata['source_id']}"))
        for d in docs
    ]
    delete_resume_chunks(state["resume_id"])
    get_vectorstore(RESUME_CHUNKS).add_documents(docs, ids=ids)
    return {"chunks_indexed": len(docs)}


# ------------------------------------------------------------------ routing
def route_after_extract(state: ProfileState) -> str:
    return END if state.get("error") else "parse_profile"


# ------------------------------------------------------------------ graph
def build_profile_graph():
    graph = StateGraph(ProfileState)
    graph.add_node("extract_text", extract_text_node)
    graph.add_node("parse_profile", parse_profile_node)
    graph.add_node("index_chunks", index_chunks_node)

    graph.add_edge(START, "extract_text")
    graph.add_conditional_edges("extract_text", route_after_extract, ["parse_profile", END])
    graph.add_edge("parse_profile", "index_chunks")
    graph.add_edge("index_chunks", END)
    return graph.compile()


profile_graph = build_profile_graph()
