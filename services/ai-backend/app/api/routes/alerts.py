from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.alert import Alert
from app.schemas.alerts import AlertRead, AlertList

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=AlertList)
async def list_alerts(
    resolved: bool = False,
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Alert)
        .where(Alert.resolved == resolved)
        .order_by(Alert.created_at.desc())
        .limit(limit)
    )
    result = await session.execute(query)
    alerts = result.scalars().all()

    count_query = select(func.count()).select_from(Alert).where(Alert.resolved == resolved)
    total = (await session.execute(count_query)).scalar() or 0

    return AlertList(items=[AlertRead.model_validate(a) for a in alerts], total=total)


@router.patch("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        return {"error": "Alert not found"}

    alert.resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    await session.commit()
    return AlertRead.model_validate(alert)
