"""Monitoring service layer with business logic."""

import logging
import socket
import ssl
from datetime import datetime, timezone
from urllib.parse import urlparse

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.alerts import send_alerts
from app.models import AlertLog, Check, Service, User
from app.monitor import check_service

logger = logging.getLogger(__name__)

def check_cert_expiry(hostname: str) -> dict:
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(
            socket.socket(), server_hostname=hostname
        ) as s:
            s.settimeout(5)
            s.connect((hostname, 443))
            cert = s.getpeercert()
            expiry = datetime.strptime(
                cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
            days_left = (expiry - datetime.utcnow()).days
            return {"days_left": days_left, "error": None}
    except Exception as e:
        return {"days_left": None, "error": str(e)}



class MonitoringService:
    """Service for coordinating monitoring operations."""

    @staticmethod
    async def run_checks(db: Session) -> dict:
        """
        Run monitoring checks for all active services and devices.

        Args:
            db: Database session

        Returns:
            Dictionary with results summary
        """
        active_services = db.query(Service).filter(Service.active).all()

        if not active_services:
            logger.info("No active services to monitor")
            return {"checked": 0, "successful": 0, "failed": 0}

        checked = 0
        successful = 0
        failed = 0

        for service in active_services:
            try:
                # Call dispatcher with appropriate parameters based on service type
                result = await check_service(
                    service_type=service.type,
                    protocol=service.protocol,
                    url=service.url,
                    ip_address=service.ip_address,
                    port=service.port,
                )

                cert_expiry_days = None
                if service.protocol == "https" and service.url:
                    parsed = urlparse(service.url)
                    hostname = parsed.hostname
                    if hostname:
                        cert_info = check_cert_expiry(hostname)
                        cert_expiry_days = cert_info.get("days_left")

                        if cert_expiry_days is not None and cert_expiry_days < 30:
                            last_cert_alert = (
                                db.query(AlertLog)
                                .filter(AlertLog.service_id == service.id, AlertLog.alert_type == "CERT_EXPIRY")
                                .order_by(AlertLog.sent_at.desc())
                                .first()
                            )
                            if not last_cert_alert or (datetime.now(timezone.utc) - last_cert_alert.sent_at).days >= 1:
                                admins = db.query(User).filter(User.is_admin).all()
                                recipients = [a.email for a in admins if a.email]
                                reason = f"SSL certificate expires in {cert_expiry_days} days"
                                try:
                                    if recipients:
                                        await send_alerts(
                                            service_name=service.name,
                                            status="CERT_EXPIRY",
                                            service_id=service.id,
                                            recipients=recipients,
                                            error_message=reason,
                                        )
                                        for r in recipients:
                                            alert_log = AlertLog(
                                                service_id=service.id,
                                                alert_type="CERT_EXPIRY",
                                                recipient_email=r,
                                            )
                                            db.add(alert_log)
                                        db.flush()
                                except Exception as e:
                                    logger.error(f"Error sending CERT_EXPIRY alerts for {service.id}: {e}")

                check = Check(
                    service_id=service.id,
                    status=result["status"],
                    status_code=result["status_code"],
                    response_time=result["response_time"],
                    cert_expiry_days=cert_expiry_days,
                    error_message=result["error_message"],
                    checked_at=datetime.now(timezone.utc),
                )

                db.add(check)
                # Flush so the check exists in the session for subsequent queries
                db.flush()
                checked += 1

                if result["status"] == "UP":
                    successful += 1
                else:
                    failed += 1
                    logger.warning(
                        f"Service {service.name} (type={service.type}, protocol={service.protocol}) is DOWN: {result['error_message']}"
                    )

                    # Check for 5 consecutive DOWN checks (including this one)
                    recent_checks = (
                        db.query(Check)
                        .filter(Check.service_id == service.id)
                        .order_by(Check.checked_at.desc())
                        .limit(5)
                        .all()
                    )

                    if len(recent_checks) == 5 and all(c.status == "DOWN" for c in recent_checks):
                        # Determine if we've already sent a DOWN alert for this sequence
                        oldest_checked_at = recent_checks[-1].checked_at
                        recent_alert = (
                            db.query(AlertLog)
                            .filter(AlertLog.service_id == service.id, AlertLog.alert_type == "DOWN")
                            .order_by(AlertLog.sent_at.desc())
                            .first()
                        )

                        already_alerted = False
                        if recent_alert and recent_alert.sent_at >= oldest_checked_at:
                            already_alerted = True

                        if not already_alerted:
                            # Get admin recipient emails
                            admins = db.query(User).filter(User.is_admin).all()
                            recipients = [a.email for a in admins if a.email]

                            # Fire alert emails asynchronously
                            try:
                                if recipients:
                                    await send_alerts(
                                        service_name=service.name,
                                        status="DOWN",
                                        service_id=service.id,
                                        recipients=recipients,
                                        error_message=result.get("error_message"),
                                    )

                                    # Record alert logs per recipient
                                    for r in recipients:
                                        alert_log = AlertLog(
                                            service_id=service.id,
                                            alert_type="DOWN",
                                            recipient_email=r,
                                        )
                                        db.add(alert_log)
                                    # flush logs so they are persisted on commit
                                    db.flush()
                            except Exception as e:
                                logger.error(f"Error sending DOWN alerts for service {service.id}: {e}")

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
                "url": service.url,
                "ip_address": service.ip_address,
                "type": service.type,
                "protocol": service.protocol,
                "status": "UNKNOWN",
                "cert_expiry_days": None,
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
            "url": service.url,
            "ip_address": service.ip_address,
            "type": service.type,
            "protocol": service.protocol,
            "status": current_status,
            "cert_expiry_days": last_check.cert_expiry_days if last_check else None,
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
