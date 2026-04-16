"""Health scores API — algorithmic score calculation from OW data."""

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query

from app.schemas.health_scores import HealthScoresLatest, HealthScoresResponse, ScoreDetail
from app.services.health_scores import (
    calculate_activity_score,
    calculate_body_score,
    calculate_recovery_score,
    calculate_sleep_score,
    score_qualifier,
)
from app.services.ow_client import ow_client

router = APIRouter(prefix="/api/health-scores", tags=["health-scores"])


@router.get("/{user_id}", response_model=HealthScoresResponse)
async def get_health_scores(user_id: str, days: int = Query(30, ge=1, le=365)):
    """Fetch raw data from OW and calculate 4 health scores."""
    date_to = date.today()
    date_from = date_to - timedelta(days=days)

    try:
        sleep_data = await ow_client.get_sleep_summary(user_id, date_from, date_to)
        activity_data = await ow_client.get_activity_summary(user_id, date_from, date_to)
        workouts = await ow_client.get_workouts(user_id, date_from, date_to)
        body_data = await ow_client.get_body_summary(user_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch data from OW: {e}")

    # Calculate sleep score
    sleep_val = calculate_sleep_score(sleep_data)
    sleep_score = ScoreDetail(value=sleep_val, qualifier=score_qualifier(sleep_val)) if sleep_val is not None else None

    # Extract HRV and RHR from body summary (averaged section)
    hrv_values: list[float] = []
    rhr_values: list[float] = []
    if body_data:
        averaged = body_data.get("averaged") or {}
        hrv = averaged.get("avg_hrv_sdnn_ms")
        rhr = averaged.get("resting_heart_rate_bpm")
        if hrv:
            hrv_values = [hrv]
        if rhr:
            rhr_values = [rhr]

    # Calculate recovery score
    recovery_val = calculate_recovery_score(hrv_values, rhr_values, sleep_val)
    recovery_score = ScoreDetail(value=recovery_val, qualifier=score_qualifier(recovery_val)) if recovery_val is not None else None

    # Calculate activity score
    active_minutes = [a.get("active_minutes", 0) for a in activity_data]
    steps = [a.get("steps", 0) for a in activity_data]
    activity_val = calculate_activity_score(active_minutes, steps, len(workouts), days)
    activity_score = ScoreDetail(value=activity_val, qualifier=score_qualifier(activity_val)) if activity_val is not None else None

    # Calculate body score
    weight_values = None
    body_fat_values = None
    if body_data:
        slow = body_data.get("slow_changing") or {}
        weight_values = [slow["weight_kg"]] if slow.get("weight_kg") else None
        body_fat_values = [slow["body_fat_percent"]] if slow.get("body_fat_percent") else None

    body_val = calculate_body_score(weight_values, body_fat_values, rhr_values)
    body_score = ScoreDetail(value=body_val, qualifier=score_qualifier(body_val)) if body_val is not None else None

    return HealthScoresResponse(
        user_id=user_id,
        period_days=days,
        sleep_score=sleep_score,
        recovery_score=recovery_score,
        activity_score=activity_score,
        body_score=body_score,
        generated_at=datetime.now(timezone.utc),
    )


@router.get("/{user_id}/latest", response_model=HealthScoresLatest)
async def get_latest_scores(user_id: str):
    """Get latest scores (7-day window for speed)."""
    result = await get_health_scores(user_id, days=7)
    scores: dict[str, ScoreDetail] = {}
    if result.sleep_score:
        scores["sleep"] = result.sleep_score
    if result.recovery_score:
        scores["recovery"] = result.recovery_score
    if result.activity_score:
        scores["activity"] = result.activity_score
    if result.body_score:
        scores["body"] = result.body_score

    return HealthScoresLatest(
        user_id=user_id,
        scores=scores,
        generated_at=result.generated_at,
    )
