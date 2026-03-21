# DragonPing — Project Context

## What is this
Full-stack uptime monitoring platform (like Uptime Kuma) built for small/medium
local network deployments (college labs etc). Final year project.
Backend: FastAPI + SQLAlchemy + APScheduler + aiosmtplib + JWT
Frontend: React + Vite + Tailwind CSS + Axios
DB: SQLite (dev) / PostgreSQL (prod)
Servers: backend :8000 / frontend :5173

---

## File map
backend/app/main.py          — app entry, registers all routers
backend/app/models.py        — DB models
backend/app/db.py            — session/engine
backend/app/auth.py          — JWT
backend/app/routes/
  services.py                — service CRUD
  status.py                  — /api/status/* + logs + overall
  alerts.py                  — email alerts (CREATE, LIST, TEST)
  public.py                  — unauthenticated /api/public/status
frontend/src/api/services.js — all Axios calls
frontend/src/pages/          — Dashboard, AddService, Login, Register
frontend/src/components/     — ServiceCard

---

## DB tables
users        — id, email, password_hash, is_admin, created_at
services     — id, name, description, type(website/device),
               protocol(http/https/icmp/tcp), url, ip_address,
               port, interval, is_public, active, created_at, updated_at
checks       — id, service_id(FK), status(UP/DOWN/UNKNOWN),
               status_code, response_time_ms, error_message, checked_at
alert_logs   — id, service_id(FK), alert_type, recipient_email, sent_at

---

## Status

### Done ✅
- JWT auth (login, register, admin role)
- Service CRUD — websites (HTTP/HTTPS) and devices (ICMP/TCP)
- APScheduler background checks every 30s
- /api/status/service/{id}, /api/status/all, /api/status/service/{id}/logs
- /api/status/service/{id}/checks (last N checks)
- Alert create/list — POST /api/alerts, GET /api/alerts
- Basic React frontend — dashboard, add service, login/register

### Broken / needs fix 🔴
- Email alerts intermittently fail silently — aiosmtplib in alerts.py
  has no proper try/except, missing env var detection, no error logging
- Public status page not working — GET /api/public/status exists but
  either returns wrong shape or frontend calls it with auth header
  (should be unauthenticated, return only is_public=True services
  with latest check status)

### In progress 🟡
- UI redesign (Uptime Kuma dark style)
  Colors: bg #0d0f12, surface #13161b, green #22c55e, red #ef4444,
          yellow #f59e0b, accent #3b82f6
  Font: IBM Plex Mono (metrics) + IBM Plex Sans (labels)
  Each service card: glowing status dot, protocol badge,
  sparkline (last 20 checks), uptime %, avg response time

### Not started yet ⬜
- Alembic DB migrations
- Historical uptime charts (24h / 7d / 30d aggregation endpoint)
- Shell agent script (sends CPU/RAM/network to /api/agent/heartbeat)
- Agent metrics table + API endpoint
- Agent dashboard page
- ML anomaly detection (Isolation Forest on response_time_ms)
- Docker / deployment

---

## Env vars required
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS   — email alerts
DATABASE_URL                                  — optional, defaults to SQLite

---

## Notes
- Test suite: 8/14 passing. Failures are 409 conflicts from previous
  runs, not real bugs. Tests need teardown between runs.
- Monitoring interval: 30s (configurable per service via `interval` field)
- Admin user must be created manually with correct password hash
- Do not use styled-components or extra CSS files — Tailwind only