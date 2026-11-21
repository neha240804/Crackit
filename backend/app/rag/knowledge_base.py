"""Knowledge base RAG: our own interview question banks and scoring rubrics.

Files live in /knowledge_base/**/*.md with a small front-matter header:
    ---
    doc_type: questions | rubric
    role_family: machine_learning | backend | hr | ...
    ---
Each "## Section" becomes one chunk (one topic = one retrievable unit), embedded with
FastEmbed into the Qdrant `knowledge_base` collection.

Re-indexed completely at startup: it's ~40 chunks (about a second), and it guarantees
edits to the Markdown files always show up with no stale chunks left behind.
"""

import re
import uuid
from functools import cache
from pathlib import Path

from langchain_core.documents import Document
from qdrant_client import models

from app.core.config import ROOT_DIR
from app.rag.embeddings import get_embeddings
from app.rag.vectorstore import KNOWLEDGE_BASE, get_qdrant, get_vectorstore

KB_DIR = ROOT_DIR / "knowledge_base"
FRONT_MATTER = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)


def load_documents(kb_dir: Path = KB_DIR) -> list[Document]:
    docs: list[Document] = []
    for path in sorted(kb_dir.rglob("*.md")):
        text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
        meta: dict[str, str] = {}
        if m := FRONT_MATTER.match(text):
            for line in m.group(1).splitlines():
                key, _, value = line.partition(":")
                meta[key.strip()] = value.strip()
            text = text[m.end():]
        # Split on "## " headings; each section is one chunk.
        for section in re.split(r"\n(?=## )", text):
            if not section.startswith("## "):
                continue  # the "# Title" preamble
            heading, _, body = section.partition("\n")
            topic = heading.removeprefix("## ").strip()
            # The subject goes into the embedded text too, so a broad query ("electrical
            # machines") finds that subject's sections: without it, it matched a metering
            # section, because no section text said "electrical machines".
            # An optional `subject:` front-matter line can describe it more fully (the
            # embedding didn't link "electrical machines" to transformers or induction motors).
            subject = meta.get("subject") or meta.get("role_family", "general").replace("_", " ")
            docs.append(Document(
                page_content=f"{subject}: {topic}\n{body.strip()}",
                metadata={
                    "doc_type": meta.get("doc_type", "unknown"),
                    "role_family": meta.get("role_family", "general"),
                    "topic": topic,
                    "source": str(path.relative_to(kb_dir)).replace("\\", "/"),
                },
            ))
    return docs


def ingest_knowledge_base() -> int:
    docs = load_documents()
    client = get_qdrant()
    client.delete(KNOWLEDGE_BASE, points_selector=models.FilterSelector(filter=models.Filter()))
    if docs:
        ids = [str(uuid.uuid5(uuid.NAMESPACE_URL, f"{d.metadata['source']}#{d.metadata['topic']}"))
               for d in docs]
        get_vectorstore(KNOWLEDGE_BASE).add_documents(docs, ids=ids)
    return len(docs)


# Minimum similarity for a question-bank section to count as "about this topic".
# A plain top-k search ALWAYS returns k sections, however unrelated: for "power system" it
# returned backend system design, SQL and deep learning, the model treated them as the
# syllabus, and produced SQL questions. Measured (bge-small cosine, best match per query):
#   topics the bank covers:  0.61-0.79 (e.g. React hooks 0.70, REST API design 0.77)
#   topics it doesn't cover: 0.49-0.63 (power system 0.52, load flow 0.63, accounting 0.63)
# The ranges overlap, so the cut-off favours precision: a missed match only means the model
# uses its own knowledge (fine for SQL or pandas), while a false match misleads it.
# 0.65 excluded all 12 off-bank subjects tested and kept 10 of 12 on-bank ones.
RELEVANT_SCORE = 0.65


# Short topics ("Transformers", "network theorems") embed weakly against ~1k-character
# sections: measured with the retrieval eval (evals/, Nov 2026), "Transformers" scored 0.57,
# "network theorems" 0.62 and "current transformers and potential transformers" never reached
# the CT/PT section, so those interviews ran with no question bank. Rephrasing the query (BGE
# instruction, "interview questions about ...") and extra title vectors were tried: the best
# still missed "Transformers", and covered and uncovered subjects stayed only ~0.04 apart.
# So a deterministic rule complements the embeddings: a section also matches when EVERY
# content word of a short query appears in its heading or subject line. Uncovered subjects
# ("Fluid mechanics", "Corporate law") share no heading words, so they still get nothing.
KEYWORD_MAX_WORDS = 6  # only short topics; long queries (resume context) stay semantic
_STOP = {"and", "the", "for", "with", "from", "into", "about", "what", "your", "interview",
         "interviews", "question", "questions", "basics", "fundamentals", "topic", "topics"}


