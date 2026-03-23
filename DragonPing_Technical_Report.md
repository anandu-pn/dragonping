# DragonPing Project Technical Report

## 1. SYSTEM OVERVIEW
DragonPing is a hybrid monitoring platform designed for small to medium-scale network environments, such as laboratory or office setups. It provides real-time visibility into the health of web services and network infrastructure.

### Key Capabilities:
- **Web Monitoring**: Tracking uptime and response times for HTTP/HTTPS services.
- **Device Monitoring**: Monitoring network devices (routers, printers, IoT) via ICMP (Ping) and TCP port checks.
- **Predictive Analytics**: Utilizing machine learning to forecast potential downtime before it occurs.
- **Agent-based Telemetry**: Collecting deep system metrics (CPU, RAM, Disk, Network) from remote linux-based hosts.
- **Automated Alerting**: Notifying administrators of status changes via email.
- **Public Status Pages**: Providing unauthenticated transparency for service health.

### Real-World Use Case:
A university IT department can use DragonPing to monitor both the student-facing portal (Web) and the underlying network hardware (Devices) in a single dashboard. Simultaneously, it tracks the system health of research servers via agents, alerting staff if a disk is nearing capacity or if a service exhibits anomalous latency patterns.

---

## 2. ARCHITECTURE ANALYSIS
DragonPing follows a classic client-server architecture with a centralized monitoring engine and distributed telemetry agents.

### System Layers:
- **Frontend Layer**: A React-based Single Page Application (SPA) providing the user interface for management and visualization.
- **Backend Layer**: A FastAPI-based REST API handling business logic, user authentication, and data orchestration.
- **Monitoring Engine**: A core module executing periodic health checks.
- **Predictive Engine**: An ML module analyzing historical data for anomaly detection.
- **Agent Layer**: Remote shell scripts that push system metrics to the backend.

### Data Flow:
1. **Management**: User interacts with the React frontend to add/update services.
2. **Execution**: The backend `APScheduler` triggers the `MonitoringService` every 30s.
3. **Storage**: Check results (status, latency) are persisted in the SQL database.
4. **Alerting**: If a status change is detected, the `Alerting` module dispatches emails via SMTP.
5. **Analytics**: Every 5 minutes, the `Predictive Engine` runs models on recent history to update risk scores.
6. **Telemetry**: Remote agents send heartbeats containing system metrics over HTTP.

### Protocols Used:
- **HTTP/HTTPS**: API communication, frontend-backend sync, and website health checks.
- **ICMP**: Network device availability (Ping).
- **TCP**: Port-level connectivity checks.
- **JWT**: Secure stateless authentication for users and agents.

---

## 3. MODULE-WISE IMPLEMENTATION DETAILS

### 3.1 Backend (FastAPI)
- **API Structure**: Modular router-based design located in `app/routes/`.
- **Route Design**: Organized by resource: `/auth`, `/services`, `/status`, `/alerts`, `/agent`, and `/predictions`.
- **Authentication**: JWT-based implementation in `app/auth.py`. Long-lived tokens (365 days) are generated for agents, while shorter sessions are used for users.
- **Database Integration**: SQLAlchemy ORM in `app/db.py` with models defined in `app/models.py`. Supports both SQLite (local) and PostgreSQL.

### 3.2 Monitoring Engine
- **Check Logic**: Implemented in `app/monitor.py` using `httpx` for web and `pythonping`/`socket` for devices.
- **Scheduler Logic**: `APScheduler` in `app/scheduler.py` runs a background thread. It executes `MonitoringService.run_checks` in an async loop.
- **Response Handling**: Results are categorized as `UP` or `DOWN`. HTTP status codes < 400 are considered operational. SSL certificate expiry is also tracked for HTTPS targets.

### 3.3 Device Monitoring
- **ICMP Implementation**: Uses the `pythonping` library to measure Round Trip Time (RTT).
- **TCP Implementation**: Uses Python's `socket` library to attempt a connection to a specific port.
- **Failure Detection**: A device is marked `DOWN` if a connection is refused, times out, or no ICMP reply is received.

### 3.4 Automotive Module (Prototype Status)
- **Status**: **Not implemented in current codebase.**
- **Design Intent**: Documented in `Docs/1.1docs.md` as a planned extension for ESP32/ECU simulation, likely intended for OBD-II/CAN data monitoring over serial or Wi-Fi, but no active routes or models currently support this.

### 3.5 Alert System
- **Triggers**: Condition-based triggers (Status change `UP`/`DOWN`, SSL cert expiry < 30 days, or High Prediction Risk).
- **Email Integration**: Implemented in `app/alerts.py` using `aiosmtplib` (SMTP).
- **Telegram Integration**: **Planned/Not implemented.** Logic and formatting functions appear in `code.txt` instructions but are missing from the `app/` directory.

### 3.6 Frontend (React)
- **Framework**: React 18 with Vite and Tailwind CSS.
- **Major Pages**:
    - `Dashboard.jsx`: Overall health and service list.
    - `AgentDashboard.jsx`: Real-time telemetry visualization.
    - `PublicStatus.jsx`: External-facing status page.
