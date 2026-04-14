from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ow_api_url: str = "http://localhost:8000"
    ow_api_key: str = ""
    anthropic_api_key: str = ""
    database_url: str = "sqlite+aiosqlite:///./data/coachboard.db"
    anomaly_scan_interval_minutes: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
