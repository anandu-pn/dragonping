"""SQLAlchemy models for DragonPing monitoring system."""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.db import Base


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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

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
    username = Column(String(50), unique=True, index=True, nullable=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email}, is_admin={self.is_admin})>"


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


class RegisteredAgent(Base):
    """Model for registered monitoring agents."""

    __tablename__ = "registered_agents"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String(255), unique=True, index=True, nullable=False)
    device_label = Column(String(255), nullable=True)
    owner_email = Column(String(255), nullable=False)
    registered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<RegisteredAgent(id={self.id}, hostname={self.hostname}, owner={self.owner_email})>"


class AgentMetric(Base):
    """Model for individual agent telemetry metrics."""

    __tablename__ = "agent_metrics"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String(255), index=True, nullable=False)
    cpu_percent = Column(Float, nullable=False)
    ram_percent = Column(Float, nullable=False)
    ram_used_mb = Column(Integer, nullable=False)
    ram_total_mb = Column(Integer, nullable=False)
    disk_percent = Column(Float, nullable=False)
    disk_used_gb = Column(Integer, nullable=False)
    disk_total_gb = Column(Integer, nullable=False)
    net_rx_bytes = Column(BigInteger, nullable=False)
    net_tx_bytes = Column(BigInteger, nullable=False)
    processes = Column(String, nullable=False)  # JSON String format
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False)

    def __repr__(self):
        return f"<AgentMetric(id={self.id}, hostname={self.hostname})>"


class ServicePrediction(Base):
    """Model for ML-based predictive downtime detection results."""

    __tablename__ = "service_predictions"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False, index=True)
    checked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    risk_level = Column(String(10), nullable=False, default="low")  # "low" / "medium" / "high"
    confidence = Column(Float, nullable=False, default=0.0)  # 0.0 to 1.0
    threshold_flag = Column(Boolean, default=False, nullable=False)
    ewma_flag = Column(Boolean, default=False, nullable=False)
    isolation_flag = Column(Boolean, default=False, nullable=False)
    reason = Column(String(2048), nullable=True)  # Human-readable explanation
    votes = Column(Integer, default=0, nullable=False)  # 0-3, how many methods flagged it

    # Composite index for efficient queries
    __table_args__ = (
        Index("ix_service_predictions_service_id_checked_at", "service_id", "checked_at"),
    )

    # Relationships
    service = relationship("Service")

    def __repr__(self):
        return f"<ServicePrediction(id={self.id}, service_id={self.service_id}, risk={self.risk_level}, votes={self.votes})>"

