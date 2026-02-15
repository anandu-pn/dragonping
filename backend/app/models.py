"""SQLAlchemy models for DragonPing monitoring system."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Index, Enum
from sqlalchemy.orm import relationship
from app.db import Base
import enum


class ServiceType(str, enum.Enum):
    """Service type enumeration."""

    WEBSITE = "website"
    DEVICE = "device"


class ProtocolType(str, enum.Enum):
    """Protocol type enumeration."""

    HTTP = "http"
    HTTPS = "https"
    ICMP = "icmp"
    TCP = "tcp"


class Service(Base):
    """Model for monitored services/websites and network devices."""

    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    url = Column(String(2048), nullable=True, unique=True)  # Optional for devices
    description = Column(String(1024), nullable=True)
    type = Column(Enum(ServiceType), default=ServiceType.WEBSITE, nullable=False)  # website or device
    protocol = Column(Enum(ProtocolType), default=ProtocolType.HTTP, nullable=False)  # http/https/icmp/tcp
    ip_address = Column(String(45), nullable=True)  # For devices and TCP checks (IPv4 or IPv6)
    port = Column(Integer, nullable=True)  # For TCP checks
    is_public = Column(Boolean, default=False, nullable=False)  # Visible on public dashboard
    interval = Column(Integer, default=30, nullable=False)  # Check interval in seconds
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    checks = relationship("Check", back_populates="service", cascade="all, delete-orphan")
    alerts = relationship("AlertLog", back_populates="service", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Service(id={self.id}, name={self.name}, type={self.type}, protocol={self.protocol})>"


class Check(Base):
    """Model for individual uptime checks and response time measurements."""

    __tablename__ = "checks"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False, index=True)
    status = Column(String(10), nullable=False)  # "UP" or "DOWN"
    status_code = Column(Integer, nullable=True)  # HTTP status code
    response_time = Column(Float, nullable=True)  # Response time in milliseconds
    error_message = Column(String(1024), nullable=True)  # Error details if failed
    checked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Foreign key index for better query performance
    __table_args__ = (
        Index("ix_checks_service_id_checked_at", "service_id", "checked_at"),
    )

    # Relationships
    service = relationship("Service", back_populates="checks")

    def __repr__(self):
        return f"<Check(id={self.id}, service_id={self.service_id}, status={self.status}, response_time={self.response_time})>"


class User(Base):
    """Model for user accounts and authentication."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, is_admin={self.is_admin})>"


class AlertLog(Base):
    """Model for alert logs when services/devices go down."""

    __tablename__ = "alert_logs"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False, index=True)
    alert_type = Column(String(20), nullable=False)  # "DOWN", "UP", etc.
    recipient_email = Column(String(255), nullable=False)
    sent_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Composite index for efficient queries
    __table_args__ = (
        Index("ix_alert_logs_service_id_sent_at", "service_id", "sent_at"),
    )

    # Relationships
    service = relationship("Service", back_populates="alerts")

    def __repr__(self):
        return f"<AlertLog(id={self.id}, service_id={self.service_id}, alert_type={self.alert_type})>"
