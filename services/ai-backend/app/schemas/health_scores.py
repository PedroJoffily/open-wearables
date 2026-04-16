"""Pydantic schemas for health scores API."""

from datetime import datetime

from pydantic import BaseModel


class ScoreDetail(BaseModel):
    value: int | None
    qualifier: str | None = None
    components: dict[str, float] | None = None


class HealthScoresResponse(BaseModel):
    user_id: str
    period_days: int
    sleep_score: ScoreDetail | None = None
    recovery_score: ScoreDetail | None = None
    activity_score: ScoreDetail | None = None
    body_score: ScoreDetail | None = None
    generated_at: datetime


class HealthScoresLatest(BaseModel):
    user_id: str
    scores: dict[str, ScoreDetail]
    generated_at: datetime
