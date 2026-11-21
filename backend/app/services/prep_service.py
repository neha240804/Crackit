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

# Display names for the knowledge-base role families (front-matter `role_family`), in the
# order the Prep page shows them. Electrical engineering comes first: Crackit is aimed mainly
# at electrical students, and these tracks come from reported core-company and PSU interviews
# (reports/Electrical fresher interview questions.md).
TRACK_LABELS = {
    "electrical_machines": "Electrical machines",
    "power_systems": "Power systems",
    # short enough to fit a track tile without truncating
    "protection_switchgear": "Protection",
    "earthing_safety": "Earthing & safety",
    "power_electronics": "Power electronics",
    "circuits_control": "Circuits & control",
    "hr": "HR & behavioral",
    "backend": "Backend",
    "frontend": "Frontend",
    "machine_learning": "Machine learning",
    "generative_ai": "Generative AI",
    "data_analytics": "Data analytics",
    "managerial": "Managerial",
}
ELECTRICAL_TRACKS = {"electrical_machines", "power_systems", "protection_switchgear",
                     "earthing_safety", "power_electronics", "circuits_control"}

# How each difficulty mixes question levels. A set is mostly at the chosen level with a little
# on either side, the way a real panel warms up and then pushes. (These replaced experience
# bands; even "easy" must stay at real-interview depth, never definitions: an old "easy ...
# definitions" wording produced textbook one-liners.)
LEVEL_MIX = {  # every question at the chosen level: a student who picks Easy expects Easy
    "easy": "every question easy",
    "intermediate": "every question intermediate",
    "hard": "every question hard",
}

PREP_PROMPT = """You write interview preparation material for students and job seekers.

Write {count} DISTINCT interview questions on the topic, each with a model answer.
Difficulty: {level} ({mix}). Every question must be at this difficulty.
LEVEL: {level_guide}
The curated syllabus tags its questions Easy, Intermediate or Hard on this same scale: prefer
the ones at the requested difficulty, and tag each question's `difficulty` honestly. Build each
question on a question or "good answers cover" point from the syllabus when there is one
(rephrase it, add a realistic situation or ask the reasoning behind it); invent a new scenario
only when the syllabus runs out, and keep it within the same concepts. In a hard set, use the
syllabus's Hard and Intermediate questions first and write at most two new scenarios: invented
hard scenarios were where wrong premises crept in.

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
  compare-and-choose question, and for software subjects one small hands-on problem (a query
  to write, an output to predict). No calculations or numerical problems, no bare definitions or acronym
  expansions, and no trick questions.
- You know nothing about this candidate's projects: never write "in your project..." or
  assume work they did. Frame scenarios as situations ("You're asked to...", "A motor...").
- Write questions the way an interviewer says them: one or two sentences, plain text. Never
  put code blocks or markdown in a question; describe any code in words.
- For engineering, science and maths subjects, include analysis: why something is done and
  what happens when a condition changes. NEVER a numerical problem or anything that needs a
  calculation: ask for the reasoning behind it instead.
- The model answer is something a strong candidate would SAY: start with a direct one-sentence
  answer, then explain briefly with one concrete example. 3-6 sentences, plain text, no markdown.
- For behavioral topics, answer in STAR form (situation, task, action, result) with a
  realistic example a student could adapt.
- Be accurate. If something depends on context, say so in one phrase. Every scenario must be
  realistic and its premise technically true (don't invent a symptom that wouldn't happen).
- Check every number and device before you write it: values must be consistent with each
  other and with typical practice (an induction motor's speed sits a few percent below
  120f/P; transformer impedance is a few percent), and each device must work the way the
  question says (a soft starter uses thyristors, a resistance starter uses resistors). Hard
  questions get harder through reasoning and trade-offs, never through made-up data. (In
  testing, hard sets asked about a 4-pole motor at 1500 rpm on 60 Hz and a soft starter
  sized with series resistors.)
- key_points: 3-4 short phrases an interviewer listens for.
- tip: one sentence, a common mistake to avoid or how to stand out.
- Do NOT repeat or rephrase any question in the ALREADY ASKED list."""


