from uuid import UUID

from sqlalchemy import Index
from sqlalchemy.orm import Mapped

from app.database import BaseDbModel
from app.mappings import FKUser, PrimaryKey, datetime_tz, numeric_10_2, str_32, str_100


class Meal(BaseDbModel):
    """User meal log entry for nutrition tracking."""

    __tablename__ = "meal"
    __table_args__ = (Index("idx_meal_user_eaten_at", "user_id", "eaten_at"),)

    id: Mapped[PrimaryKey[UUID]]
    user_id: Mapped[FKUser]
    name: Mapped[str_100]
    calories_kcal: Mapped[numeric_10_2]
    protein_g: Mapped[numeric_10_2 | None]
    carbs_g: Mapped[numeric_10_2 | None]
    fat_g: Mapped[numeric_10_2 | None]
    meal_type: Mapped[str_32]  # breakfast / lunch / dinner / snack
    eaten_at: Mapped[datetime_tz]
    created_at: Mapped[datetime_tz]
