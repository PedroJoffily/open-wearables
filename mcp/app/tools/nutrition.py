"""MCP tools for querying nutrition / calorie budget data."""

import logging
from datetime import date

from fastmcp import FastMCP

from app.services.api_client import client

logger = logging.getLogger(__name__)

nutrition_router = FastMCP(name="Nutrition Tools")


@nutrition_router.tool
async def get_calorie_budget(
    user_id: str,
    date: str | None = None,
) -> dict:
    """
    Get the calorie budget for a user on a given date.

    Combines calorie expenditure (from wearable devices) with calorie intake
    (from logged meals) to produce a daily calorie budget showing how many
    calories the user can still consume.

    Args:
        user_id: UUID of the user. Use get_users to discover available users.
        date: Date in YYYY-MM-DD format. Defaults to today.

    Returns:
        A dictionary containing:
        - user: User info (id, first_name, last_name)
        - date: The date queried
        - budget: { daily_target_kcal, consumed_kcal, burned_kcal, remaining_kcal }
        - macros: { protein_g, carbs_g, fat_g }
        - meals: List of meals logged that day

    Notes for LLMs:
        - Use this to answer questions like "How many calories can I still eat today?"
        - remaining_kcal = daily_target - consumed. Negative means over budget.
        - burned_kcal comes from wearable data and may be null if no device data.
        - Meals are logged manually by the user via the nutrition UI.
    """
    try:
        if not date:
            from datetime import date as date_cls
            date = date_cls.today().isoformat()

        # Fetch user details
        try:
            user_data = await client.get_user(user_id)
            user = {
                "id": str(user_data.get("id")),
                "first_name": user_data.get("first_name"),
                "last_name": user_data.get("last_name"),
            }
        except ValueError as e:
            return {"error": f"User not found: {user_id}", "details": str(e)}

        # Fetch nutrition summary
        summary = await client.get_nutrition_summary(user_id, date)

        expenditure = summary.get("expenditure", {})
        intake = summary.get("intake", {})
        budget = summary.get("budget", {})

        return {
            "user": user,
            "date": date,
            "budget": {
                "daily_target_kcal": budget.get("daily_target_kcal", 2000),
                "consumed_kcal": intake.get("total_kcal", 0),
                "burned_kcal": expenditure.get("total_kcal"),
                "remaining_kcal": budget.get("remaining_kcal", 0),
            },
            "macros": {
                "protein_g": intake.get("protein_g", 0),
                "carbs_g": intake.get("carbs_g", 0),
                "fat_g": intake.get("fat_g", 0),
            },
            "meals": [
                {
                    "name": m.get("name"),
                    "calories_kcal": m.get("calories_kcal"),
                    "meal_type": m.get("meal_type"),
                    "eaten_at": m.get("eaten_at"),
                }
                for m in intake.get("meals", [])
            ],
        }

    except ValueError as e:
        logger.error(f"API error in get_calorie_budget: {e}")
        return {"error": str(e)}
    except Exception as e:
        logger.exception(f"Unexpected error in get_calorie_budget: {e}")
        return {"error": f"Failed to fetch calorie budget: {e}"}
