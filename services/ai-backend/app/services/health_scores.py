"""Algorithmic health score calculator.

Computes 4 sub-scores (sleep, recovery, activity, body) from raw OW data.
These are deterministic calculations — no LLM calls.
"""

from __future__ import annotations

import statistics
from datetime import date, timedelta
from typing import Any


def calculate_sleep_score(sleep_records: list[dict[str, Any]]) -> int | None:
    """Calculate sleep score (0-100) from sleep summary records.

    Weights: duration 30%, deep 20%, REM 15%, efficiency 20%, consistency 15%
    """
    if not sleep_records:
        return None

    scores: list[float] = []

    for rec in sleep_records:
        duration_min = rec.get("duration_minutes") or 0
        stages = rec.get("stages") or {}
        deep_min = stages.get("deep_minutes") or 0
        rem_min = stages.get("rem_minutes") or 0
        efficiency = rec.get("efficiency_percent")

        if duration_min <= 0:
            continue

        # Duration score: 7-9h = 100, <5h or >10h = low
        dur_score = _clamp(_bell_curve(duration_min, ideal=480, width=120))

        # Deep sleep: 15-25% of total is optimal
        deep_pct = (deep_min / duration_min) * 100 if duration_min > 0 else 0
        deep_score = _clamp(_bell_curve(deep_pct, ideal=20, width=10))

        # REM: 20-25% is optimal
        rem_pct = (rem_min / duration_min) * 100 if duration_min > 0 else 0
        rem_score = _clamp(_bell_curve(rem_pct, ideal=22, width=8))

        # Efficiency: higher is better, cap at 100
        eff_score = _clamp(float(efficiency)) if efficiency else 75.0

        scores.append(dur_score * 0.30 + deep_score * 0.20 + rem_score * 0.15 + eff_score * 0.20)

    if not scores:
        return None

    # Consistency bonus: low variance in durations = better
    if len(sleep_records) >= 3:
        durations = [
            r.get("duration_minutes", 0)
            for r in sleep_records
            if r.get("duration_minutes", 0) > 0
        ]
        if len(durations) >= 3:
            cv = statistics.stdev(durations) / statistics.mean(durations) if statistics.mean(durations) > 0 else 1
            consistency = _clamp(100 - cv * 200)  # Low CV = high consistency
            avg = statistics.mean(scores) + consistency * 0.15
            return _clamp_int(avg)

    return _clamp_int(statistics.mean(scores) + 15)  # 15% consistency placeholder


def calculate_recovery_score(
    hrv_values: list[float],
    rhr_values: list[float],
    sleep_score: int | None,
    training_load: float | None = None,
) -> int | None:
    """Calculate recovery score (0-100).

    Based on HRV trend, resting HR, sleep quality, and training load balance.
    """
    components: list[float] = []

    # HRV component (30%): higher and trending up = better
    if hrv_values and len(hrv_values) >= 2:
        avg_hrv = statistics.mean(hrv_values)
        hrv_score = _clamp(min(100, avg_hrv * 1.5))  # ~65ms = 100
        components.append(hrv_score * 0.30)

    # RHR component (25%): lower is better
    if rhr_values:
        avg_rhr = statistics.mean(rhr_values)
        rhr_score = _clamp(max(0, 100 - (avg_rhr - 45) * 2))  # 45bpm = 100, 95bpm = 0
        components.append(rhr_score * 0.25)

    # Sleep quality (30%)
    if sleep_score is not None:
        components.append(sleep_score * 0.30)

    # Training load balance (15%)
    if training_load is not None:
        # Moderate load (0.8-1.2 ratio) is optimal
        load_score = _clamp(_bell_curve(training_load, ideal=1.0, width=0.4) * 100)
        components.append(load_score * 0.15)

    if not components:
        return None

    # Normalize to full scale
    weight_sum = sum(
        w for w, has in [
            (0.30, bool(hrv_values and len(hrv_values) >= 2)),
            (0.25, bool(rhr_values)),
            (0.30, sleep_score is not None),
            (0.15, training_load is not None),
        ]
        if has
    )
    if weight_sum == 0:
        return None

    return _clamp_int(sum(components) / weight_sum * 100)


