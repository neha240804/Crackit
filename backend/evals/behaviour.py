"""Suite 7: do whole interviews follow the rules?

Runs simulated interviews through the real interview steps (prepare -> plan -> opening ->
interviewer after every answer; the same functions the LangGraph graph runs, without the
database). The candidate's answers come from the scenario: literal text ("I don't know"), or
a style that a small simulator plays from the interviewer's actual question (strong / partial
/ weak), so each run is a fresh, realistic conversation.

Checked in code, per interviewer turn:
  flow          a miss with no earlier miss on the thread -> hint; a second miss, or 3 follow-ups
                -> new topic (the coaching rule)
  non-answer    "I don't know" / "tell me the answer" is judged a miss and gets no praise
  no repeat     no question re-asked, except the one guided retry after a hint
  short         the whole turn stays under 70 words (it's spoken aloud)
Checked by a strong-model judge reading the transcript:
  never gives the answer, never asks a calculation, stays on the interview topic, asks one question
"""

import json
import re

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from app.agents.common.llm import get_llm, get_structured_llm
from app.agents.interview.graph import (
    MAX_FOLLOW_UPS,
    MISSES,
    interviewer_node,
    non_answer_reaction,
    opening_node,
    plan_node,
    prepare_node,
    thread_info,
)
from app.services.prep_service import is_repeat
from evals.common import DATA_DIR, Metric, Pacer, SuiteResult, Timer, pct, with_retry

STYLES = {"strong", "partial", "weak"}
PRAISE = re.compile(r"\b(great|excellent|good (job|start|effort|answer|point)|nice|well done|"
                    r"brilliant|perfect|spot on)\b", re.IGNORECASE)
MAX_TURN_WORDS = 70

SIMULATOR = """You play a candidate in a {level} {kind} interview{about}. Answer the
interviewer's LAST question out loud, in the first person, in 2-4 natural spoken sentences.
Play this style: {style_rule}
Answer ONLY the question; no greetings, no questions back."""

STYLE_RULES = {
    "strong": "a correct, specific answer a well-prepared candidate would give, with the key reason.",
    "partial": "you get part of it right but miss the key point the question is really after.",
    "weak": "confident but technically WRONG: a plausible misconception, stated as fact.",
}
HR_STYLE_RULES = {
    "strong": "a specific, honest story or reason with a concrete example from student life.",
    "partial": "a relevant but generic answer with no concrete example.",
    "weak": "vague cliches that dodge the question (\"I'm a hard worker, I get along with everyone\").",
}


class TurnVerdict(BaseModel):
    turn: int = Field(description="Turn number as given")
    reveals_answer: bool = Field(description="States the answer or the key missing idea to a question "
                                             "the candidate got wrong or did not answer")
    asks_calculation: bool = Field(description="Asks for something that needs a calculation: values "
                                               "to compute, a formula to solve, a size to work out")
    on_topic: bool = Field(description="The question fits the interview topic (or the candidate's "
                                       "own background as it relates to it)")
    one_question: bool = Field(description="Asks exactly one question (one ask, even if worded in "
                                           "two short sentences)")
    note: str = Field(description="One short reason if any check fails, else empty")


class Verdicts(BaseModel):
    turns: list[TurnVerdict]


JUDGE = """You review a mock interview transcript turn by turn. For EVERY numbered interviewer
turn, decide:
- reveals_answer: true if the interviewer states the correct answer, or the key idea the
  candidate was missing, for a question the candidate got wrong, half right or did not answer.
  A hint that nudges ("think about what happens at no load") is NOT revealing. Confirming or
  adding to an answer the candidate already got RIGHT is not revealing either.
- asks_calculation: true if the question needs a numerical calculation to answer.
- on_topic: true if the question fits the interview topic "{topic}" ({kind}).
- one_question: true if it asks exactly one question.
Be strict and literal; add a short note for any failing check."""


def load() -> list[dict]:
    return json.loads((DATA_DIR / "behaviour_scenarios.json").read_text(encoding="utf-8"))["scenarios"]


async def simulate(sc: dict, style: str, question: str) -> str:
    hr = sc["type"] == "hr"
    rules = HR_STYLE_RULES if hr else STYLE_RULES
    system = SIMULATOR.format(level=sc["level"], kind="HR" if hr else "technical",
                              about="" if hr else f" on {sc['topic']}", style_rule=rules[style])
    llm = get_llm("fast", temperature=0.7)
    reply = await with_retry(lambda: llm.ainvoke([SystemMessage(system),
                                                   HumanMessage(f"INTERVIEWER: {question}")]),
                             f"simulate {sc['id']}")
    return str(reply.content).strip()


def code_checks(turn: dict, prior_questions: list[str]) -> dict:
    """Rules checked in code for one interviewer turn (after the candidate's answer)."""
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


