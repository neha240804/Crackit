"""Voice mock-interview graph (time-boxed, resumable).

    START -> prepare -> plan -> opening -> listen ⏸
    listen --(answer, time left)--> interviewer -> listen ⏸
    listen --(time up / ended)----> closing -> END

`listen` calls interrupt(): the graph PAUSES there and the Postgres checkpointer saves the
whole state. The API later resumes it with Command(resume={"text": ..., "duration_sec": ...})
and execution continues right after the interrupt() call. Because the state lives in
Postgres (thread_id = session id), a page refresh or a server restart loses nothing.

Latency matters in a live conversation, so each turn makes ONE fast LLM call
(interviewer). Opening and closing are templates. Scoring happens later (build_report).
"""

import re
import time
from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt

from app.agents.common.levels import REAL_QUESTION_STYLE, level_guide, level_label
from app.agents.common.llm import get_structured_llm
from app.agents.interview.prompts import (
    INTERVIEWER_PROMPT,
    PLAN_PROMPT,
    REPORT_PROMPT,
    SWITCH_PROMPT,
)
from app.rag.knowledge_base import RELEVANT_SCORE, get_rubrics, search_knowledge_base
from app.schemas.interview import (
    PERSONAS,
    InterviewerTurn,
    InterviewerTurnWithSwitch,
    InterviewPlan,
    InterviewReport,
)
from app.services.speech_metrics import overall_metrics

CLOSE_WHEN_SECONDS_LEFT = 40  # don't start a new question with less time than this
MAX_FOLLOW_UPS = 3  # follow-ups on one thread (when answers are good) before moving on
MAX_MISSES = 2  # wrong/unclear answers in a row on one thread before moving on
TYPE_LABEL = {"topic": "topic-based", "resume": "resume-based",
              "jd": "job-description-based", "hr": "HR and behavioral"}


class InterviewState(TypedDict, total=False):
    config: dict
    context: str  # candidate resume / JD summary (may be empty)
    kb: str  # retrieved question-bank sections
    plan: dict
    messages: list[dict]  # {"role", "text", "kind", "duration_sec"}
    deadline: float | None  # unix time when it ends; None until the candidate presses Start
    ended_by_user: bool
    done: bool


def remaining_seconds(state: InterviewState) -> int:
    """Seconds left. Before the clock starts (deadline None) that's the full duration."""
    if state.get("deadline") is None:
        return state["config"]["duration_minutes"] * 60
    return max(0, int(state["deadline"] - time.time()))


def _persona(state: InterviewState) -> dict:
    return PERSONAS[state["config"]["interviewer"]]


def _subject(cfg: dict) -> str:
    if cfg["interview_type"] == "hr":
        return "HR and behavioral questions"
    if cfg.get("topic"):
        return cfg["topic"]
    return "your resume" if cfg["interview_type"] == "resume" else "the target job"


# ------------------------------------------------------------------ nodes
def prepare_node(state: InterviewState) -> dict:
    """RAG: fetch question-bank sections relevant to this interview."""
    cfg = state["config"]
    query = " ".join(filter(None, [
        cfg.get("topic"), ", ".join(cfg.get("subtopics", [])),
        "behavioral teamwork motivation strengths" if cfg["interview_type"] == "hr" else "",
        state.get("context", "")[:600],
    ])) or "general interview questions"
    # Only sections that really match: for subjects the bank doesn't cover (e.g. power
    # systems) a plain top-k returned unrelated software sections as the "reference".
    docs = search_knowledge_base(query, k=4, doc_type="questions", min_score=RELEVANT_SCORE)
    kb = "\n\n".join(f"[{d.metadata['source']} / {d.metadata['topic']}]\n{d.page_content}"
                     for d in docs) or (
        "(none for this topic: ask what real interviews at this level ask about it)")
    # The clock does NOT start here: it starts when the candidate presses Start (begin()).
    # Starting it at creation expired interviews while people were still in the setup screen.
    return {"kb": kb, "messages": [], "deadline": None}


