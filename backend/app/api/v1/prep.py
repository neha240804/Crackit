"""Question prep: curated tracks, study sets of questions with model answers, and the user's
saved prep data (starred questions, the current set), stored per account in Postgres."""

import uuid

from fastapi import APIRouter
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert

from app.api.deps import CurrentUser, DbSession, KeyedUser
from app.core.rate_limit import per_user
from app.db.models import PrepCurrentSet, StarredQuestion
from app.schemas.prep import CurrentSetIn, PrepRequest, PrepSetOut, PrepTrack, StarredIn, StarredOut
from app.services import prep_service

router = APIRouter(prefix="/prep", tags=["question prep"])


@router.get("/tracks", response_model=list[PrepTrack])
async def tracks(user: CurrentUser):
    """Curated tracks (backend, ML, HR...) with their subtopics, from the question bank."""
    return prep_service.list_tracks()


@router.post("/questions", response_model=PrepSetOut, dependencies=[per_user("prep", times=6, seconds=60)])
async def questions(req: PrepRequest, user: KeyedUser, db: DbSession):
    """A study set: questions with model answers, key points and a tip (~3-10 s).
    With resume_id: the questions an interviewer is likely to ask about that resume."""
    return await prep_service.generate(db, user, req)


# ---------------------------------------------------------------- starred questions
# Stored per account (they used to live in one browser's localStorage), so stars follow the
# user to any device. No AI involved: plain reads and writes.
@router.get("/starred", response_model=list[StarredOut])
async def list_starred(user: CurrentUser, db: DbSession):
    rows = await db.scalars(select(StarredQuestion).where(StarredQuestion.user_id == user.id)
                            .order_by(StarredQuestion.created_at.desc()))
    return list(rows)


@router.put("/starred", response_model=StarredOut, dependencies=[per_user("prep-save", times=120, seconds=60)])
async def star(body: StarredIn, user: CurrentUser, db: DbSession):
    """Star a question (idempotent: starring it again updates the stored copy)."""
    stmt = insert(StarredQuestion).values(
        id=uuid.uuid4(), user_id=user.id, key=body.key, question=body.question.model_dump(),
        topic=body.topic, experience=body.experience,
    ).on_conflict_do_update(
        constraint="uq_starred_user_key",
        set_={"question": body.question.model_dump(), "topic": body.topic, "experience": body.experience},
    ).returning(StarredQuestion)
    row = (await db.scalars(stmt)).one()
    await db.commit()
    return row


@router.delete("/starred/{star_id}", status_code=204)
async def unstar(star_id: uuid.UUID, user: CurrentUser, db: DbSession) -> None:
    await db.execute(delete(StarredQuestion).where(StarredQuestion.id == star_id,
                                                   StarredQuestion.user_id == user.id))
    await db.commit()


# ---------------------------------------------------------------- the current study set
@router.get("/current")
async def get_current_set(user: CurrentUser, db: DbSession) -> dict | None:
    row = await db.scalar(select(PrepCurrentSet).where(PrepCurrentSet.user_id == user.id))
    return row.data if row else None


@router.put("/current", status_code=204, dependencies=[per_user("prep-save", times=120, seconds=60)])
async def save_current_set(body: CurrentSetIn, user: CurrentUser, db: DbSession) -> None:
    """Replace the user's current study set (saved on every change: new set, marks, more
    questions). One row per user, upserted."""
    stmt = insert(PrepCurrentSet).values(id=uuid.uuid4(), user_id=user.id, data=body.data)
    stmt = stmt.on_conflict_do_update(index_elements=[PrepCurrentSet.user_id], set_={"data": body.data})
    await db.execute(stmt)
    await db.commit()


@router.delete("/current", status_code=204)
async def clear_current_set(user: CurrentUser, db: DbSession) -> None:
    await db.execute(delete(PrepCurrentSet).where(PrepCurrentSet.user_id == user.id))
    await db.commit()
