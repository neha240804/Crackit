"""DeepEval on the retrieval dataset: contextual precision and recall of the question-bank search.

Run from backend/ (uses a Groq key like the other suites):

    uv run python -m evals.deepeval_rag            # all covered-subject queries
    uv run python -m evals.deepeval_rag --limit 5  # smoke test

How the dataset maps onto DeepEval's RAG test case:
  input              the topic a user types ("Transformers")
  retrieval_context  what Crackit actually hands the AI: the app's own search (top 4 sections at
                     or above RELEVANT_SCORE, plus heading-keyword matches), in rank order
  expected_output    the ideal material: the labelled best section's text, or, for broad queries
                     with no single best section, the themes of the expected question-bank file(s)

Metrics (an LLM judge reads them; scores 0-1):
  ContextualPrecision  are the RELEVANT sections ranked above irrelevant ones? (rank-weighted
                       precision of the retrieved list)
  ContextualRecall     how much of the expected material is present in what was retrieved?
Next to them, the same queries scored without an LLM (plain information-retrieval precision
and recall against the labelled files), so the two can be compared.

Uncovered subjects (the dataset's `negative` list) don't fit DeepEval's test case (there is
no expected output); their rejection rate is in the retrieval suite.

The judge is a Groq model from a different family than the app's gpt-oss models (default
qwen3.8-27b; set DEEPEVAL_JUDGE_MODEL to change it), so it doesn't share their blind spots
and uses a separate token quota. (llama-3.3-70b, the first choice, isn't offered on this key.)
"""

import argparse
import os
import statistics
import time

os.environ.setdefault("DEEPEVAL_TELEMETRY_OPT_OUT", "YES")  # no usage data sent to DeepEval
os.environ.setdefault("ERROR_REPORTING", "NO")

import groq
from deepeval.metrics import ContextualPrecisionMetric, ContextualRecallMetric
from deepeval.models import DeepEvalBaseLLM
from deepeval.test_case import LLMTestCase
from langchain_groq import ChatGroq

from app.core.groq_key import current_groq_key
from app.rag.knowledge_base import RELEVANT_SCORE, load_documents, search_with_scores
from evals.common import Metric, SuiteResult, Timer, pct, save, table, use_groq_key
from evals.retrieval import load

JUDGE_MODEL = os.environ.get("DEEPEVAL_JUDGE_MODEL", "qwen/qwen3.8-27b")
NOTHING = "(no question-bank section was retrieved)"


class GroqJudge(DeepEvalBaseLLM):
    """DeepEval's judge interface on a Groq model. DeepEval passes a Pydantic `schema` when it
    wants structured verdicts; JSON mode + the schema in its prompt covers models without
    strict json_schema support."""

    def __init__(self, model: str = JUDGE_MODEL):
        self.model_name = model
        super().__init__(model)

    def load_model(self):
        return ChatGroq(model=self.model_name, api_key=current_groq_key(), temperature=0,
                        max_retries=6, timeout=120)

    def generate(self, prompt: str, schema=None):
        if schema is not None:
            return self.model.with_structured_output(schema, method="json_mode").invoke(prompt)
        return self.model.invoke(prompt).content

    async def a_generate(self, prompt: str, schema=None):
        if schema is not None:
            return await self.model.with_structured_output(schema, method="json_mode").ainvoke(prompt)
        return (await self.model.ainvoke(prompt)).content

    def get_model_name(self) -> str:
        return f"groq/{self.model_name}"


def expected_material(query: dict, docs) -> str:
    """The ideal context for this query, built from the labelled answer key."""
    if query.get("section"):
        for d in docs:
            if d.metadata["topic"] == query["section"]:
                return d.page_content
    themes = [f"{d.metadata['topic']}" for d in docs
              if d.metadata["doc_type"] == "questions" and d.metadata["role_family"] in query["expect"]]
    return (f"Interview questions on {query['query']} cover these themes: " + "; ".join(themes) + ".")


