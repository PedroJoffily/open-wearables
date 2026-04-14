"""Periodic anomaly scan task — runs via APScheduler."""

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.alert import Alert
from app.agents.anomaly_agent import scan_all_users

logger = logging.getLogger(__name__)


async def run_anomaly_scan():
    """Scan all users for health anomalies and store new alerts."""
    logger.info("Starting anomaly scan...")

    try:
        anomalies = await scan_all_users()
    except Exception as e:
        logger.error(f"Anomaly scan failed: {e}")
        return

    if not anomalies:
        logger.info("Anomaly scan complete — no anomalies found.")
        return

    async with async_session() as session:
        for a in anomalies:
            # Check for duplicate (same user, type, message in last 24h)
            existing = await session.execute(
                select(Alert).where(
                    Alert.user_id == a["user_id"],
                    Alert.alert_type == a["alert_type"],
                    Alert.message == a["message"],
                    Alert.resolved == False,
                )
            )
            if existing.scalar_one_or_none():
                continue

            alert = Alert(
                user_id=a["user_id"],
                member_name=a["member_name"],
                severity=a["severity"],
                alert_type=a["alert_type"],
                message=a["message"],
            )
            session.add(alert)

        await session.commit()

    logger.info(f"Anomaly scan complete — {len(anomalies)} anomalies detected.")


def sync_anomaly_scan():
    """Synchronous wrapper for APScheduler."""
    asyncio.run(run_anomaly_scan())
