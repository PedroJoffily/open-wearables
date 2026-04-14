"""Recommendation Agent — generates proactive coaching recommendations from member health data."""

from datetime import date, datetime, timedelta, timezone
from typing import Any

from pydantic import BaseModel
from pydantic_ai import Agent

from app.services.ow_client import ow_client


class DetectedRecommendation(BaseModel):
    category: str  # alert, check_in, praise, nudge, sync
    severity: str  # info, warning, critical
    message: str
    action_text: str  # 2-5 word CTA for coach


RECOMMENDATION_SYSTEM_PROMPT = """You are a coaching intelligence engine for a fitness/longevity coaching platform.
Analyze the member's recent health data and generate proactive recommendations for their coach.

You generate 5 types of recommendations:

1. **alert** (health concern): Flag genuine health anomalies that need immediate attention.
   - Sleep below 6 hours for 3+ consecutive nights → severity: critical
   - Resting HR spike >10% above 30-day average → severity: warning
   - Resting HR spike >15% above baseline → severity: critical
   - Sleep efficiency consistently below 75% → severity: warning
   - Example action_text: "Check recovery protocol", "Review sleep habits"

2. **check_in** (relationship maintenance): Suggest when the coach should reach out.
   - No workout logged for 7+ days when they usually train 3+/week → severity: info
   - No data at all for 5+ days (but device is connected) → severity: info
   - Significant change in routine patterns (sudden schedule shift) → severity: info
   - Example action_text: "Schedule check-in", "Send a quick message"

3. **praise** (motivation): Celebrate achievements and positive trends.
   - Workout streak: 5+ consecutive days with a workout → severity: info
   - Sleep consistency improved (duration variation decreased) → severity: info
   - Steps consistently above 10k/day for 7+ days → severity: info
   - Resting HR trending down (improving fitness) → severity: info
   - High training volume maintained over 2+ weeks → severity: info
   - Example action_text: "Send encouragement", "Celebrate this win"

4. **nudge** (gentle push): Flag concerning-but-not-critical trends.
   - Activity dropped 20-50% vs weekly average → severity: warning
   - Sleep dropped below 7h for 2 nights (not yet critical) → severity: warning
   - Skipped 3+ usual training days → severity: warning
   - Example action_text: "Worth a message", "Gentle follow-up"

5. **sync** (device/data): Device connectivity issues.
   - No device sync for 48+ hours → severity: info
   - No health data for 7+ days despite connected device → severity: warning
   - Example action_text: "Remind to sync device", "Check device connection"

Rules:
- Return ALL applicable recommendations, not just problems.
- ALWAYS look for praise opportunities — coaches need positive signals too.
- The action_text must be 2-5 words, a direct instruction for the coach.
- The message must be one clear sentence.
- Do NOT fabricate data — only flag patterns genuinely present in the data.
- If there's truly nothing noteworthy, return an empty list.
- Prefer generating praise or check_in when data is positive rather than returning nothing.
- A member with consistent training and decent sleep deserves at least a praise.
"""

recommendation_agent = Agent(
    "anthropic:claude-sonnet-4-5-20250929",
    system_prompt=RECOMMENDATION_SYSTEM_PROMPT,
    output_type=list[DetectedRecommendation],
)