async def plan_node(state: InterviewState) -> dict:
    cfg = state["config"]
    settings_text = (
        f"Type: {TYPE_LABEL[cfg['interview_type']]}\nTopic: {cfg.get('topic') or '-'}\n"
        f"Sub-topics: {', '.join(cfg.get('subtopics', [])) or '-'}\n"
        f"Level: {level_label(cfg['experience'])}\nDuration: {cfg['duration_minutes']} min"
    )
    llm = get_structured_llm(InterviewPlan, tier="fast")
    plan: InterviewPlan = await llm.ainvoke([
        SystemMessage(PLAN_PROMPT.format(level_guide=level_guide(cfg["experience"]),
                                         question_style=REAL_QUESTION_STYLE)),
        HumanMessage(f"SETTINGS:\n{settings_text}\n\nCANDIDATE CONTEXT:\n"
                     f"{state.get('context') or '-'}\n\nQUESTION BANK:\n{state['kb']}"),
    ])
    return {"plan": plan.model_dump()}


def opening_node(state: InterviewState) -> dict:
    cfg = state["config"]
    persona = _persona(state)
    level = level_label(cfg["experience"]).lower()
    text = (
        f"Hello, I'm {persona['name']}, and I'll be your interviewer today. This is a "
        f"{cfg['duration_minutes']} minute mock interview on {_subject(cfg)}, at {level} level. "
        "Take your time with each answer, and speak naturally. To begin, please introduce "
        "yourself briefly."
    )
    return {"messages": [{"role": "interviewer", "text": text, "kind": "opening",
                          "focus_area": "introduction"}]}


def listen_node(state: InterviewState) -> dict:
    last = state["messages"][-1]
    # ⏸ Pause here until the API resumes us with the candidate's answer.
    answer = interrupt({"utterance": last["text"], "kind": last["kind"]})
    # The service passes the deadline (from when the candidate pressed Start) with each answer.
    update: dict = {"deadline": answer["deadline"]} if answer.get("deadline") else {}
    if answer.get("end"):
        return {**update, "ended_by_user": True}
    msg = {"role": "candidate", "text": answer["text"], "kind": "answer",
           "duration_sec": answer.get("duration_sec")}
    return {**update, "messages": [*state["messages"], msg]}


def route_after_listen(state: InterviewState) -> str:
    if state.get("ended_by_user") or remaining_seconds(state) < CLOSE_WHEN_SECONDS_LEFT:
        return "closing"
    return "interviewer"


MISSES = {"incorrect", "unclear", "partially_correct"}

# Replies that are not an attempt at the question. Told in the prompt to "reassure, don't
# praise" after these, the fast model still said "Great effort!" to "I don't know" and
# "That's a good start!" to "Can you just tell me the answer?" (scripted interview), which
# sounds fake. So when moving on after one of these, code says a fixed, honest line instead.
ASKED_FOR_ANSWER = re.compile(
    r"\b(tell|give|say)\b.{0,15}\b(me|us)\b.{0,15}\banswer\b|\bwhat('?s| is) the (right |correct )?answer\b",
    re.IGNORECASE)
DONT_KNOW = re.compile(
    r"\b(i )?(don'?t|do not) know\b|\bno idea\b|\bnot (really |very )?sure\b|\bno clue\b"
    r"|\b(i )?can'?t (recall|remember)\b|\bskip (this|it|that)\b|\b(i'?ll|i will|let me) pass\b|^\s*pass\b",
    re.IGNORECASE)
_MOVE_ON = ["Let's try something different.", "Let's move to another area.", "Let's switch gears."]


def non_answer_reaction(answer: str, turn_number: int) -> str | None:
    """A fixed, honest reaction for moving on after a non-answer, or None for a real answer
    (whose reaction the model writes). The answer is never given: the report has it.
    Only short replies count, so a real answer that happens to say "not sure" stays the model's."""
    text = answer.strip()
    if len(text.split()) > 25:
        return None
    move_on = _MOVE_ON[turn_number % len(_MOVE_ON)]  # varied, so it doesn't sound canned
    if ASKED_FOR_ANSWER.search(text):
        return f"I'll leave that one for your feedback report, it has a model answer. {move_on}"
    if DONT_KNOW.search(text):
        return f"No worries, that one's worth revising later. {move_on}"
    return None


