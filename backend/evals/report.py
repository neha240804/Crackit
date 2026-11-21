"""Suite 3: are the feedback report's scores right, stable and grounded?

Each transcript has the overall score band an experienced interviewer would give, limits on
some per-question scores (e.g. "I don't know" scores at most 2/10), and pairs that must rank
in order (a strong interview scores above a weak one on the same topic). The runner calls the
real build_report() several times per transcript and checks:
  - in band:      overall score inside the expected band
  - per question: per-question limits respected
  - stable:       the spread of overall scores across runs is small
  - ordered:      the pairs rank the right way round (on the mean score)
  - grounded:     a second AI pass (strong model) checks every strength and summary claim
                  against the transcript and lists the ones the candidate never said
"""

import json
import statistics

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from app.agents.common.llm import get_structured_llm
from app.agents.interview.graph import build_report
from evals.common import DATA_DIR, Metric, Pacer, SuiteResult, Timer, pct, with_retry

WPM = 130  # speaking pace used to fill in answer durations (the report measures pace)


class Groundedness(BaseModel):
    """Judge output. All fields required (Groq strict mode)."""

    unsupported: list[str] = Field(description="Claims about the candidate that the transcript "
                                               "does NOT support, quoted from the report. Empty if none.")
    claims_checked: int = Field(description="How many claims about the candidate you checked")


GROUNDED_PROMPT = """You check an interview feedback report for claims that are not supported by
the transcript. A claim is unsupported if it credits the candidate with something they did not
say (a concept, an example, a number, a skill) or describes their answer wrongly. Advice,
scores and generic coaching ("practise STAR stories") are not claims: ignore them. Judge only
against the transcript; be strict but fair."""


def load() -> dict:
    return json.loads((DATA_DIR / "report_transcripts.json").read_text(encoding="utf-8"))


def to_state(t: dict) -> dict:
    messages = []
    for i, (q, a) in enumerate(t["qa"]):
        messages.append({"role": "interviewer", "text": q, "kind": "question" if i == 0 else "follow_up"})
        messages.append({"role": "candidate", "text": a, "kind": "answer",
                         "duration_sec": round(len(a.split()) / WPM * 60, 1)})
    cfg = {"interview_type": t["type"], "topic": t.get("topic"), "experience": t["level"],
           "duration_minutes": 10, "interviewer": "maya"}
    return {"config": cfg, "plan": {"title": t["title"]}, "messages": messages}


async def grounded(t: dict, report: dict) -> dict:
    claims = [f"SUMMARY: {report['summary']}", *[f"STRENGTH: {s}" for s in report["strengths"]],
              *[f"Q{q['question_index']} STRENGTH: {s}" for q in report["questions"] for s in q["strengths"]]]
    transcript = "\n".join(f"Q{i}: {q}\nA{i}: {a}" for i, (q, a) in enumerate(t["qa"], 1))
    llm = get_structured_llm(Groundedness, tier="strong", temperature=0)
    verdict: Groundedness = await with_retry(lambda: llm.ainvoke([
        SystemMessage(GROUNDED_PROMPT),
        HumanMessage(f"TRANSCRIPT:\n{transcript}\n\nREPORT CLAIMS:\n" + "\n".join(claims)),
    ]), f"groundedness {t['id']}")
    return verdict.model_dump()


