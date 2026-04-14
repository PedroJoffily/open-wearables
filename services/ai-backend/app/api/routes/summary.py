from datetime import datetime, timezone

from fastapi import APIRouter

from app.agents.summary_agent import generate_health_summary
from app.schemas.summary import HealthSummaryResponse

router = APIRouter(prefix="/api/summary", tags=["summary"])


@router.get("/{user_id}", response_model=HealthSummaryResponse)
async def get_health_summary(user_id: str, period: int = 30):
    summary = await generate_health_summary(user_id, period_days=period)
    return HealthSummaryResponse(
        user_id=user_id,
        period_days=period,
        summary=summary,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
