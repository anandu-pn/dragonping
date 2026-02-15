"""API routes for monitoring status and history."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Service, Check
from app.schemas import CheckResponse, ServiceStats
from app.services.monitoring_service import MonitoringService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/status", tags=["status"])


@router.get("/service/{service_id}", response_model=ServiceStats)
def get_service_status(service_id: int, db: Session = Depends(get_db)):
    """
    Get current status and statistics for a service.

    Args:
        service_id: Service ID
        db: Database session

    Returns:
        Service statistics
    """
    service = db.query(Service).filter(Service.id == service_id).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found"
        )

    stats = MonitoringService.get_service_stats(db, service_id)

    return stats


@router.get("/service/{service_id}/checks", response_model=list[CheckResponse])
def get_service_checks(
    service_id: int, limit: int = 50, db: Session = Depends(get_db)
):
    """
    Get recent checks for a service.

    Args:
        service_id: Service ID
        limit: Maximum number of checks to return
        db: Database session

    Returns:
        List of recent checks
    """
    service = db.query(Service).filter(Service.id == service_id).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found"
        )

    checks = MonitoringService.get_recent_checks(db, service_id, limit)

    return checks


@router.get("/service/{service_id}/logs", response_model=list[CheckResponse])
def get_service_logs(
    service_id: int, limit: int = 50, db: Session = Depends(get_db)
):
    """
    Get service logs (alias for checks).

    Args:
        service_id: Service ID
        limit: Maximum number of logs to return
        db: Database session

    Returns:
        List of recent logs
    """
    service = db.query(Service).filter(Service.id == service_id).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found"
        )

    logs = MonitoringService.get_recent_checks(db, service_id, limit)

    return logs


@router.get("/summary")
def get_all_services_status(db: Session = Depends(get_db)):
    """
    Get status summary for all services.

    Args:
        db: Database session

    Returns:
        Summary of all services
    """
    services = db.query(Service).all()

    services_stats = []

    for service in services:
        stats = MonitoringService.get_service_stats(db, service.id)
        services_stats.append(stats)

    total_services = len(services_stats)
    up_services = sum(1 for s in services_stats if s["status"] == "UP")
    down_services = sum(1 for s in services_stats if s["status"] == "DOWN")

    return {
        "total_services": total_services,
        "up_services": up_services,
        "down_services": down_services,
        "services": services_stats,
    }


@router.get("/all")
def get_overall_status(db: Session = Depends(get_db)):
    """
    Get overall status (alias for summary).

    Args:
        db: Database session

    Returns:
        Overall status summary
    """
    services = db.query(Service).all()

    services_stats = []

    for service in services:
        stats = MonitoringService.get_service_stats(db, service.id)
        services_stats.append(stats)

    total_services = len(services_stats)
    up_services = sum(1 for s in services_stats if s["status"] == "UP")
    down_services = sum(1 for s in services_stats if s["status"] == "DOWN")

    return {
        "total_services": total_services,
        "up": up_services,
        "down": down_services,
        "services": services_stats,
    }
