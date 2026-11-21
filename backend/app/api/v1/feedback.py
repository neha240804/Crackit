"""Feedback page: users tell us what's broken, what they'd like, or how the interviewer did.

Stored per account (deleted with it). Nothing is emailed or shared; read it with SQL:
    SELECT created_at, category, rating, message FROM site_feedback ORDER BY created_at DESC;
"""

import uuid
from datetime import datetime
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core.rate_limit import per_user
from app.db.models import SiteFeedback

router = APIRouter(prefix="/feedback", tags=["feedback"])

Category = Literal["bug", "idea", "interviewer", "other"]


class FeedbackIn(BaseModel):
    category: Category
    rating: int | None = Field(None, ge=1, le=5)
    message: str = Field(min_length=3, max_length=3000)


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: str
    rating: int | None
    message: str
    created_at: datetime


@router.post("", response_model=FeedbackOut, status_code=201,
             dependencies=[per_user("site-feedback", times=5, seconds=600)])
async def send_feedback(body: FeedbackIn, user: CurrentUser, db: DbSession) -> SiteFeedback:
    row = SiteFeedback(user_id=user.id, category=body.category, rating=body.rating,
                       message=body.message.strip())
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.get("", response_model=list[FeedbackOut])
async def my_feedback(user: CurrentUser, db: DbSession) -> list[SiteFeedback]:
    """What this user sent before (newest first), so the page can show it back."""
    rows = await db.scalars(select(SiteFeedback).where(SiteFeedback.user_id == user.id)
                            .order_by(SiteFeedback.created_at.desc()).limit(20))
    return list(rows)
