"""Pydantic schemas for portfolio analytics API."""

from datetime import datetime

from pydantic import BaseModel


class ClientAtRisk(BaseModel):
    user_id: str
    name: str
    risk_reason: str
    severity: str  # warning, critical
    sleep_score: int | None = None
    recovery_score: int | None = None
    recommendation_id: str | None = None


class ClientScore(BaseModel):
    user_id: str
    name: str
    sleep_score: int | None = None
    recovery_score: int | None = None


class PortfolioStats(BaseModel):
    active_clients: int
    avg_sleep_score: float | None = None
    avg_recovery_score: float | None = None
    clients_needing_attention: int
    avg_hrv: float | None = None
    compliance_rate: float | None = None  # % of clients syncing in last 48h
    clients_at_risk: list[ClientAtRisk] = []
    client_scores: list[ClientScore] = []


class PortfolioTrendPoint(BaseModel):
    date: str
    avg_sleep_score: float | None = None
    avg_recovery_score: float | None = None
    avg_activity_score: float | None = None
    active_clients: int = 0


class PortfolioTrends(BaseModel):
    period_days: int
    data: list[PortfolioTrendPoint] = []


class ActivityFeedItem(BaseModel):
    id: str
    user_id: str
    user_name: str
    event_type: str  # workout, sleep, score_change, sync, milestone
    title: str
    description: str | None = None
    timestamp: datetime
    severity: str = "info"  # info, success, warning


class ActivityFeed(BaseModel):
    items: list[ActivityFeedItem]
    total: int


class RiskMatrixEntry(BaseModel):
    user_id: str
    name: str
    activity_score: float
    recovery_score: float
    quadrant: str  # high-high, high-low, low-high, low-low


class ClientEngagement(BaseModel):
    user_id: str
    name: str
    status: str  # active, slowing, at_risk
    last_sync_hours_ago: float | None = None
    current_streak_days: int = 0


class RetentionData(BaseModel):
    active_count: int = 0
    slowing_count: int = 0
    at_risk_count: int = 0
    engagement_streaks: list[ClientEngagement] = []
    churn_risk_count: int = 0
    churn_trend: str = "stable"  # up, down, stable
    compliance_rate: float | None = None
    compliance_trend: str = "stable"  # up, down, stable
    recommended_outreach: int = 0