RESUME_PREP_PROMPT = """You help a candidate prepare for questions an interviewer will ask about
THEIR OWN resume, given below as numbered SOURCES (one fact per line).

Write {count} DISTINCT questions an interviewer is most likely to ask about this resume, every
one at {level} difficulty. Cover, in roughly this order of likelihood: the strongest projects (what was
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


# HR rounds need their own prompt. With the technical one, HR sets came out as "suggestions":
# textbook points phrased as questions ("Why is it important to keep a disagreement focused on
# the problem?"), team-lead hypotheticals a fresher never faces, compound questions, answers
# that invented facts as if they were the student's ("your recent 500 MW solar plant",
# "reduced bugs by 30%"), and software examples (sprints, code review) for electrical students.
# The wording is field-neutral on purpose (product decision: the site reads as a general mock
# interview site), so it says "[your branch]" / "your field" instead of "electrical engineering":
# the generated answers are shown to users verbatim.
HR_LEVEL = {
    "easy": "the standard openers every panel asks: tell me about yourself, why this company, "
            "why you chose your field, relocation, higher studies, five-year plan",
    "intermediate": "behavioural questions answered with a real story: tell me about a time you "
                    "worked in a team, handled a disagreement, missed a deadline, took the lead, "
                    "learned something fast; strengths and weaknesses with evidence",
    "hard": "pressure and tricky questions: why should we hire you over others, a failure and "
            "what it taught you, low marks or a gap year, why this role and not another field, a "
            "conflict with a senior, a service bond, a posting somewhere remote, salary expectations",
}

HR_PREP_PROMPT = """You prepare graduates for the HR round of job interviews (campus placements
and graduate or trainee roles).

Write {count} DISTINCT HR questions with model answers. Difficulty: {level}, which for HR means
{hr_level}. Every question must be at this difficulty.

