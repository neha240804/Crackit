"""Suite 9: does search by meaning find the right question-bank sections?

No AI model calls (only the local embedding model), so it is free and takes seconds. Uses
the app's own search (search_with_scores, as the interview's prepare step and prep call it):
top 4 question-bank sections at or above RELEVANT_SCORE, plus keyword matches on section
headings for short topics. Also sweeps the semantic cut-off to show the trade-off between
finding covered subjects and rejecting uncovered ones, which is how RELEVANT_SCORE was chosen.
"""

import json

from qdrant_client import models

from app.rag.knowledge_base import RELEVANT_SCORE, ingest_knowledge_base, search_with_scores
from app.rag.vectorstore import KNOWLEDGE_BASE, get_vectorstore
from evals.common import DATA_DIR, Metric, SuiteResult, Timer, pct

K = 4
SWEEP = [round(0.55 + 0.02 * i, 2) for i in range(11)]  # 0.55 ... 0.75


def load() -> dict:
    return json.loads((DATA_DIR / "retrieval_queries.json").read_text(encoding="utf-8"))


def search_docs(query: str) -> list:
    """(Document, score) for the top K question-bank sections, as the interview searches."""
    flt = models.Filter(must=[models.FieldCondition(key="metadata.doc_type",
                                                    match=models.MatchValue(value="questions"))])
    return get_vectorstore(KNOWLEDGE_BASE).similarity_search_with_score(query, k=K, filter=flt)


def search(query: str) -> list[tuple[str, str, float]]:
    """(role_family, section heading, score): top K by meaning alone (for the cut-off sweep)."""
    return [(d.metadata["role_family"], d.metadata["topic"], float(s)) for d, s in search_docs(query)]


def app_search(query: str, cutoff: float) -> list[tuple[str, str, float, str]]:
    """(role_family, heading, score, why): exactly what the app hands the AI."""
    return [(d.metadata["role_family"], d.metadata["topic"], s, why)
            for d, s, why in search_with_scores(query, K, "questions", None, cutoff)]


async def run(reindex: bool = True, cutoff: float = RELEVANT_SCORE) -> SuiteResult:
    data = load()
    with Timer() as t:
        if reindex:  # search what is in knowledge_base/ now, not an older index
            print(f"  indexed {ingest_knowledge_base()} question-bank and rubric sections")
        pos = [{**q, "hits": search(q["query"])} for q in data["positive"]]
        neg = [{"query": q, "hits": search(q)} for q in data["negative"]]

    def kept(hits, cut):
        return [h for h in hits if h[2] >= cut]

    for q in pos:
        q["kept"] = app_search(q["query"], cutoff)
        q["top1_ok"] = bool(q["kept"]) and q["kept"][0][0] in q["expect"]
        q["found"] = any(h[0] in q["expect"] for h in q["kept"])
        q["precision"] = pct(sum(h[0] in q["expect"] for h in q["kept"]), len(q["kept"])) if q["kept"] else None
        if q.get("section"):
            q["section_ok"] = any(h[1] == q["section"] for h in q["kept"])
        via = sum(h[3] == "keyword" for h in q["kept"])
        print(f"  {'ok' if q['found'] else 'XX'} {q['query']!r}: best {q['hits'][0][0]} "
              f"{q['hits'][0][2]:.2f}, {len(q['kept'])} kept ({via} by heading keywords)")
    for q in neg:
        q["kept"] = app_search(q["query"], cutoff)
        q["rejected"] = not q["kept"]
        print(f"  {'ok' if q['rejected'] else 'XX'} (uncovered) {q['query']!r}: best "
              f"{q['hits'][0][0]} {q['hits'][0][2]:.2f}")

    precisions = [q["precision"] for q in pos if q["precision"] is not None]
    sections = [q["section_ok"] for q in pos if "section_ok" in q]
    metrics = [
        Metric("Covered subjects found", pct(sum(q["found"] for q in pos), len(pos)), 90,
               help=f"A right section is returned at or above the cut-off ({cutoff})."),
        Metric("Best result is the right subject", pct(sum(q["top1_ok"] for q in pos), len(pos)), 90,
               help="The first section handed to the AI comes from an expected question-bank file."),
        Metric("Precision of what is kept", sum(precisions) / len(precisions) if precisions else 0, 85,
               help="Of the sections passed to the AI, the share from the right subject."),
        Metric("Right section among results", pct(sum(sections), len(sections)), 80,
               help="For queries with a known best section heading."),
        Metric("Uncovered subjects rejected", pct(sum(q["rejected"] for q in neg), len(neg)), 100,
               help="Subjects the bank doesn't cover return nothing (else the AI treats unrelated "
                    "sections as the syllabus)."),
    ]
    sweep = []
    for cut in SWEEP:
        found = sum(any(h[0] in q["expect"] and h[2] >= cut for h in q["hits"]) for q in pos)
        rejected = sum(not kept(q["hits"], cut) for q in neg)
        sweep.append((cut, pct(found, len(pos)), pct(rejected, len(neg))))
    result = SuiteResult("retrieval", metrics, pos + neg,
                         [f"{len(pos)} covered and {len(neg)} uncovered queries, top {K}, cut-off {cutoff}."],
                         t.seconds)
    result.extra_md = sweep_md(sweep, cutoff) + "\n\n" + misses_md(pos, neg)
    return result


def sweep_md(sweep, cutoff) -> str:
    rows = ["## Cut-off sweep (meaning only, before heading keywords)", "",
            ("Raising the cut-off rejects more uncovered subjects but finds fewer covered ones. "
            "Choose the lowest value that still rejects all uncovered subjects."), "",
            "| Cut-off | Covered found | Uncovered rejected |", "|---|---|---|"]
    rows += [f"| {c:.2f}{' (current)' if abs(c - cutoff) < 1e-9 else ''} | {f:.0f}% | {r:.0f}% |"
             for c, f, r in sweep]
    return "\n".join(rows)


def misses_md(pos, neg) -> str:
    rows = ["## Problems", ""]
    for q in pos:
        if not q["found"] or q.get("section_ok") is False:
            best = ", ".join(f"{h[0]} / {h[1]} ({h[2]:.2f})" for h in q["hits"][:3])
            rows.append(f"- **{q['query']}** (expected {', '.join(q['expect'])}"
                        f"{', section ' + q['section'] if q.get('section') else ''}): got {best}")
    for q in neg:
        if not q["rejected"]:
            rows.append(f"- **{q['query']}** (uncovered) kept: "
                        + ", ".join(f"{h[0]} / {h[1]} ({h[2]:.2f})" for h in q["kept"]))
    return "\n".join(rows) if len(rows) > 2 else "## Problems\n\nNone."
