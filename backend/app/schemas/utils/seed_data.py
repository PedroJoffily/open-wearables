"""Schemas for seed data generation via the dashboard."""

from datetime import date

from pydantic import BaseModel, Field, model_validator

from app.schemas.enums import HealthScoreCategory, ProviderName, WorkoutType


class WorkoutConfig(BaseModel):
    """Parameters controlling workout generation."""

    count: int = Field(80, ge=0, le=500)
    workout_types: list[WorkoutType] | None = Field(
        None, description="Specific workout types to generate. None = random from all."
    )
    duration_min_minutes: int = Field(15, ge=5, le=600)
    duration_max_minutes: int = Field(180, ge=5, le=600)
    hr_min_range: tuple[int, int] = (90, 120)
    hr_max_range: tuple[int, int] = (140, 180)
    steps_range: tuple[int, int] = (500, 20_000)
    time_series_chance_pct: int = Field(30, ge=0, le=100)
    date_range_months: int = Field(6, ge=1, le=24)
    date_from: date | None = Field(None, description="Explicit start date. Overrides date_range_months.")
    date_to: date | None = Field(None, description="Explicit end date. Overrides date_range_months.")

    @model_validator(mode="after")
    def _validate_ranges(self) -> "WorkoutConfig":
        if self.duration_min_minutes > self.duration_max_minutes:
            msg = (
                f"duration_min_minutes ({self.duration_min_minutes}) "
                f"must be <= duration_max_minutes ({self.duration_max_minutes})"
            )
            raise ValueError(msg)
        if self.date_from and self.date_to and self.date_from > self.date_to:
            msg = f"date_from ({self.date_from}) must be <= date_to ({self.date_to})"
            raise ValueError(msg)
        return self


class SleepStageDistribution(BaseModel):
    """Percentage ranges for each sleep stage. Light = remainder (100% - others)."""

    deep_pct_range: tuple[int, int] = (15, 25)
    rem_pct_range: tuple[int, int] = (20, 25)
    awake_pct_range: tuple[int, int] = (2, 8)

    @model_validator(mode="after")
    def _validate_ranges(self) -> "SleepStageDistribution":
        for name in ("deep_pct_range", "rem_pct_range", "awake_pct_range"):
            lo, hi = getattr(self, name)
            if not (0 <= lo <= hi <= 100):
                msg = f"{name}: need 0 <= min ({lo}) <= max ({hi}) <= 100"
                raise ValueError(msg)
        max_sum = self.deep_pct_range[1] + self.rem_pct_range[1] + self.awake_pct_range[1]
        if max_sum > 95:
            msg = f"Sum of max percentages ({max_sum}%) exceeds 95% - not enough room for light sleep"
            raise ValueError(msg)
        return self


SLEEP_STAGE_PROFILES: dict[str, dict] = {
    "optimal": {
        "label": "Optimal Sleeper",
        "description": "Balanced stages - good sleep scores",
        "distribution": SleepStageDistribution(
            deep_pct_range=(18, 25),
            rem_pct_range=(20, 25),
            awake_pct_range=(2, 5),
        ),
    },
    "deep_deficit": {
        "label": "Deep Sleep Deficit",
        "description": "Low deep sleep - poor physical recovery",
        "distribution": SleepStageDistribution(
            deep_pct_range=(5, 10),
            rem_pct_range=(20, 25),
            awake_pct_range=(5, 10),
        ),
    },
    "rem_deprived": {
        "label": "REM Deprived",
        "description": "Low REM sleep - poor cognitive recovery",
        "distribution": SleepStageDistribution(
            deep_pct_range=(15, 22),
            rem_pct_range=(8, 13),
            awake_pct_range=(5, 10),
        ),
    },
    "restless": {
        "label": "Restless Sleeper",
        "description": "Excessive wake time - fragmented sleep",
        "distribution": SleepStageDistribution(
            deep_pct_range=(10, 15),
            rem_pct_range=(15, 20),
            awake_pct_range=(15, 25),
        ),
    },
    "athlete_recovery": {
        "label": "Athlete Recovery",
        "description": "Heavy deep sleep - optimal physical recovery",
        "distribution": SleepStageDistribution(
            deep_pct_range=(25, 35),
            rem_pct_range=(20, 25),
            awake_pct_range=(2, 5),
        ),
    },
}


