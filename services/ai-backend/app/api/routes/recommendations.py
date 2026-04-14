"""API routes for coaching recommendations."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.recommendation import Recommendation
from app.schemas.recommendations import RecommendationList, RecommendationRead

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("", response_model=RecommendationList)
async def list_recommendations(
    resolved: bool = False,
    category: str | None = None,
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
):
    query = select(Recommendation).where(Recommendation.resolved == resolved)

    if category:
        query = query.where(Recommendation.category == category)

    query = query.order_by(Recommendation.created_at.desc()).limit(limit)
    result = await session.execute(query)
    recs = result.scalars().all()

    count_query = (
        select(func.count())
        .select_from(Recommendation)
        .where(Recommendation.resolved == resolved)
    )
    if category:
        count_query = count_query.where(Recommendation.category == category)
    total = (await session.execute(count_query)).scalar() or 0

    return RecommendationList(
        items=[RecommendationRead.model_validate(r) for r in recs],
        total=total,
    )


@router.patch("/{rec_id}/resolve", response_model=RecommendationRead)
async def resolve_recommendation(
    rec_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Recommendation).where(Recommendation.id == rec_id)
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.resolved = True
    rec.resolved_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(rec)

    return RecommendationRead.model_validate(rec)


@router.post("/scan")
async def trigger_scan():
    """Manually trigger a recommendation scan."""
    from app.tasks.recommendation_scan import run_recommendation_scan

    await run_recommendation_scan()
    return {"status": "ok", "message": "Scan completed"}
