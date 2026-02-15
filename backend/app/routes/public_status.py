"""Public API routes for service status monitoring without authentication."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Service
from app.schemas import ServiceStats
from app.services.monitoring_service import MonitoringService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/status", response_model=dict)
def get_public_services_status(service_id: int = None, db: Session = Depends(get_db)):
    """
    Get public service status without authentication.

    Endpoint is accessible to anyone and returns only services marked as is_public=true.

    Args:
        service_id: Optional service ID to get specific service details
        db: Database session

    Returns:
        Dictionary with public services and their status
    """
    if service_id:
        # Get specific service if provided and it's public
        service = db.query(Service).filter(
            Service.id == service_id,
            Service.is_public == True
        ).first()

        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found or not public",
            )

        stats = MonitoringService.get_service_stats(db, service_id)
        return {
            "service": stats,
        }

    else:
        # Get all public services
        public_services = db.query(Service).filter(Service.is_public == True).all()

        services_stats = []
        for service in public_services:
            stats = MonitoringService.get_service_stats(db, service.id)
            services_stats.append(stats)

        # Calculate summary
        total_services = len(services_stats)
        up_services = sum(1 for s in services_stats if s["status"] == "UP")
        down_services = sum(1 for s in services_stats if s["status"] == "DOWN")

        return {
            "summary": {
                "total_services": total_services,
                "up_services": up_services,
                "down_services": down_services,
            },
            "services": services_stats,
        }


@router.get("/status/health")
def public_health_check(db: Session = Depends(get_db)):
    """
    Simple public health check endpoint.

    Returns:
        Status information
    """
    public_services_count = db.query(Service).filter(Service.is_public == True).count()

    return {
        "status": "healthy",
        "public_services": public_services_count,
    }
