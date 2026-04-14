from datetime import date
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.database import DbSession
from app.schemas.nutrition import MealCreate, MealRead, NutritionSummary
from app.services import ApiKeyDep
from app.services.nutrition_service import nutrition_service

router = APIRouter()


@router.post("/users/{user_id}/nutrition/meals", response_model=MealRead, status_code=201)
async def create_meal(
    user_id: UUID,
    meal_data: MealCreate,
    db: DbSession,
    _api_key: ApiKeyDep,
) -> MealRead:
    """Log a meal for a user."""
    meal = nutrition_service.create_meal(db, user_id, meal_data)
    return MealRead.model_validate(meal)


@router.get("/users/{user_id}/nutrition/meals", response_model=list[MealRead])
async def get_meals(
    user_id: UUID,
    db: DbSession,
    _api_key: ApiKeyDep,
    date: date = Query(default_factory=date.today, description="Date in YYYY-MM-DD format"),
) -> list[MealRead]:
    """Get meals for a user on a given date."""
    meals = nutrition_service.get_meals_for_date(db, user_id, date)
    return [MealRead.model_validate(m) for m in meals]


@router.delete("/users/{user_id}/nutrition/meals/{meal_id}", status_code=204)
async def delete_meal(
    user_id: UUID,
    meal_id: UUID,
    db: DbSession,
    _api_key: ApiKeyDep,
) -> None:
    """Delete a meal."""
    deleted = nutrition_service.delete_meal(db, user_id, meal_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Meal not found")


@router.get("/users/{user_id}/summaries/nutrition", response_model=NutritionSummary)
async def get_nutrition_summary(
    user_id: UUID,
    db: DbSession,
    _api_key: ApiKeyDep,
    date: date = Query(default_factory=date.today, description="Date in YYYY-MM-DD format"),
) -> NutritionSummary:
    """Get nutrition summary (intake + expenditure + budget) for a date."""
    return nutrition_service.get_nutrition_summary(db, user_id, date)
