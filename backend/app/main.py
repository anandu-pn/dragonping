"""FastAPI main application setup."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.scheduler import start_scheduler, stop_scheduler
from app.routes import services, status, auth, public_status, alerts

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
    start_scheduler()
    logger.info("Background scheduler started")
    yield

    # Shutdown
    logger.info("Shutting down DragonPing application...")
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
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],  # React dev server
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
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
