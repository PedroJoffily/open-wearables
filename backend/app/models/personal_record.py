from uuid import UUID

from sqlalchemy.orm import Mapped, relationship

from app.database import BaseDbModel
from app.mappings import PrimaryKey, UniqueFkUser, date_col, str_32, numeric_10_2


class PersonalRecord(BaseDbModel):
    """Slow-changing physical attributes linked to a user."""

    __tablename__ = "personal_record"

    id: Mapped[PrimaryKey[UUID]]
    user_id: Mapped[UniqueFkUser]

    birth_date: Mapped[date_col | None]
    sex: Mapped[bool | None]
    gender: Mapped[str_32 | None]
    daily_calorie_target_kcal: Mapped[int | None]

    user: Mapped["User"] = relationship(back_populates="personal_record")
