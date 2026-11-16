"""Database engine and session factory (SQLAlchemy 2.0, async).

- engine: owns the connection pool to Postgres; one per app.
- SessionLocal: creates short-lived sessions; one per request.
- get_db: a FastAPI dependency that opens a session for a request and always closes it.
"""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(settings.database_url, pool_pre_ping=True)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
