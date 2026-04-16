from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class LabResultRead(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    tested_at: datetime
    original_filename: str
    content_type: str
    size_bytes: int
    created_at: datetime

    model_config = {"from_attributes": True}