def run(limit: int | None, pace: float) -> SuiteResult:
    use_groq_key()
    judge = GroqJudge()
    precision_metric = ContextualPrecisionMetric(model=judge, include_reason=True, async_mode=False)
    recall_metric = ContextualRecallMetric(model=judge, include_reason=True, async_mode=False)
    docs = load_documents()
    queries = load()["positive"][:limit] if limit else load()["positive"]
    details = []
    stopped = ""
    with Timer() as t:
        for i, q in enumerate(queries, 1):
            # Exactly what the app hands the AI (meaning + heading keywords).
            kept = [(d, s) for d, s, _ in search_with_scores(q["query"], 4, "questions", None, RELEVANT_SCORE)]
            case = LLMTestCase(
                input=f"Interview topic: {q['query']}",
                actual_output="(not used: retrieval is evaluated on its own)",
                expected_output=expected_material(q, docs),
                retrieval_context=[d.page_content for d, _ in kept] or [NOTHING],
            )
            row = {"query": q["query"], "kept": [d.metadata["topic"] for d, _ in kept],
                   "kept_families": [d.metadata["role_family"] for d, _ in kept]}
            try:
                for name, metric in (("precision", precision_metric), ("recall", recall_metric)):
                    metric.measure(case)
                    row[name], row[f"{name}_reason"] = metric.score, metric.reason
                    time.sleep(pace)
            except groq.RateLimitError as exc:
                # The judge's free daily token quota (200k/day) ran out: keep what's scored.
                stopped = (f"Stopped after {len(details)} of {len(queries)} queries: the judge hit "
                           f"its Groq rate limit ({str(exc)[:120]}). Re-run later for the rest.")
                print("  " + stopped)
                break
            # Plain IR versions (no LLM), against the labelled files.
            relevant_kept = sum(f in q["expect"] for f in row["kept_families"])
            row["ir_precision"] = relevant_kept / len(kept) if kept else 0.0
            row["ir_found"] = relevant_kept > 0
            details.append(row)
            print(f"  {i:>2}/{len(queries)} {q['query']!r}: precision {row['precision']:.2f}, "
                  f"recall {row['recall']:.2f}, {len(kept)} section(s) kept")

    mean_p = statistics.mean(r["precision"] for r in details)
    mean_r = statistics.mean(r["recall"] for r in details)
    metrics = [
        Metric("DeepEval contextual precision (mean)", 100 * mean_p, 80,
               help="Relevant sections ranked above irrelevant ones, judged by an LLM (0-100)."),
        Metric("DeepEval contextual recall (mean)", 100 * mean_r, 70,
               help="Share of the expected material present in the retrieved sections, judged by an LLM."),
        Metric("Queries with recall >= 0.5", pct(sum(r["recall"] >= 0.5 for r in details), len(details)), 80,
               help="Topics where at least half the expected material reached the AI."),
        Metric("IR precision (no LLM, mean)", 100 * statistics.mean(r["ir_precision"] for r in details), 85,
               help="Share of kept sections from a labelled file (0 when nothing is kept)."),
        Metric("IR recall (no LLM)", pct(sum(r["ir_found"] for r in details), len(details)), 90,
               help="Queries where at least one section from a labelled file was kept."),
    ]
    notes = [(f"{len(details)} covered-subject queries; judge {judge.get_model_name()}; "
              f"retrieval = the app's search (top 4 at >= {RELEVANT_SCORE} + heading keywords).")]
    result = SuiteResult("deepeval-rag", metrics, details, notes + ([stopped] if stopped else []),
                         t.seconds)
    low = sorted(details, key=lambda r: r["recall"] + r["precision"])[:8]
    result.extra_md = "\n".join(
        ["## Lowest-scoring queries", "", "| Query | Precision | Recall | Kept sections | Judge's reason (recall) |",
         "|---|---|---|---|---|"]
        + [f"| {r['query']} | {r['precision']:.2f} | {r['recall']:.2f} | {'; '.join(r['kept']) or 'none'} | "
           f"{(r['recall_reason'] or '').replace('|', '/')[:220]} |" for r in low])
    return result


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="DeepEval contextual precision / recall on question-bank search")
    p.add_argument("--limit", type=int)
    p.add_argument("--pace", type=float, default=3.0, help="seconds between judge calls")
    args = p.parse_args()
    res = run(args.limit, args.pace)
    print("\n" + table(res) + f"\n\nSaved {save(res)}")