def _words(text: str) -> set[str]:
    """Content words, lightly normalised (lowercase, no plural 's')."""
    return {w[:-1] if w.endswith("s") and len(w) > 4 else w
            for w in re.findall(r"[a-z][a-z0-9-]+", text.lower())
            if len(w) > 2 and w not in _STOP}


@cache
def _headings() -> tuple[tuple[Document, frozenset[str], frozenset[str], tuple[float, ...]], ...]:
    """Every section with the words of its subject line + heading, of the heading alone, and
    the heading's embedding (cached: the files only change on deploy; ~80 short texts)."""
    docs = load_documents()
    titles = [d.page_content.split("\n", 1)[0] for d in docs]  # "<subject>: <heading>"
    vectors = get_embeddings().embed_documents(titles)
    return tuple((d, frozenset(_words(t)), frozenset(_words(d.metadata["topic"])), tuple(v))
                 for d, t, v in zip(docs, titles, vectors, strict=True))


def _cosine(a, b) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    return dot / ((sum(x * x for x in a) ** 0.5) * (sum(y * y for y in b) ** 0.5) or 1.0)


def keyword_matches(query: str, doc_type: str | None = None,
                    role_family: str | None = None) -> list[Document]:
    """Sections whose heading/subject contains every content word of a short query. Best
    first: a match in the heading itself before one only in the subject line (for
    "Transformers", "Transformer working and construction" before the subject-only "Induction
    motor ..." sections), then by meaning similarity to the heading."""
    words = _words(query)
    if not words or len(words) > KEYWORD_MAX_WORDS:
        return []
    found = [(d, words <= heading, vec) for d, title, heading, vec in _headings()
             if words <= title
             and (doc_type is None or d.metadata["doc_type"] == doc_type)
             and (role_family is None or d.metadata["role_family"] == role_family)]
    if not found:
        return []
    q = get_embeddings().embed_query(query)
    found.sort(key=lambda f: (not f[1], -_cosine(q, f[2])))
    return [d for d, _, _ in found]


def search_with_scores(
    query: str, k: int = 4, doc_type: str | None = None, role_family: str | None = None,
    min_score: float | None = None,
) -> list[tuple[Document, float, str]]:
    """(section, similarity, why) for the best matches, best first; `why` is "semantic" or
    "keyword". With `min_score`, semantic matches below it are dropped and keyword matches
    fill the free places, so an off-topic query returns nothing rather than noise."""
    conditions = []
    if doc_type:
        conditions.append(models.FieldCondition(
            key="metadata.doc_type", match=models.MatchValue(value=doc_type)))
    if role_family:
        conditions.append(models.FieldCondition(
            key="metadata.role_family", match=models.MatchValue(value=role_family)))
    flt = models.Filter(must=conditions) if conditions else None
    hits = get_vectorstore(KNOWLEDGE_BASE).similarity_search_with_score(query, k=k, filter=flt)
    if min_score is None:
        return [(d, float(s), "semantic") for d, s in hits]
    kept = [(d, float(s), "semantic") for d, s in hits if s >= min_score]
    seen = {(d.metadata["source"], d.metadata["topic"]) for d, _, _ in kept}
    scores = {(d.metadata["source"], d.metadata["topic"]): float(s) for d, s in hits}
    for d in keyword_matches(query, doc_type, role_family):
        key = (d.metadata["source"], d.metadata["topic"])
        if len(kept) >= k:
            break
        if key not in seen:
            kept.append((d, scores.get(key, 0.0), "keyword"))
            seen.add(key)
    return kept


def search_knowledge_base(
    query: str, k: int = 4, doc_type: str | None = None, role_family: str | None = None,
    min_score: float | None = None,
) -> list[Document]:
    """Top-k question-bank sections for `query`. With `min_score`, sections below that
    similarity are dropped (unless their heading matches a short topic word for word, see
    keyword_matches), so an off-topic query returns nothing rather than noise."""
    return [d for d, _, _ in search_with_scores(query, k, doc_type, role_family, min_score)]


def get_rubrics() -> str:
    """All rubric sections as one text block (small, always relevant for scoring)."""
    docs = [d for d in load_documents() if d.metadata["doc_type"] == "rubric"]
    return "\n\n".join(d.page_content for d in docs)


if __name__ == "__main__":  # uv run python -m app.rag.knowledge_base
    print(f"Indexed {ingest_knowledge_base()} knowledge-base chunks")
