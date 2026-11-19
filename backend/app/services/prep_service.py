"""Question prep: generate study sets (questions + model answers) for a topic and level.

Grounding: the curated question bank in knowledge_base/ (the same one the interviewer
uses) is retrieved with RAG and given to the model as the syllabus, so sets stay on the
topics real interviews cover. One LLM call per set; nothing is stored server-side (the
browser keeps recent sets), so there is no table and no migration for this feature.
"""

import asyncio
import logging
import re

from fastapi import HTTPException
from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.common.errors import ai_http_error
from app.agents.common.levels import REAL_QUESTION_STYLE, level_guide
from app.agents.common.llm import get_structured_llm
from app.agents.profile.sources import build_sources, format_sources
from app.db.models import User
from app.db.session import release_connection
from app.rag.knowledge_base import RELEVANT_SCORE, load_documents, search_knowledge_base
from app.schemas.prep import PrepRequest, PrepSet, PrepSetOut, PrepTrack
from app.schemas.profile import CandidateProfile
from app.services.resume_service import get_resume

logger = logging.getLogger(__name__)

# Display names for the knowledge-base role families (front-matter `role_family`).
TRACK_LABELS = {
    "backend": "Backend",
    "frontend": "Frontend",
    "machine_learning": "Machine learning",
    "generative_ai": "Generative AI",
    "data_analytics": "Data analytics",
    "hr": "HR & behavioral",
    "managerial": "Managerial",
}

# "Fresher" means a graduate being interviewed for a first job, NOT a beginner: it used to say
# "mostly easy ... fundamentals and definitions", which produced textbook one-liners, far below
# real campus, PSU and core-company interviews.
LEVEL_MIX = {
    "fresher": "graduate entry level, as asked in campus placements, PSU and core-company "
               "interviews: core concepts with the why and how, standard results and their "
               "intuition, comparisons, and short problems; mostly medium, one or two easy, one hard",
    "1-3": "mostly medium with some hard; applied problems, debugging and decisions from real work",
    "3-5": "mostly medium and hard; trade-offs, debugging and design decisions",
    "5+": "mostly hard; architecture, scale, leadership of technical decisions",
}

PREP_PROMPT = """You write interview preparation material for students and job seekers.

Write {count} DISTINCT interview questions on the topic, each with a model answer.
Level: {level} ({mix}).
LEVEL: {level_guide}

The goal: a candidate who studies this set should recognise these questions in their real
interview. Pick the questions interviewers for this topic and level ask most often, and the
ones candidates most often get wrong, not textbook trivia or language internals that rarely
come up (for Python, e.g., "__new__ vs __init__" is trivia; "why is my default list argument
shared between calls?" is a real interview question).

{question_style}

Rules:
- EVERY question must be about the TOPIC itself. Use the curated syllabus only where it is
  about this topic; if there is none, follow the standard university syllabus for the subject
  and how it is really examined in interviews (core companies, PSUs and campus placements for
  engineering and science; product companies for software).
- Mix the question types across the set: at least two realistic scenario or debugging
  questions ("X happens; what do you check / do?"), why/how and what-if questions, one
  compare-and-choose question, and for technical subjects one small hands-on problem (a query
  to write, an output to predict, a quick calculation). No bare definitions or acronym
  expansions, and no trick questions.
- You know nothing about this candidate's projects: never write "in your project..." or
  assume work they did. Frame scenarios as situations ("You're asked to...", "A motor...").
- Write questions the way an interviewer says them: one or two sentences, plain text. Never
  put code blocks or markdown in a question; describe any code in words.
- For engineering, science and maths subjects, include analysis: why something is done, what
  happens when a condition changes, and at least one short numerical problem whose answer
  works the numbers out briefly in words.
- The model answer is something a strong candidate would SAY: start with a direct one-sentence
  answer, then explain briefly with one concrete example. 3-6 sentences, plain text, no markdown.
- For behavioral topics, answer in STAR form (situation, task, action, result) with a
  realistic example a student could adapt.
- Be accurate. If something depends on context, say so in one phrase. Every scenario must be
  realistic and its premise technically true (don't invent a symptom that wouldn't happen),
  and numerical problems must use the correct formula (e.g. three-phase quantities).
- key_points: 3-4 short phrases an interviewer listens for.
- tip: one sentence, a common mistake to avoid or how to stand out.
- Do NOT repeat or rephrase any question in the ALREADY ASKED list."""


RESUME_PREP_PROMPT = """You help a candidate prepare for questions an interviewer will ask about
THEIR OWN resume, given below as numbered SOURCES (one fact per line).

Write {count} DISTINCT questions an interviewer is most likely to ask about this resume, at
level {level}. Cover, in roughly this order of likelihood: the strongest projects (what was
built, why, the hardest part, what you would change), technology choices and trade-offs, the
roles and their impact, skills listed (expect "you list X: how have you used it?"), and one
"walk me through your resume" or motivation question.

Rules:
- Name the actual project, company or technology in each question, as interviewers do.
- The model answer is in FIRST PERSON and uses ONLY facts from the sources. Never invent
  numbers, tools, results or responsibilities. Where the resume lacks a detail the answer
  needs, write a bracketed placeholder the candidate fills in, e.g. "[your metric]".
- Answers are spoken: direct first sentence, then the specifics. 3-6 sentences, plain text.
- key_points: 3-4 short phrases the interviewer listens for.
- tip: one sentence on how to prepare this answer (what to rehearse or look up).
- Do NOT repeat or rephrase any question in the ALREADY ASKED list. When that list is not
  empty, move to parts of the resume it does not cover yet (other projects, roles, skills,
  education, certifications) instead of asking a new angle on the same item: in testing,
  "More questions" otherwise re-asked the same project's trade-offs in different words."""


