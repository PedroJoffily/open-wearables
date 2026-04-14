"""Periodic recommendation scan — runs via APScheduler."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.agents.recommendation_agent import scan_all_users
from app.database import async_session
from app.models.recommendation import Recommendation

logger = logging.getLogger(__name__)


async def run_recommendation_scan() -> None:
    """Scan all users and store new recommendations."""
    logger.info("Starting recommendation scan...")
    try:
        results = await scan_all_users()
    except Exception as e:
        logger.error("Recommendation scan failed: %s", e)
        return

    new_count = 0
    async with async_session() as session:
        for r in results:
            # Dedup: skip if identical unresolved recommendation exists
            existing = await session.execute(
                select(Recommendation).where(
                    Recommendation.user_id == r["user_id"],
                    Recommendation.category == r["category"],
                    Recommendation.message == r["message"],
                    Recommendation.resolved == False,
                )
            )
            if existing.scalar_one_or_none():
                continue

            # For praise: skip if same user+category was created in last 24h
            if r["category"] == "praise":
                cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
                recent_praise = await session.execute(
                    select(Recommendation).where(
                        Recommendation.user_id == r["user_id"],
                        Recommendation.category == "praise",
                        Recommendation.created_at > cutoff,
                    )
                )
                if recent_praise.scalar_one_or_none():
                    continue

            rec = Recommendation(
                user_id=r["user_id"],
                member_name=r["member_name"],
                category=r["category"],
                severity=r["severity"],
                message=r["message"],
                action_text=r["action_text"],
            )
            session.add(rec)
            new_count += 1

        await session.commit()

    logger.info("Recommendation scan complete: %d new items from %d total", new_count, len(results))


def sync_recommendation_scan() -> None:
    """Synchronous wrapper for APScheduler."""
    asyncio.run(run_recommendation_scan())
