#!/usr/bin/env python3
"""Seed comprehensive data for all users up to 2026-04-15."""

from datetime import date

from app.database import SessionLocal
from app.schemas.utils.seed_data import (
    SeedDataRequest,
    SeedProfileConfig,
    SleepConfig,
    WorkoutConfig,
)
from app.services.seed_data_service import seed_data_service

END_DATE = date(2026, 4, 15)
START_DATE = date(2025, 10, 15)  # 6 months of data


def seed_full() -> None:
    request = SeedDataRequest(
        num_users=3,
        profile=SeedProfileConfig(
            preset="comprehensive",
            generate_workouts=True,
            generate_sleep=True,
            generate_time_series=True,
            num_connections=4,
            workout_config=WorkoutConfig(
                count=150,
                time_series_chance_pct=60,
                duration_min_minutes=15,
                duration_max_minutes=180,
                date_from=START_DATE,
                date_to=END_DATE,
            ),
            sleep_config=SleepConfig(
                count=90,
                duration_min_minutes=300,
                duration_max_minutes=600,
                nap_chance_pct=10,
                date_from=START_DATE,
                date_to=END_DATE,
            ),
        ),
    )
    with SessionLocal() as db:
        summary = seed_data_service.generate(db, request)

    print("Done:")
    for k, v in summary.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    seed_full()
