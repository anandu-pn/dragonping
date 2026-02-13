"""Pydantic schemas for API requests and responses."""

from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional


# ==================== Service Schemas ====================

class ServiceBase(BaseModel):
    """Base schema for service creation/updates."""

    name: str = Field(..., min_length=1, max_length=255)
    url: HttpUrl
    description: Optional[str] = Field(None, max_length=1024)
    interval: int = Field(30, ge=10, le=3600)  # 10 seconds to 1 hour
    active: bool = True


class ServiceCreate(ServiceBase):
    """Schema for creating a new service."""

    pass


class ServiceUpdate(BaseModel):
    """Schema for updating a service."""

    name: Optional[str] = None
    url: Optional[HttpUrl] = None
    description: Optional[str] = None
    interval: Optional[int] = None
    active: Optional[bool] = None


class ServiceResponse(ServiceBase):
    """Schema for service response with additional metadata."""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Check Schemas ====================

class CheckResponse(BaseModel):
    """Schema for check/monitoring response."""

    id: int
    service_id: int
    status: str  # "UP" or "DOWN"
    status_code: Optional[int]
    response_time: Optional[float]  # milliseconds
    error_message: Optional[str]
    checked_at: datetime

    class Config:
        from_attributes = True


class ServiceWithChecks(ServiceResponse):
    """Service with recent check history."""

    checks: List[CheckResponse] = []


class ServiceStats(BaseModel):
    """Service statistics."""

    service_id: int
    name: str
    url: str
    status: str  # Current status
    uptime_percentage: float  # Percentage of successful checks
    avg_response_time: Optional[float]  # Average response time in ms
    last_check: Optional[datetime]
    last_check_response_time: Optional[float]
    total_checks: int
    failed_checks: int


# ==================== Error Schemas ====================

class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
    code: Optional[str] = None
