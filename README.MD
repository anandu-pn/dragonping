# 🐉 DragonPing — Complete System Documentation

**A production-ready uptime monitoring system built with FastAPI, React, and PostgreSQL**

## 📋 Overview

DragonPing is an enterprise-grade website uptime monitoring system that provides real-time monitoring, historical data tracking, and beautiful dashboards. The system automatically checks website availability at configurable intervals, stores detailed metrics, and presents actionable insights through an intuitive web interface.

### Key Features

- ✅ **Real-time Monitoring** — Check website uptime every 10-3600 seconds
- 📊 **Response Time Tracking** — Monitor and visualize response times over time
- 📈 **Uptime Statistics** — Calculate and display uptime percentages
- 📋 **Check History** — Complete audit logs with sorting and export capabilities
- 🎨 **Modern Dashboard** — Clean, responsive UI built with React and Tailwind CSS
- 📱 **Mobile Responsive** — Works seamlessly on desktop, tablet, and mobile
- ⚡ **Fast & Scalable** — Built with async/await and efficient database queries
- 🔒 **Secure Endpoints** — Prepared for future authentication implementation

---

## 🏗️ Architecture Overview

### Project Architecture

dragonping/
├── backend/
│ ├── app/
│ │ ├── main.py
│ │ ├── db.py
│ │ ├── models.py
│ │ ├── schemas.py
│ │ ├── routes/
│ │ ├── services/
│ │ ├── scheduler.py
│ │ └── monitor.py
│ └── requirements.txt
│
├── frontend/
│ ├── src/
│ │ ├── pages/
│ │ ├── components/
│ │ ├── api/
│ │ └── App.jsx
│ └── package.json
│
└── README.md

2️⃣ BACKEND IMPLEMENTATION (FASTAPI)
Step 1 — Setup environment

Inside /backend:

python -m venv venv
source venv/bin/activate (Linux/mac)
venv\Scripts\activate (Windows)

pip install fastapi uvicorn sqlalchemy psycopg2-binary httpx apscheduler python-dotenv

Optional Mongo:

pip install pymongo

Step 2 — PostgreSQL Setup

Create DB:

dragonping_db

Connection string:

postgresql://postgres:password@localhost:5432/dragonping_db

Store in .env:

DATABASE_URL=postgresql://postgres:password@localhost:5432/dragonping_db

Step 3 — Database Layer
db.py

Copilot prompt:

create sqlalchemy engine setup using env DATABASE_URL

Expected structure:

engine

SessionLocal

Base

Step 4 — Models
models.py

Tables:

services

id

name

url

interval

created_at

checks

id

service_id

status (UP/DOWN)

response_time

checked_at

Copilot prompt:

create sqlalchemy models for service monitoring system

Step 5 — Schemas
schemas.py

Pydantic models:

ServiceCreate

ServiceResponse

CheckResponse

Copilot prompt:

generate pydantic schemas for above models

Step 6 — API Routes

Create folder:

routes/
services.py
status.py

APIs required:
POST /services

Add service

GET /services

List services

GET /status/{id}

Status history

Step 7 — Monitoring Engine
monitor.py

Function:

check_service(url):
send HTTP request
measure response time
return status

Use:

httpx

timeout

exception handling

Copilot prompt:

write async function to monitor website uptime

Step 8 — Scheduler
scheduler.py

Use APScheduler.

Runs:
every 30 seconds

Flow:

get services from DB
for each:
call monitor
store result

Copilot prompt:

implement apscheduler background job for monitoring services

Step 9 — main.py

Initialize:

FastAPI app

DB

include routers

start scheduler

Copilot prompt:

integrate fastapi app with scheduler and routers

Run:

uvicorn app.main:app --reload

3️⃣ FRONTEND IMPLEMENTATION (REACT)
Step 1 — Setup

Inside /frontend:

npm create vite@latest
npm install
npm install axios tailwindcss chart.js react-chartjs-2

Initialize Tailwind.

Step 2 — UI Pages

Create:

src/pages/
Dashboard.jsx
AddService.jsx
Logs.jsx

Step 3 — API Layer
src/api/services.js

Functions:

getServices()

addService()

getStatus()

Step 4 — Dashboard UI

Components:

ServiceCard

StatusBadge

ResponseGraph

Display:

UP/DOWN

last response time

uptime %

Copilot prompt:

create uptime dashboard UI similar to uptime robot

Step 5 — Add Service Form

Fields:

name

url

interval

POST → backend

Step 6 — Analytics Graph

Use Chart.js

Show:

response time trend

Copilot prompt:

create chart.js line chart for response time

4️⃣ OPTIONAL MONGODB (LOG STORAGE)

Use for:

raw logs

error traces

mongo.py

Store:

{
service_id,
raw_response,
error,
timestamp
}

Not required for MVP.

5️⃣ DATA FLOW
User adds service
→ saved in PostgreSQL

Scheduler runs
→ monitor service

Result stored
→ checks table

Frontend fetches data
→ dashboard displays status

6️⃣ TESTING PLAN

Test cases:

Add valid website

Add invalid URL

Stop internet

Observe DOWN status

Check logs

Verify graph updates

7️⃣ GITHUB COPILOT WORKFLOW

Use prompts like:

"create fastapi CRUD for services"

"write sqlalchemy models"

"implement apscheduler job"

"create react dashboard card component"

"write axios api integration"

Copilot will generate 70% code.

You refine.

8️⃣ WHAT NOT TO BUILD NOW

Avoid:

auth

NATS

multi-user

distributed workers

alerts

docker

Add later.

9️⃣ DAY-1 COMPLETION CHECKLIST

If these work → success:

✔ Add service
✔ Monitoring runs automatically
✔ Status stored
✔ Dashboard loads services
✔ Graph visible

That is a complete MVP.

🔟 NEXT PHASE (After MVP)

Later you can add:

NATS

alerts

auth

docker

distributed workers

TCP ping

multi-region checks
