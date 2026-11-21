"""Quality rules checked in code: free, so they run on every finished interview.

The turn rules are the same ones the offline behaviour eval applies to simulated interviews
(evals/behaviour.py imports `turn_checks` from here). Online, the turns are replayed from the
interview's saved messages: each interviewer message written by the interviewer step carries
its `next_move`, and each answer carries the interviewer's `assessment` of it, so the thread
state before every turn can be rebuilt with the same `thread_info()` the graph used.
"""

import re

from app.agents.interview.graph import (
    MAX_FOLLOW_UPS,
    MISSES,
    answered_pairs,
    non_answer_reaction,
    thread_info,
)
from app.services.prep_service import is_repeat

PRAISE = re.compile(r"\b(great|excellent|good (job|start|effort|answer|point)|nice|well done|"
                    r"brilliant|perfect|spot on)\b", re.IGNORECASE)
MAX_TURN_WORDS = 70  # a turn is spoken aloud: longer ones feel like a lecture
# A cheap first filter for calculation questions (the judge checks it properly on a sample).
CALCULATION = re.compile(r"\b(calculate|compute|work out the|solve for|how many (amps|volts|ohms|watts|kw|mw))\b",
                         re.IGNORECASE)

# check -> (target % of turns or interviews that should pass, what it means)
TARGETS = {
    "flow": (90, "Hint after a first miss; new topic after a second miss or 3 follow-ups."),
    "non_answer_is_miss": (100, '"I don\'t know" / "tell me the answer" counted as a miss.'),
    "no_praise_after_non_answer": (100, "No \"great\" / \"nice\" after a non-answer."),
    "never_reveals_answer": (95, "The interviewer never states the answer to a missed question (judge)."),
    "no_calculation": (100, "No question needs a calculation (judge)."),
    "on_topic": (95, "Questions fit the chosen topic (judge)."),
    "one_question": (90, "One question per turn (judge)."),
    "no_repeat": (95, "No question asked twice, except the guided retry after a hint."),
    "short": (90, f"Whole turn under {MAX_TURN_WORDS} words (it is spoken aloud)."),
}
NAMES = {"flow": "Coaching flow (hint, then move on)", "non_answer_is_miss": "Non-answers judged as misses",
         "no_praise_after_non_answer": "No praise after a non-answer", "never_reveals_answer": "Never gives the answer",
         "no_calculation": "No calculation questions", "on_topic": "Stays on topic", "one_question": "One question per turn",
         "no_repeat": "No repeated questions", "short": "Turns short enough to speak"}

# Online-only checks (whole interview or report), same shape.
ONLINE_TARGETS = {
    "no_calculation_words": (100, "No turn uses calculation wording (calculate, compute...; code filter)."),
    "every_answer_scored": (100, "The report scores every answered question."),
    "model_answer_given": (100, "Every scored question has a model answer (2+ sentences)."),
    "report_agrees": (85, ("Report scores agree with the interviewer's live verdicts "
                           "(correct >= 6/10, incorrect/unclear <= 5/10).")),
    "report_grounded": (90, "Report claims about the candidate are supported by the transcript (judge)."),
}
ONLINE_NAMES = {"no_calculation_words": "No calculation wording", "every_answer_scored": "Every answer scored",
                "model_answer_given": "Model answer for every question", "report_agrees": "Report agrees with interviewer",
                "report_grounded": "Report claims grounded"}
ALL_TARGETS = {**TARGETS, **ONLINE_TARGETS}
ALL_NAMES = {**NAMES, **ONLINE_NAMES}


