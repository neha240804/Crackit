"""FastAPI application entry point.

Run locally from the backend folder:
    uv run uvicorn app.main:app --reload --loop asyncio:SelectorEventLoop
(The Selector loop is required on Windows: psycopg's async mode, used by the LangGraph
Postgres checkpointer, can't run on Windows' default Proactor loop.)
Interactive API docs: http://localhost:8000/docs
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agents.interview import runtime as interview_runtime
from app.api.v1 import auth, health, interviews, optimizer, resumes
from app.rag.embeddings import get_embeddings
from app.rag.knowledge_base import ingest_knowledge_base
from app.rag.vectorstore import ensure_collections
from app.services import tts


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Qdrant collections, embedding model, knowledge base, interview checkpointer.
    # Sync work goes to a thread so it doesn't block the event loop.
    await asyncio.to_thread(ensure_collections)
    await asyncio.to_thread(get_embeddings)
    await asyncio.to_thread(ingest_knowledge_base)
    await interview_runtime.start()
    # Load the voice model in the background: the API is usable immediately, and
    # /tts answers 503 (browser voice) until it's ready.
    voice_loading = asyncio.create_task(asyncio.to_thread(tts.load_model))
    yield
    voice_loading.cancel()
    await interview_runtime.stop()


app = FastAPI(title="MockInterview AI", version="0.1.0", lifespan=lifespan)

# Allow the React dev server (Vite, port 5174) to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Every v1 route lives under /api/v1 so a future v2 can sit beside it.
for router in (health.router, auth.router, resumes.router, optimizer.router, interviews.router):
    app.include_router(router, prefix="/api/v1")
