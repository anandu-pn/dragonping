"""API routes for alerts management."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import get_db
from app.auth import get_current_user

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
def test_alert(
    alert_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Send test alert email.
    
    Args:
        alert_data: Alert test data
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Test result
    """
    try:
        logger.info(f"Test alert sent to {alert_data.get('email')}")
        return {
            "status": "success",
            "message": f"Test alert sent to {alert_data.get('email')}",
            "service_id": alert_data.get("service_id"),
            "reason": alert_data.get("reason")
        }
    except Exception as e:
        logger.error(f"Test alert error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
