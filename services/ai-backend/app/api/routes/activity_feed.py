"""Activity feed — recent notable events across all clients."""

import logging
import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Query

from app.schemas.portfolio import ActivityFeed, ActivityFeedItem
from app.services.ow_client import ow_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/activity-feed", tags=["activity-feed"])


@router.get("", response_model=ActivityFeed)
async def get_activity_feed(limit: int = Query(20, ge=1, le=50)):
    """Get recent notable events across all clients."""
    users = await ow_client.get_users()

    date_to = date.today()
    date_from = date_to - timedelta(days=3)  # Last 3 days for feed

    items: list[ActivityFeedItem] = []

    for user in users[:30]:  # Cap to avoid timeout
        user_id = user.get("id", "")
        name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "Unknown"

        try:
            # Recent workouts
            workouts = await ow_client.get_workouts(user_id, date_from, date_to)
            for w in workouts[:3]:
                workout_type = (w.get("type") or "workout").replace("_", " ").title()
                duration_min = round((w.get("duration_seconds") or 0) / 60)
                items.append(ActivityFeedItem(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    user_name=name,
                    event_type="workout",
                    title=f"{workout_type} completed",
                    description=f"{duration_min} min session" if duration_min > 0 else None,
                    timestamp=datetime.fromisoformat(w["start_time"]) if w.get("start_time") else datetime.now(timezone.utc),
                    severity="success",
                ))

            # Recent sleep
            sleep_data = await ow_client.get_sleep_summary(user_id, date_from, date_to)
            for s in sleep_data[:2]:
                duration = s.get("duration_minutes", 0)
                if duration <= 0:
                    continue  # Skip records with no actual sleep
                hours = duration // 60
                mins = duration % 60

                severity = "info"
                if duration < 300:
                    severity = "warning"
                elif duration >= 420:
                    severity = "success"

                efficiency = s.get("efficiency_percent")
                items.append(ActivityFeedItem(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    user_name=name,
                    event_type="sleep",
                    title=f"Slept {hours}h {mins}m",
                    description=f"Efficiency: {efficiency}%" if efficiency else None,
                    timestamp=datetime.fromisoformat(s["start_time"]) if s.get("start_time") else datetime.now(timezone.utc),
                    severity=severity,
                ))

        except Exception as e:
            logger.warning("Activity feed: failed for user %s: %s", user_id, e)
            continue

    # Sort by timestamp descending, limit
    items.sort(key=lambda x: x.timestamp, reverse=True)
    items = items[:limit]

    return ActivityFeed(items=items, total=len(items))
