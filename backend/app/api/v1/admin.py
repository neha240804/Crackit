"""Admin pages for the site owner (ADMIN_EMAILS in .env). Anyone else gets a 404.

GET /admin/quality: the online evaluation of real interviews (app/quality/): pass rates
against the eval targets, reply time, report scores, students' ratings, recent failures and
the latest checked interviews. The same numbers as `python -m app.quality.summary`.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import AdminUser
from app.quality.summary import collect

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/quality")
async def quality(_admin: AdminUser, days: Annotated[int, Query(ge=1, le=90)] = 7) -> dict:
    return await collect(days)