class SleepConfig(BaseModel):
    """Parameters controlling sleep generation."""

    count: int = Field(20, ge=0, le=365)
    duration_min_minutes: int = Field(300, ge=60, le=720)
    duration_max_minutes: int = Field(600, ge=60, le=720)
    nap_chance_pct: int = Field(10, ge=0, le=100)
    weekend_catchup: bool = Field(
        False,
        description="If True, weekday sleep is shorter and weekend sleep is longer.",
    )
    date_range_months: int = Field(6, ge=1, le=24)
    date_from: date | None = Field(None, description="Explicit start date. Overrides date_range_months.")
    date_to: date | None = Field(None, description="Explicit end date. Overrides date_range_months.")
    stage_profile: str | None = Field(
        None,
        description="Named sleep stage profile. None = use stage_distribution.",
    )
    stage_distribution: SleepStageDistribution = SleepStageDistribution()

    @model_validator(mode="after")
    def _validate_ranges(self) -> "SleepConfig":
        if self.duration_min_minutes > self.duration_max_minutes:
            msg = (
                f"duration_min_minutes ({self.duration_min_minutes}) "
                f"must be <= duration_max_minutes ({self.duration_max_minutes})"
            )
            raise ValueError(msg)
        if self.date_from and self.date_to and self.date_from > self.date_to:
            msg = f"date_from ({self.date_from}) must be <= date_to ({self.date_to})"
            raise ValueError(msg)
        if self.stage_profile is not None and self.stage_profile not in SLEEP_STAGE_PROFILES:
            msg = f"Unknown stage_profile '{self.stage_profile}'. Valid profiles: {', '.join(SLEEP_STAGE_PROFILES)}"
            raise ValueError(msg)
        return self


class HealthScoreConfig(BaseModel):
    """Parameters controlling health score generation."""

    categories: list[HealthScoreCategory] = Field(
        default=[HealthScoreCategory.SLEEP, HealthScoreCategory.RECOVERY, HealthScoreCategory.ACTIVITY],
        description="Score categories to generate.",
    )
    score_range: tuple[int, int] = Field((50, 95), description="Value range for generated scores.")
    days: int = Field(30, ge=1, le=365, description="Number of days of score history.")


class PersonaConfig(BaseModel):
    """A named user persona for the clinic_demo preset."""

    first_name: str
    last_name: str
    providers: list[ProviderName]
    workout_types: list[WorkoutType] | None = None
    workout_count: int = 40
    sleep_count: int = 30
    sleep_profile: str = "optimal"
    sleep_duration_min: int = 360
    sleep_duration_max: int = 540
    generate_workouts: bool = True
    generate_sleep: bool = True
    generate_time_series: bool = True
    health_score_config: HealthScoreConfig = HealthScoreConfig()
    activity_level: str = "moderate"  # low, moderate, high
    days_of_data: int = 60
    notes: str = ""  # internal description


class SeedProfileConfig(BaseModel):
    """Complete seed data generation configuration."""

    preset: str | None = None
    generate_workouts: bool = True
    generate_sleep: bool = True
    generate_time_series: bool = True
    providers: list[ProviderName] | None = Field(None, description="Specific providers. None = random selection.")
    num_connections: int = Field(2, ge=1, le=5)
    workout_config: WorkoutConfig = WorkoutConfig()
    sleep_config: SleepConfig = SleepConfig()


class SeedDataRequest(BaseModel):
    """API request to generate seed data."""

    num_users: int = Field(1, ge=1, le=10)
    profile: SeedProfileConfig = SeedProfileConfig()
    random_seed: int | None = Field(
        None,
        description="Seed for reproducible generation. None = random.",
    )


class SeedDataResponse(BaseModel):
    """API response after dispatching seed task."""

    task_id: str
    status: str
    seed_used: int | None = None


