"""Background scheduler using APScheduler."""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.services.monitoring_service import MonitoringService

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def scheduled_check_job():
    """Job function to run monitoring checks."""
    db = SessionLocal()
    try:
        # Run in synchronous context - need to use asyncio
        import asyncio
        result = asyncio.run(MonitoringService.run_checks(db))
        logger.info(f"Scheduled check completed: {result}")
    except Exception as e:
        logger.error(f"Error in scheduled check job: {str(e)}")
    finally:
        db.close()


def start_scheduler():
    """Start the background scheduler."""
    if not scheduler.running:
        # Run checks every 30 seconds
        scheduler.add_job(
            scheduled_check_job,
            trigger=IntervalTrigger(seconds=30),
            id="monitoring_job",
            name="Periodic uptime monitoring",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("Scheduler started - monitoring job scheduled every 30 seconds")


def stop_scheduler():
    """Stop the background scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
