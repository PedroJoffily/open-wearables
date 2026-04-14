from pydantic import BaseModel


class HealthSummaryResponse(BaseModel):
    user_id: str
    period_days: int
    summary: str
    generated_at: str
