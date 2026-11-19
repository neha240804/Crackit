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
from pathlib import Path

from langchain_core.documents import Document
from qdrant_client import models

from app.core.config import ROOT_DIR
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
            docs.append(Document(
                page_content=f"{topic}\n{body.strip()}",
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


def search_knowledge_base(
    query: str, k: int = 4, doc_type: str | None = None, role_family: str | None = None,
    min_score: float | None = None,
) -> list[Document]:
    """Top-k question-bank sections for `query`. With `min_score`, sections below that
    similarity are dropped, so an off-topic query returns nothing rather than noise."""
    conditions = []
    if doc_type:
        conditions.append(models.FieldCondition(
            key="metadata.doc_type", match=models.MatchValue(value=doc_type)))
    if role_family:
        conditions.append(models.FieldCondition(
            key="metadata.role_family", match=models.MatchValue(value=role_family)))
    flt = models.Filter(must=conditions) if conditions else None
    store = get_vectorstore(KNOWLEDGE_BASE)
    if min_score is None:
        return store.similarity_search(query, k=k, filter=flt)
    hits = store.similarity_search_with_score(query, k=k, filter=flt)
    return [doc for doc, score in hits if score >= min_score]


def get_rubrics() -> str:
    """All rubric sections as one text block (small, always relevant for scoring)."""
    docs = [d for d in load_documents() if d.metadata["doc_type"] == "rubric"]
    return "\n\n".join(d.page_content for d in docs)


if __name__ == "__main__":  # uv run python -m app.rag.knowledge_base
    print(f"Indexed {ingest_knowledge_base()} knowledge-base chunks")