def thread_info(messages: list[dict]) -> tuple[str, int, list[str], int]:
    """(current topic, follow-ups asked on it, topics covered, struggling streak).

    A thread = everything since the interviewer last moved to a new topic (an opening or a
    `question`). Defined by moves, not by the topic label: the model sometimes rewords the
    label, which silently reset the old count and disabled the limits.

    struggling streak = how many of the candidate's most recent answers in this thread were
    incorrect, unclear or only partially correct, in a row.
    """
    asked = [m for m in messages if m["role"] == "interviewer" and m.get("focus_area")]
    covered = list(dict.fromkeys(m["focus_area"] for m in asked))
    if not asked:
        return "introduction", 0, covered, 0
    start = max(i for i, m in enumerate(messages)
                if m["role"] == "interviewer" and m.get("kind") in ("opening", "question"))
    thread = messages[start:]
    depth = sum(1 for m in thread if m["role"] == "interviewer" and m.get("kind") == "follow_up")
    misses = 0
    for m in reversed(thread):
        if m["role"] != "candidate" or "assessment" not in m:
            continue
        if m["assessment"] not in MISSES:
            break
        misses += 1
    return messages[start].get("focus_area", "introduction"), depth, covered, misses


def next_focus_area(plan_areas: list[str], covered: list[str], current: str) -> str:
    """The first planned focus area not yet covered (labels compared loosely, since the
    model rewords them). Falls back to the next area after the current one."""
    def words(s: str) -> set[str]:
        return {w for w in re.findall(r"[a-z]+", s.lower()) if len(w) > 3}

    def seen(area: str) -> bool:
        return any(len(words(area) & words(c)) >= max(1, len(words(area)) // 2)
                   for c in [*covered, current])

    for area in plan_areas:
        if not seen(area):
            return area
    # Everything in the plan was touched: go to the area after the current one.
    idx = next((i for i, a in enumerate(plan_areas) if words(a) & words(current)), -1)
    return plan_areas[(idx + 1) % len(plan_areas)] if plan_areas else "a different topic"


def thread_rule(depth: int, misses: int) -> str:
    """Mandatory instructions, decided in code (the model alone kept digging into topics
    the candidate clearly didn't know)."""
    if misses >= MAX_MISSES:
        return (f"\nThe candidate's last {misses} answers on this topic were wrong or unclear, "
                "even after a hint. next_move MUST be new_topic now: encourage them warmly "
                "WITHOUT giving the answer, then switch to a different focus area.")
    if depth >= MAX_FOLLOW_UPS:
        return (f"\nYou have already asked {depth} follow-ups on this thread: next_move MUST be "
                "new_topic now. Briefly wrap up this point in your reaction, then switch.")
    if misses == MAX_MISSES - 1:
        return ("\nThe candidate already had a hint on this question. If this answer is ALSO "
                "incorrect, unclear or only partly correct, next_move MUST be new_topic: "
                "encourage them WITHOUT giving the answer and move on. Only continue this "
                "thread if this answer is correct.")
    # First miss on a question: hint and one guided retry (never the answer).
    return ("\nIf this answer is incorrect, unclear or only partly correct, next_move MUST be "
            "hint: a hint in your reaction (never the answer), then the same question again in "
            "a guided form.")


TRANSCRIPT_MESSAGES = 10  # how far back the interviewer sees (so it doesn't repeat itself)
FULL_RECENT = 4  # the latest messages are sent whole; older ones are compacted
OLD_QUESTION_CHARS = 170  # an older interviewer line: its end, where the question is
OLD_ANSWER_CHARS = 120  # an older answer: its start


def _words(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-z]{4,}", text.lower())}


def pick_kb_section(kb: str, focus: str) -> str:
    """The ONE question-bank section most about `focus` (the current thread and the next
    topic), by shared words with its heading line; the first (most relevant to the whole
    interview) if none share any. Two sections per turn cost ~560 tokens; one ~280."""
    sections = [s for s in re.split(r"\n\n(?=\[)", kb) if s.strip()]
    if len(sections) <= 1:
        return kb
    wanted = _words(focus)
    scores = [len(wanted & _words(s.split("\n", 1)[0])) for s in sections]
    best = max(range(len(sections)), key=lambda i: (scores[i], -i))
    return sections[best]


def turn_transcript(messages: list[dict]) -> str:
    """The last TRANSCRIPT_MESSAGES lines, the newest FULL_RECENT in full. Older ones keep
    what the interviewer needs: the QUESTION it asked (the end of its line; the start is the
    reaction) so it doesn't ask it again, and the gist of the answer. Saves ~280 tokens a turn
    (~10%) while still showing every recent question."""
    recent = messages[-TRANSCRIPT_MESSAGES:]
    lines = []
    for i, m in enumerate(recent):
        text, interviewer = m["text"], m["role"] == "interviewer"
        if i < len(recent) - FULL_RECENT:
            if interviewer and len(text) > OLD_QUESTION_CHARS:
                text = "…" + text[-OLD_QUESTION_CHARS:].split(" ", 1)[-1]
            elif not interviewer and len(text) > OLD_ANSWER_CHARS:
                text = text[:OLD_ANSWER_CHARS].rsplit(" ", 1)[0] + "…"
        lines.append(f"{'INTERVIEWER' if interviewer else 'CANDIDATE'}: {text}")
    return "\n".join(lines)


async def interviewer_node(state: InterviewState) -> dict:
    started = time.perf_counter()  # stored on the turn: online evaluation tracks reply latency
    cfg = state["config"]
    persona = _persona(state)
    plan = state["plan"]
    thread, depth, covered, misses = thread_info(state["messages"])
    target = next_focus_area(plan["focus_areas"], covered, thread)
    # Smaller prompt = fewer tokens. Measured (scripts/measure_interview_quota.py): a 15-minute
    # interview cost ~48k tokens on the fast model, 94% of it prompt, and the free tier allows
    # 200k a day per Groq account: ~4 interviews. So each turn sends ONE question-bank section
    # (the one about the current or next topic) and a compacted transcript (turn_transcript).
    kb = pick_kb_section(state["kb"], f"{thread} {target}")
    human = HumanMessage(f"TRANSCRIPT SO FAR:\n{turn_transcript(state['messages'])}\n\nYour turn.")

    # Fast model (falls back to strong): in testing it judged answers as accurately (4/4) and
    # replied ~0.3-1 s faster, which matters in a live conversation. It also has its own
    # daily token quota, separate from the strong model used by the report and optimizer.
    llm = get_structured_llm(InterviewerTurn, tier="fast", temperature=0.6)
    # Same, plus a drafted topic switch; only when the candidate is already struggling.
    llm_with_switch = get_structured_llm(InterviewerTurnWithSwitch, tier="fast", temperature=0.6)

    async def ask() -> InterviewerTurn:
        rule = thread_rule(depth, misses)
        if misses == MAX_MISSES - 1:  # struggling: draft the switch now, avoiding a 2nd call
            rule += ("\nALSO fill switch_reaction (warm and WITHOUT the answer: credit only what "
                     "they really got right; after 'I don't know' reassure instead of praising; "
                     "if they asked for the answer, say it will be in their feedback report; then "
                     "a transition like 'Let's try something different.') and switch_question (ONE clear, concrete question about "
                     f"'{target}' at the candidate's level: a single idea, never a definition or a calculation). "
                     "They are used if you have to move on.")
        # Prompt caching: Groq doesn't count cached prompt tokens against the free daily limit,
        # and a prompt is cached from its start up to the first difference. So the system
        # message holds ONLY what stays the same for the whole interview (persona, rules,
        # level, plan, question bank, resume), and everything that changes per turn (topics
        # covered, current thread, the mandatory rule, time left, transcript) goes in the
        # human message after it. Measured with scripts/measure_interview_quota.py: before,
        # the changing lines sat near the top and 0 of ~2,900 tokens per turn were cached.
        system = INTERVIEWER_PROMPT.format(
            name=persona["name"], style=persona["style"], title=plan["title"],
            interview_type=TYPE_LABEL[cfg["interview_type"]],
            experience=level_label(cfg["experience"]),
            level_guide=level_guide(cfg["experience"]), question_style=REAL_QUESTION_STYLE,
            focus_areas="; ".join(plan["focus_areas"]), kb=kb, context=state.get("context") or "-",
        )
        turn_state = (
            f"INTERVIEW STATE\nCovered so far: {', '.join(covered) or 'none yet'}\n"
            f'Current thread: "{thread}" with {depth} follow-up(s) already asked on it.{rule}\n'
            f"Time remaining: about {remaining_seconds(state)} seconds.\n\n"
        )
        model = llm_with_switch if misses == MAX_MISSES - 1 else llm
        return await model.ainvoke([SystemMessage(system), HumanMessage(turn_state + human.content)])

    async def switch_topic() -> InterviewerTurn:
        """Move on, to a topic CODE picks. Asked to "choose a new topic", the model kept
        choosing a variation of the current one (in testing it even labelled a bias
        question as a new topic). An explicit target leaves it nothing to drift back to."""
        system = SWITCH_PROMPT.format(
            name=persona["name"], style=persona["style"],
            experience=level_label(cfg["experience"]), current=thread, target=target, kb=kb,
            level_guide=level_guide(cfg["experience"]),
        )
        turn = await llm.ainvoke([SystemMessage(system), human])
        turn.next_move, turn.focus_area = "new_topic", target
        return turn

    if misses >= MAX_MISSES or depth >= MAX_FOLLOW_UPS:
        turn = await switch_topic()  # already decided by earlier answers: one call
    else:
        turn = await ask()
        # The model judges the newest answer in the same call that picks the next move, so
        # code only learns that verdict now. If it makes 2 misses in a row, move on anyway.
        if turn.assessment in MISSES and misses + 1 >= MAX_MISSES:
            if getattr(turn, "switch_question", "").strip():  # drafted: no extra call
                turn.reaction, turn.question = turn.switch_reaction, turn.switch_question
                turn.next_move, turn.focus_area = "new_topic", target
            elif turn.next_move != "new_topic":
                turn = await switch_topic()
    # Moving on because they're stuck, after a non-answer: an honest fixed line (see above).
    last = state["messages"][-1]
    # Any verdict but "correct": "tell me the answer" is sometimes judged not_applicable.
    if turn.next_move == "new_topic" and turn.assessment != "correct" and last["role"] == "candidate":
        fixed = non_answer_reaction(last["text"], len(state["messages"]))
        if fixed:
            turn.reaction = fixed
    spoken =f"{turn.reaction.strip()} {turn.question.strip()}".strip()
    msg = {"role": "interviewer", "text": spoken,
           "kind": "question" if turn.next_move == "new_topic" else "follow_up",
           "focus_area": turn.focus_area, "next_move": turn.next_move,
           "latency_ms": round((time.perf_counter() - started) * 1000)}
    # Store the assessment on the candidate's answer: useful context for the final report.
    messages = [*state["messages"]]
    messages[-1] = {**messages[-1], "assessment": turn.assessment}
    return {"messages": [*messages, msg]}


def closing_node(state: InterviewState) -> dict:
    name = _persona(state)["name"]
    text = (
        "That's all the time we have. Thank you for your answers today, it was great talking "
        f"with you. This is {name} signing off. Your detailed feedback report is being "
        "prepared now."
    )
    msg = {"role": "interviewer", "text": text, "kind": "closing"}
    return {"messages": [*state["messages"], msg], "done": True}


# ------------------------------------------------------------------ graph
def build_interview_graph(checkpointer):
    g = StateGraph(InterviewState)
    g.add_node("prepare", prepare_node)
    g.add_node("plan", plan_node)
    g.add_node("opening", opening_node)
    g.add_node("listen", listen_node)
    g.add_node("interviewer", interviewer_node)
    g.add_node("closing", closing_node)

    g.add_edge(START, "prepare")
    g.add_edge("prepare", "plan")
    g.add_edge("plan", "opening")
    g.add_edge("opening", "listen")
    g.add_conditional_edges("listen", route_after_listen, ["interviewer", "closing"])
    g.add_edge("interviewer", "listen")
    g.add_edge("closing", END)
    return g.compile(checkpointer=checkpointer)


# ------------------------------------------------------------------ report (after the interview)
async def build_report(state: InterviewState) -> dict:
    messages = state["messages"]
    answers = [{"text": m["text"], "duration_sec": m.get("duration_sec")}
               for m in messages if m["role"] == "candidate"]
    metrics = overall_metrics(answers)
    if not answers:
        return {"overall_score": 0, "technical_score": 0, "communication_score": 0,
                "structure_score": 0, "summary": "The interview ended before any answers were "
                "given, so there is nothing to score yet. Try a full session.",
                "strengths": [], "improvements": [], "next_steps": [], "questions": [],
                "metrics": metrics}

    # Only ANSWERED question/answer pairs are scored. A question cut off by the timer or the
    # End button must not count as "unanswered" (seen in testing: it scored 0/10).
    pairs = answered_pairs(messages)
    numbered = [line for i, (q, a) in enumerate(pairs, 1)
                for line in (f"Q{i} ({q['kind']}): {q['text']}", f"A{i}: {a['text']}")]
    cfg = state["config"]
    # Temperature 0: the same transcript should get (nearly) the same report.
    llm = get_structured_llm(InterviewReport, tier="strong", reasoning_effort="medium", temperature=0)
    report: InterviewReport = await llm.ainvoke([
        SystemMessage(REPORT_PROMPT.format(rubrics=get_rubrics())),
        HumanMessage(
            f"Interview: {state['plan']['title']} ({TYPE_LABEL[cfg['interview_type']]}), "
            f"level {level_label(cfg['experience'])}.\n\nMEASURED COMMUNICATION METRICS: "
            f"{ {k: v for k, v in metrics.items() if k != 'per_answer'} }\n\n"
            "TRANSCRIPT:\n" + "\n".join(numbered)
        ),
    ])
    # Keep exactly one feedback item per answered question, attach the question text.
    by_index = {q.question_index: q for q in report.questions if 1 <= q.question_index <= len(pairs)}
    questions = [{**by_index[i].model_dump(), "question": pairs[i - 1][0]["text"],
                  "answer": pairs[i - 1][1]["text"], "metrics": metrics["per_answer"][i - 1]}
                 for i in sorted(by_index)]
    for q in questions:
        q["strengths"] = drop_unhearable(q["strengths"])
    out = {**report.model_dump(), "questions": questions, "metrics": metrics}
    out["strengths"] = drop_unhearable(out["strengths"])
    out["summary"] = " ".join(drop_unhearable(re.split(r"(?<=[.!?])\s+", out["summary"]))) or out["summary"]
    return {**out, **scores_from_questions(out)}


# Words about how someone SOUNDS or comes across. The report only receives text (plus measured
# pace and filler counts), yet the report eval found it praising "a calm tone", "a friendly
# demeanor", "a polite and professional tone" (5 of 13 unsupported claims). The prompt now
# forbids it; this removes any that still slip through (rules in code back the prompt).
# Precise on purpose: "explained the energy losses" or "an example of staying calm under
# pressure" (an HR story the candidate told) are real strengths and must stay. So: words that
# can only be about delivery, or a manner word tied to how they SPOKE / CAME ACROSS.
_MANNER = r"(confident\w*|calm\w*|friendly|polite\w*|warm\w*|enthusias\w*|energetic|composed|nervous\w*|professional)"
UNHEARABLE = re.compile(
    r"\b(tone|vocal|demeanou?r|body language|eye contact|smil(e|ed|es|ing)|poise|charisma\w*)\b"
    rf"|\b(sound(s|ed)?|spoke|speaks|speaking|came across|comes across|delivery|delivered)\b[^.]{{0,30}}\b{_MANNER}\b"
    rf"|\b{_MANNER} (voice|manner|attitude|presence|delivery)\b",
    re.IGNORECASE)


def drop_unhearable(claims: list[str]) -> list[str]:
    return [c for c in claims if not UNHEARABLE.search(c)]


# Overall and technical scores come from the per-question scores in code. The model used to
# pick them separately, and the same transcript then scored 35 vs 22 and 64 vs 51 in two runs
# (report eval): one number drifting on its own. Per-question scores are where the reasoning
# is, and an average is steadier than any single guess.
OVERALL_WEIGHTS = {"technical_score": 0.6, "communication_score": 0.2, "structure_score": 0.2}


def scores_from_questions(report: dict) -> dict:
    scores = [q["score"] for q in report["questions"]]
    if not scores:
        return {}
    technical = round(10 * sum(scores) / len(scores))
    parts = {**report, "technical_score": technical}
    overall = round(sum(parts[k] * w for k, w in OVERALL_WEIGHTS.items()))
    return {"technical_score": technical, "overall_score": max(0, min(100, overall))}


def answered_pairs(messages: list[dict]) -> list[tuple[dict, dict]]:
    """(interviewer question, candidate answer) pairs, in order; unanswered ones skipped."""
    pairs, last_question = [], None
    for m in messages:
        if m["role"] == "interviewer":
            last_question = m
        elif m["role"] == "candidate" and last_question is not None:
            pairs.append((last_question, m))
            last_question = None
    return pairs
