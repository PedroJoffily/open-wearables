#!/usr/bin/env python3
"""Seed default agent API key if it doesn't exist."""

from app.config import settings
from app.database import SessionLocal
from app.schemas.model_crud.credentials import ApiKeyCreate
from app.services.api_key_service import api_key_service


def seed_agent_api_key() -> None:
    """Create default agent API key if it doesn't exist."""
    with SessionLocal() as db:
        if api_key_service.get(db, settings.agent_api_key):
            print("Agent API key already exists, skipping.")
            return

        api_key_service.create(db, ApiKeyCreate(id=settings.agent_api_key, name="Agent (internal)"))
        print(f"✓ Created agent API key: {settings.agent_api_key[:12]}...")


if __name__ == "__main__":
    seed_agent_api_key()
