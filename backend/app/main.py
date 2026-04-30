"""FastAPI main application setup."""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db import init_db
from app.routes import agent, alerts, auth, predictions, public_status, services, status

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application startup and shutdown events.

    Args:
        app: FastAPI application instance
    """
    # Startup
    logger.info("Starting DragonPing application...")
    init_db()
    logger.info("Database initialized")

    if os.getenv("ENVIRONMENT") != "test":
        from app.scheduler import start_scheduler, stop_scheduler
        start_scheduler()
        logger.info("Background scheduler started")

    yield

    # Shutdown
    logger.info("Shutting down DragonPing application...")
    if os.getenv("ENVIRONMENT") != "test":
        from app.scheduler import stop_scheduler
        stop_scheduler()
        logger.info("Background scheduler stopped")


# Initialize FastAPI application
app = FastAPI(
    title="DragonPing",
    description="Website uptime monitoring system",
    version="0.2.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(public_status.router)
app.include_router(services.router)
app.include_router(status.router)
app.include_router(alerts.router)
app.include_router(agent.router)
app.include_router(predictions.router)

# Serve static files (e.g. dragonping-agent.sh)
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
# Create static directoy if it doesn't exist
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", tags=["root"])
def read_root():
    """Root endpoint."""
    return {
        "message": "Welcome to DragonPing",
        "docs": "/docs",
        "version": "0.2.0",
    }


@app.get("/health", tags=["health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
