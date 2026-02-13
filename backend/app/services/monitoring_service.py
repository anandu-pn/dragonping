"""Monitoring service layer with business logic."""

import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import Service, Check
from app.monitor import check_service

logger = logging.getLogger(__name__)


class MonitoringService:
    """Service for coordinating monitoring operations."""

    @staticmethod
    async def run_checks(db: Session) -> dict:
        """
        Run monitoring checks for all active services.

        Args:
            db: Database session

        Returns:
            Dictionary with results summary
        """
        active_services = db.query(Service).filter(Service.active == True).all()

        if not active_services:
            logger.info("No active services to monitor")
            return {"checked": 0, "successful": 0, "failed": 0}

        checked = 0
        successful = 0
        failed = 0

        for service in active_services:
            try:
                result = await check_service(str(service.url))

                check = Check(
                    service_id=service.id,
                    status=result["status"],
                    status_code=result["status_code"],
                    response_time=result["response_time"],
                    error_message=result["error_message"],
                    checked_at=datetime.utcnow(),
                )

                db.add(check)
                checked += 1

                if result["status"] == "UP":
                    successful += 1
                else:
                    failed += 1
                    logger.warning(
                        f"Service {service.name} ({service.url}) is DOWN: {result['error_message']}"
                    )

            except Exception as e:
                logger.error(f"Error checking service {service.name}: {str(e)}")
                failed += 1

        db.commit()
        logger.info(f"Monitoring completed: {checked} checked, {successful} up, {failed} down")

        return {"checked": checked, "successful": successful, "failed": failed}

    @staticmethod
    def get_service_stats(db: Session, service_id: int) -> dict:
        """
        Get statistics for a specific service.

        Args:
            db: Database session
            service_id: Service ID

        Returns:
            Statistics dictionary
        """
        service = db.query(Service).filter(Service.id == service_id).first()

        if not service:
            return None

        checks = db.query(Check).filter(Check.service_id == service_id).all()

        if not checks:
            return {
                "service_id": service_id,
                "name": service.name,
                "url": str(service.url),
                "status": "UNKNOWN",
                "uptime_percentage": 0,
                "avg_response_time": None,
                "last_check": None,
                "last_check_response_time": None,
                "total_checks": 0,
                "failed_checks": 0,
            }

        total_checks = len(checks)
        failed_checks = sum(1 for c in checks if c.status == "DOWN")
        successful_checks = total_checks - failed_checks
        uptime_percentage = (successful_checks / total_checks * 100) if total_checks > 0 else 0

        response_times = [c.response_time for c in checks if c.response_time is not None]
        avg_response_time = (
            sum(response_times) / len(response_times) if response_times else None
        )

        last_check = checks[-1] if checks else None

        current_status = checks[-1].status if checks else "UNKNOWN"

        return {
            "service_id": service_id,
            "name": service.name,
            "url": str(service.url),
            "status": current_status,
            "uptime_percentage": round(uptime_percentage, 2),
            "avg_response_time": round(avg_response_time, 2) if avg_response_time else None,
            "last_check": last_check.checked_at if last_check else None,
            "last_check_response_time": last_check.response_time if last_check else None,
            "total_checks": total_checks,
            "failed_checks": failed_checks,
        }

    @staticmethod
    def get_recent_checks(db: Session, service_id: int, limit: int = 50) -> list:
        """
        Get recent checks for a service.

        Args:
            db: Database session
            service_id: Service ID
            limit: Number of recent checks to return

        Returns:
            List of recent checks
        """
        return (
            db.query(Check)
            .filter(Check.service_id == service_id)
            .order_by(desc(Check.checked_at))
            .limit(limit)
            .all()
        )
