"""Qdrant collections and LangChain vector stores.

Collections (like tables, but for vectors):
- resume_chunks:  pieces of each user's resume, used to ground rewrites and interviews
- knowledge_base: interview question bank, rubrics, ATS guidelines

Payload indexes on user_id etc. make filtered searches fast. Every resume search MUST
filter by user_id so users never see each other's data.
"""

from functools import lru_cache

from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient, models

from app.core.config import settings
from app.rag.embeddings import get_embeddings

RESUME_CHUNKS = "resume_chunks"
KNOWLEDGE_BASE = "knowledge_base"

# Fields we filter on, per collection. langchain-qdrant stores metadata under "metadata.".
PAYLOAD_INDEXES = {
    RESUME_CHUNKS: ["metadata.user_id", "metadata.resume_id", "metadata.section"],
    KNOWLEDGE_BASE: ["metadata.doc_type", "metadata.role_family"],
}


@lru_cache
def get_qdrant() -> QdrantClient:
    return QdrantClient(url=settings.qdrant_url)


def ensure_collections() -> None:
    """Create missing collections at startup. Safe to run every time."""
    client = get_qdrant()
    for name, fields in PAYLOAD_INDEXES.items():
        if not client.collection_exists(name):
            client.create_collection(
                name,
                vectors_config=models.VectorParams(
                    size=settings.embedding_dim, distance=models.Distance.COSINE
                ),
            )
            for field in fields:
                client.create_payload_index(name, field, models.PayloadSchemaType.KEYWORD)


def get_vectorstore(collection: str) -> QdrantVectorStore:
    return QdrantVectorStore(
        client=get_qdrant(), collection_name=collection, embedding=get_embeddings()
    )


def delete_resume_chunks(resume_id: str) -> None:
    """Remove every chunk of one resume (used before re-indexing and on delete)."""
    get_qdrant().delete(
        RESUME_CHUNKS,
        points_selector=models.FilterSelector(
            filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="metadata.resume_id", match=models.MatchValue(value=resume_id)
                    )
                ]
            )
        ),
    )