async def run_scenario(sc: dict, pacer: Pacer) -> dict:
    cfg = {"interview_type": sc["type"], "topic": sc.get("topic"), "subtopics": [],
           "experience": sc["level"], "duration_minutes": 15, "interviewer": "maya"}
    state: dict = {"config": cfg, "context": ""}
    state.update(prepare_node(state))
    state.update(await with_retry(lambda: plan_node(state), f"plan {sc['id']}"))
    await pacer.wait()
    state.update(opening_node(state))
    turns = []
    for index, spec in enumerate([sc["intro"], *sc["answers"]]):
        question = state["messages"][-1]["text"]
        style = spec if spec in STYLES else "literal"
        text = await simulate(sc, spec, question) if style != "literal" else spec
        _, depth, _, misses = thread_info(state["messages"])
        state["messages"] = [*state["messages"], {"role": "candidate", "text": text, "kind": "answer",
                                                  "duration_sec": max(3, len(text.split()) / 2.2)}]
        state.update(await with_retry(lambda: interviewer_node(state), f"turn {sc['id']}"))
        await pacer.wait()
        reply = state["messages"][-1]
        turns.append({"index": index, "style": style, "answer": text,
                      "non_answer": style == "literal" and index > 0 and non_answer_reaction(text, 0) is not None,
                      "assessment": state["messages"][-2]["assessment"], "next_move": reply["next_move"],
                      "reply": reply["text"], "depth_before": depth, "misses_before": misses})
        print(f"    turn {index}: {style:<8} -> {turns[-1]['assessment']:<17} {reply['next_move']}")

    prior: list[str] = [state["messages"][0]["text"]]
    for turn in turns:
        turn["checks"] = code_checks(turn, prior)
        prior.append(turn["reply"])

    transcript = [f"OPENING: {state['messages'][0]['text']}"]
    for turn in turns:
        transcript += [f"CANDIDATE: {turn['answer']}", f"INTERVIEWER turn {turn['index']}: {turn['reply']}"]
    judge = get_structured_llm(Verdicts, tier="strong", temperature=0)
    verdicts: Verdicts = await with_retry(lambda: judge.ainvoke([
        SystemMessage(JUDGE.format(topic=sc.get("topic") or "HR and behavioral",
                                   kind="HR round" if sc["type"] == "hr" else "technical interview")),
        HumanMessage("\n".join(transcript)),
    ]), f"judge {sc['id']}")
    await pacer.wait()
    by_turn = {v.turn: v for v in verdicts.turns}
    for turn in turns:
        v = by_turn.get(turn["index"])
        if v:
            turn["checks"].update({"never_reveals_answer": not v.reveals_answer,
                                   "no_calculation": not v.asks_calculation,
                                   "on_topic": v.on_topic, "one_question": v.one_question})
            turn["judge_note"] = v.note
    return {"id": sc["id"], "plan": state["plan"], "turns": turns}


TARGETS = {  # check -> (target %, what it means)
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


async def run(limit: int | None = None, pace: float = 12.0) -> SuiteResult:
    scenarios = load()[:limit] if limit else load()
    pacer = Pacer(pace)
    details = []
    with Timer() as t:
        for i, sc in enumerate(scenarios, 1):
            print(f"  scenario {i}/{len(scenarios)}: {sc['id']}")
            details.append(await run_scenario(sc, pacer))
    metrics = []
    for check, (target, meaning) in TARGETS.items():
        values = [turn["checks"][check] for d in details for turn in d["turns"] if check in turn["checks"]]
        if values:
            metrics.append(Metric(NAMES[check], pct(sum(values), len(values)), target,
                                  help=f"{meaning} ({len(values)} turns checked)"))
    result = SuiteResult("behaviour", metrics, details,
                         [(f"{len(scenarios)} simulated interviews, "
                          f"{sum(len(d['turns']) for d in details)} interviewer turns.")], t.seconds)
    result.extra_md = failures_md(details)
    return result


def failures_md(details: list[dict]) -> str:
    rows = ["## Failed checks", ""]
    for d in details:
        for turn in d["turns"]:
            failed = [c for c, ok in turn["checks"].items() if not ok]
            if failed:
                rows.append(f"- **{d['id']} turn {turn['index']}** ({turn['style']}, judged "
                            f"{turn['assessment']}, {turn['next_move']}): failed {', '.join(failed)}. "
                            f"Candidate: \"{turn['answer'][:140]}\" Interviewer: \"{turn['reply'][:220]}\""
                            + (f" Judge: {turn.get('judge_note')}" if turn.get("judge_note") else ""))
    return "\n".join(rows) if len(rows) > 2 else "## Failed checks\n\nNone."
