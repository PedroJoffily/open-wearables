"""Recommendation model — proactive coaching intelligence items."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    member_name: Mapped[str] = mapped_column(String(255), default="")
    category: Mapped[str] = mapped_column(String(20))  # alert, check_in, praise, nudge, sync
    severity: Mapped[str] = mapped_column(String(20))  # info, warning, critical
    message: Mapped[str] = mapped_column(Text)
    action_text: Mapped[str] = mapped_column(String(255), default="")
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
