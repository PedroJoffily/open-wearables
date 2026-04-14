"""Service for nutrition tracking (meals + calorie budget)."""

from datetime import date, datetime, timezone
from logging import Logger, getLogger
from uuid import UUID, uuid4

from sqlalchemy import select, and_, func
from sqlalchemy.orm import Session

from app.models.data_source import DataSource
from app.models.event_record import EventRecord
from app.models.meal import Meal
from app.models.personal_record import PersonalRecord
from app.models.workout_details import WorkoutDetails
from app.schemas.nutrition import (
    MealCreate,
    MealRead,
    NutritionBudget,
    NutritionExpenditure,
    NutritionIntake,
    NutritionSummary,
)

DEFAULT_CALORIE_TARGET = 2000


class NutritionService:
    def __init__(self, log: Logger):
        self.logger = log

    def create_meal(self, db: Session, user_id: UUID, data: MealCreate) -> Meal:
        meal = Meal(
            id=uuid4(),
            user_id=user_id,
            name=data.name,
            calories_kcal=data.calories_kcal,
            protein_g=data.protein_g,
            carbs_g=data.carbs_g,
            fat_g=data.fat_g,
            meal_type=data.meal_type,
            eaten_at=data.eaten_at,
            created_at=datetime.now(timezone.utc),
        )
        db.add(meal)
        db.commit()
        db.refresh(meal)
        return meal

    def get_meals_for_date(self, db: Session, user_id: UUID, day: date) -> list[Meal]:
        start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        end = datetime(day.year, day.month, day.day, 23, 59, 59, tzinfo=timezone.utc)
        stmt = (
            select(Meal)
            .where(
                and_(
                    Meal.user_id == user_id,
                    Meal.eaten_at >= start,
                    Meal.eaten_at <= end,
                )
            )
            .order_by(Meal.eaten_at)
        )
        return list(db.execute(stmt).scalars().all())

    def delete_meal(self, db: Session, user_id: UUID, meal_id: UUID) -> bool:
        stmt = select(Meal).where(and_(Meal.id == meal_id, Meal.user_id == user_id))
        meal = db.execute(stmt).scalar_one_or_none()
        if not meal:
            return False
        db.delete(meal)
        db.commit()
        return True

    def get_nutrition_summary(
        self, db: Session, user_id: UUID, day: date
    ) -> NutritionSummary:
        # --- Intake from meals ---
        meals = self.get_meals_for_date(db, user_id, day)
        meals_read = [MealRead.model_validate(m) for m in meals]

        total_intake_kcal = float(sum(m.calories_kcal for m in meals))
        total_protein = float(sum(m.protein_g or 0 for m in meals))
        total_carbs = float(sum(m.carbs_g or 0 for m in meals))
        total_fat = float(sum(m.fat_g or 0 for m in meals))

        intake = NutritionIntake(
            total_kcal=total_intake_kcal,
            protein_g=total_protein,
            carbs_g=total_carbs,
            fat_g=total_fat,
            meals=meals_read,
        )

        # --- Expenditure from workout calories ---
        start_dt = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        end_dt = datetime(day.year, day.month, day.day, 23, 59, 59, tzinfo=timezone.utc)

        active_kcal = None
        try:
            stmt = (
                select(func.sum(WorkoutDetails.energy_burned))
                .join(EventRecord, EventRecord.id == WorkoutDetails.record_id)
                .join(DataSource, DataSource.id == EventRecord.data_source_id)
                .where(
                    and_(
                        DataSource.user_id == user_id,
                        EventRecord.category == "workout",
                        EventRecord.start_datetime >= start_dt,
                        EventRecord.start_datetime <= end_dt,
                    )
                )
            )
            result = db.execute(stmt).scalar()
            if result is not None:
                active_kcal = float(result)
        except Exception as e:
            self.logger.warning(f"Failed to fetch workout calories: {e}")

        expenditure = NutritionExpenditure(
            basal_kcal=None,
            active_kcal=active_kcal,
            total_kcal=active_kcal,
        )

        # --- Budget ---
        stmt = select(PersonalRecord).where(PersonalRecord.user_id == user_id)
        personal_record = db.execute(stmt).scalar_one_or_none()
        daily_target = DEFAULT_CALORIE_TARGET
        if personal_record and personal_record.daily_calorie_target_kcal:
            daily_target = personal_record.daily_calorie_target_kcal

        remaining = daily_target + (active_kcal or 0) - total_intake_kcal

        budget = NutritionBudget(
            daily_target_kcal=daily_target,
            remaining_kcal=remaining,
        )

        return NutritionSummary(
            date=day,
            expenditure=expenditure,
            intake=intake,
            budget=budget,
        )


nutrition_service = NutritionService(log=getLogger(__name__))
