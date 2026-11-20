"""Health check: confirms the API can reach every service it depends on."""

from fastapi import APIRouter
from qdrant_client import AsyncQdrantClient
from sqlalchemy import text

from app.api.deps import DbSession
from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(db: DbSession) -> dict:
    checks: dict[str, str] = {}

    try:
        await db.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as exc:  # noqa: BLE001 - report the failure instead of crashing
        checks["postgres"] = f"error: {exc.__class__.__name__}"

    try:
        client = AsyncQdrantClient(url=settings.qdrant_url)
        await client.get_collections()
        await client.close()
        checks["qdrant"] = "ok"
    except Exception as exc:  # noqa: BLE001
        checks["qdrant"] = f"error: {exc.__class__.__name__}"

    healthy = checks["postgres"] == "ok" and checks["qdrant"] == "ok"
    return {"status": "ok" if healthy else "degraded", "checks": checks}
