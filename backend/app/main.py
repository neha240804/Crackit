"""FastAPI application entry point.

Run locally from the backend folder:
    uv run uvicorn app.main:app --reload --loop asyncio:SelectorEventLoop
(The Selector loop is required on Windows: psycopg's async mode, used by the LangGraph
Postgres checkpointer, can't run on Windows' default Proactor loop.)
Interactive API docs: http://localhost:8000/docs
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agents.interview import runtime as interview_runtime
from app.api.v1 import account, auth, health, interviews, optimizer, prep, resumes
from app.core.config import settings
from app.core.monitoring import init_error_alerts
from app.rag.embeddings import get_embeddings
from app.rag.knowledge_base import ingest_knowledge_base
from app.rag.vectorstore import ensure_collections
from app.services import email, tts

logger = logging.getLogger(__name__)
# Before the app exists, so errors during startup are reported too (no-op without SENTRY_DSN).
init_error_alerts()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.is_production and not email.configured():
        # Not fatal (everything else works), but loud: users can't reset a forgotten password.
        logger.warning("SMTP_HOST / MAIL_FROM are not set: password reset emails can't be sent")
    # Startup: Qdrant collections, embedding model, knowledge base, interview checkpointer.
    # Sync work goes to a thread so it doesn't block the event loop.
    await asyncio.to_thread(ensure_collections)
    await asyncio.to_thread(get_embeddings)
    await asyncio.to_thread(ingest_knowledge_base)
    await interview_runtime.start()
    # Load the voice model in the background: the API is usable immediately, and
    # /tts answers 503 (browser voice) until it's ready. With the browser voice (the default)
    # the server voices nothing, so Kokoro isn't loaded at all (~330 MB of memory saved).
    voice_loading = asyncio.create_task(
        asyncio.to_thread(tts.load_model) if settings.tts_engine != "browser" else asyncio.sleep(0))
    yield
    voice_loading.cancel()
    await interview_runtime.stop()


# The interactive docs list every endpoint and schema: handy in development, a free map
# for attackers in production, so they are switched off there.
_docs = {} if not settings.is_production else {"docs_url": None, "redoc_url": None, "openapi_url": None}
app = FastAPI(title="Crackit API", version="0.1.0", lifespan=lifespan, **_docs)

# Which browser origins may call the API (CORS_ORIGINS in .env; dev default: the Vite server).
# The login token travels in the Authorization header, not a cookie, so credentials aren't
# needed; methods/headers are limited to what the frontend actually sends.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Groq-Key"],  # X-Groq-Key: user's own key (BYOK)
)

# Every v1 route lives under /api/v1 so a future v2 can sit beside it.
for router in (health.router, auth.router, resumes.router, optimizer.router, prep.router,
               interviews.router, account.router):
    app.include_router(router, prefix="/api/v1")
