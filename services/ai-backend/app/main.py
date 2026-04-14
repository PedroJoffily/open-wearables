"""CoachBoard AI Backend — FastAPI application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.api.routes import recommendations, summary, notes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database initialized.")

    # Start recommendation scan scheduler if API key is configured
    scheduler = None
    if settings.anthropic_api_key:
        try:
            from apscheduler.schedulers.background import BackgroundScheduler
            from app.tasks.recommendation_scan import sync_recommendation_scan

            scheduler = BackgroundScheduler()
            scheduler.add_job(
                sync_recommendation_scan,
                "interval",
                minutes=settings.anomaly_scan_interval_minutes,
                id="recommendation_scan",
            )
            scheduler.start()
            logger.info(
                f"Recommendation scan scheduler started (every {settings.anomaly_scan_interval_minutes}min)"
            )
        except Exception as e:
            logger.warning(f"Failed to start scheduler: {e}")
    else:
        logger.warning("ANTHROPIC_API_KEY not set — recommendation scan disabled")

    yield

    # Shutdown
    if scheduler:
        scheduler.shutdown()
        logger.info("Scheduler shut down.")


app = FastAPI(
    title="CoachBoard AI",
    description="AI backend for coaching dashboard — recommendations, health summaries, coaching notes",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(recommendations.router)
app.include_router(summary.router)
app.include_router(notes.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "coachboard-ai"}
