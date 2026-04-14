from datetime import datetime

from pydantic import BaseModel


class NoteCreate(BaseModel):
    user_id: str
    content: str
    author: str = "Coach"


class NoteUpdate(BaseModel):
    content: str | None = None


class NoteRead(BaseModel):
    id: str
    user_id: str
    content: str
    author: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteList(BaseModel):
    items: list[NoteRead]
    total: int
