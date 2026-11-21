"""Run the eval suites. From backend/:

    uv run python -m evals.run --suite retrieval           # free, seconds
    uv run python -m evals.run --suite judgement           # ~41 AI calls, ~10 min
    uv run python -m evals.run --suite behaviour           # ~6 interviews, ~20 min
    uv run python -m evals.run --suite report --runs 2     # ~16 reports, ~15 min
    uv run python -m evals.run --suite all
    uv run python -m evals.run --suite judgement --limit 5 # a quick smoke test

Each suite prints a table and writes evals/results/<suite>-<time>.md and .json. The exit code
is 1 if any metric misses its target, so it can gate a release. See docs/EVALS.md.
"""

import argparse
import asyncio
import sys

from evals import behaviour, judgement, report, retrieval
from evals.common import SuiteResult, save, table, use_groq_key

SUITES = ["retrieval", "judgement", "report", "behaviour"]


async def main(args: argparse.Namespace) -> int:
    suites = SUITES if args.suite == "all" else [args.suite]
    if any(s != "retrieval" for s in suites):
        use_groq_key()
    results: list[SuiteResult] = []
    for name in suites:
        print(f"\n=== {name} ===")
        if name == "retrieval":
            res = await retrieval.run(reindex=not args.no_reindex)
        elif name == "judgement":
            res = await judgement.run(args.limit, args.repeats, args.pace)
        elif name == "report":
            res = await report.run(args.limit, args.runs, max(args.pace, 30), not args.no_grounding)
        else:
            res = await behaviour.run(args.limit, args.pace)
        path = save(res)
        print("\n" + table(res) + f"\n\nSaved {path}")
        results.append(res)
    if len(results) > 1:
        print("\n=== summary ===")
        for r in results:
            print(f"  {r.suite:<10} {'PASS' if r.passed else 'FAIL'}  "
                  f"({sum(m.passed for m in r.metrics)}/{len(r.metrics)} metrics on target)")
    return 0 if all(r.passed for r in results) else 1


def parse() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Crackit AI evals")
    p.add_argument("--suite", choices=[*SUITES, "all"], default="all")
    p.add_argument("--limit", type=int, help="only the first N cases / transcripts / scenarios")
    p.add_argument("--repeats", type=int, default=1, help="judgement: judge each case N times")
    p.add_argument("--runs", type=int, default=2, help="report: build each report N times")
    p.add_argument("--pace", type=float, default=12.0,
                   help="seconds to wait between AI calls (free-tier tokens per minute)")
    p.add_argument("--no-grounding", action="store_true", help="report: skip the invented-claims check")
    p.add_argument("--no-reindex", action="store_true", help="retrieval: search the existing index")
    return p.parse_args()


if __name__ == "__main__":
    sys.exit(asyncio.run(main(parse())))
