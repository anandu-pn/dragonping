"""Agent registration and telemetry endpoints."""

import logging
import json
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import jwt
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db import get_db
from app.models import User, RegisteredAgent, AgentMetric
from app.auth import verify_password, get_current_user, JWT_SECRET_KEY, JWT_ALGORITHM
from app.schemas import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent", tags=["agent"])
security = HTTPBearer()

# Schemas
class AgentRegisterRequest(BaseModel):
    username: str
    password: str
    hostname: str
    device_label: Optional[str] = None

class AgentRegisterResponse(BaseModel):
    token: str
    hostname: str
    device_label: Optional[str]
    registered_at: datetime

class AgentHeartbeatRequest(BaseModel):
    hostname: str
    cpu_percent: float
    ram_percent: float
    ram_used_mb: int
    ram_total_mb: int
    disk_percent: float
    disk_used_gb: int
    disk_total_gb: int
    net_rx_bytes: int
    net_tx_bytes: int
    processes: str  # JSON array string

# Dependency to check agent token
def get_current_agent(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "agent":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/register", response_model=AgentRegisterResponse)
def register_agent(request: AgentRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new agent and get a long-lived JWT token.
    Uses the same validation logic as /auth/login.
    """
    # Validate username/password against the users table
    user = db.query(User).filter(
        (User.email == request.username) | (User.username == request.username)
    ).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Generate long-lived JWT token (365 days)
    expire = datetime.now(timezone.utc) + timedelta(days=365)
    payload = {
        "sub": request.username,
        "hostname": request.hostname,
        "type": "agent",
        "exp": int(expire.timestamp()),
        "iat": int(datetime.now(timezone.utc).timestamp()),
    }
    encoded_jwt = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    # Create or update registered_agents row
    agent = db.query(RegisteredAgent).filter(RegisteredAgent.hostname == request.hostname).first()
    if agent:
        agent.device_label = request.device_label or request.hostname
        agent.owner_email = request.username
        agent.is_active = True
    else:
        agent = RegisteredAgent(
            hostname=request.hostname,
            device_label=request.device_label or request.hostname,
            owner_email=request.username,
        )
        db.add(agent)

    db.commit()
    db.refresh(agent)

    return AgentRegisterResponse(
        token=encoded_jwt,
        hostname=agent.hostname,
        device_label=agent.device_label,
        registered_at=agent.registered_at
    )


@router.post("/heartbeat")
def agent_heartbeat(
    request: AgentHeartbeatRequest, 
    db: Session = Depends(get_db), 
    agent_payload: dict = Depends(get_current_agent)
):
    """
    Receive telemetry from an authenticated agent.
    """
    if agent_payload.get("hostname") != request.hostname:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token hostname does not match payload hostname"
        )

    # Update last_seen in RegisteredAgent
    agent = db.query(RegisteredAgent).filter(RegisteredAgent.hostname == request.hostname).first()
    if agent:
        agent.last_seen = datetime.now(timezone.utc)
        agent.is_active = True

    # Save AgentMetric
    metric = AgentMetric(
        hostname=request.hostname,
        cpu_percent=request.cpu_percent,
        ram_percent=request.ram_percent,
        ram_used_mb=request.ram_used_mb,
        ram_total_mb=request.ram_total_mb,
        disk_percent=request.disk_percent,
        disk_used_gb=request.disk_used_gb,
        disk_total_gb=request.disk_total_gb,
        net_rx_bytes=request.net_rx_bytes,
        net_tx_bytes=request.net_tx_bytes,
        processes=request.processes,
    )
    db.add(metric)
    db.commit()

    return {"status": "ok"}


@router.get("/{hostname}/metrics")
def get_agent_metrics(hostname: str, limit: int = 60, db: Session = Depends(get_db)):
    """
    Get the last N metrics for a specific hostname.
    No auth required.
    """
    metrics = (
        db.query(AgentMetric)
        .filter(AgentMetric.hostname == hostname)
        .order_by(desc(AgentMetric.recorded_at))
        .limit(limit)
        .all()
    )
    return metrics


@router.get("/list")
def list_registered_agents(
    db: Session = Depends(get_db), 
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Returns all rows from registered_agents. Secure endpoint matching /auth routes logic.
    """
    agents = db.query(RegisteredAgent).all()
    return agents
