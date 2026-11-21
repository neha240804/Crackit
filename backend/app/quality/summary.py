"""How is the AI doing on real interviews? Pass rates against the eval targets, latency, ratings.

Run it where the backend runs (it reads the database):

    uv run python -m app.quality.summary                 # last 7 days (dev, from backend/)
    docker compose -f docker-compose.prod.yml exec backend python -m app.quality.summary --days 30
    ... --json                                           # machine-readable, e.g. for a cron job

Exit code 1 when a check with enough data is below its target, so a scheduled run can alert.
"""

import argparse
import asyncio
import json
import statistics
import sys
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.core.config import settings
from app.db.models import InterviewQuality, InterviewSession
from app.db.session import SessionLocal, engine
from app.quality.checks import ALL_NAMES, ALL_TARGETS

MIN_SAMPLES = 5  # below this a pass rate says little: shown, but never "below target"


def _merge(into: dict, checks: dict) -> None:
    for name, c in checks.items():
        entry = into.setdefault(name, {"passed": 0, "total": 0})
        entry["passed"] += c["passed"]
        entry["total"] += c["total"]


async def collect(days: int) -> dict:
    since = datetime.now(UTC) - timedelta(days=days)
    async with SessionLocal() as db:
        rows = (await db.execute(
            select(InterviewQuality, InterviewSession.report, InterviewSession.user_feedback,
                   InterviewSession.config)
            .join(InterviewSession, InterviewSession.id == InterviewQuality.session_id)
            .where(InterviewQuality.created_at >= since)
            .order_by(InterviewQuality.created_at.desc())
        )).all()
    code, judge, latency, scores, ratings, examples, recent = {}, {}, [], [], [], [], []
    status = {"done": 0, "failed": 0, "pending": 0, "skipped": 0}
    for q, report, feedback, cfg in rows:
        _merge(code, q.checks.get("checks", {}))
        latency += q.checks.get("latency_ms", [])
        status[q.judge_status] = status.get(q.judge_status, 0) + 1
        if q.judge_status == "done" and q.judge:
            _merge(judge, q.judge.get("checks", {}))
        if report and report.get("overall_score") is not None:
            scores.append(report["overall_score"])
        if feedback and feedback.get("rating"):
            ratings.append(feedback["rating"])
        if len(recent) < 25:  # the latest interviews, one line each (the admin page's list)
            own = q.checks.get("checks", {}).values()
            counts = {"passed": sum(c["passed"] for c in own), "total": sum(c["total"] for c in own)}
            failed = sorted({c for f in q.checks.get("failures", []) for c in f["failed"]}
                            | {c for c, v in (q.judge or {}).get("checks", {}).items() if v["passed"] < v["total"]})
            recent.append({"interview": str(q.session_id), "at": q.created_at.isoformat(),
                           "title": (cfg or {}).get("title") or (cfg or {}).get("topic") or "Interview",
                           "type": (cfg or {}).get("interview_type"), "turns": q.checks.get("turns", 0),
                           "passed": counts["passed"], "total": counts["total"], "failed": failed,
                           "judge": q.judge_status, "score": (report or {}).get("overall_score"),
                           "rating": (feedback or {}).get("rating")})
        if len(examples) < 8:
            for f in q.checks.get("failures", [])[:2]:
                examples.append({"interview": str(q.session_id), **f})
            for n in (q.judge or {}).get("notes", [])[:2]:
                examples.append({"interview": str(q.session_id), "judge": n["note"], "turn": n["turn"]})
            for claim in (q.judge or {}).get("unsupported", [])[:2]:
                examples.append({"interview": str(q.session_id), "unsupported_claim": claim})

    checks = []
    for name, (target, meaning) in ALL_TARGETS.items():
        c = judge.get(name) or code.get(name)
        if not c or not c["total"]:
            continue
        rate = round(100 * c["passed"] / c["total"], 1)
        checks.append({"check": name, "name": ALL_NAMES[name], "rate": rate, "target": target,
                       "n": c["total"], "source": "judge" if name in judge else "code",
                       "below_target": c["total"] >= MIN_SAMPLES and rate < target, "meaning": meaning})
    q = statistics.quantiles(latency, n=10) if len(latency) >= 2 else []
    return {
        "days": days, "interviews": len(rows), "judge": status, "checks": checks,
        "latency_ms": {"turns": len(latency), "median": round(statistics.median(latency)) if latency else None,
                       "p90": round(q[-1]) if q else None},
        "overall_score": {"n": len(scores), "mean": round(statistics.mean(scores), 1) if scores else None},
        "user_rating": {"n": len(ratings), "mean": round(statistics.mean(ratings), 2) if ratings else None},
        "examples": examples[:8], "recent": recent, "names": ALL_NAMES,
        "judge_settings": {"enabled": bool(settings.online_eval_groq_key.strip()),
                           "sample_rate": settings.online_eval_sample_rate,
                           "daily_max": settings.online_eval_daily_max},
    }


def render(s: dict) -> str:
    j = s["judge"]
    lines = [f"Crackit online evaluation, last {s['days']} days",
             (f"Interviews checked: {s['interviews']}  (AI judge: {j['done']} judged, {j['pending']} pending, "
             f"{j['failed']} failed, {j['skipped']} code checks only)"), ""]
    if not s["checks"]:
        return "\n".join([*lines, "No finished interviews with a report in this period yet."])
    lines.append(f"{'Check':<36} {'Pass':>7} {'Target':>7} {'n':>6}  Source")
    for c in s["checks"]:
        flag = "  BELOW TARGET" if c["below_target"] else ("" if c["n"] >= MIN_SAMPLES else "  (few samples)")
        lines.append(f"{c['name']:<36} {c['rate']:>6}% {c['target']:>6}% {c['n']:>6}  {c['source']}{flag}")
    lat, sc, ur = s["latency_ms"], s["overall_score"], s["user_rating"]
    lines += ["", (f"Interviewer reply time: median {lat['median']} ms, 90th percentile {lat['p90']} ms "
                  f"({lat['turns']} turns; AI step only, not speech)"),
              f"Report overall score: mean {sc['mean']} ({sc['n']} reports)",
              f"Students' own rating: mean {ur['mean']} / 5 ({ur['n']} ratings)"]
    if s["examples"]:
        lines += ["", "Recent failures (look at these first):"]
        lines += [f"- {json.dumps(e, ensure_ascii=False)[:400]}" for e in s["examples"]]
    return "\n".join(lines)


async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    try:
        summary = await collect(args.days)
    finally:
        await engine.dispose()
    print(json.dumps(summary, indent=2) if args.json else render(summary))
    return 1 if any(c["below_target"] for c in summary["checks"]) else 0


if __name__ == "__main__":
    if sys.platform == "win32":  # psycopg/asyncpg on Windows: the selector loop (see CLAUDE.md)
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    sys.exit(asyncio.run(main()))