async def run(limit: int | None = None, runs: int = 2, pace: float = 30.0,
              check_grounding: bool = True) -> SuiteResult:
    data = load()
    transcripts = data["transcripts"][:limit] if limit else data["transcripts"]
    pacer = Pacer(pace)
    details = []
    with Timer() as t:
        for i, tr in enumerate(transcripts, 1):
            reports = []
            for _ in range(runs):
                reports.append(await with_retry(lambda tr=tr: build_report(to_state(tr)), tr["id"]))
                await pacer.wait()
            overall = [r["overall_score"] for r in reports]
            lo, hi = tr["overall"]
            limit_checks = []
            for r in reports:
                by_q = {q["question_index"]: q["score"] for q in r["questions"]}
                for q_index, rule in tr.get("per_question", {}).items():
                    score = by_q.get(int(q_index))
                    ok = score is not None and rule.get("min", 0) <= score <= rule.get("max", 10)
                    limit_checks.append({"q": int(q_index), "score": score, "rule": rule, "ok": ok})
            ground = None
            if check_grounding:
                ground = await grounded(tr, reports[0])
                await pacer.wait()
            details.append({
                "id": tr["id"], "band": [lo, hi], "overall": overall,
                "in_band": [lo <= s <= hi for s in overall],
                "distance": [max(lo - s, s - hi, 0) for s in overall],
                "spread": max(overall) - min(overall), "mean": statistics.mean(overall),
                "per_question": limit_checks, "grounding": ground,
                "summary": reports[0]["summary"],
            })
            g = f", unsupported claims {len(ground['unsupported'])}" if ground else ""
            print(f"  {i}/{len(transcripts)} {tr['id']}: scores {overall} (band {lo}-{hi}){g}")

    by_id = {d["id"]: d for d in details}
    pairs = [(a, b) for a, b in data["order"] if a in by_id and b in by_id]
    ordered = sum(by_id[a]["mean"] > by_id[b]["mean"] for a, b in pairs)
    in_band = [x for d in details for x in d["in_band"]]
    q_checks = [c["ok"] for d in details for c in d["per_question"]]
    metrics = [
        Metric("Overall score in expected band", pct(sum(in_band), len(in_band)), 80,
               help="Reports whose overall score falls inside the band an experienced interviewer would give."),
        Metric("Mean distance outside the band", statistics.mean(x for d in details for x in d["distance"]), 5,
               higher_is_better=False, unit=" pts", help="How far off the misses are (0 = always in band)."),
        Metric("Per-question limits respected", pct(sum(q_checks), len(q_checks)), 85,
               help='E.g. "I don\'t know" scores at most 2/10, a complete answer at least 7/10.'),
    ]
    if pairs:  # needs both transcripts of a pair (not the case with a small --limit)
        metrics.append(Metric("Strong vs weak ranked correctly", pct(ordered, len(pairs)), 100,
                              help="Pairs of transcripts that must rank in order, compared on the mean score."))
    if runs > 1:
        metrics.append(Metric("Largest score spread across runs", max(d["spread"] for d in details), 10,
                               higher_is_better=False, unit=" pts",
                               help=f"Same transcript scored {runs} times: max - min of the overall score."))
    if check_grounding:
        clean = sum(not d["grounding"]["unsupported"] for d in details)
        metrics.append(Metric("Reports with no invented claims", pct(clean, len(details)), 75,
                              help="A strong-model check lists strengths / summary claims the candidate never said."))
    result = SuiteResult("report", metrics, details,
                         [f"{len(transcripts)} transcripts x {runs} run(s)."], t.seconds)
    result.extra_md = report_md(details)
    return result


def report_md(details: list[dict]) -> str:
    rows = ["## Per transcript", "", "| Transcript | Band | Scores | Spread | Invented claims |",
            "|---|---|---|---|---|"]
    for d in details:
        g = d["grounding"]
        rows.append(f"| {d['id']} | {d['band'][0]}-{d['band'][1]} | {', '.join(map(str, d['overall']))} | "
                    f"{d['spread']} | {len(g['unsupported']) if g else '-'} |")
    claims = [(d["id"], c) for d in details if d["grounding"] for c in d["grounding"]["unsupported"]]
    if claims:
        rows += ["", "## Invented claims found", *[f"- **{i}**: {c}" for i, c in claims]]
    broken = [(d["id"], c) for d in details for c in d["per_question"] if not c["ok"]]
    if broken:
        rows += ["", "## Per-question limits broken",
                 *[f"- **{i}** Q{c['q']}: scored {c['score']}, expected {c['rule']}" for i, c in broken]]
    return "\n".join(rows)
