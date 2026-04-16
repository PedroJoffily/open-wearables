"""API routes for coaching recommendations."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.recommendation import Recommendation
from app.schemas.recommendations import (
    CheckInItem,
    CheckInList,
    RecommendationList,
    RecommendationRead,
)

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("", response_model=RecommendationList)
async def list_recommendations(
    resolved: bool = False,
    category: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("created_at", pattern="^(created_at|severity|member_name)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    session: AsyncSession = Depends(get_session),
):
    query = select(Recommendation).where(Recommendation.resolved == resolved)

    # Support comma-separated categories
    if category:
        categories = [c.strip() for c in category.split(",") if c.strip()]
        if len(categories) == 1:
            query = query.where(Recommendation.category == categories[0])
        elif categories:
            query = query.where(Recommendation.category.in_(categories))

    # Sorting
    sort_col = getattr(Recommendation, sort_by, Recommendation.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    query = query.offset(offset).limit(limit)
    result = await session.execute(query)
    recs = result.scalars().all()

    # Total count
    count_query = (
        select(func.count())
        .select_from(Recommendation)
        .where(Recommendation.resolved == resolved)
    )
    if category:
        categories = [c.strip() for c in category.split(",") if c.strip()]
        if len(categories) == 1:
            count_query = count_query.where(Recommendation.category == categories[0])
        elif categories:
            count_query = count_query.where(Recommendation.category.in_(categories))
    total = (await session.execute(count_query)).scalar() or 0

    return RecommendationList(
        items=[RecommendationRead.model_validate(r) for r in recs],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/check-ins", response_model=CheckInList)
async def list_check_ins(
    session: AsyncSession = Depends(get_session),
):
    """Get recommended check-ins: unresolved alert/check_in recs, grouped by user (most urgent per user)."""
    query = (
        select(Recommendation)
        .where(Recommendation.resolved == False)  # noqa: E712
        .where(Recommendation.category.in_(["alert", "check_in"]))
        .order_by(Recommendation.created_at.asc())
    )
    result = await session.execute(query)
    recs = result.scalars().all()

    overdue_threshold = datetime.now(timezone.utc) - timedelta(days=3)

    # Group by user, pick most urgent per user
    seen_users: dict[str, Recommendation] = {}
    severity_rank = {"critical": 0, "warning": 1, "info": 2}
    for rec in recs:
        if rec.user_id not in seen_users:
            seen_users[rec.user_id] = rec
        else:
            existing = seen_users[rec.user_id]
            if severity_rank.get(rec.severity, 9) < severity_rank.get(existing.severity, 9):
                seen_users[rec.user_id] = rec

    items = []
    for rec in seen_users.values():
        created = rec.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        items.append(
            CheckInItem(
                user_id=rec.user_id,
                member_name=rec.member_name,
                reason=rec.action_text if rec.action_text else rec.message,
                overdue=created < overdue_threshold,
                recommendation_id=rec.id,
                created_at=rec.created_at,
            )
        )

    # Sort: overdue first, then by created_at ascending
    items.sort(key=lambda x: (not x.overdue, x.created_at))

    return CheckInList(items=items, total=len(items))


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