- **Data Fetching**: Axios-based hooks in `src/api/` with 30s auto-refresh intervals for real-time updates.

---

## 4. DATABASE DESIGN
The system uses SQLAlchemy models mapped to the following tables:

| Table | Purpose | Key Fields |
| :--- | :--- | :--- |
| `users` | User accounts | `email`, `password_hash`, `is_admin` |
| `services` | Monitoring targets | `type`, `protocol`, `url`, `ip_address`, `interval` |
| `checks` | Historical results | `status`, `response_time`, `status_code`, `error_message` |
| `alert_logs` | Notification history | `alert_type`, `recipient_email`, `sent_at` |
| `registered_agents` | Managed hosts | `hostname`, `device_label`, `last_seen` |
| `agent_metrics` | Host telemetry | `cpu_percent`, `ram_percent`, `disk_usage`, `processes` |
| `service_predictions`| ML results | `risk_level`, `confidence`, `reason`, `votes` |

---

## 5. WORKFLOW / SYSTEM OPERATION
1. **Onboarding**: User registers and logs in as Admin.
2. **Configuration**: Admin adds a service (e.g., `https://api.myapp.com`) with a 30s interval.
3. **Execution**: Every 30s, the Scheduler triggers a fetch. `httpx` records a 150ms response time.
4. **Persistence**: A new row is added to `checks` with `status='UP'` and `response_time=150.0`.
5. **Detection**: If the next check returns a `500 Internal Server Error`, the system detects a status change.
6. **Alerting**: The system waits for 5 consecutive failures (configured in `monitoring_service.py`) before firing an email alert.
7. **Visualization**: The administrative dashboard and public status page update to show a red `DOWN` badge.

---

## 6. DEVOPS & DEPLOYMENT
- **Docker Setup**: Multi-stage `Dockerfile` found in both `backend/` and `frontend/`. A root `docker-compose.yml` orchestrates the application, database, and optional testing services.
- **CI/CD Pipeline**: GitHub Actions workflow defined in `.github/workflows/ci.yml`. It performs automated linting via `ruff` and runs `pytest` suites on backend code.
- **Build Flow**: Standard Vite build for frontend (distributing static assets via Nginx) and Uvicorn production server for the FastAPI backend.

---

## 7. IMPLEMENTED FEATURES VS PARTIAL FEATURES

### Fully Implemented ✅
- **Multi-protocol Monitoring**: HTTP/HTTPS, ICMP, and TCP.
- **ML Anomaly Detection**: Thresholding, EWMA baseline, and Isolation Forest models.
- **Agent System**: Shell-based metric collection and centralized dashboard.
- **JWT Auth**: Full RBAC (Role-Based Access Control) for admins and users.

### Partially Implemented ⚠️
- **SLA Tracking**: Models and API logic exist, but `app/sla.py` contains field name mismatches (`response_time_ms` vs `response_time`), indicating it is in a non-functional state.
- **Email Alerts**: Core logic exists but lacks error recovery and reliable SMTP validation (marked for fix in documentation).
- **Public Status Page**: Exists as an endpoint/page but has known routing/auth header issues.

### Planned / Not Implemented ⬜
- **Telegram Alerts**: Zero implementation in code; exists only as a design blueprint in `code.txt`.
- **Automotive Module**: Completely missing from implementation; mentioned only in design docs.
- **Historical Charts**: Aggregation endpoints for 7d/30d uptime are not yet present.

---

## 8. TECHNICAL DECISIONS (BASED ON CODE)
- **FastAPI / Asyncio**: Chosen for the backend to handle hundreds of concurrent monitoring check I/O operations without blocking.
- **APScheduler**: Provides a lightweight, database-backed (optional) job queue without the complexity of Celery/Redis.
- **SQLite (Default)**: Used to lower the barrier for development and small-scale portable deployments.
- **Ruff**: Integrated for extremely fast linting and code quality enforcement.

---

## 9. LIMITATIONS (FROM CODE)
- **Monolithic Monitoring**: Since the scheduler runs inside the API process, extreme monitoring loads could impact API responsiveness.
- **Sequential Checks**: Although async, the `MonitoringService.run_checks` function iterates through services, which may drift in timing for very large target lists.
- **SLA Accuracy**: Current SLA calculations are based on simple averages/sums and do not account for scheduled maintenance windows.

---

## 10. FUTURE EXTENSIONS (INFERRED FROM STRUCTURE)
- **Distributed Monitoring**: The `RegisteredAgent` system could be evolved to perform monitoring checks from multiple geographic locations, reporting results back to the central hub.
- **Time-Series Optimization**: Migration of `checks` and `agent_metrics` to a time-series optimized database (e.g., TimescaleDB or InfluxDB) as data scales.
- **Real-time Notifications**: Implementation of WebSockets for live dashboard updates, replacing the current 30s polling mechanism.
