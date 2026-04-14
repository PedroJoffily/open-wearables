"""Client for the Open Wearables API."""

from datetime import date, timedelta
from typing import Any

import httpx

from app.config import settings


class OWClient:
    """Typed HTTP client for Open Wearables REST API."""

    def __init__(self):
        self._base_url = settings.ow_api_url.rstrip("/")
        self._headers = {"X-Open-Wearables-API-Key": settings.ow_api_key}

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=self._base_url,
            headers=self._headers,
            timeout=30.0,
        )

    async def get_users(self) -> list[dict[str, Any]]:
        async with self._client() as client:
            resp = await client.get("/api/v1/users", params={"limit": 100})
            resp.raise_for_status()
            data = resp.json()
            return data.get("items", data) if isinstance(data, dict) else data

    async def get_user(self, user_id: str) -> dict[str, Any]:
        async with self._client() as client:
            resp = await client.get(f"/api/v1/users/{user_id}")
            resp.raise_for_status()
            return resp.json()

    async def get_activity_summary(
        self, user_id: str, date_from: date | None = None, date_to: date | None = None
    ) -> list[dict[str, Any]]:
        date_to = date_to or date.today()
        date_from = date_from or (date_to - timedelta(days=7))
        async with self._client() as client:
            resp = await client.get(
                f"/api/v1/users/{user_id}/summaries/activity",
                params={"start_date": str(date_from), "end_date": str(date_to)},
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data

    async def get_sleep_summary(
        self, user_id: str, date_from: date | None = None, date_to: date | None = None
    ) -> list[dict[str, Any]]:
        date_to = date_to or date.today()
        date_from = date_from or (date_to - timedelta(days=7))
        async with self._client() as client:
            resp = await client.get(
                f"/api/v1/users/{user_id}/summaries/sleep",
                params={"start_date": str(date_from), "end_date": str(date_to)},
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data

    async def get_body_summary(self, user_id: str) -> dict[str, Any] | None:
        async with self._client() as client:
            resp = await client.get(f"/api/v1/users/{user_id}/summaries/body")
            if resp.status_code == 204:
                return None
            resp.raise_for_status()
            return resp.json()

    async def get_workouts(
        self, user_id: str, date_from: date | None = None, date_to: date | None = None
    ) -> list[dict[str, Any]]:
        date_to = date_to or date.today()
        date_from = date_from or (date_to - timedelta(days=7))
        async with self._client() as client:
            resp = await client.get(
                f"/api/v1/users/{user_id}/events/workouts",
                params={"start_date": str(date_from), "end_date": str(date_to)},
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data

    async def get_connections(self, user_id: str) -> list[dict[str, Any]]:
        async with self._client() as client:
            resp = await client.get(f"/api/v1/users/{user_id}/providers")
            resp.raise_for_status()
            data = resp.json()
            return data if isinstance(data, list) else data.get("data", [])


ow_client = OWClient()
