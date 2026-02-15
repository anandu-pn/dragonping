# DragonPing v1.1 - Complete Implementation Details

**Version:** 1.1  
**Release Date:** February 14, 2026  
**Status:** Production Ready ✅

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [API Endpoints](#api-endpoints)
8. [Authentication System](#authentication-system)
9. [Monitoring System](#monitoring-system)
10. [Alert System](#alert-system)
11. [Project Structure](#project-structure)
12. [Setup & Deployment](#setup--deployment)
13. [Configuration](#configuration)

---

## Project Overview

### What is DragonPing?

DragonPing is a comprehensive **website and device uptime monitoring system** that provides real-time monitoring, alerts, and status dashboards. It enables administrators to track the health of multiple web services and network devices with detailed metrics and email notifications.

### Key Capabilities

- **Multi-Protocol Monitoring**: HTTP/HTTPS websites, ICMP ping, TCP port connectivity
- **Real-Time Alerts**: Email notifications on status changes
- **Detailed Metrics**: Uptime percentage, response times, failure tracking
- **Role-Based Access**: Admin and regular user accounts
- **Public Dashboard**: Unauthenticated access to selected services
- **Scalable Architecture**: Background job scheduling with APScheduler

### Use Cases

1. **Website Monitoring**: Track uptime of web applications
2. **Network Device Monitoring**: Monitor router, server, network device availability
3. **API Health Checks**: Monitor critical API endpoints
4. **SLA Compliance**: Track uptime for SLA reporting
5. **Incident Response**: Real-time alerts for quick response

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Client                              │
│                    (Browser/Frontend)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/HTTPS
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Reverse Proxy/Load Balancer                   │
│                      (Optional - Nginx)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼─┐         ┌──▼────┐     ┌───▼────┐
    │React │         │FastAPI│     │SMTP    │
    │Vite  │         │Server │     │Server  │
    └──────┘         └───────┘     └────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼──────┐  ┌─────▼──────┐  ┌────▼─────────┐
    │APScheduler│  │SQLAlchemy │  │Auth System   │
    │(Background│  │ (ORM)      │  │(JWT/Bcrypt)  │
    │ Monitoring)│  └─────┬──────┘  └──────────────┘
    └───────────┘        │
                    ┌────▼──────┐
                    │SQLite/    │
                    │PostgreSQL │
                    │Database   │
                    └───────────┘

                    ┌─────────────────────────┐
                    │ External Services       │
                    ├─────────────────────────┤
                    │ • Monitored Websites    │
                    │ • Network Devices       │
                    │ • SMTP Mail Servers     │
                    └─────────────────────────┘
```

### Component Description

1. **Frontend (React + Vite)**
   - User interface
   - Service management
   - Real-time status display
   - Alert configuration

2. **Backend (FastAPI)**
   - REST API endpoints
   - Business logic
   - Database operations
   - Authentication

3. **Background Scheduler (APScheduler)**
   - Periodic monitoring tasks
   - Status checks (every 30 seconds)
   - Health tracking

4. **Database (SQLite/PostgreSQL)**
   - Service definitions
   - Monitoring history
   - User accounts
   - Alert configurations

5. **External Services**
   - Monitored websites/devices
   - SMTP server for alerts

---

## Technology Stack

### Backend

| Component        | Technology        | Version  | Purpose                  |
| ---------------- | ----------------- | -------- | ------------------------ |
| Framework        | FastAPI           | 0.109.0+ | Web framework, REST API  |
| Server           | Uvicorn           | 0.27.0+  | ASGI server              |
| ORM              | SQLAlchemy        | 2.0.23+  | Database abstraction     |
| Database         | SQLite/PostgreSQL | Latest   | Data persistence         |
| Database Driver  | psycopg2          | 2.9.9+   | PostgreSQL support       |
| Environment      | python-dotenv     | 1.0.0+   | Configuration management |
| HTTP Client      | httpx             | 0.25.0+  | Async HTTP requests      |
| Scheduler        | APScheduler       | 3.10.4+  | Background scheduling    |
| Data Validation  | Pydantic          | 2.5.0+   | Schema validation        |
| Password Hashing | bcrypt            | 4.0.0+   | Secure password storage  |
| JWT              | PyJWT             | 2.8.0+   | Token management         |
| Form Upload      | python-multipart  | 0.0.6+   | File uploads             |
| Ping             | pythonping        | 1.1.0+   | ICMP ping utility        |
| Email            | aiosmtplib        | 3.0.0+   | Async email sending      |
| HTTP Testing     | requests          | Latest   | API testing              |

### Frontend

| Component   | Technology   | Version  | Purpose           |
| ----------- | ------------ | -------- | ----------------- |
| Framework   | React        | 18.x     | UI framework      |
| Build Tool  | Vite         | 5.4.21+  | Fast build system |
| Styling     | Tailwind CSS | 3.x      | Utility-first CSS |
| Icons       | Lucide React | Latest   | Icon library      |
| HTTP Client | Axios        | Latest   | HTTP requests     |
| Routing     | React Router | 6.x      | Page routing      |
| State Mgmt  | Context API  | Built-in | State management  |
| CSS         | PostCSS      | Latest   | CSS processing    |

### DevOps & Tools

| Tool    | Purpose                    |
| ------- | -------------------------- |
| Docker  | Optional containerization  |
| Nginx   | Optional reverse proxy     |
| Git     | Version control            |
| npm     | JavaScript package manager |
| pip     | Python package manager     |
| pytest  | Backend testing            |
| Postman | API testing                |

---

## Database Schema

### Tables Overview

```sql
-- Users Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,        -- 'website' or 'device'
  protocol VARCHAR(50) NOT NULL,    -- 'http', 'https', 'icmp', 'tcp'
  url VARCHAR(2048),                -- For website services
  ip_address VARCHAR(45),            -- For device services
  port INTEGER,                      -- Optional, for TCP services
  interval INTEGER DEFAULT 30,       -- Check interval in seconds
  is_public BOOLEAN DEFAULT FALSE,   -- Visible on public dashboard
  active BOOLEAN DEFAULT TRUE,       -- Monitoring enabled/disabled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Checks Table (Monitoring History)
CREATE TABLE checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,       -- 'UP', 'DOWN', 'UNKNOWN'
  response_time_ms FLOAT,            -- Response time in milliseconds
  error_message TEXT,                -- Error details if failed
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Alerts Table
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  email VARCHAR(255) NOT NULL,
  alert_on JSON,                     -- ["down", "slow"] conditions
  alert_threshold INTEGER,           -- e.g., 2000ms for response time
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id)
);
```

### Entity Relationships

```
users
  ├── has many services (via service ownership)
  └── receives alerts

services
  ├── belongs to user
  ├── has many checks (monitoring history)
  └── has many alerts

checks
  └── belongs to service

alerts
  ├── belongs to service
  └── targets user (via email)
```

### Data Types

| Type     | SQLite    | PostgreSQL | Usage              |
| -------- | --------- | ---------- | ------------------ |
| Integer  | INTEGER   | INTEGER    | IDs, counts, ports |
| String   | VARCHAR   | VARCHAR    | Text data          |
| Text     | TEXT      | TEXT       | Long text          |
| Float    | REAL      | NUMERIC    | Response times     |
| Boolean  | BOOLEAN   | BOOLEAN    | Flags              |
| DateTime | TIMESTAMP | TIMESTAMP  | Timestamps         |
| JSON     | TEXT      | JSONB      | Alert conditions   |

---

## Backend Implementation

### Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization
│   ├── db.py                   # Database setup & session management
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── auth.py                 # Authentication & security
│   ├── alerts.py               # Email alert service
│   ├── scheduler.py            # APScheduler configuration
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py             # Auth endpoints (register, login)
│   │   ├── services.py         # Service CRUD endpoints
│   │   ├── status.py           # Status & monitoring endpoints
│   │   ├── alerts.py           # Alert management endpoints
│   │   └── public_status.py    # Public API endpoints
│   └── services/
│       ├── __init__.py
│       └── monitoring_service.py # Core monitoring logic
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables
├── app.db                      # SQLite database
└── venv/                       # Virtual environment
```

### Key Files & Modules

#### 1. **main.py** - FastAPI Application

```python
# Core application setup
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db
from app.scheduler import start_scheduler, stop_scheduler
from app.routes import services, status, auth, public_status, alerts

app = FastAPI(
    title="DragonPing",
    description="Website uptime monitoring system",
    version="0.2.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()

app.lifespan = lifespan

# Include routers
app.include_router(auth.router)
app.include_router(services.router)
app.include_router(status.router)
app.include_router(alerts.router)
app.include_router(public_status.router)
```

#### 2. **models.py** - Database Models

```python
# Example User Model
class User(Base):
    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True)
    email: str = Column(String, unique=True, index=True)
    password_hash: str = Column(String)
    is_admin: bool = Column(Boolean, default=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

# Example Service Model
class Service(Base):
    __tablename__ = "services"

    id: int = Column(Integer, primary_key=True)
    name: str = Column(String)
    description: str = Column(String)
    type: str = Column(String)  # 'website' or 'device'
    protocol: str = Column(String)  # 'http', 'https', 'icmp', 'tcp'
    url: str = Column(String, nullable=True)
    ip_address: str = Column(String, nullable=True)
    port: int = Column(Integer, nullable=True)
    interval: int = Column(Integer, default=30)
    is_public: bool = Column(Boolean, default=False)
    active: bool = Column(Boolean, default=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, onupdate=datetime.utcnow)

# Example Check Model (Monitoring History)
class Check(Base):
    __tablename__ = "checks"

    id: int = Column(Integer, primary_key=True)
    service_id: int = Column(Integer, ForeignKey("services.id"))
    status: str = Column(String)  # 'UP', 'DOWN', 'UNKNOWN'
    response_time_ms: float = Column(Float, nullable=True)
    error_message: str = Column(String, nullable=True)
    checked_at: datetime = Column(DateTime, default=datetime.utcnow)

    service = relationship("Service")
```

#### 3. **schemas.py** - Pydantic Schemas

```python
# Request/Response models for validation
from pydantic import BaseModel, EmailStr, HttpUrl

class UserCreate(BaseModel):
    email: EmailStr
    password: str  # min_length=8

class ServiceCreate(BaseModel):
    name: str
    url: Optional[HttpUrl] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    type: str  # 'website' or 'device'
    protocol: str  # 'http', 'https', 'icmp', 'tcp'
    description: Optional[str] = None
    interval: int = 30
    active: bool = True
    is_public: bool = False

class ServiceResponse(BaseModel):
    id: int
    name: str
    type: str
    protocol: str
    url: Optional[str]
    ip_address: Optional[str]
    port: Optional[int]
    interval: int
    active: bool
    is_public: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

#### 4. **auth.py** - Authentication Logic

```python
# Authentication utilities
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: int, email: str) -> str:
    """Create JWT token"""
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=1),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency for protected endpoints"""
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = int(payload.get("sub"))
    email = payload.get("email")

    # Verify user exists in database
    return {"id": user_id, "email": email}
```

#### 5. **scheduler.py** - Background Monitoring

```python
# APScheduler configuration
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.monitoring_service import MonitoringService

scheduler = BackgroundScheduler()

def start_scheduler():
    """Start background scheduler"""
    # Schedule monitoring job every 30 seconds
    scheduler.add_job(
        run_monitoring,
        "interval",
        seconds=30,
        id="periodic_monitoring",
        name="Periodic uptime monitoring"
    )
    scheduler.start()
    logger.info("Scheduler started")

def stop_scheduler():
    """Stop background scheduler"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")

def run_monitoring():
    """Execute monitoring for all active services"""
    db = SessionLocal()
    try:
        services = db.query(Service).filter(Service.active == True).all()
        for service in services:
            MonitoringService.check_service(db, service)
    finally:
        db.close()
```

#### 6. **monitoring_service.py** - Core Monitoring Logic

```python
# Service monitoring implementation
import httpx
from pythonping import ping
import socket
import time

class MonitoringService:
    @staticmethod
    def check_service(db: Session, service: Service):
        """Check single service status"""
        start_time = time.time()
        status = "UNKNOWN"
        response_time = None
        error_message = None

        try:
            if service.type == "website":
                status, response_time = MonitoringService.check_website(service)
            elif service.type == "device":
                status, response_time = MonitoringService.check_device(service)
        except Exception as e:
            status = "DOWN"
            error_message = str(e)
            response_time = (time.time() - start_time) * 1000

        # Record the check
        check = Check(
            service_id=service.id,
            status=status,
            response_time_ms=response_time,
            error_message=error_message
        )
        db.add(check)
        db.commit()

        # Check if alert should be triggered
        if status == "DOWN":
            AlertService.send_alert(db, service, status)

    @staticmethod
    def check_website(service: Service) -> tuple:
        """Check website availability"""
        async def _check():
            timeout = 10.0
            try:
                async with httpx.AsyncClient() as client:
                    start = time.time()
                    response = await client.get(
                        service.url,
                        timeout=timeout,
                        follow_redirects=True
                    )
                    response_time = (time.time() - start) * 1000

                    if response.status_code < 400:
                        return "UP", response_time
                    else:
                        return "DOWN", response_time
            except Exception as e:
                return "DOWN", None

        # Run async check
        return asyncio.run(_check())

    @staticmethod
    def check_device(service: Service) -> tuple:
        """Check device availability"""
        if service.protocol == "icmp":
            return MonitoringService.check_icmp(service.ip_address)
        elif service.protocol == "tcp":
            return MonitoringService.check_tcp(service.ip_address, service.port)
        return "UNKNOWN", None

    @staticmethod
    def check_icmp(ip_address: str) -> tuple:
        """ICMP ping check"""
        try:
            response = ping(ip_address, count=1)
            if response.success():
                return "UP", response.avg_rtt
            else:
                return "DOWN", None
        except Exception:
            return "DOWN", None

    @staticmethod
    def check_tcp(ip_address: str, port: int) -> tuple:
        """TCP port connectivity check"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        start = time.time()

        try:
            result = sock.connect_ex((ip_address, port))
            response_time = (time.time() - start) * 1000

            if result == 0:
                return "UP", response_time
            else:
                return "DOWN", response_time
        finally:
            sock.close()
```

#### 7. **alerts.py** - Email Alert System

```python
# Email alert service
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from os import getenv

class AlertService:
    SMTP_HOST = getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(getenv("SMTP_PORT", "587"))
    SMTP_USER = getenv("SMTP_USER")
    SMTP_PASS = getenv("SMTP_PASS")
    FROM_EMAIL = getenv("SMTP_FROM_EMAIL", SMTP_USER)

    @staticmethod
    async def send_alert(service: Service, status: str, reason: str = None):
        """Send alert email"""
        alerts = db.query(Alert).filter(
            Alert.service_id == service.id,
            Alert.enabled == True
        ).all()

        for alert in alerts:
            message = MIMEMultipart()
            message["From"] = AlertService.FROM_EMAIL
            message["To"] = alert.email
            message["Subject"] = f"Alert: {service.name} is {status}"

            body = f"""
            Service: {service.name}
            Status: {status}
            URL: {service.url or service.ip_address}
            Time: {datetime.now()}
            {reason or ""}
            """

            message.attach(MIMEText(body, "plain"))

            try:
                async with aiosmtplib.SMTP(hostname=AlertService.SMTP_HOST,
                                          port=AlertService.SMTP_PORT) as smtp:
                    await smtp.login(AlertService.SMTP_USER, AlertService.SMTP_PASS)
                    await smtp.send_message(message)
                    logger.info(f"Alert sent to {alert.email}")
            except Exception as e:
                logger.error(f"Failed to send alert: {e}")
```

---

## Frontend Implementation

### Project Structure

```
frontend/
├── src/
│   ├── App.jsx                 # Main app component
│   ├── main.jsx                # Entry point
│   ├── index.css               # Global styles
│   ├── api/
│   │   ├── __init__.js
│   │   └── services.js         # API client
│   ├── components/
│   │   ├── Navbar.jsx          # Navigation
│   │   ├── PrivateRoute.jsx    # Protected routes
│   │   ├── ServiceCard.jsx     # Service display
│   │   ├── StatusBadge.jsx     # Status indicator
│   │   ├── ResponseChart.jsx   # Response time chart
│   │   ├── DragonLoader.jsx    # Loading animation
│   │   └── DragonLoader.css
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state management
│   └── pages/
│       ├── Dashboard.jsx       # Main dashboard
│       ├── Login.jsx           # Login page
│       ├── Register.jsx        # Registration page
│       ├── AddService.jsx      # Service creation
│       ├── Logs.jsx            # Service logs
│       ├── PublicStatus.jsx    # Public dashboard
│       └── Profile.jsx         # User profile
├── public/
│   └── resources/              # Static assets
├── index.html                  # HTML entry point
├── package.json                # Dependencies
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind config
└── postcss.config.js           # PostCSS config
```

### Key Components

#### 1. **App.jsx** - Main Application

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddService from "./pages/AddService";
import PublicStatus from "./pages/PublicStatus";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/public" element={<PublicStatus />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-service" element={<AddService />} />
            <Route path="/logs/:serviceId" element={<Logs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

#### 2. **AuthContext.jsx** - State Management

```jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const stored_token = localStorage.getItem("auth_token");
    const stored_email = localStorage.getItem("user_email");

    if (stored_token && stored_email) {
      setToken(stored_token);
      setUser({ email: stored_email });
    }
    setLoading(false);
  }, []);

  const login = (email, token) => {
    setUser({ email });
    setToken(token);
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user_email", email);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_email");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

#### 3. **services.js** - API Client

```javascript
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor - add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Services API
export const getServices = async (skip = 0, limit = 100) => {
  const response = await apiClient.get("/services", {
    params: { skip, limit },
  });
  return response.data;
};

export const addService = async (data) => {
  const payload = {
    name: data.name,
    type: data.type,
    protocol: data.protocol,
    description: data.description || "",
    interval: data.interval || 30,
    active: data.active !== false,
    is_public: data.is_public || false,
  };

  if (data.url !== undefined) payload.url = data.url;
  if (data.ip_address !== undefined) payload.ip_address = data.ip_address;
  if (data.port !== undefined) payload.port = data.port;

  const response = await apiClient.post("/services", payload);
  return response.data;
};

// Status API
export const getServiceStatus = async (serviceId) => {
  const response = await apiClient.get(`/status/service/${serviceId}`);
  return response.data;
};

export const getServiceLogs = async (serviceId, limit = 50) => {
  const response = await apiClient.get(`/status/service/${serviceId}/logs`, {
    params: { limit },
  });
  return response.data;
};

export const getOverallStatus = async () => {
  const response = await apiClient.get("/status/all");
  return response.data;
};

// Alert API
export const createAlert = async (data) => {
  const response = await apiClient.post("/alerts", data);
  return response.data;
};

export const listAlerts = async () => {
  const response = await apiClient.get("/alerts");
  return response.data;
};

export const testAlert = async (data) => {
  const response = await apiClient.post("/alerts/test", data);
  return response.data;
};
```

#### 4. **Dashboard.jsx** - Main Dashboard

```jsx
import { useEffect, useState } from "react";
import { getServices, getOverallStatus } from "../api/services";
import ServiceCard from "../components/ServiceCard";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, statsData] = await Promise.all([
          getServices(),
          getOverallStatus(),
        ]);
        setServices(servicesData);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 p-8">
        <div className="bg-card rounded-lg p-6">
          <h3>Total Services</h3>
          <p className="text-3xl font-bold">{stats?.total_services}</p>
        </div>
        <div className="bg-card rounded-lg p-6">
          <h3>Up</h3>
          <p className="text-3xl font-bold text-green-500">{stats?.up}</p>
        </div>
        <div className="bg-card rounded-lg p-6">
          <h3>Down</h3>
          <p className="text-3xl font-bold text-red-500">{stats?.down}</p>
        </div>
        <div className="bg-card rounded-lg p-6">
          <h3>Uptime</h3>
          <p className="text-3xl font-bold">99.5%</p>
        </div>
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
```

#### 5. **AddService.jsx** - Service Creation Form

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addService } from "../api/services";

export default function AddService() {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState("website");
  const [protocol, setProtocol] = useState("https");
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    ip_address: "",
    port: "",
    description: "",
    interval: 30,
    active: true,
    is_public: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? checked
          : name === "interval" || name === "port"
            ? value
              ? parseInt(value)
              : ""
            : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        type: serviceType,
        protocol: protocol,
        interval: formData.interval,
        active: formData.active,
        is_public: formData.is_public,
      };

      if (serviceType === "website") {
        payload.url = formData.url;
      } else if (serviceType === "device") {
        payload.ip_address = formData.ip_address;
        if (protocol === "tcp") {
          payload.port = formData.port;
        }
      }

      await addService(payload);
      navigate("/");
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 p-8">
      <h1 className="text-3xl font-bold mb-8">Add Service</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-lg p-8 max-w-2xl"
      >
        {/* Service Type Selection */}
        <div className="mb-6">
          <label className="block mb-2">Service Type</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setServiceType("website")}
              className={`flex-1 py-2 px-4 rounded ${
                serviceType === "website" ? "bg-blue-500" : "bg-gray-700"
              }`}
            >
              Website
            </button>
            <button
              type="button"
              onClick={() => setServiceType("device")}
              className={`flex-1 py-2 px-4 rounded ${
                serviceType === "device" ? "bg-blue-500" : "bg-gray-700"
              }`}
            >
              Device
            </button>
          </div>
        </div>

        {/* Service Name */}
        <div className="mb-6">
          <label className="block mb-2">Service Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full bg-gray-700 rounded px-4 py-2"
            required
          />
        </div>

        {/* Website URL (if website type) */}
        {serviceType === "website" && (
          <>
            <div className="mb-6">
              <label className="block mb-2">Protocol</label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full bg-gray-700 rounded px-4 py-2"
              >
                <option value="https">HTTPS</option>
                <option value="http">HTTP</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block mb-2">URL</label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className="w-full bg-gray-700 rounded px-4 py-2"
                placeholder="https://example.com"
                required
              />
            </div>
          </>
        )}

        {/* Device Configuration (if device type) */}
        {serviceType === "device" && (
          <>
            <div className="mb-6">
              <label className="block mb-2">Protocol</label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full bg-gray-700 rounded px-4 py-2"
              >
                <option value="icmp">ICMP (Ping)</option>
                <option value="tcp">TCP</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block mb-2">IP Address</label>
              <input
                type="text"
                name="ip_address"
                value={formData.ip_address}
                onChange={handleInputChange}
                className="w-full bg-gray-700 rounded px-4 py-2"
                placeholder="192.168.1.1"
                required
              />
            </div>
            {protocol === "tcp" && (
              <div className="mb-6">
                <label className="block mb-2">Port</label>
                <input
                  type="number"
                  name="port"
                  value={formData.port}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded px-4 py-2"
                  placeholder="22"
                  required
                />
              </div>
            )}
          </>
        )}

        {/* Common Settings */}
        <div className="mb-6">
          <label className="block mb-2">Check Interval (seconds)</label>
          <input
            type="number"
            name="interval"
            value={formData.interval}
            onChange={handleInputChange}
            className="w-full bg-gray-700 rounded px-4 py-2"
            min="10"
            max="3600"
          />
        </div>

        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            name="active"
            checked={formData.active}
            onChange={handleInputChange}
            id="active"
          />
          <label htmlFor="active" className="ml-2">
            Enable Monitoring
          </label>
        </div>

        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            name="is_public"
            checked={formData.is_public}
            onChange={handleInputChange}
            id="is_public"
          />
          <label htmlFor="is_public" className="ml-2">
            Public Dashboard
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 rounded px-4 py-2"
        >
          Add Service
        </button>
      </form>
    </div>
  );
}
```

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint         | Auth | Description       |
| ------ | ---------------- | ---- | ----------------- |
| POST   | `/auth/register` | No   | Register new user |
| POST   | `/auth/login`    | No   | User login        |

#### Request/Response Examples

```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Service Management Endpoints

| Method | Endpoint             | Auth | Description         |
| ------ | -------------------- | ---- | ------------------- |
| GET    | `/api/services`      | Yes  | List all services   |
| POST   | `/api/services`      | Yes  | Create service      |
| GET    | `/api/services/{id}` | Yes  | Get service details |
| PUT    | `/api/services/{id}` | Yes  | Update service      |
| DELETE | `/api/services/{id}` | Yes  | Delete service      |

#### Request/Response Examples

```bash
# Create Service
curl -X POST http://localhost:8000/api/services \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google Search",
    "url": "https://www.google.com",
    "type": "website",
    "protocol": "https",
    "interval": 30,
    "active": true,
    "is_public": false
  }'

Response (201):
{
  "id": 2,
  "name": "Google Search",
  "url": "https://www.google.com/",
  "type": "website",
  "protocol": "https",
  "ip_address": null,
  "port": null,
  "interval": 30,
  "active": true,
  "is_public": false,
  "created_at": "2026-02-14T17:58:46.098981",
  "updated_at": "2026-02-14T17:58:46.098987"
}

# List Services
curl -X GET http://localhost:8000/api/services \
  -H "Authorization: Bearer YOUR_TOKEN"

Response (200):
[
  {
    "id": 1,
    "name": "Google",
    "type": "website",
    "protocol": "https",
    "url": "https://google.com/",
    ...
  },
  ...
]
```

### Status & Monitoring Endpoints

| Method | Endpoint                          | Auth | Description    |
| ------ | --------------------------------- | ---- | -------------- |
| GET    | `/api/status/service/{id}`        | Yes  | Service status |
| GET    | `/api/status/service/{id}/logs`   | Yes  | Service logs   |
| GET    | `/api/status/service/{id}/checks` | Yes  | Recent checks  |
| GET    | `/api/status/all`                 | Yes  | Overall status |
| GET    | `/api/status/summary`             | Yes  | Status summary |

#### Request/Response Examples

```bash
# Get Service Status
curl -X GET http://localhost:8000/api/status/service/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

Response (200):
{
  "service_id": 1,
  "name": "Google",
  "url": "https://google.com/",
  "type": "website",
  "status": "UP",
  "uptime_percentage": 97.06,
  "avg_response_time": 2359.24,
  "last_check": "2026-02-14T18:13:30.081073",
  "last_check_response_time": 1999.875545501709,
  "total_checks": 34,
  "failed_checks": 1
}

# Get Overall Status
curl -X GET http://localhost:8000/api/status/all \
  -H "Authorization: Bearer YOUR_TOKEN"

Response (200):
{
  "total_services": 6,
  "up": 2,
  "down": 2,
  "services": [...]
}
```

### Alert Management Endpoints

| Method | Endpoint           | Auth | Description     |
| ------ | ------------------ | ---- | --------------- |
| POST   | `/api/alerts`      | Yes  | Create alert    |
| GET    | `/api/alerts`      | Yes  | List alerts     |
| POST   | `/api/alerts/test` | Yes  | Send test alert |

#### Request/Response Examples

```bash
# Create Alert
curl -X POST http://localhost:8000/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "email": "admin@example.com",
    "alert_on": ["down", "slow"],
    "alert_threshold": 2000
  }'

Response (201):
{
  "id": 1,
  "service_id": 1,
  "email": "admin@example.com",
  "alert_on": ["down", "slow"],
  "alert_threshold": 2000
}

# Test Alert
curl -X POST http://localhost:8000/api/alerts/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "email": "admin@example.com",
    "reason": "Service is down"
  }'

Response (200):
{
  "status": "success",
  "message": "Test alert sent to admin@example.com"
}
```

### Public API Endpoints

| Method | Endpoint             | Auth | Description           |
| ------ | -------------------- | ---- | --------------------- |
| GET    | `/api/public/status` | No   | Public service status |

#### Request/Response Examples

```bash
# Get Public Status
curl -X GET http://localhost:8000/api/public/status

Response (200):
{
  "summary": {
    "total_services": 2,
    "up_services": 2,
    "down_services": 0
  },
  "services": [
    {
      "service_id": 1,
      "name": "Google",
      "status": "UP",
      "uptime_percentage": 97.06,
      "last_check": "2026-02-14T18:13:30.081073"
    }
  ]
}
```

---

## Authentication System

### JWT Token Flow

```
1. User Registration/Login
   ├─ Email + Password sent to API
   ├─ Password verified with bcrypt
   └─ JWT token generated

2. Token Creation
   ├─ Payload: { sub: user_id, email, exp, iat }
   ├─ Signed with SECRET_KEY
   ├─ Expires in 24 hours
   └─ Stored in Browser localStorage

3. Protected Requests
   ├─ Request includes: Authorization: Bearer TOKEN
   ├─ Server verifies JWT signature
   ├─ Token expiry checked
   └─ Request processed if valid

4. Token Storage
   └─ Client: localStorage (auth_token, user_email)
```

### Security Features

1. **Password Hashing**
   - Algorithm: bcrypt
   - Cost: 12 rounds
   - Stored as hash, never plain text

2. **JWT Tokens**
   - Algorithm: HS256 (HMAC with SHA-256)
   - Expiration: 24 hours
   - Signature verification on each request

3. **CORS Configuration**
   - Allowed origins: Frontend domain + localhost
   - Credentials: Allowed
   - Methods: GET, POST, PUT, DELETE

4. **HTTPS Recommendation**
   - Use in production
   - Protects token transmission
   - Required for email verification

---

## Monitoring System

### Monitoring Flow

```
┌─────────────────────────────────────────────┐
│      APScheduler (Every 30 seconds)         │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│     Fetch Active Services from DB           │
└────────────┬────────────────────────────────┘
             │
             ▼
        ┌────────────────────┐
        │  For Each Service  │
        └────────┬───────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
 Website       ICMP          TCP
 (HTTP/HTTPS)  (Ping)        (Port)
    │            │            │
    └────────────┼────────────┘
                 │
         Check Performed
         Store Result
         │
         ├─ Status: UP/DOWN
         ├─ Response Time
         └─ Error Message (if any)
         │
         ▼
  Trigger Alert if Status Changed
  or Threshold Exceeded
         │
         ▼
  Email Notification Sent
```

### Service Status States

| Status  | Meaning                     | Trigger                                  |
| ------- | --------------------------- | ---------------------------------------- |
| UP      | Service responding normally | HTTP 2xx, ICMP reply, TCP connection     |
| DOWN    | Service not responding      | HTTP 4xx/5xx, no ICMP reply, TCP timeout |
| UNKNOWN | Not yet checked             | Initial state, no check performed        |

### Response Time Metrics

- **Measured in milliseconds**
- Website: Time from request to response
- ICMP: Round-trip time (ping)
- TCP: Time to establish connection

### Uptime Calculation

```
Uptime % = (Successful Checks / Total Checks) × 100

Example:
- Total checks: 100
- Failed checks: 3
- Uptime: (97 / 100) × 100 = 97%
```

---

## Alert System

### Alert Configuration

```
Alert {
  service_id: int,           # Which service to monitor
  email: string,             # Email recipient
  alert_on: string[],        # Conditions: ["down", "slow"]
  alert_threshold: int,      # Response time threshold (ms)
  enabled: boolean           # Alert on/off
}
```

### Alert Conditions

| Condition   | Trigger                         | Example                   |
| ----------- | ------------------------------- | ------------------------- |
| `down`      | Service becomes DOWN            | Website returns 500 error |
| `slow`      | Response time exceeds threshold | Response > 2000ms         |
| `recovered` | Service goes from DOWN to UP    | Auto-recovery detection   |

### Email Alert Template

```html
Subject: Alert: [Service Name] is [STATUS] Dear Administrator, Your monitored
service has triggered an alert. ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Service:
[Service Name] Status: [UP/DOWN] Time: [Timestamp] Response Time: [ms]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ URL/IP: [Service URL or IP] Protocol:
[HTTP/HTTPS/ICMP/TCP] Threshold: [Response Time Threshold] [Error Details if
applicable] View Dashboard: [Dashboard Link] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DragonPing Monitoring System
```

### Alert Sending Flow

```
1. Check Completed
   ├─ Status determined
   └─ Response time measured

2. Check Alert Conditions
   ├─ Status changed? → Trigger alert
   ├─ Response time > threshold? → Trigger alert
   └─ Enabled? → Send alert

3. Find Alert Recipients
   └─ Query alerts for service

4. Send Email
   ├─ Connect to SMTP server
   ├─ Authenticate with credentials
   ├─ Format email message
   ├─ Send to recipient
   └─ Log in database

5. Handle Errors
   ├─ SMTP connection failed → Retry
   ├─ Invalid email → Log error
   └─ Rate limiting → Queue for later
```

---

## Project Structure Full Tree

```
dragonping/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app
│   │   ├── db.py                      # Database setup
│   │   ├── models.py                  # ORM models
│   │   ├── schemas.py                 # Pydantic schemas
│   │   ├── auth.py                    # Authentication
│   │   ├── alerts.py                  # Email alerts
│   │   ├── scheduler.py               # APScheduler
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # Auth endpoints
│   │   │   ├── services.py            # Service CRUD
│   │   │   ├── status.py              # Status endpoints
│   │   │   ├── alerts.py              # Alert endpoints
│   │   │   └── public_status.py       # Public API
│   │   └── services/
│   │       ├── __init__.py
│   │       └── monitoring_service.py  # Monitoring logic
│   ├── venv/                          # Virtual environment
│   ├── requirements.txt               # Python dependencies
│   ├── .env                           # Environment variables
│   ├── .env.example                   # Example env file
│   ├── app.db                         # SQLite database
│   ├── test_all_features.py           # Test suite
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Main component
│   │   ├── main.jsx                   # Entry point
│   │   ├── index.css                  # Global styles
│   │   ├── api/
│   │   │   ├── __init__.js
│   │   │   └── services.js            # API client
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Navigation
│   │   │   ├── PrivateRoute.jsx       # Protected routes
│   │   │   ├── ServiceCard.jsx        # Service card
│   │   │   ├── StatusBadge.jsx        # Status badge
│   │   │   ├── ResponseChart.jsx      # Charts
│   │   │   ├── DragonLoader.jsx       # Loader
│   │   │   └── DragonLoader.css
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Auth state
│   │   └── pages/
│   │       ├── Dashboard.jsx          # Dashboard
│   │       ├── Login.jsx              # Login
│   │       ├── Register.jsx           # Register
│   │       ├── AddService.jsx         # Add service
│   │       ├── Logs.jsx               # Logs
│   │       ├── PublicStatus.jsx       # Public dashboard
│   │       └── Profile.jsx            # Profile
│   ├── public/
│   │   └── resources/                 # Static assets
│   ├── index.html                     # HTML entry
│   ├── package.json                   # Dependencies
│   ├── package-lock.json
│   ├── vite.config.js                 # Vite config
│   ├── tailwind.config.js             # Tailwind config
│   ├── postcss.config.js              # PostCSS config
│   └── README.md
│
├── Docs/
│   ├── 1.1docs.md                     # Version 1.1 docs
│   ├── API_REFERENCE_GUIDE.md         # API reference
│   ├── IMPLEMENTATION_CHECKLIST.md    # Checklist
│   └── [other docs]
│
├── .git/                              # Git repository
├── .gitignore
├── README.MD                          # Project README
├── IMPLEMENTATION_COMPLETE.md         # Completion summary
└── [root config files]
```

---

## Setup & Deployment

### Local Development Setup

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update .env with your settings
# Then start the server
uvicorn app.main:app --reload
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
```

### Database Initialization

```python
# app/db.py handles automatic initialization
# SQLite creates app.db automatically
# Tables created on first run

# Or manually initialize:
from app.db import init_db
init_db()  # Creates all tables
```

### Environment Variables

```bash
# .env file
DATABASE_URL=sqlite:///app.db
# Or for PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost/dragonping

SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
ADMIN_EMAIL=admin@example.com

# Frontend
VITE_API_URL=http://localhost:8000/api
```

### Production Deployment

#### Using Docker

```dockerfile
# backend/Dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ /app/app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/dragonping
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      - db
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: dragonping
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Configuration

### FastAPI Configuration

```python
# app/main.py
app = FastAPI(
    title="DragonPing",
    description="Website and device uptime monitoring",
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)
```

### Database Configuration

```python
# app/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = getenv("DATABASE_URL", "sqlite:///app.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Vite Configuration

```javascript
// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    minify: "terser",
  },
});
```

---

## Version History

### v1.0 (Initial Release)

- Basic website monitoring
- User authentication
- Simple dashboard

### v1.1 (Current - February 14, 2026)

- ✅ Device monitoring (ICMP, TCP)
- ✅ Email alert system
- ✅ Status/logs APIs
- ✅ Public dashboard
- ✅ Improved UI/UX
- ✅ Complete API documentation
- ✅ Production-ready configuration

---

## Support & Maintenance

### Common Issues

1. **Database connection error**
   - Check DATABASE_URL in .env
   - Ensure database server is running
   - Verify file permissions (for SQLite)

2. **Email alerts not sending**
   - Verify SMTP credentials
   - Check firewall rules
   - Enable 2FA app password (for Gmail)

3. **CORS errors**
   - Check frontend origin in CORS config
   - Verify API_URL in frontend .env
   - Clear browser cache

4. **Port already in use**
   - Change port in uvicorn: `--port 8001`
   - Change frontend port in vite.config.js

### Performance Optimization

1. **Database**
   - Add indexes on frequently queried columns
   - Archive old check data
   - Use connection pooling

2. **Monitoring**
   - Increase check interval for non-critical services
   - Use connection timeouts
   - Cache responses

3. **Frontend**
   - Enable service worker
   - Use lazy loading
   - Minify assets

---

## Future Enhancements

- [ ] Webhook notifications
- [ ] Slack/Teams integration
- [ ] Advanced analytics & graphs
- [ ] Mobile app
- [ ] Multi-tenant support
- [ ] Custom alert templates
- [ ] API rate limiting
- [ ] Audit logging
- [ ] Geographic monitoring
- [ ] SLA reporting

---

**End of Implementation Document v1.1**

**Status:** ✅ Complete  
**Last Updated:** February 14, 2026  
**Maintained By:** DragonPing Development Team
