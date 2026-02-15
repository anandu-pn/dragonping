"""Background scheduler using APScheduler."""

import logging
import asyncio
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from sqlalchemy import desc
from os import getenv

from app.db import SessionLocal
from app.models import Check, Service, AlertLog
from app.services.monitoring_service import MonitoringService
from app.alerts import send_alerts

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()
ADMIN_EMAIL = getenv("ADMIN_EMAIL")


def get_previous_status(db: Session, service_id: int) -> str:
    """
    Get the previous status of a service (before the latest check).

    Args:
        db: Database session
        service_id: Service ID

    Returns:
        Previous status ("UP" or "DOWN") or "UNKNOWN" if no previous check
    """
    # Get the second-to-last check
    checks = (
        db.query(Check)
        .filter(Check.service_id == service_id)
        .order_by(desc(Check.checked_at))
        .limit(2)
        .all()
    )

    if len(checks) >= 2:
        return checks[1].status
    elif len(checks) == 1:
        return checks[0].status
    else:
        return "UNKNOWN"


async def process_alerts(db: Session):
    """
    Process alerts for any service status changes.

    Args:
        db: Database session
    """
    try:
        # Get all services
        services = db.query(Service).all()

        for service in services:
            # Get latest check
            latest_check = (
                db.query(Check)
                .filter(Check.service_id == service.id)
                .order_by(desc(Check.checked_at))
                .first()
            )

            if not latest_check:
                continue

            # Get previous status
            previous_status = get_previous_status(db, service.id)

            # Check if status changed
            current_status = latest_check.status
            if previous_status != "UNKNOWN" and previous_status != current_status:
                logger.info(
                    f"Status change detected for {service.name}: {previous_status} -> {current_status}"
                )

                # Determine recipients (admin + service creator)
                recipients = [ADMIN_EMAIL] if ADMIN_EMAIL else []

                # Send alerts
                if recipients:
                    sent_count = await send_alerts(
                        service_name=service.name,
                        status=current_status,
                        service_id=service.id,
                        recipients=recipients,
                        error_message=latest_check.error_message,
                    )

                    # Log alert dispatch
                    for recipient in recipients:
                        alert_log = AlertLog(
                            service_id=service.id,
                            alert_type=current_status,
                            recipient_email=recipient,
                        )
                        db.add(alert_log)

                    db.commit()

    except Exception as e:
        logger.error(f"Error processing alerts: {str(e)}")


async def scheduled_check_job_async(db: Session):
    """
    Async job function to run monitoring checks and process alerts.

    Args:
        db: Database session
    """
    try:
        # Run monitoring checks
        result = await MonitoringService.run_checks(db)
        logger.info(f"Scheduled check completed: {result}")

        # Process any alerts for status changes
        await process_alerts(db)

    except Exception as e:
        logger.error(f"Error in scheduled check job: {str(e)}")


def scheduled_check_job():
    """Synchronous wrapper for the async scheduled check job."""
    db = SessionLocal()
    try:
        asyncio.run(scheduled_check_job_async(db))
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