def list_tracks() -> list[PrepTrack]:
    """Curated tracks and their subtopics, straight from the question-bank Markdown."""
    topics: dict[str, list[str]] = {}
    for doc in load_documents():
        if doc.metadata["doc_type"] == "questions":
            topics.setdefault(doc.metadata["role_family"], []).append(doc.metadata["topic"])
    return [PrepTrack(id=k, label=TRACK_LABELS.get(k, k.replace("_", " ").title()), topics=v)
            for k, v in topics.items()]


async def generate(db: AsyncSession, user: User, req: PrepRequest) -> PrepSetOut:
    asked = "\n".join(f"- {q}" for q in req.exclude[-40:]) or "(none)"
    if req.resume_id:
        # Questions about the candidate's own resume: the resume IS the syllabus.
        resume = await get_resume(db, user, req.resume_id)  # ownership check
        if resume.status != "ready" or not resume.profile:
            raise HTTPException(409, "This resume could not be read. Try uploading it again.")
        sources = format_sources(build_sources(CandidateProfile.model_validate(resume.profile)))
        focus = (req.topic or "").strip()
        topic = f"Your resume: {resume.filename}"
        system = RESUME_PREP_PROMPT.format(count=req.count + 2, level=req.experience)
        docs = []
        human = (f"SOURCES (the candidate's resume):\n{sources}\n\n"
                 f"FOCUS: {focus or 'the whole resume'}\n\nALREADY ASKED:\n{asked}")
    else:
        topic = (req.topic or "").strip()
        # Retrieval is sync (FastEmbed + Qdrant client): run it in a thread.
        # Only sections that really match (RELEVANT_SCORE): an unrelated "syllabus" made the
        # model write SQL questions for "power system".
        docs = await asyncio.to_thread(
            search_knowledge_base, topic, 3, "questions", req.track or None, RELEVANT_SCORE
        )
        syllabus = "\n\n".join(d.page_content for d in docs) or (
            "(none for this topic: use the standard syllabus and real interview practice for it)")
        system = PREP_PROMPT.format(count=req.count + 2, level=req.experience, mix=LEVEL_MIX[req.experience],
                                    level_guide=level_guide(req.experience),
                                    question_style=REAL_QUESTION_STYLE)
        human = (f"TOPIC: {topic}\n\nCURATED SYLLABUS (questions real interviews ask, and what "
                 f"good answers cover):\n{syllabus}\n\nALREADY ASKED:\n{asked}")
    # Which model: the fast one is accurate when the question bank grounds it (software, data,
    # HR) and for resume sets (the resume grounds it). With NO bank match it has only its own
    # knowledge, and for core engineering it invented things: in testing, a "4-pole vs 6-pole
    # breaker" choice and a "system N-factor of 2.5" for power systems. The strong model knows
    # these subjects far better; it costs more tokens, so only ungrounded topics use it (it
    # falls back to the fast model on a rate limit).
    grounded = bool(req.resume_id) or bool(docs)
    # (count + 2 above: two spares, because near-repeats are filtered out below.)
    await release_connection(db)  # no DB connection held during the LLM call
    try:
        llm = get_structured_llm(PrepSet, tier="fast" if grounded else "strong", temperature=0.5)
        result: PrepSet = await llm.ainvoke([SystemMessage(system), HumanMessage(human)])
    except Exception as exc:  # log the real cause; never label every failure "rate limit"
        raise ai_http_error(exc, f"Question prep for {topic!r}") from exc

    # Drop near-repeats in code: the prompt alone wasn't enough (see is_repeat).
    kept: list = []
    for q in result.questions:
        if not any(is_repeat(q.question, old) for old in [*req.exclude, *(k.question for k in kept)]):
            kept.append(q)
    return PrepSetOut(topic=topic, experience=req.experience, questions=kept[: req.count])


_STOP = {"a", "an", "the", "and", "or", "of", "to", "in", "on", "at", "for", "with", "you", "your", "yours", "i", "me", "my", "we", "our", "is", "are", "was", "were", "be", "been", "do", "did", "does", "how", "what", "why", "which", "who", "when", "where", "can", "could", "would", "should", "will", "about", "from", "by", "as", "it", "its", "this", "that", "these", "those", "any", "one", "if", "had", "have", "has", "into", "than", "then", "there", "their", "them", "they"}


def _content_words(text: str) -> set[str]:
    return {w.rstrip("s") for w in re.findall(r"[a-z0-9]+", text.lower()) if w not in _STOP and len(w) > 2}


def is_repeat(new: str, old: str, threshold: float = 0.6) -> bool:
    """True when `new` mostly reuses `old`'s content words (a rephrased repeat).

    Overlap is measured against the SHORTER question, so a long rewording of a short one is
    still caught. Tuned on real "More questions" output: re-asked items scored 0.6-0.83,
    a different angle on the same project 0.38, unrelated questions 0-0.33."""
    a, b = _content_words(new), _content_words(old)
    if not a or not b:
        return False
    return len(a & b) / min(len(a), len(b)) >= threshold
