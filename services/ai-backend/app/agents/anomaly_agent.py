"""Anomaly Detection Agent — scans member data for health anomalies."""

from datetime import date, datetime, timedelta, timezone
from typing import Any

from pydantic import BaseModel
from pydantic_ai import Agent

from app.services.ow_client import ow_client


class DetectedAnomaly(BaseModel):
    severity: str  # info, warning, critical
    alert_type: str  # sleep, heart_rate, activity, sync
    message: str


ANOMALY_SYSTEM_PROMPT = """You are a health data anomaly detector for a fitness/longevity coaching platform.
Analyze the member's recent health data and flag any anomalies that a coach should know about.

Flag these patterns:
- Sleep below 6 hours for 3+ consecutive nights → critical
- Resting HR spike >10% above 30-day average → warning
- Daily steps dropped >50% compared to weekly average → warning
- No device sync for 48+ hours → info
- Sleep efficiency consistently below 75% → warning
- Unusually high resting HR (>15% above baseline) → critical

For each anomaly, provide:
- severity: "info", "warning", or "critical"
- alert_type: "sleep", "heart_rate", "activity", or "sync"
- message: A brief, clear description (one sentence)

If no anomalies are found, return an empty list.
Do NOT fabricate anomalies — only flag genuine patterns in the data.
"""

anomaly_agent = Agent(
    "anthropic:claude-sonnet-4-5-20250929",
    system_prompt=ANOMALY_SYSTEM_PROMPT,
    output_type=list[DetectedAnomaly],
)


async def scan_user_anomalies(user_id: str, user_name: str) -> list[DetectedAnomaly]:
    """Scan a single user's data for anomalies."""
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
        connections = await ow_client.get_connections(user_id)
    except Exception:
        connections = []

    # Build context
    context_parts = [f"Member: {user_name}"]
    context_parts.append(f"\n--- Last 7 days ---")

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

    # 30-day baselines
    context_parts.append(f"\n--- 30-day baselines ---")
    if sleep_30d:
        durations = [s.get("duration_minutes") for s in sleep_30d if s.get("duration_minutes")]
        if durations:
            context_parts.append(f"Avg sleep: {sum(durations) / len(durations) / 60:.1f}h")
    if activity_30d:
        steps_all = [a.get("steps") for a in activity_30d if a.get("steps")]
        if steps_all:
            context_parts.append(f"Avg steps: {sum(steps_all) / len(steps_all):.0f}")
        hrs = [a.get("heart_rate", {}).get("min_bpm") for a in activity_30d if a.get("heart_rate", {}).get("min_bpm")]
        if hrs:
            context_parts.append(f"Avg resting HR: {sum(hrs) / len(hrs):.0f} bpm")

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

    # Skip AI call if no data at all
    if not sleep_7d and not activity_7d:
        if connections:
            return [DetectedAnomaly(
                severity="info",
                alert_type="sync",
                message=f"No health data available for {user_name} in the past 7 days",
            )]
        return []

    result = await anomaly_agent.run(
        f"Analyze this member's data for anomalies:\n\n{context}"
    )
    return result.output


async def scan_all_users() -> list[dict[str, Any]]:
    """Scan all users for anomalies. Returns list of (user_id, user_name, anomalies)."""
    users = await ow_client.get_users()
    all_anomalies = []

    for user in users:
        user_id = user.get("id", "")
        name = f"{user.get('first_name', '') or ''} {user.get('last_name', '') or ''}".strip() or "Unknown"
        try:
            anomalies = await scan_user_anomalies(user_id, name)
            for a in anomalies:
                all_anomalies.append({
                    "user_id": user_id,
                    "member_name": name,
                    "severity": a.severity,
                    "alert_type": a.alert_type,
                    "message": a.message,
                })
        except Exception:
            continue

    return all_anomalies
