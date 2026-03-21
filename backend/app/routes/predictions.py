"""Prediction API endpoints for predictive downtime detection."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.db import get_db
from app.models import ServicePrediction, Service

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.get("/summary")
def get_predictions_summary(db: Session = Depends(get_db)):
    """Get the most recent prediction for each service.

    Returns one row per service with its latest risk assessment.
    No authentication required.
    """
    # Subquery: latest prediction id per service
    latest_subq = (
        db.query(
            ServicePrediction.service_id,
            func.max(ServicePrediction.id).label("max_id"),
        )
        .group_by(ServicePrediction.service_id)
        .subquery()
    )

    # Join to get full prediction rows + service name
    results = (
        db.query(ServicePrediction, Service.name)
        .join(latest_subq, ServicePrediction.id == latest_subq.c.max_id)
        .join(Service, Service.id == ServicePrediction.service_id)
        .all()
    )

    summary = []
    for pred, service_name in results:
        summary.append({
            "service_id": pred.service_id,
            "service_name": service_name,
            "risk_level": pred.risk_level,
            "confidence": pred.confidence,
            "votes": pred.votes,
            "threshold_flag": pred.threshold_flag,
            "ewma_flag": pred.ewma_flag,
            "isolation_flag": pred.isolation_flag,
            "reason": pred.reason,
            "checked_at": pred.checked_at.isoformat() if pred.checked_at else None,
        })

    return summary


@router.get("/{service_id}")
def get_service_predictions(service_id: int, limit: int = 20, db: Session = Depends(get_db)):
    """Get the last N predictions for a specific service.

    No authentication required.
    """
    predictions = (
        db.query(ServicePrediction)
        .filter(ServicePrediction.service_id == service_id)
        .order_by(desc(ServicePrediction.checked_at))
        .limit(limit)
        .all()
    )

    return [
        {
            "id": p.id,
            "service_id": p.service_id,
            "risk_level": p.risk_level,
            "confidence": p.confidence,
            "votes": p.votes,
            "threshold_flag": p.threshold_flag,
            "ewma_flag": p.ewma_flag,
            "isolation_flag": p.isolation_flag,
            "reason": p.reason,
            "checked_at": p.checked_at.isoformat() if p.checked_at else None,
        }
        for p in predictions
    ]
