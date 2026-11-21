"""Quality checks that need judgement: a strong-model judge reads a finished interview.

Code can't tell whether a reply gave the answer away or whether a report's praise is true, so
a judge does, using the same prompts as the offline evals (evals/behaviour.py and
evals/report.py import them from here).

Runs on the SITE OWNER's Groq key (ONLINE_EVAL_GROQ_KEY), never the student's: their free
quota is what limits them to 5 interviews a day, and judging costs ~4-6k tokens per interview.
"""

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from app.agents.common.llm import get_structured_llm
from app.agents.interview.graph import answered_pairs


# ---------------------------------------------------------------- interviewer turns
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


def verdict_checks(v: TurnVerdict) -> dict[str, bool]:
    return {"never_reveals_answer": not v.reveals_answer, "no_calculation": not v.asks_calculation,
            "on_topic": v.on_topic, "one_question": v.one_question}


# ---------------------------------------------------------------- report claims
class Groundedness(BaseModel):
    """Judge output. All fields required (Groq strict mode)."""

    unsupported: list[str] = Field(description="Claims about the candidate that the transcript "
                                               "does NOT support, quoted from the report. Empty if none.")
    claims_checked: int = Field(description="How many claims about the candidate you checked")


# The report also receives MEASURED speech metrics (pace, fillers, length). The first version of
# this judge saw only the transcript, so true claims like "good pace (130 wpm)" were counted as
# invented (7 of the 13 flagged in the first run). It now gets the metrics too, and still flags
# what neither can show: tone, confidence, manner.
GROUNDED_PROMPT = """You check an interview feedback report for claims that are not supported by
its evidence: the transcript AND the measured speech metrics (speaking pace in words per
minute, filler words per 100 words, answer length), measured from the audio. A claim is
unsupported if it credits the candidate with something they did not say (a concept, an
example, a number, a skill), describes their answer wrongly, or describes something neither
source can show (tone of voice, confidence, manner, demeanour). Pace, filler and length
claims that match the metrics ARE supported. Advice, scores and generic coaching ("practise
STAR stories") are not claims: ignore them. Be strict but fair."""


def report_claims(report: dict) -> list[str]:
    return [f"SUMMARY: {report['summary']}", *[f"STRENGTH: {s}" for s in report["strengths"]],
            *[f"Q{q['question_index']} STRENGTH: {s}" for q in report["questions"] for s in q["strengths"]]]


async def judge_report(qa: list[tuple[str, str]], report: dict) -> Groundedness:
    transcript = "\n".join(f"Q{i}: {q}\nA{i}: {a}" for i, (q, a) in enumerate(qa, 1))
    metrics = {k: v for k, v in report.get("metrics", {}).items() if k != "per_answer"}
    llm = get_structured_llm(Groundedness, tier="strong", temperature=0)
    return await llm.ainvoke([
        SystemMessage(GROUNDED_PROMPT),
        HumanMessage(f"TRANSCRIPT:\n{transcript}\n\nMEASURED SPEECH METRICS: {metrics}\n\n"
                     "REPORT CLAIMS:\n" + "\n".join(report_claims(report))),
    ])


# ---------------------------------------------------------------- a real interview
def _topic(cfg: dict) -> tuple[str, str]:
    if cfg["interview_type"] == "hr":
        return "HR and behavioral", "HR round"
    return cfg.get("topic") or cfg.get("title") or "the candidate's resume and target role", "technical interview"


async def judge_interview(messages: list[dict], cfg: dict, report: dict) -> dict:
    """Judge a finished interview: every interviewer turn, then the report's claims.
    Returns {"checks": {check: {"passed", "total"}}, "notes": [...], "unsupported": [...]}."""
    from app.quality.checks import replay_turns, tally  # here: checks imports the graph too

    turns = replay_turns(messages)
    results, notes = [], []
    if turns:
        lines = [f"OPENING: {messages[0]['text']}"]
        for t in turns:
            lines += [f"CANDIDATE: {t['answer']}", f"INTERVIEWER turn {t['index']}: {t['reply']}"]
        topic, kind = _topic(cfg)
        judge = get_structured_llm(Verdicts, tier="strong", temperature=0)
        verdicts: Verdicts = await judge.ainvoke([SystemMessage(JUDGE.format(topic=topic, kind=kind)),
                                                  HumanMessage("\n".join(lines))])
        for v in verdicts.turns:
            if 0 <= v.turn < len(turns):
                results.append(verdict_checks(v))
                if v.note.strip():
                    notes.append({"turn": v.turn, "note": v.note.strip()[:300]})

    unsupported: list[str] = []
    qa = [(q["text"], a["text"]) for q, a in answered_pairs(messages)]
    if qa and report.get("questions"):
        grounded = await judge_report(qa, report)
        unsupported = grounded.unsupported[:10]
        # One pass/fail per checked claim, so the rate reads "x% of claims were supported".
        checked = max(grounded.claims_checked, len(unsupported))
        results += [{"report_grounded": True}] * (checked - len(unsupported))
        results += [{"report_grounded": False}] * len(unsupported)
    return {"checks": tally(results), "notes": notes[:10], "unsupported": unsupported}
