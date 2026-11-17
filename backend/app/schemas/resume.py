import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.profile import CandidateProfile


class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    status: str
    error: str | None
    is_primary: bool
    purpose: str  # interview | ats
    created_at: datetime
    profile: CandidateProfile | None