class SeedPresetInfo(BaseModel):
    """Preset metadata returned by the presets endpoint."""

    id: str
    label: str
    description: str
    profile: SeedProfileConfig


# ---------------------------------------------------------------------------
# Preset definitions
# ---------------------------------------------------------------------------

SEED_PRESETS: dict[str, dict] = {
    "active_athlete": {
        "label": "Active Athlete",
        "description": "High-volume training across running, cycling, swimming, and strength.",
        "profile": SeedProfileConfig(
            preset="active_athlete",
            generate_workouts=True,
            generate_sleep=True,
            generate_time_series=True,
            workout_config=WorkoutConfig(
                count=120,
                workout_types=[
                    WorkoutType.RUNNING,
                    WorkoutType.CYCLING,
                    WorkoutType.SWIMMING,
                    WorkoutType.STRENGTH_TRAINING,
                ],
                duration_min_minutes=30,
                duration_max_minutes=180,
                hr_min_range=(80, 110),
                hr_max_range=(160, 195),
                steps_range=(2000, 25_000),
                time_series_chance_pct=50,
            ),
            sleep_config=SleepConfig(count=30, stage_profile="athlete_recovery"),
        ),
    },
    "boxer_footballer": {
        "label": "Boxer + Footballer",
        "description": "Combat and team sport focus - boxing, soccer, running. No sleep data.",
        "profile": SeedProfileConfig(
            preset="boxer_footballer",
            generate_workouts=True,
            generate_sleep=False,
            generate_time_series=True,
            workout_config=WorkoutConfig(
                count=100,
                workout_types=[
                    WorkoutType.BOXING,
                    WorkoutType.SOCCER,
                    WorkoutType.RUNNING,
                    WorkoutType.STRENGTH_TRAINING,
                ],
                duration_min_minutes=30,
                duration_max_minutes=120,
                hr_min_range=(85, 115),
                hr_max_range=(155, 190),
                time_series_chance_pct=40,
            ),
        ),
    },
    "sleep_deprived": {
        "label": "Short Sleeper",
        "description": "Consistently short sleep (4-6h), minimal workouts.",
        "profile": SeedProfileConfig(
            preset="sleep_deprived",
            generate_workouts=True,
            generate_sleep=True,
            generate_time_series=True,
            workout_config=WorkoutConfig(count=10, time_series_chance_pct=20),
            sleep_config=SleepConfig(
                count=60,
                duration_min_minutes=240,
                duration_max_minutes=360,
                nap_chance_pct=5,
                stage_profile="deep_deficit",
            ),
        ),
    },
    "weekend_catchup": {
        "label": "Weekend Catch-Up",
        "description": "Short weekday sleep (4-6h), long weekend sleep (8-10h).",
        "profile": SeedProfileConfig(
            preset="weekend_catchup",
            generate_workouts=True,
            generate_sleep=True,
            generate_time_series=True,
            workout_config=WorkoutConfig(count=10, time_series_chance_pct=15),
            sleep_config=SleepConfig(
                count=60,
                duration_min_minutes=240,
                duration_max_minutes=360,
                weekend_catchup=True,
            ),
        ),
    },
    "irregular_sleeper": {
        "label": "Irregular Sleeper",
        "description": "Highly variable sleep times and durations - no consistent pattern.",
        "profile": SeedProfileConfig(
            preset="irregular_sleeper",
            generate_workouts=True,
            generate_sleep=True,
            generate_time_series=True,
            workout_config=WorkoutConfig(count=5, time_series_chance_pct=15),
            sleep_config=SleepConfig(
                count=90,
                duration_min_minutes=180,
                duration_max_minutes=660,
                nap_chance_pct=20,
                stage_profile="restless",
            ),
        ),
    },
    "activity_only": {
        "label": "Activity Only",
        "description": "Workouts and time series only - no sleep records.",
        "profile": SeedProfileConfig(
            preset="activity_only",
            generate_workouts=True,
            generate_sleep=False,
            generate_time_series=True,
            workout_config=WorkoutConfig(count=80),
        ),
    },
    "sleep_only": {
        "label": "Sleep Only",
        "description": "Sleep records only - no workout data.",
        "profile": SeedProfileConfig(
            preset="sleep_only",
            generate_workouts=False,
            generate_sleep=True,
            generate_time_series=False,
            sleep_config=SleepConfig(count=40, stage_profile="optimal"),
        ),
    },
    "minimal": {
        "label": "Minimal (Quick)",
        "description": "Small dataset for quick testing - 5 workouts, 5 sleeps, no time series.",
        "profile": SeedProfileConfig(
            preset="minimal",
            generate_workouts=True,
            generate_sleep=True,
            generate_time_series=False,
            workout_config=WorkoutConfig(count=5),
            sleep_config=SleepConfig(count=5),
        ),
    },
    "comprehensive": {
        "label": "Comprehensive",
        "description": "Large, rich dataset - 150 workouts, 60 sleeps, 5 providers, 80% time series.",
        "profile": SeedProfileConfig(
            preset="comprehensive",
            generate_workouts=True,
            generate_sleep=True,
            generate_time_series=True,
            num_connections=5,
            workout_config=WorkoutConfig(
                count=150,
                time_series_chance_pct=80,
                duration_min_minutes=10,
                duration_max_minutes=240,
            ),
            sleep_config=SleepConfig(count=60),
        ),
    },
    "clinic_demo": {
        "label": "Clinic Demo (18 clients)",
        "description": "18 diverse client personas for longevity clinic / wellness studio demo with health scores.",
        "profile": SeedProfileConfig(
            preset="clinic_demo",
            generate_workouts=True,
            generate_sleep=True,
            generate_time_series=True,
            num_connections=2,
        ),
    },
}

