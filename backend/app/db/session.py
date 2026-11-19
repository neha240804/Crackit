"""Database engine and session factory (SQLAlchemy 2.0, async).

- engine: owns the connection pool to Postgres; one per app.
- SessionLocal: creates short-lived sessions; one per request.
- get_db: a FastAPI dependency that opens a session for a request and always closes it.
"""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Pool sizes come from settings (see config.py for why they are what they are).
engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=10,  # fail fast with a clear error instead of hanging 30 s
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


async def release_connection(db: AsyncSession) -> None:
    """End the current transaction so its pooled connection goes back to the pool.

    Call this right before a slow external call (Groq LLM / Whisper, often 2-10 s). The first
    query of a request (even the login check) opens a transaction, and SQLAlchemy keeps that
    connection checked out until commit/rollback. Without this, every request waiting on the
    AI also held a database connection: ~15 in-flight AI calls exhausted the default pool and
    page loads then failed. Commit (not rollback): with expire_on_commit=False the loaded
    objects stay usable and tracked, and later writes simply check out a connection again.
    """
    await db.commit()