def calculate_activity_score(
    active_minutes: list[int],
    steps: list[int],
    workout_count: int = 0,
    days: int = 7,
) -> int | None:
    """Calculate activity score (0-100).

    Based on active minutes, daily steps, workout frequency, and consistency.
    """
    if not active_minutes and not steps:
        return None

    components: list[float] = []

    # Active minutes (35%): 150min/week target (WHO recommendation)
    if active_minutes:
        weekly_active = sum(active_minutes[-7:]) if len(active_minutes) >= 7 else sum(active_minutes)
        active_score = _clamp(min(100, (weekly_active / 150) * 100))
        components.append(active_score * 0.35)

    # Steps (25%): 8000-10000 daily is target
    if steps:
        avg_steps = statistics.mean(steps) if steps else 0
        steps_score = _clamp(min(100, (avg_steps / 10000) * 100))
        components.append(steps_score * 0.25)

    # Workout frequency (25%): 4-5 sessions/week is optimal
    if days > 0:
        weekly_rate = (workout_count / days) * 7
        freq_score = _clamp(min(100, (weekly_rate / 5) * 100))
        components.append(freq_score * 0.25)

    # Consistency (15%): low variance in daily steps
    if steps and len(steps) >= 3:
        cv = statistics.stdev(steps) / statistics.mean(steps) if statistics.mean(steps) > 0 else 1
        consistency = _clamp(100 - cv * 150)
        components.append(consistency * 0.15)

    if not components:
        return None

    weight_sum = sum(
        w for w, has in [
            (0.35, bool(active_minutes)),
            (0.25, bool(steps)),
            (0.25, days > 0),
            (0.15, bool(steps and len(steps) >= 3)),
        ]
        if has
    )
    return _clamp_int(sum(components) / weight_sum * 100) if weight_sum > 0 else None


def calculate_body_score(
    weight_values: list[float] | None = None,
    body_fat_values: list[float] | None = None,
    rhr_trend: list[float] | None = None,
) -> int | None:
    """Calculate body composition score (0-100).

    Based on weight stability, body fat trends, and resting vitals.
    """
    components: list[float] = []

    # Weight stability (40%): stable or gently trending toward goal
    if weight_values and len(weight_values) >= 3:
        cv = statistics.stdev(weight_values) / statistics.mean(weight_values) if statistics.mean(weight_values) > 0 else 1
        stability = _clamp(100 - cv * 500)
        components.append(stability * 0.40)

    # Body fat (35%): lower is generally better, but healthy range varies
    if body_fat_values:
        avg_bf = statistics.mean(body_fat_values)
        bf_score = _clamp(max(0, 100 - max(0, avg_bf - 15) * 3))  # 15% = 100, 48% = 0
        components.append(bf_score * 0.35)

    # RHR trend (25%): improving (decreasing) is good
    if rhr_trend and len(rhr_trend) >= 2:
        recent = statistics.mean(rhr_trend[-3:]) if len(rhr_trend) >= 3 else rhr_trend[-1]
        older = statistics.mean(rhr_trend[:3])
        improvement = older - recent  # positive = improving
        trend_score = _clamp(70 + improvement * 5)
        components.append(trend_score * 0.25)

    if not components:
        return None

    weight_sum = sum(
        w for w, has in [
            (0.40, bool(weight_values and len(weight_values) >= 3)),
            (0.35, bool(body_fat_values)),
            (0.25, bool(rhr_trend and len(rhr_trend) >= 2)),
        ]
        if has
    )
    return _clamp_int(sum(components) / weight_sum * 100) if weight_sum > 0 else None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _bell_curve(value: float, ideal: float, width: float) -> float:
    """Gaussian-like scoring: 100 at ideal, falls off with distance."""
    distance = abs(value - ideal)
    return max(0, 100 * (1 - (distance / width) ** 2))


def _clamp(value: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, value))


def _clamp_int(value: float) -> int:
    return int(max(0, min(100, round(value))))


def score_qualifier(value: int) -> str:
    if value >= 85:
        return "excellent"
    if value >= 70:
        return "good"
    if value >= 50:
        return "fair"
    return "poor"
