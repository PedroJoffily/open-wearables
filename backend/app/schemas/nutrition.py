from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class MealCreate(BaseModel):
    name: str = Field(..., max_length=100)
    calories_kcal: Decimal = Field(..., ge=0)
    protein_g: Decimal | None = Field(None, ge=0)
    carbs_g: Decimal | None = Field(None, ge=0)
    fat_g: Decimal | None = Field(None, ge=0)
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    eaten_at: datetime


class MealRead(BaseModel):
    id: UUID
    name: str
    calories_kcal: Decimal
    protein_g: Decimal | None
    carbs_g: Decimal | None
    fat_g: Decimal | None
    meal_type: str
    eaten_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class NutritionExpenditure(BaseModel):
    basal_kcal: float | None = None
    active_kcal: float | None = None
    total_kcal: float | None = None


class NutritionIntake(BaseModel):
    total_kcal: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    meals: list[MealRead] = []


class NutritionBudget(BaseModel):
    daily_target_kcal: int = 2000
    remaining_kcal: float = 0


class NutritionSummary(BaseModel):
    date: date
    expenditure: NutritionExpenditure
    intake: NutritionIntake
    budget: NutritionBudget
