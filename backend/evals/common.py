"""Shared helpers for the eval suites: the Groq key, pacing, retries, metrics and results files."""

import asyncio
import json
import os
import time
from collections.abc import Awaitable, Callable
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path

import groq

from app.core.config import ROOT_DIR
from app.core.groq_key import looks_like_groq_key, set_user_key

EVALS_DIR = Path(__file__).parent
DATA_DIR = EVALS_DIR / "data"
RESULTS_DIR = EVALS_DIR / "results"


# ------------------------------------------------------------------ the Groq key
def use_groq_key() -> None:
    """Crackit has no server key (bring-your-own-key only), so the evals need one too.

    Order: CRACKIT_EVAL_GROQ_KEY env var, GROQ_API_KEY env var, then GROQ_API_KEY in the repo's
    .env (the app itself ignores it). Quotes around the value are stripped."""
    key = os.environ.get("CRACKIT_EVAL_GROQ_KEY") or os.environ.get("GROQ_API_KEY") or ""
    env_file = ROOT_DIR / ".env"
    if not key and env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith("GROQ_API_KEY="):
                key = line.split("=", 1)[1]
    key = key.strip().strip('"').strip("'")
    if not looks_like_groq_key(key):
        raise SystemExit("No Groq key for the evals: set CRACKIT_EVAL_GROQ_KEY (a gsk_... key).")
    set_user_key(key)


# ------------------------------------------------------------------ pacing and retries
@dataclass
class Pacer:
    """Groq's free tier allows ~8,000 tokens per minute per model. One interviewer turn is
    ~2k tokens and a report ~6k, so the suites wait between calls instead of failing."""

    seconds: float = 12.0

    async def wait(self) -> None:
        if self.seconds > 0:
            await asyncio.sleep(self.seconds)


async def with_retry[T](make: Callable[[], Awaitable[T]], label: str, tries: int = 3) -> T:
    """Run an AI call; on a rate limit, wait a minute and try again (the app itself falls
    back to the other model first, see agents/common/llm.py)."""
    for attempt in range(1, tries + 1):
        try:
            return await make()
        except groq.RateLimitError:
            if attempt == tries:
                raise
            print(f"  rate limited on {label}; waiting 60 s (try {attempt}/{tries})")
            await asyncio.sleep(60)
    raise RuntimeError("unreachable")


# ------------------------------------------------------------------ metrics
@dataclass
class Metric:
    """One number with its target. higher_is_better=False for error rates."""

    name: str
    value: float
    target: float
    higher_is_better: bool = True
    unit: str = "%"
    help: str = ""

    @property
    def passed(self) -> bool:
        return self.value >= self.target if self.higher_is_better else self.value <= self.target

    def show(self, x: float) -> str:
        return f"{x:.0f}%" if self.unit == "%" else f"{x:.2f}{self.unit}"


@dataclass
class SuiteResult:
    suite: str
    metrics: list[Metric]
    details: list[dict] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    seconds: float = 0.0
    extra_md: str = ""  # suite-specific tables for the .md summary

    @property
    def passed(self) -> bool:
        return all(m.passed for m in self.metrics)


def pct(part: float, whole: float) -> float:
    return 100.0 * part / whole if whole else 0.0


def table(result: SuiteResult) -> str:
    rows = ["| Metric | Result | Target | |", "|---|---|---|---|"]
    for m in result.metrics:
        sign = ">=" if m.higher_is_better else "<="
        rows.append(f"| {m.name} | {m.show(m.value)} | {sign} {m.show(m.target)} | "
                    f"{'PASS' if m.passed else 'FAIL'} |")
    return "\n".join(rows)


def save(result: SuiteResult) -> Path:
    """Write <suite>-<time>.json (every case) and .md (summary) to evals/results/."""
    RESULTS_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    base = RESULTS_DIR / f"{result.suite}-{stamp}"
    payload = {"suite": result.suite, "passed": result.passed, "seconds": round(result.seconds),
               "metrics": [{**asdict(m), "passed": m.passed} for m in result.metrics],
               "notes": result.notes, "details": result.details}  # extra_md is only for the .md
    base.with_suffix(".json").write_text(json.dumps(payload, indent=2, ensure_ascii=False),
                                         encoding="utf-8")
    md = [f"# Eval: {result.suite}", "",
          (f"{'PASSED' if result.passed else 'FAILED'} in {result.seconds / 60:.1f} min "
          f"({datetime.now():%Y-%m-%d %H:%M})"), "", table(result), ""]
    md += [f"- **{m.name}**: {m.help}" for m in result.metrics if m.help]
    if result.notes:
        md += ["", "## Notes", *[f"- {n}" for n in result.notes]]
    if result.extra_md:
        md += ["", result.extra_md]
    base.with_suffix(".md").write_text("\n".join(md) + "\n", encoding="utf-8")
    return base.with_suffix(".md")


class Timer:
    def __enter__(self):
        self.start = time.time()
        return self

    def __exit__(self, *_):
        self.seconds = time.time() - self.start
