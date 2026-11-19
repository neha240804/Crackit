"""Today's usage of the daily AI allowance, so the app can show "3 of 5 left today"."""

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.services import usage

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("")
async def today(user: CurrentUser, db: DbSession) -> dict[str, dict[str, int]]:
    return await usage.summary(db, user)
