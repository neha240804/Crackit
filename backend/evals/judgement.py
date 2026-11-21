"""Suite 1: does the interviewer judge answers correctly?

Each case is a question, a candidate answer and the label a human gave it. The runner puts
the case into a real interview state and calls the real interviewer step (interviewer_node,
same prompt, model and code as production), then compares its `assessment` with the label.

What matters most is the MISS decision (incorrect / unclear / partially_correct vs the rest):
it decides whether the candidate gets a follow-up, a hint, or a topic change. A lenient
error (a wrong answer judged fine) is worse than a harsh one: the candidate never learns.
"""

import json
from collections import Counter

from app.agents.interview.graph import MISSES, interviewer_node, prepare_node
from evals.common import DATA_DIR, Metric, Pacer, SuiteResult, Timer, pct, with_retry

LABELS = ["correct", "partially_correct", "incorrect", "unclear", "not_applicable"]
OPENING = ("Hello, I'm Maya, and I'll be your interviewer today. This is a mock interview. "
           "To begin, please introduce yourself briefly.")
INTRO = "Hi, I'm a final-year student. I did a project and an internship related to this area."


def load_cases() -> list[dict]:
    lines = (DATA_DIR / "judgement.jsonl").read_text(encoding="utf-8").splitlines()
    return [json.loads(line) for line in lines if line.strip()]


def is_miss(label: str) -> bool:
    return label in MISSES


_kb_cache: dict[tuple, str] = {}


def build_state(case: dict) -> dict:
    """A realistic interview state that ends with the candidate's answer to the question."""
    cfg = {"interview_type": case["type"], "topic": case.get("topic"), "subtopics": [],
           "experience": case["level"], "duration_minutes": 10, "interviewer": "maya"}
    key = (case["type"], case.get("topic"))
    if key not in _kb_cache:  # the same retrieval the real interview does (prepare step)
        _kb_cache[key] = prepare_node({"config": cfg, "context": ""})["kb"]
    area = case.get("topic") or "Teamwork and conflict"
    plan = {"title": f"{area} interview",
            "focus_areas": [area, "Applied scenarios", "Trade-offs and design", "Own projects"]}
    messages = [{"role": "interviewer", "text": OPENING, "kind": "opening",
                 "focus_area": "introduction"}]
    if case.get("question"):
        messages += [
            {"role": "candidate", "text": INTRO, "kind": "answer", "duration_sec": 8},
            {"role": "interviewer", "text": case["question"], "kind": "question", "focus_area": area},
        ]
    messages.append({"role": "candidate", "text": case["answer"], "kind": "answer",
                     "duration_sec": max(3, len(case["answer"].split()) / 2.2)})
    return {"config": cfg, "context": "", "kb": _kb_cache[key], "plan": plan,
            "messages": messages, "deadline": None}


async def judge_once(case: dict) -> dict:
    out = await with_retry(lambda: interviewer_node(build_state(case)), case["id"])
    judged, reply = out["messages"][-2], out["messages"][-1]
    return {"assessment": judged["assessment"], "next_move": reply.get("next_move"),
            "reply": reply["text"]}


async def run(limit: int | None = None, repeats: int = 1, pace: float = 12.0) -> SuiteResult:
    cases = load_cases()[:limit] if limit else load_cases()
    pacer = Pacer(pace)
    details = []
    with Timer() as t:
        for i, case in enumerate(cases, 1):
            runs = []
            for _ in range(repeats):
                runs.append(await judge_once(case))
                await pacer.wait()
            ok_labels = {case["expected"], *case.get("also_ok", [])}
            preds = [r["assessment"] for r in runs]
            details.append({
                "id": case["id"], "expected": case["expected"], "also_ok": case.get("also_ok", []),
                "predicted": preds, "exact": [p in ok_labels for p in preds],
                "miss_agrees": [is_miss(p) == is_miss(case["expected"]) for p in preds],
                "next_move": [r["next_move"] for r in runs], "reply": runs[0]["reply"],
                "answer": case["answer"], "note": case.get("note", ""),
            })
            mark = "ok " if all(details[-1]["miss_agrees"]) else "XX "
            print(f"  {mark}{i:>2}/{len(cases)} {case['id']}: expected {case['expected']}, got {preds}")

    flat = [(d, p) for d in details for p in d["predicted"]]
    n = len(flat)
    exp_miss = [(d, p) for d, p in flat if is_miss(d["expected"])]
    exp_ok = [(d, p) for d, p in flat if not is_miss(d["expected"])]
    lenient = sum(not is_miss(p) for _, p in exp_miss)
    harsh = sum(is_miss(p) for _, p in exp_ok)
    stable = sum(len(set(d["predicted"])) == 1 for d in details)

    metrics = [
        Metric("Miss decision agrees with label", pct(sum(m for d in details for m in d["miss_agrees"]), n), 90,
               help="Right / not-right decision (it drives follow-up vs hint vs topic change). The headline number."),
        Metric("Exact label agrees", pct(sum(e for d in details for e in d["exact"]), n), 75,
               help="Same label as the human, or one of its accepted alternatives."),
        Metric("Lenient errors (wrong answer judged fine)", pct(lenient, len(exp_miss)), 10, higher_is_better=False,
               help="Of answers labelled incorrect / unclear / partial, how many the AI let pass. Worst error type."),
        Metric("Harsh errors (good answer judged wrong)", pct(harsh, len(exp_ok)), 10, higher_is_better=False,
               help="Of answers labelled correct / not applicable, how many the AI marked as a miss."),
    ]
    if repeats > 1:
        metrics.append(Metric("Same label on every repeat", pct(stable, len(details)), 85,
                              help=f"Cases judged identically in all {repeats} runs (consistency)."))
    confusion = Counter((d["expected"], p) for d, p in flat)
    notes = [f"{len(cases)} cases x {repeats} run(s) = {n} judgements."]
    result = SuiteResult("judgement", metrics, details, notes, t.seconds)
    result.extra_md = confusion_md(confusion) + "\n\n" + mistakes_md(details)
    return result


def confusion_md(confusion: Counter) -> str:
    rows = ["## Confusion matrix (rows = human label, columns = AI label)", "",
            "| human \\ AI | " + " | ".join(LABELS) + " |", "|---" * (len(LABELS) + 1) + "|"]
    for exp in LABELS:
        rows.append(f"| {exp} | " + " | ".join(str(confusion.get((exp, p), 0) or "")
                                              for p in LABELS) + " |")
    return "\n".join(rows)


def mistakes_md(details: list[dict]) -> str:
    bad = [d for d in details if not all(d["miss_agrees"])]
    if not bad:
        return "## Disagreements on the miss decision\n\nNone."
    rows = ["## Disagreements on the miss decision", ""]
    for d in bad:
        rows += [(f"- **{d['id']}**: human `{d['expected']}`, AI `{', '.join(d['predicted'])}`. "
                 f"Answer: \"{d['answer'][:160]}\". Interviewer replied: \"{d['reply'][:200]}\"")]
    return "\n".join(rows)
