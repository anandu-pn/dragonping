"""Pydantic schemas for API requests and responses."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, HttpUrl

# ==================== Authentication Schemas ====================

class UserCreate(BaseModel):
    """Schema for user registration."""

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Schema for user response."""

    id: int
    username: Optional[str] = None
    email: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Service Schemas ====================

class ServiceBase(BaseModel):
    """Base schema for service creation/updates."""

    name: str = Field(..., min_length=1, max_length=255)
    url: Optional[HttpUrl] = None
    description: Optional[str] = Field(None, max_length=1024)
    type: str = "website"  # "website" or "device"
    protocol: str = "http"  # "http", "https", "icmp", "tcp"
    ip_address: Optional[str] = None
    port: Optional[int] = Field(None, ge=1, le=65535)
    is_public: bool = False
    interval: int = Field(30, ge=10, le=3600)  # 10 seconds to 1 hour
    active: bool = True
    user_id: Optional[int] = None


class ServiceCreate(ServiceBase):
    """Schema for creating a new service."""

    pass


class ServiceUpdate(BaseModel):
    """Schema for updating a service."""

    name: Optional[str] = None
    url: Optional[HttpUrl] = None
    description: Optional[str] = None
    type: Optional[str] = None
    protocol: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    is_public: Optional[bool] = None
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
    url: Optional[str]
    type: str
    protocol: str
    status: str  # Current status
    uptime_percentage: float  # Percentage of successful checks
    avg_response_time: Optional[float]  # Average response time in ms
    last_check: Optional[datetime]
    last_check_response_time: Optional[float]
    total_checks: int
    failed_checks: int


class AlertLogResponse(BaseModel):
    """Schema for alert log response."""

    id: int
    service_id: int
    alert_type: str
    recipient_email: str
    sent_at: datetime

    class Config:
        from_attributes = True


# ==================== Error Schemas ====================

class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
    code: Optional[str] = None
