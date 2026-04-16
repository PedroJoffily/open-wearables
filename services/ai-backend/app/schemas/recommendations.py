"""Pydantic schemas for recommendations API."""

from datetime import datetime

from pydantic import BaseModel


class RecommendationRead(BaseModel):
    id: str
    user_id: str
    member_name: str
    category: str
    severity: str
    message: str
    action_text: str
    resolved: bool
    created_at: datetime
    resolved_at: datetime | None = None

    model_config = {"from_attributes": True}


class RecommendationList(BaseModel):
    items: list[RecommendationRead]
    total: int
    limit: int = 20
    offset: int = 0


class CheckInItem(BaseModel):
    user_id: str
    member_name: str
    reason: str
    overdue: bool
    recommendation_id: str
    created_at: datetime


class CheckInList(BaseModel):
    items: list[CheckInItem]
    total: int