Questions:
- Exactly what an HR panel says, in its own words: short, ONE question, usually one sentence
  ("Tell me about yourself.", "Why should we hire you?", "Tell me about a time you disagreed
  with a teammate. What did you do?"). Prefer the questions panels ask most; the curated list
  below shows them, with the companies where candidates reported them.
- Never a textbook point turned into a question ("Why is teamwork important?", "Why is it
  important to focus on the problem, not the person?"), never two questions joined into one,
  never a manager scenario a fresher would not face ("You are leading a team...").

Model answers:
- What a strong graduate would actually SAY, in the first person, complete and
  natural, 5-8 sentences. Behavioural answers follow STAR (situation, task, action, result) as a
  told story, without naming the letters.
- Build the stories on what a fresher really has: the final-year project, an internship or
  industrial training, a college team, technical club or fest, labs, a part-time job.
- The answer is a TEMPLATE the student makes their own, so it must not state facts you cannot
  know. Every name, number, percentage, result, company project, plant, place or award is a
  [placeholder] in square brackets. A story describes the kind of thing that happened ("I
  noticed the readings drifting, so I...") and puts the specifics in brackets ("[what you
  measured]", "[the result]"). Writing "saved 15%" or "the 500 MW plant in Gujarat" is wrong;
  "[the saving you achieved]" and "[a recent project of the company]" are right.
- Answer the question that was asked: "How would you handle..." gets what you would do (and,
  if useful, a short real example), not an invented success story with numbers.
- An intern does not cause outages, run upgrades alone or lead engineers: keep stories at the
  scale of a student's real responsibility.
- Never give advice instead of an answer ("You should mention...", "A good answer would...").

Example of the right shape (do not copy it):
Q: Tell me about yourself.
A: I'm [your name], a final-year [your branch] student at [college]. I've always liked
[what draws you to your field], which is why my final-year project was on [your project],
where I [what you did]. During my internship at [company or plant], I worked on
[a task you worked on] and learned [one concrete thing]. Outside class, I [activity that shows a
strength]. I'm now looking for a role where I can work on [area] at a company like [company
name], and grow into [your goal].

key_points: 3-4 things the HR panel listens for. tip: one sentence on how to make this answer
the student's own (what to fill in, what to avoid).
Do NOT repeat or rephrase any question in the ALREADY ASKED list."""


# HR round personalised from the candidate's resume (Prep: "From your resume" > "HR &
# behavioral"). Same rules as HR_PREP_PROMPT, but the answers use the resume's real facts, so a
# student rehearses THEIR "tell me about yourself", not a template with blanks everywhere.
HR_RESUME_PREP_PROMPT = """You prepare a graduate for the HR round of job interviews, using
THEIR resume, given below as numbered SOURCES (one fact per line).

Write {count} DISTINCT HR questions with model answers. Difficulty: {level}, which for HR means
{hr_level}. Every question must be at this difficulty.

Questions:
- Exactly what an HR panel says: short, ONE question. Mix the standard HR questions (the curated
  list shows the ones panels ask most) with questions the panel would ask because of THIS resume:
  "I see you interned at [the company on the resume]. What did you learn there?", "Why did you
  pick [their project] for your final year?", "Your resume lists [a club or achievement]. What
  was your role?". Name the real project, company or activity, as interviewers do.
- Never a textbook point turned into a question, never two questions in one, never a manager
  scenario a fresher would not face.

Model answers:
- In the first person, what this candidate would actually SAY, complete and natural, 5-8
  sentences; behavioural answers as a told STAR story (without naming the letters).
- Use the resume's real facts: their degree and college, projects, internships, skills,
  certifications and achievements, with the details exactly as written in the sources. The
  stories must come from experiences on the resume.
- Never invent anything the sources do not say: no new numbers, results, awards, tools,
  teammates' actions or company facts. Where the answer needs something the resume cannot know
  (family background, a weakness, why this company, the exact outcome of a story), write a
  [placeholder] for the student to fill in, e.g. "[why this company appeals to you]".
- Facts about the company you are interviewing with are ALWAYS placeholders ("[a recent project
  of the company]"), never invented ("your recent distribution-automation rollout" is wrong).
  Story details not on the resume are placeholders too: durations, deadlines, how the
  disagreement started, the result ("we finished [how early] before the deadline").
- Never give advice instead of an answer ("You should mention...").

key_points: 3-4 things the HR panel listens for. tip: one sentence on what to personalise or
rehearse in this answer.
Do NOT repeat or rephrase any question in the ALREADY ASKED list."""


def hr_bank() -> str:
    """The curated HR questions (all HR sections of the bank): small, so no RAG needed."""
    return "\n\n".join(d.page_content for d in load_documents()
                       if d.metadata["doc_type"] == "questions" and d.metadata["role_family"] == "hr")


def list_tracks() -> list[PrepTrack]:
    """Curated tracks and their subtopics, straight from the question-bank Markdown."""
    topics: dict[str, list[str]] = {}
    for doc in load_documents():
        if doc.metadata["doc_type"] == "questions":
            topics.setdefault(doc.metadata["role_family"], []).append(doc.metadata["topic"])
    order = list(TRACK_LABELS)  # known tracks in display order, unknown ones last
    ranked = sorted(topics, key=lambda k: order.index(k) if k in order else len(order))
    return [PrepTrack(id=k, label=TRACK_LABELS.get(k, k.replace("_", " ").title()), topics=topics[k])
            for k in ranked]


async def generate(db: AsyncSession, user: User, req: PrepRequest) -> PrepSetOut:
    asked = "\n".join(f"- {q}" for q in req.exclude[-40:]) or "(none)"
    if req.resume_id:
        # Questions about the candidate's own resume: the resume IS the syllabus.
        resume = await get_resume(db, user, req.resume_id)  # ownership check
        if resume.status != "ready" or not resume.profile:
            raise HTTPException(409, "This resume could not be read. Try uploading it again.")
        profile = CandidateProfile.model_validate(resume.profile)
        sources = format_sources(build_sources(profile))
        focus = (req.topic or "").strip()
        docs = []
        is_hr = req.kind == "hr"
        if is_hr:
            topic = f"HR questions: {resume.filename}"
            system = HR_RESUME_PREP_PROMPT.format(count=req.count + 2, level=req.experience,
                                                  hr_level=HR_LEVEL[req.experience])
            name = profile.contact.name or "[your name]"
            human = (f"CANDIDATE NAME: {name}\n\nSOURCES (the candidate's resume):\n{sources}\n\n"
                     f"FOCUS: {focus or 'the whole HR round'}\n\nCURATED HR QUESTIONS (what panels "
                     f"ask most):\n{hr_bank()}\n\nALREADY ASKED:\n{asked}")
        else:
            topic = f"Your resume: {resume.filename}"
            system = RESUME_PREP_PROMPT.format(count=req.count + 2, level=req.experience)
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
        # HR sets (the HR track, or a topic that only matches HR sections) use the HR prompt.
        is_hr = req.track == "hr" or (bool(docs) and all(d.metadata["role_family"] == "hr" for d in docs))
        if is_hr:
            system = HR_PREP_PROMPT.format(count=req.count + 2, level=req.experience,
                                           hr_level=HR_LEVEL[req.experience])
        else:
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
    # Electrical tracks use it too, even though the electrical bank grounds them: with the
    # bank the fast model still wrote false premises ("adjust an MCCB beyond its breaking
    # capacity", a CT ratio given in kVA), and electrical students are the main audience.
    electrical = (req.track in ELECTRICAL_TRACKS
                  or any(d.metadata["role_family"] in ELECTRICAL_TRACKS for d in docs))
    # HR sets too: the fast model kept inventing specifics in model answers ("won a regional
    # competition", "a 30% improvement in power factor") despite the placeholder rule.
    hr_set = is_hr  # HR sets, generic or from a resume, use the strong model
    grounded = (bool(req.resume_id) and not hr_set) or (bool(docs) and not electrical and not hr_set)
    # (count + 2 above: two spares, because near-repeats are filtered out below.)
    await release_connection(db)  # no DB connection held during the LLM call
    try:
        # Reasoning stays "low". Tried "medium" for electrical sets: invented hard scenarios were
        # still sometimes wrong (a generator "inrush" with harmonic restraint), and the extra
        # tokens hit the shared free key's per-minute limit (one set took 84 s). Accuracy comes
        # from anchoring questions on the curated bank instead (see PREP_PROMPT).
        # max_retries=0: on a rate limit switch to the other model at once. With one retry the
        # client waited out the per-minute window: a second hard set in a row took 75 s.
        llm = get_structured_llm(PrepSet, tier="fast" if grounded else "strong", temperature=0.5,
                                 max_retries=0)
        result: PrepSet = await llm.ainvoke([SystemMessage(system), HumanMessage(human)])
    except Exception as exc:  # log the real cause; never label every failure "rate limit"
        raise ai_http_error(exc, f"Question prep for {topic!r}") from exc

    # Every question in a set is at the difficulty the student chose. Sets used to mix levels
    # ("Easy" sets showed intermediate questions), which read as a bug. The model is asked for
    # one level and tags each question; questions it tagged at that level come first, the
    # spares fill any gap, and all are shown at the chosen level (they were written for it).
    ordered = sorted(result.questions, key=lambda q: q.difficulty != req.experience)
    # Drop near-repeats in code: the prompt alone wasn't enough (see is_repeat).
    kept: list = []
    for q in ordered:
        if not any(is_repeat(q.question, old) for old in [*req.exclude, *(k.question for k in kept)]):
            kept.append(q)
    kept = kept[: req.count]
    for q in kept:
        q.difficulty = req.experience
    return PrepSetOut(topic=topic, experience=req.experience, questions=kept)


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
