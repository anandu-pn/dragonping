"""SQLAlchemy models for DragonPing monitoring system."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db import Base


class Service(Base):
    """Model for monitored services/websites."""

    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    url = Column(String(2048), nullable=False, unique=True)
    description = Column(String(1024), nullable=True)
    interval = Column(Integer, default=30, nullable=False)  # Check interval in seconds
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    checks = relationship("Check", back_populates="service", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Service(id={self.id}, name={self.name}, url={self.url})>"


class Check(Base):
    """Model for individual uptime checks and response time measurements."""

    __tablename__ = "checks"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False, index=True)
    status = Column(String(10), nullable=False)  # "UP" or "DOWN"
    status_code = Column(Integer, nullable=True)  # HTTP status code
    response_time = Column(Float, nullable=True)  # Response time in milliseconds
    error_message = Column(String(1024), nullable=True)  # Error details if failed
    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Foreign key index for better query performance
    __table_args__ = (
        Index("ix_checks_service_id_checked_at", "service_id", "checked_at"),
    )

    # Relationships
    service = relationship("Service", back_populates="checks")

    def __repr__(self):
        return f"<Check(id={self.id}, service_id={self.service_id}, status={self.status}, response_time={self.response_time})>"
