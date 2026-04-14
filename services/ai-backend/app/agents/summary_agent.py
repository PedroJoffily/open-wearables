"""Health Summary Agent — generates natural language health summaries for a member."""

from datetime import date, timedelta

from pydantic_ai import Agent

from app.services.ow_client import ow_client

SUMMARY_SYSTEM_PROMPT = """You are a health coach's AI assistant. Generate a brief, actionable health summary
for a fitness/longevity studio member based on their wearable data.

Rules:
- Write 2-3 sentences maximum
- Use a warm but professional tone — you're briefing a coach, not the member
- Start with the overall picture (positive or concerning)
- Mention specific metrics only when noteworthy (unusually high/low)
- If data is old, mention when it's from (e.g. "Based on data from early February...")
- End with a coaching suggestion if relevant
- Never use medical diagnoses or alarm language
- Use plain numbers (e.g. "7.2 hours" not "7h12m")

Example outputs:
- "Strong recovery week — sleep consistently above 7 hours with good deep sleep ratios. Resting HR stable at 58 bpm. Consider increasing training intensity next week."
- "Mixed signals this week. Sleep dropped to 5.5 hours on 3 nights, though activity stayed high with 4 workouts. Worth checking in about recovery and stress levels."
- "Based on data from early February, member was highly active with 12 workouts across diverse activities. No recent data since then — worth checking in about their routine."
"""

summary_agent = Agent(
    "anthropic:claude-sonnet-4-5-20250929",
    system_prompt=SUMMARY_SYSTEM_PROMPT,
)


async def _fetch_data(user_id: str, date_from: date, date_to: date) -> dict:
    """Fetch all data types for a user in a given range."""
    try:
        sleep = await ow_client.get_sleep_summary(user_id, date_from, date_to)
    except Exception:
        sleep = []

    try:
        activity = await ow_client.get_activity_summary(user_id, date_from, date_to)
    except Exception:
        activity = []

    try:
        workouts = await ow_client.get_workouts(user_id, date_from, date_to)
    except Exception:
        workouts = []

    try:
        body = await ow_client.get_body_summary(user_id)
    except Exception:
        body = None

    return {
        "sleep": sleep,
        "activity": activity,
        "workouts": workouts,
        "body": body,
    }


def _has_data(d: dict) -> bool:
    return bool(d["sleep"] or d["activity"] or d["workouts"])


async def generate_health_summary(user_id: str, period_days: int = 30) -> str:
    """Fetch OW data and generate a health summary via Claude.

    Auto-expands search window if no data found in requested period.
    """
    date_to = date.today()
    date_from = date_to - timedelta(days=period_days)

    data = await _fetch_data(user_id, date_from, date_to)
    actual_period = period_days

    # If no data in requested period, progressively expand search
    if not _has_data(data):
        for expand_days in [90, 180, 365]:
            if expand_days <= period_days:
                continue
            date_from_expanded = date_to - timedelta(days=expand_days)
            data = await _fetch_data(user_id, date_from_expanded, date_to)
            if _has_data(data):
                actual_period = expand_days
                date_from = date_from_expanded
                break

    sleep_data = data["sleep"]
    activity_data = data["activity"]
    workouts = data["workouts"]
    body = data["body"]

    # If still no data, return message
    if not _has_data(data):
        return "No wearable data available for this member. They may need to connect their device or sync their data."

    # Build context for the agent
    context_parts = []
    if actual_period != period_days:
        context_parts.append(
            f"Note: No data found in the last {period_days} days. "
            f"Showing data from the last {actual_period} days instead (from {date_from} to {date_to})."
        )
    context_parts.append(f"Member data ({date_from} to {date_to}):")

    if sleep_data:
        durations = [s.get("duration_minutes") for s in sleep_data if s.get("duration_minutes")]
        if durations:
            avg_sleep = sum(durations) / len(durations)
            context_parts.append(f"Sleep: {len(durations)} nights recorded, avg {avg_sleep / 60:.1f} hours")
            efficiencies = [s.get("efficiency_percent") for s in sleep_data if s.get("efficiency_percent")]
            if efficiencies:
                context_parts.append(f"  Avg sleep efficiency: {sum(efficiencies) / len(efficiencies):.0f}%")
            # Show date range of sleep data
            dates = sorted([s.get("date", "") for s in sleep_data if s.get("date")])
            if dates:
                context_parts.append(f"  Sleep data range: {dates[0]} to {dates[-1]}")
    else:
        context_parts.append("Sleep: No data available")

    if activity_data:
        steps = [a.get("steps") for a in activity_data if a.get("steps")]
        if steps:
            context_parts.append(f"Activity: {len(steps)} days, avg {sum(steps) / len(steps):.0f} steps/day")
        active_cals = [a.get("active_calories_kcal") for a in activity_data if a.get("active_calories_kcal")]
        if active_cals:
            context_parts.append(f"  Avg active calories: {sum(active_cals) / len(active_cals):.0f} kcal")
        hr_data = [a.get("heart_rate", {}) for a in activity_data if a.get("heart_rate")]
        resting_hrs = [h.get("min_bpm") for h in hr_data if h and h.get("min_bpm")]
        if resting_hrs:
            context_parts.append(f"  Resting HR range: {min(resting_hrs)}-{max(resting_hrs)} bpm")
    else:
        context_parts.append("Activity: No data available")

    if workouts:
        context_parts.append(f"Workouts: {len(workouts)} sessions logged")
        types = [w.get("type") or w.get("name") or "unknown" for w in workouts]
        context_parts.append(f"  Types: {', '.join(types[:15])}")
        # Show date range
        w_dates = sorted([
            (w.get("start_time") or "")[:10]
            for w in workouts
            if w.get("start_time")
        ])
        if w_dates:
            context_parts.append(f"  Workout date range: {w_dates[0]} to {w_dates[-1]}")
    else:
        context_parts.append("Workouts: None logged")

    if body:
        slow = body.get("slow_changing", {})
        if slow.get("weight_kg"):
            context_parts.append(f"Body: Weight {slow['weight_kg']} kg")
        averaged = body.get("averaged", {})
        if averaged.get("resting_heart_rate_bpm"):
            context_parts.append(f"  7-day avg resting HR: {averaged['resting_heart_rate_bpm']} bpm")

    # Days since last data point
    all_dates = []
    for s in sleep_data:
        if s.get("date"):
            all_dates.append(s["date"])
    for a in activity_data:
        if a.get("date"):
            all_dates.append(a["date"])
    for w in workouts:
        if w.get("start_time"):
            all_dates.append(w["start_time"][:10])
    if all_dates:
        most_recent = max(all_dates)
        context_parts.append(f"\nMost recent data point: {most_recent}")
        try:
            days_ago = (date_to - date.fromisoformat(most_recent)).days
            if days_ago > 7:
                context_parts.append(f"  ({days_ago} days ago — data is stale)")
        except ValueError:
            pass

    context = "\n".join(context_parts)

    result = await summary_agent.run(
        f"Generate a health summary for this member's coach:\n\n{context}"
    )
    return result.output