def turn_checks(turn: dict, prior_questions: list[str]) -> dict[str, bool]:
    """Rules for one interviewer turn (the reply to the candidate's answer).

    turn: index (0 = the reply to the introduction), assessment, next_move, reply,
    depth_before / misses_before (thread state before the answer), non_answer."""
    checks = {}
    miss = turn["assessment"] in MISSES
    if turn["index"] > 0:  # the introduction has no right or wrong
        if miss and (turn["misses_before"] >= 1 or turn["depth_before"] >= MAX_FOLLOW_UPS):
            checks["flow"] = turn["next_move"] == "new_topic"
        elif miss:
            checks["flow"] = turn["next_move"] == "hint"
        elif turn["depth_before"] >= MAX_FOLLOW_UPS:
            checks["flow"] = turn["next_move"] == "new_topic"
    if turn["non_answer"]:
        checks["non_answer_is_miss"] = miss
        checks["no_praise_after_non_answer"] = not PRAISE.search(turn["reply"])
    if turn["next_move"] != "hint":  # the guided retry after a hint may repeat the question
        checks["no_repeat"] = not any(is_repeat(turn["reply"], q) for q in prior_questions)
    checks["short"] = len(turn["reply"].split()) <= MAX_TURN_WORDS
    return checks


def replay_turns(messages: list[dict]) -> list[dict]:
    """Rebuild every interviewer turn of a saved interview, with the thread state before it."""
    turns, prior = [], []
    for j, m in enumerate(messages):
        if m["role"] == "interviewer" and m.get("next_move") and j and messages[j - 1]["role"] == "candidate":
            answer = messages[j - 1]
            _, depth, _, misses = thread_info(messages[:j - 1])
            index = len(turns)
            turn = {"index": index, "answer": answer["text"], "assessment": answer.get("assessment", ""),
                    "next_move": m["next_move"], "reply": m["text"], "depth_before": depth,
                    "misses_before": misses, "latency_ms": m.get("latency_ms"),
                    "non_answer": index > 0 and non_answer_reaction(answer["text"], 0) is not None}
            turn["checks"] = turn_checks(turn, prior)
            turn["checks"]["no_calculation_words"] = not CALCULATION.search(m["text"])
            turns.append(turn)
        if m["role"] == "interviewer":
            prior.append(m["text"])
    return turns


def report_checks(messages: list[dict], report: dict) -> dict[str, bool]:
    """Is the report complete, and does it agree with what the interviewer judged live?"""
    pairs = answered_pairs(messages)
    if not pairs:
        return {}
    scored = {q["question_index"]: q for q in report.get("questions", [])}
    checks = {
        "every_answer_scored": all(i in scored for i in range(1, len(pairs) + 1)),
        "model_answer_given": all(len(q.get("ideal_answer", "").split()) >= 10 for q in scored.values()),
    }
    # Two independent judgements of the same answer: the interviewer's live verdict (fast
    # model, one answer at a time) and the report's score (strong model, whole transcript).
    # They should rarely contradict each other; when they do, one of them is wrong.
    agree = []
    for i, (_, answer) in enumerate(pairs, 1):
        verdict, q = answer.get("assessment"), scored.get(i)
        if q is None or verdict not in ("correct", "incorrect", "unclear"):
            continue
        agree.append(q["score"] >= 6 if verdict == "correct" else q["score"] <= 5)
    if agree:
        checks["report_agrees"] = sum(agree) / len(agree) >= 0.75
    return checks


def tally(results: list[dict[str, bool]]) -> dict[str, dict]:
    """[{check: ok}, ...] -> {check: {"passed": n, "total": n}}."""
    out: dict[str, dict] = {}
    for checks in results:
        for name, ok in checks.items():
            entry = out.setdefault(name, {"passed": 0, "total": 0})
            entry["total"] += 1
            entry["passed"] += bool(ok)
    return out


def interview_checks(messages: list[dict], report: dict) -> dict:
    """Everything code can check about one finished interview, ready to store."""
    turns = replay_turns(messages)
    checks = tally([t["checks"] for t in turns] + [report_checks(messages, report)])
    failures = [{"turn": t["index"], "failed": [c for c, ok in t["checks"].items() if not ok],
                 "answer": t["answer"][:200], "reply": t["reply"][:300]}
                for t in turns if not all(t["checks"].values())]
    latencies = [t["latency_ms"] for t in turns if t["latency_ms"] is not None]
    return {"checks": checks, "failures": failures[:10], "turns": len(turns), "latency_ms": latencies}
