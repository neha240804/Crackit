"""Local embeddings with FastEmbed, exposed through LangChain's `Embeddings` interface.

An embedding turns text into a vector (here 384 numbers) so that texts with similar
meaning end up close together. Implementing LangChain's interface means any LangChain
component (vector stores, retrievers, RAGAS) can use our local model.

The model (~70 MB) downloads from Hugging Face on first use, then is cached.
"""

import os
from functools import lru_cache

from fastembed import TextEmbedding
from langchain_core.embeddings import Embeddings

from app.core.config import DATA_DIR, settings

# Windows can't make the symlinks the Hugging Face cache prefers; caching still works.
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
MODEL_CACHE_DIR = DATA_DIR / "models"  # inside the project, so Windows temp cleanup can't wipe it


class FastEmbedEmbeddings(Embeddings):
    def __init__(self, model_name: str):
        self._model = TextEmbedding(model_name=model_name, cache_dir=str(MODEL_CACHE_DIR))

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [vector.tolist() for vector in self._model.embed(texts)]

    def embed_query(self, text: str) -> list[float]:
        # BGE models work best when queries go through query_embed (adds a query prefix).
        return next(iter(self._model.query_embed(text))).tolist()


@lru_cache  # load the model once per process; it is slow to load, fast to use
def get_embeddings() -> FastEmbedEmbeddings:
    return FastEmbedEmbeddings(settings.embedding_model)