# ---------------------------------------------------------------------------
# Clinic demo — 18 client personas
# ---------------------------------------------------------------------------

CLINIC_DEMO_PERSONAS: list[PersonaConfig] = [
    # --- HIGH PERFORMERS ---
    PersonaConfig(
        first_name="Elena", last_name="Voss",
        providers=[ProviderName.GARMIN, ProviderName.OURA],
        workout_types=[WorkoutType.RUNNING, WorkoutType.CYCLING, WorkoutType.STRENGTH_TRAINING],
        workout_count=60, sleep_count=55, sleep_profile="athlete_recovery",
        sleep_duration_min=420, sleep_duration_max=510,
        health_score_config=HealthScoreConfig(score_range=(78, 98)),
        activity_level="high", days_of_data=60,
        notes="Triathlete. Consistent data, great scores.",
    ),
    PersonaConfig(
        first_name="Marcus", last_name="Chen",
        providers=[ProviderName.WHOOP, ProviderName.GARMIN],
        workout_types=[WorkoutType.RUNNING, WorkoutType.STRENGTH_TRAINING, WorkoutType.YOGA],
        workout_count=50, sleep_count=55, sleep_profile="optimal",
        sleep_duration_min=420, sleep_duration_max=480,
        health_score_config=HealthScoreConfig(score_range=(75, 95)),
        activity_level="high", days_of_data=60,
        notes="Exec with solid habits. Marathon runner.",
    ),
    PersonaConfig(
        first_name="Aisha", last_name="Rahman",
        providers=[ProviderName.APPLE, ProviderName.OURA],
        workout_types=[WorkoutType.YOGA, WorkoutType.PILATES, WorkoutType.WALKING],
        workout_count=45, sleep_count=55, sleep_profile="optimal",
        sleep_duration_min=450, sleep_duration_max=510,
        health_score_config=HealthScoreConfig(score_range=(80, 96)),
        activity_level="moderate", days_of_data=60,
        notes="Wellness enthusiast. Excellent sleep consistency.",
    ),

    # --- MODERATE / IMPROVING ---
    PersonaConfig(
        first_name="James", last_name="O'Brien",
        providers=[ProviderName.GARMIN],
        workout_types=[WorkoutType.STRENGTH_TRAINING, WorkoutType.WALKING, WorkoutType.HIKING],
        workout_count=30, sleep_count=50, sleep_profile="deep_deficit",
        sleep_duration_min=360, sleep_duration_max=450,
        health_score_config=HealthScoreConfig(score_range=(55, 78)),
        activity_level="moderate", days_of_data=60,
        notes="Mid-50s, recovering from back surgery. Sleep needs work.",
    ),
    PersonaConfig(
        first_name="Sofia", last_name="Park",
        providers=[ProviderName.APPLE, ProviderName.GARMIN],
        workout_types=[WorkoutType.RUNNING, WorkoutType.CYCLING, WorkoutType.SWIMMING],
        workout_count=35, sleep_count=45, sleep_profile="optimal",
        sleep_duration_min=390, sleep_duration_max=480,
        health_score_config=HealthScoreConfig(score_range=(65, 85)),
        activity_level="moderate", days_of_data=60,
        notes="New to structured training. Improving steadily.",
    ),
    PersonaConfig(
        first_name="David", last_name="Müller",
        providers=[ProviderName.GARMIN, ProviderName.WHOOP],
        workout_types=[WorkoutType.STRENGTH_TRAINING, WorkoutType.ROWING, WorkoutType.CYCLING],
        workout_count=40, sleep_count=50, sleep_profile="rem_deprived",
        sleep_duration_min=360, sleep_duration_max=480,
        health_score_config=HealthScoreConfig(score_range=(60, 82)),
        activity_level="moderate", days_of_data=60,
        notes="Strong but REM-deprived. Busy schedule.",
    ),
    PersonaConfig(
        first_name="Priya", last_name="Sharma",
        providers=[ProviderName.OURA, ProviderName.APPLE],
        workout_types=[WorkoutType.YOGA, WorkoutType.WALKING, WorkoutType.STRENGTH_TRAINING],
        workout_count=25, sleep_count=55, sleep_profile="optimal",
        sleep_duration_min=420, sleep_duration_max=510,
        health_score_config=HealthScoreConfig(score_range=(70, 90)),
        activity_level="moderate", days_of_data=60,
        notes="Focus on longevity and stress reduction.",
    ),

    # --- NEEDS ATTENTION ---
    PersonaConfig(
        first_name="Maya", last_name="Torres",
        providers=[ProviderName.APPLE],
        workout_types=[WorkoutType.WALKING],
        workout_count=8, sleep_count=50, sleep_profile="restless",
        sleep_duration_min=300, sleep_duration_max=420,
        health_score_config=HealthScoreConfig(score_range=(35, 60)),
        activity_level="low", days_of_data=60,
        notes="No workouts in last 10 days. Fragmented sleep. Needs check-in.",
    ),
    PersonaConfig(
        first_name="Robert", last_name="Kim",
        providers=[ProviderName.GARMIN],
        workout_types=[WorkoutType.STRENGTH_TRAINING, WorkoutType.WALKING],
        workout_count=12, sleep_count=14, sleep_profile="deep_deficit",
        sleep_duration_min=300, sleep_duration_max=390,
        health_score_config=HealthScoreConfig(score_range=(40, 65)),
        activity_level="low", days_of_data=14,
        notes="New client. Only 14 days of data. Short sleeper.",
    ),
    PersonaConfig(
        first_name="Lena", last_name="Johansson",
        providers=[ProviderName.OURA],
        workout_types=[WorkoutType.RUNNING, WorkoutType.YOGA],
        workout_count=20, sleep_count=50, sleep_profile="restless",
        sleep_duration_min=330, sleep_duration_max=420,
        health_score_config=HealthScoreConfig(score_range=(40, 62)),
        activity_level="low", days_of_data=60,
        notes="High stress, poor sleep. Steps dropped 35% this week.",
    ),
    PersonaConfig(
        first_name="Tom", last_name="Jackson",
        providers=[ProviderName.WHOOP],
        workout_types=[WorkoutType.STRENGTH_TRAINING, WorkoutType.BOXING],
        workout_count=45, sleep_count=40, sleep_profile="deep_deficit",
        sleep_duration_min=280, sleep_duration_max=360,
        health_score_config=HealthScoreConfig(score_range=(38, 58)),
        activity_level="high", days_of_data=60,
        notes="Overtraining risk. Very high strain, very poor sleep.",
    ),

    # --- MIXED / INTERESTING PATTERNS ---
    PersonaConfig(
        first_name="Nina", last_name="Petrov",
        providers=[ProviderName.GARMIN, ProviderName.OURA],
        workout_types=[WorkoutType.RUNNING, WorkoutType.SWIMMING, WorkoutType.STRENGTH_TRAINING],
        workout_count=50, sleep_count=55, sleep_profile="athlete_recovery",
        sleep_duration_min=420, sleep_duration_max=510,
        health_score_config=HealthScoreConfig(score_range=(72, 92)),
        activity_level="high", days_of_data=60,
        notes="Competitive swimmer. Good recovery protocol.",
    ),
    PersonaConfig(
        first_name="Alex", last_name="Rivera",
        providers=[ProviderName.APPLE, ProviderName.WHOOP],
        workout_types=[WorkoutType.CYCLING, WorkoutType.RUNNING],
        workout_count=30, sleep_count=45, sleep_profile="restless",
        sleep_duration_min=300, sleep_duration_max=390,
        health_score_config=HealthScoreConfig(score_range=(42, 65)),
        activity_level="moderate", days_of_data=60,
        notes="Sleep below 5h for 3 consecutive nights. Needs alert.",
    ),
    PersonaConfig(
        first_name="Jordan", last_name="Kim",
        providers=[ProviderName.GARMIN],
        workout_types=[WorkoutType.RUNNING, WorkoutType.HIKING, WorkoutType.YOGA],
        workout_count=55, sleep_count=55, sleep_profile="optimal",
        sleep_duration_min=420, sleep_duration_max=480,
        health_score_config=HealthScoreConfig(score_range=(70, 90)),
        activity_level="high", days_of_data=60,
        notes="7-day workout streak. Consistent performer.",
    ),
    PersonaConfig(
        first_name="Sam", last_name="Patel",
        providers=[ProviderName.APPLE, ProviderName.GARMIN],
        workout_types=[WorkoutType.WALKING, WorkoutType.CYCLING],
        workout_count=20, sleep_count=45, sleep_profile="deep_deficit",
        sleep_duration_min=360, sleep_duration_max=420,
        health_score_config=HealthScoreConfig(score_range=(50, 72)),
        activity_level="low", days_of_data=60,
        notes="Daily steps dropped 35% this week. Worth a message.",
    ),
    PersonaConfig(
        first_name="Casey", last_name="Brooks",
        providers=[ProviderName.WHOOP, ProviderName.OURA],
        workout_types=[WorkoutType.STRENGTH_TRAINING, WorkoutType.RUNNING],
        workout_count=15, sleep_count=50, sleep_profile="rem_deprived",
        sleep_duration_min=360, sleep_duration_max=450,
        health_score_config=HealthScoreConfig(score_range=(48, 70)),
        activity_level="low", days_of_data=60,
        notes="No workouts in 10 days. Unusual pattern.",
    ),
    PersonaConfig(
        first_name="Morgan", last_name="Lee",
        providers=[ProviderName.GARMIN],
        workout_types=[WorkoutType.RUNNING, WorkoutType.STRENGTH_TRAINING],
        workout_count=35, sleep_count=40, sleep_profile="optimal",
        sleep_duration_min=390, sleep_duration_max=480,
        health_score_config=HealthScoreConfig(score_range=(65, 85)),
        activity_level="moderate", days_of_data=60,
        notes="Good overall. Device sync gap 48h recently.",
    ),
    PersonaConfig(
        first_name="Ava", last_name="Nakamura",
        providers=[ProviderName.OURA, ProviderName.APPLE],
        workout_types=[WorkoutType.PILATES, WorkoutType.YOGA, WorkoutType.WALKING],
        workout_count=35, sleep_count=55, sleep_profile="optimal",
        sleep_duration_min=450, sleep_duration_max=540,
        health_score_config=HealthScoreConfig(score_range=(76, 94)),
        activity_level="moderate", days_of_data=60,
        notes="Best sleep in the group. Low-impact focus.",
    ),
]
