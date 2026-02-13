"""API routes for service management."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Service
from app.schemas import ServiceCreate, ServiceUpdate, ServiceResponse
from app.services.monitoring_service import MonitoringService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/services", tags=["services"])


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(service: ServiceCreate, db: Session = Depends(get_db)):
    """
    Create a new service to monitor.

    Args:
        service: Service creation data
        db: Database session

    Returns:
        Created service
    """
    # Check if URL already exists
    existing_service = db.query(Service).filter(Service.url == str(service.url)).first()
    if existing_service:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Service with this URL already exists",
        )

    db_service = Service(
        name=service.name,
        url=str(service.url),
        description=service.description,
        interval=service.interval,
        active=service.active,
    )

    db.add(db_service)
    db.commit()
    db.refresh(db_service)

    logger.info(f"Created service: {db_service.name} ({db_service.url})")

    return db_service


@router.get("", response_model=list[ServiceResponse])
def list_services(
    skip: int = 0, limit: int = 100, active_only: bool = False, db: Session = Depends(get_db)
):
    """
    List all services.

    Args:
        skip: Number of services to skip
        limit: Maximum number of services to return
        active_only: Filter to only active services
        db: Database session

    Returns:
        List of services
    """
    query = db.query(Service)

    if active_only:
        query = query.filter(Service.active == True)

    services = query.offset(skip).limit(limit).all()

    return services


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: Session = Depends(get_db)):
    """
    Get a specific service by ID.

    Args:
        service_id: Service ID
        db: Database session

    Returns:
        Service details
    """
    service = db.query(Service).filter(Service.id == service_id).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found"
        )

    return service


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int, service_update: ServiceUpdate, db: Session = Depends(get_db)
):
    """
    Update a service.

    Args:
        service_id: Service ID
        service_update: Updated service data
        db: Database session

    Returns:
        Updated service
    """
    service = db.query(Service).filter(Service.id == service_id).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found"
        )

    # Check if new URL is unique
    if service_update.url and str(service_update.url) != service.url:
        existing_service = (
            db.query(Service).filter(Service.url == str(service_update.url)).first()
        )
        if existing_service:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Service with this URL already exists",
            )

    # Update fields if provided
    if service_update.name is not None:
        service.name = service_update.name
    if service_update.url is not None:
        service.url = str(service_update.url)
    if service_update.description is not None:
        service.description = service_update.description
    if service_update.interval is not None:
        service.interval = service_update.interval
    if service_update.active is not None:
        service.active = service_update.active

    db.commit()
    db.refresh(service)

    logger.info(f"Updated service: {service.name}")

    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: int, db: Session = Depends(get_db)):
    """
    Delete a service.

    Args:
        service_id: Service ID
        db: Database session
    """
    service = db.query(Service).filter(Service.id == service_id).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found"
        )

    db.delete(service)
    db.commit()

    logger.info(f"Deleted service: {service.name}")