async def scan_user_recommendations(user_id: str, user_name: str) -> list[DetectedRecommendation]:
    """Scan a single user's data and generate coaching recommendations."""
    date_to = date.today()
    date_from_7d = date_to - timedelta(days=7)
    date_from_30d = date_to - timedelta(days=30)

    # Fetch recent and baseline data
    try:
        sleep_7d = await ow_client.get_sleep_summary(user_id, date_from_7d, date_to)
    except Exception:
        sleep_7d = []

    try:
        sleep_30d = await ow_client.get_sleep_summary(user_id, date_from_30d, date_to)
    except Exception:
        sleep_30d = []

    try:
        activity_7d = await ow_client.get_activity_summary(user_id, date_from_7d, date_to)
    except Exception:
        activity_7d = []

    try:
        activity_30d = await ow_client.get_activity_summary(user_id, date_from_30d, date_to)
    except Exception:
        activity_30d = []

    try:
        workouts_7d = await ow_client.get_workouts(user_id, date_from_7d, date_to)
    except Exception:
        workouts_7d = []

    try:
        workouts_30d = await ow_client.get_workouts(user_id, date_from_30d, date_to)
    except Exception:
        workouts_30d = []

    try:
        connections = await ow_client.get_connections(user_id)
    except Exception:
        connections = []

    # Build context
    context_parts = [f"Member: {user_name}"]
    context_parts.append("\n--- Last 7 days ---")

    if sleep_7d:
        for s in sleep_7d:
            dur = s.get("duration_minutes")
            eff = s.get("efficiency_percent")
            context_parts.append(
                f"Sleep {s.get('date', '?')}: {dur / 60:.1f}h" + (f", efficiency {eff}%" if eff else "")
                if dur else f"Sleep {s.get('date', '?')}: no duration"
            )
    else:
        context_parts.append("Sleep: No data")

    if activity_7d:
        for a in activity_7d:
            steps = a.get("steps")
            hr = a.get("heart_rate", {})
            rhr = hr.get("min_bpm") if hr else None
            context_parts.append(
                f"Activity {a.get('date', '?')}: {steps} steps" + (f", resting HR {rhr} bpm" if rhr else "")
                if steps else f"Activity {a.get('date', '?')}: no steps"
            )
    else:
        context_parts.append("Activity: No data")

    if workouts_7d:
        context_parts.append(f"Workouts (7d): {len(workouts_7d)} sessions")
        for w in workouts_7d[:10]:
            w_name = w.get("type") or w.get("name") or "workout"
            w_date = (w.get("start_time") or "")[:10]
            context_parts.append(f"  {w_date}: {w_name}")
    else:
        context_parts.append("Workouts (7d): None logged")

    # 30-day baselines
    context_parts.append("\n--- 30-day baselines ---")
    if sleep_30d:
        durations = [s.get("duration_minutes") for s in sleep_30d if s.get("duration_minutes")]
        if durations:
            context_parts.append(f"Avg sleep: {sum(durations) / len(durations) / 60:.1f}h ({len(durations)} nights)")
    if activity_30d:
        steps_all = [a.get("steps") for a in activity_30d if a.get("steps")]
        if steps_all:
            context_parts.append(f"Avg steps: {sum(steps_all) / len(steps_all):.0f}")
        hrs = [a.get("heart_rate", {}).get("min_bpm") for a in activity_30d if a.get("heart_rate", {}).get("min_bpm")]
        if hrs:
            context_parts.append(f"Avg resting HR: {sum(hrs) / len(hrs):.0f} bpm")

    if workouts_30d:
        context_parts.append(f"Workouts (30d): {len(workouts_30d)} total ({len(workouts_30d) / 4.3:.1f}/week avg)")

    # Connection status
    if connections:
        for c in connections:
            last_sync = c.get("last_synced_at")
            if last_sync:
                sync_dt = datetime.fromisoformat(last_sync.replace("Z", "+00:00"))
                hours_ago = (datetime.now(timezone.utc) - sync_dt).total_seconds() / 3600
                context_parts.append(f"Device {c.get('provider', '?')}: last synced {hours_ago:.0f}h ago")
    else:
        context_parts.append("No connected devices")

    context = "\n".join(context_parts)

    # If no recent data, check for older data (up to 365 days)
    if not sleep_7d and not activity_7d and not workouts_7d and not sleep_30d and not activity_30d and not workouts_30d:
        # Look for any historical data
        has_old_data = False
        last_data_info = ""
        for expand in [90, 180, 365]:
            date_from_exp = date_to - timedelta(days=expand)
            try:
                old_workouts = await ow_client.get_workouts(user_id, date_from_exp, date_to)
            except Exception:
                old_workouts = []
            try:
                old_sleep = await ow_client.get_sleep_summary(user_id, date_from_exp, date_to)
            except Exception:
                old_sleep = []
            if old_workouts or old_sleep:
                has_old_data = True
                # Find most recent date
                dates = []
                for w in old_workouts:
                    if w.get("start_time"):
                        dates.append(w["start_time"][:10])
                for s in old_sleep:
                    if s.get("date"):
                        dates.append(s["date"])
                if dates:
                    most_recent = max(dates)
                    days_ago = (date_to - date.fromisoformat(most_recent)).days
                    last_data_info = f"Last data was {days_ago} days ago ({most_recent}), with {len(old_workouts)} workouts and {len(old_sleep)} sleep records in the past {expand} days"
                break

        results = []
        if has_old_data:
            results.append(DetectedRecommendation(
                category="check_in",
                severity="warning",
                message=f"{user_name} was active but stopped tracking. {last_data_info}. Time to reconnect.",
                action_text="Re-engage member",
            ))
        elif connections:
            results.append(DetectedRecommendation(
                category="sync",
                severity="warning",
                message=f"No health data available for {user_name} despite connected device",
                action_text="Check device connection",
            ))
        else:
            results.append(DetectedRecommendation(
                category="check_in",
                severity="info",
                message=f"No data or devices for {user_name} — consider onboarding help",
                action_text="Schedule check-in",
            ))
        return results

    result = await recommendation_agent.run(
        f"Analyze this member's data and generate coaching recommendations:\n\n{context}"
    )
    return result.output


async def scan_all_users() -> list[dict[str, Any]]:
    """Scan all users for recommendations. Returns list of dicts."""
    users = await ow_client.get_users()
    all_recommendations = []

    for user in users:
        user_id = user.get("id", "")
        name = f"{user.get('first_name', '') or ''} {user.get('last_name', '') or ''}".strip() or "Unknown"
        try:
            recs = await scan_user_recommendations(user_id, name)
            for r in recs:
                all_recommendations.append({
                    "user_id": user_id,
                    "member_name": name,
                    "category": r.category,
                    "severity": r.severity,
                    "message": r.message,
                    "action_text": r.action_text,
                })
        except Exception:
            continue

    return all_recommendations
