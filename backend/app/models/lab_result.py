from uuid import UUID

from sqlalchemy import Index
from sqlalchemy.orm import Mapped

from app.database import BaseDbModel
from app.mappings import FKUser, PrimaryKey, datetime_tz, str_100, str_255


class LabResult(BaseDbModel):
    """User-uploaded lab result file (PDF/JPG/PNG) with metadata."""

    __tablename__ = "lab_result"
    __table_args__ = (Index("idx_lab_result_user_tested_at", "user_id", "tested_at"),)

    id: Mapped[PrimaryKey[UUID]]
    user_id: Mapped[FKUser]
    title: Mapped[str_255]
    tested_at: Mapped[datetime_tz]
    file_key: Mapped[str_255]
    original_filename: Mapped[str_255]
    content_type: Mapped[str_100]
    size_bytes: Mapped[int]
    created_at: Mapped[datetime_tz]
