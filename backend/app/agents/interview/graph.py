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

from app.agents.common.llm import get_structured_llm
from app.agents.interview.prompts import (
    INTERVIEWER_PROMPT,
    PLAN_PROMPT,
    REPORT_PROMPT,
    SWITCH_PROMPT,
)
from app.rag.knowledge_base import get_rubrics, search_knowledge_base
from app.schemas.interview import (
    EXPERIENCE_LABEL,
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
    docs = search_knowledge_base(query, k=4, doc_type="questions")
    kb = "\n\n".join(f"[{d.metadata['source']} / {d.metadata['topic']}]\n{d.page_content}"
                     for d in docs)
    # The clock does NOT start here: it starts when the candidate presses Start (begin()).
    # Starting it at creation expired interviews while people were still in the setup screen.
    return {"kb": kb, "messages": [], "deadline": None}


async def plan_node(state: InterviewState) -> dict:
    cfg = state["config"]
    settings_text = (
        f"Type: {TYPE_LABEL[cfg['interview_type']]}\nTopic: {cfg.get('topic') or '-'}\n"
        f"Sub-topics: {', '.join(cfg.get('subtopics', [])) or '-'}\n"
        f"Level: {EXPERIENCE_LABEL[cfg['experience']]}\nDuration: {cfg['duration_minutes']} min"
    )
    llm = get_structured_llm(InterviewPlan, tier="fast")
    plan: InterviewPlan = await llm.ainvoke([
        SystemMessage(PLAN_PROMPT),
        HumanMessage(f"SETTINGS:\n{settings_text}\n\nCANDIDATE CONTEXT:\n"
                     f"{state.get('context') or '-'}\n\nQUESTION BANK:\n{state['kb']}"),
    ])
    return {"plan": plan.model_dump()}


def opening_node(state: InterviewState) -> dict:
    cfg = state["config"]
    persona = _persona(state)
    level = EXPERIENCE_LABEL[cfg["experience"]].lower()
    text = (
        f"Hello, I'm {persona['name']}, and I'll be your interviewer today. This is a "
        f"{cfg['duration_minutes']} minute {level} mock interview on {_subject(cfg)}. "
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
        return (f"\nThe candidate's last {misses} answers on this topic were wrong or unclear. "
                "next_move MUST be new_topic now: give the correct idea in ONE short sentence, "
                "kindly, then switch to a different focus area.")
    if depth >= MAX_FOLLOW_UPS:
        return (f"\nYou have already asked {depth} follow-ups on this thread: next_move MUST be "
                "new_topic now. Briefly wrap up this point in your reaction, then switch.")
    if misses == MAX_MISSES - 1:
        return ("\nThe candidate's previous answer on this topic was already wrong or unclear. "
                "If this answer is ALSO incorrect, unclear or only partly correct, next_move MUST "
                "be new_topic: give the correct idea in one short sentence and move on. Only "
                "continue this thread if this answer is correct.")
    return ""


async def interviewer_node(state: InterviewState) -> dict:
    cfg = state["config"]
    persona = _persona(state)
    plan = state["plan"]
    thread, depth, covered, misses = thread_info(state["messages"])
    # Smaller prompt = faster replies and fewer tokens (free tier: 8k tokens/MINUTE per model;
    # with 4 question-bank sections and 14 messages a turn cost ~2.4k tokens).
    kb = "\n\n".join(re.split(r"\n\n(?=\[)", state["kb"])[:2])
    transcript = "\n".join(
        f"{'INTERVIEWER' if m['role'] == 'interviewer' else 'CANDIDATE'}: {m['text']}"
        for m in state["messages"][-10:]
    )
    human = HumanMessage(f"TRANSCRIPT SO FAR:\n{transcript}\n\nYour turn.")

    # Fast model (falls back to strong): in testing it judged answers as accurately (4/4) and
    # replied ~0.3-1 s faster, which matters in a live conversation. It also has its own
    # daily token quota, separate from the strong model used by the report and optimizer.
    llm = get_structured_llm(InterviewerTurn, tier="fast", temperature=0.6)
    # Same, plus a drafted topic switch; only when the candidate is already struggling.
    llm_with_switch = get_structured_llm(InterviewerTurnWithSwitch, tier="fast", temperature=0.6)

    target = next_focus_area(plan["focus_areas"], covered, thread)

    async def ask() -> InterviewerTurn:
        rule = thread_rule(depth, misses)
        if misses == MAX_MISSES - 1:  # struggling: draft the switch now, avoiding a 2nd call
            rule += ("\nALSO fill switch_reaction (the correct idea in one short sentence, then "
                     "'Let's move on.') and switch_question (ONE simple, basic question about "
                     f"'{target}', a single idea). They are used if you have to move on.")
        system = INTERVIEWER_PROMPT.format(
            name=persona["name"], style=persona["style"], title=plan["title"],
            interview_type=TYPE_LABEL[cfg["interview_type"]],
            experience=EXPERIENCE_LABEL[cfg["experience"]],
            focus_areas="; ".join(plan["focus_areas"]), covered=", ".join(covered) or "none yet",
            thread=thread, depth=depth, thread_rule=rule,
            remaining=remaining_seconds(state), kb=kb, context=state.get("context") or "-",
        )
        model = llm_with_switch if misses == MAX_MISSES - 1 else llm
        return await model.ainvoke([SystemMessage(system), human])

    async def switch_topic() -> InterviewerTurn:
        """Move on, to a topic CODE picks. Asked to "choose a new topic", the model kept
        choosing a variation of the current one (in testing it even labelled a bias
        question as a new topic). An explicit target leaves it nothing to drift back to."""
        system = SWITCH_PROMPT.format(
            name=persona["name"], style=persona["style"],
            experience=EXPERIENCE_LABEL[cfg["experience"]], current=thread, target=target, kb=kb,
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
    spoken = f"{turn.reaction.strip()} {turn.question.strip()}".strip()
    msg = {"role": "interviewer", "text": spoken,
           "kind": "question" if turn.next_move == "new_topic" else "follow_up",
           "focus_area": turn.focus_area, "next_move": turn.next_move}
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
    llm = get_structured_llm(InterviewReport, tier="strong", reasoning_effort="medium")
    report: InterviewReport = await llm.ainvoke([
        SystemMessage(REPORT_PROMPT.format(rubrics=get_rubrics())),
        HumanMessage(
            f"Interview: {state['plan']['title']} ({TYPE_LABEL[cfg['interview_type']]}), "
            f"level {EXPERIENCE_LABEL[cfg['experience']]}.\n\nMEASURED COMMUNICATION METRICS: "
            f"{ {k: v for k, v in metrics.items() if k != 'per_answer'} }\n\n"
            "TRANSCRIPT:\n" + "\n".join(numbered)
        ),
    ])
    # Keep exactly one feedback item per answered question, attach the question text.
    by_index = {q.question_index: q for q in report.questions if 1 <= q.question_index <= len(pairs)}
    questions = [{**by_index[i].model_dump(), "question": pairs[i - 1][0]["text"],
                  "answer": pairs[i - 1][1]["text"], "metrics": metrics["per_answer"][i - 1]}
                 for i in sorted(by_index)]
    return {**report.model_dump(), "questions": questions, "metrics": metrics}


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
