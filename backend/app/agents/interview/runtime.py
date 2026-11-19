"""Owns the Postgres connection pool, the LangGraph checkpointer and the compiled graph.

Started/stopped by FastAPI's lifespan. Note: psycopg's async mode needs a Selector event
loop on Windows; run uvicorn with `--loop asyncio:SelectorEventLoop` (see launch.json).
"""

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from app.agents.interview.graph import build_interview_graph
from app.core.config import settings

_pool: AsyncConnectionPool | None = None
_graph = None


def _conninfo() -> str:
    s = settings
    return (f"postgresql://{s.postgres_user}:{s.postgres_password}@{s.postgres_host}:"
            f"{s.postgres_port}/{s.postgres_db}")


async def start() -> None:
    global _pool, _graph
    _pool = AsyncConnectionPool(
        _conninfo(), open=False, max_size=settings.checkpoint_pool_size,
        kwargs={"autocommit": True, "prepare_threshold": 0, "row_factory": dict_row},
    )
    await _pool.open()
    saver = AsyncPostgresSaver(_pool)
    await saver.setup()  # creates the checkpoint tables on first run
    _graph = build_interview_graph(saver)


async def stop() -> None:
    if _pool is not None:
        await _pool.close()


def get_graph():
    if _graph is None:
        raise RuntimeError("Interview runtime not started")
    return _graph
