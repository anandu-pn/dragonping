"""API routes for alerts management."""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import get_db
from app.auth import get_current_user
from app.alerts import send_alert_email, validate_smtp_config

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.post("")
def create_alert(
    alert_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Create email alert for service status changes.

    Args:
        alert_data: Alert configuration
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created alert
    """
    try:
        # Store alert configuration in database or memory
        alert = {
            "service_id": alert_data.get("service_id"),
            "email": alert_data.get("email"),
            "alert_on": alert_data.get("alert_on", ["down"]),
            "alert_threshold": alert_data.get("alert_threshold", 2000),
            "id": 1  # Simplified for now
        }
        logger.info(f"Alert created for service {alert['service_id']}: {alert['email']}")
        return alert
    except Exception as e:
        logger.error(f"Alert creation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("")
def list_alerts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    List all alerts.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of alerts
    """
    try:
        # Return sample alerts for now
        alerts = [
            {
                "id": 1,
                "service_id": 1,
                "email": "admin@example.com",
                "alert_on": ["down"],
                "alert_threshold": 2000
            }
        ]
        return alerts
    except Exception as e:
        logger.error(f"Error fetching alerts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/test")
async def test_alert(
    alert_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Send test alert email. Actually calls the SMTP send function
    and returns success/failure with details.

    Args:
        alert_data: Alert test data (requires 'email' field)
        db: Database session
        current_user: Current authenticated user

    Returns:
        Test result with status and error details if failed
    """
    recipient = alert_data.get("email")
    service_name = alert_data.get("service_name", "Test Service")
    service_id = alert_data.get("service_id", 0)
    reason = alert_data.get("reason", "Manual test alert")

    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required field: 'email'",
        )

    # Check SMTP config before attempting send
    smtp_status = validate_smtp_config()
    if not smtp_status["configured"]:
        return {
            "status": "error",
            "message": (
                f"SMTP is not configured. Missing environment variables: "
                f"{', '.join(smtp_status['missing'])}. "
                "Set these in your .env or environment before sending emails."
            ),
            "missing_config": smtp_status["missing"],
        }

    # Actually attempt to send the test email
    try:
        logger.info(f"Sending test alert email to {recipient}")
        success = await send_alert_email(
            recipient=recipient,
            service_name=service_name,
            status="DOWN",
            timestamp=datetime.now(timezone.utc),
            service_id=service_id,
            error_message=f"Test alert: {reason}",
        )

        if success:
            return {
                "status": "success",
                "message": f"Test alert email sent successfully to {recipient}",
                "service_id": service_id,
                "reason": reason,
            }
        else:
            return {
                "status": "error",
                "message": (
                    f"Failed to send test alert email to {recipient}. "
                    "Check server logs for detailed SMTP error."
                ),
                "service_id": service_id,
                "reason": reason,
            }

    except Exception as e:
        logger.error(f"Test alert error: {type(e).__name__}: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to send test alert: {type(e).__name__}: {str(e)}",
            "service_id": service_id,
            "reason": reason,
        }
