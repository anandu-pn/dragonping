

Below is a **complete, copy-paste ready `frontend/README.md`** you can put directly into your project.
This is written as an **implementation guide**, not just description — so you can build step-by-step with Copilot.
use similar approch used by uptimekuma
---

# 🐉 DragonPing Frontend — Implementation Guide

This document explains how to build the DragonPing frontend UI using:

* React (Vite)
* JavaScript (no TypeScript)
* Tailwind CSS
* Axios
* Chart.js

Goal:
Build a **clean, modern uptime monitoring dashboard UI** in 1 day.

---

# 📦 Tech Stack

### Core

* React (Vite)
* JavaScript (ES6)
* Tailwind CSS
* Axios

### UI & Visualization

* Chart.js
* React ChartJS 2
* Heroicons / Lucide icons

### Optional

* React Router
* Shadcn UI / Material UI (if needed)

---

# 📁 Folder Structure

```
frontend/
 ├── src/
 │   ├── api/
 │   │   ├── services.js
 │   │
 │   ├── components/
 │   │   ├── ServiceCard.jsx
 │   │   ├── StatusBadge.jsx
 │   │   ├── ResponseChart.jsx
 │   │   └── Navbar.jsx
 │   │
 │   ├── pages/
 │   │   ├── Dashboard.jsx
 │   │   ├── AddService.jsx
 │   │   └── Logs.jsx
 │   │
 │   ├── App.jsx
 │   ├── main.jsx
 │   └── index.css
 │
 ├── package.json
 └── README.md
```

---

# 🚀 Step 1 — Project Setup

Inside `/frontend`:

```
npm create vite@latest .
npm install
npm install axios react-router-dom chart.js react-chartjs-2
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

# 🎨 Step 2 — Tailwind Setup

Edit `tailwind.config.js`:

```
content: ["./index.html", "./src/**/*.{js,jsx}"]
```

In `index.css`:

```
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

# 🌐 Step 3 — Backend API Config

Create:

```
src/api/services.js
```

Functions needed:

* getServices()
* addService()
* getStatus(serviceId)

Copilot prompt:

> create axios api functions for uptime monitoring backend

Base URL:

```
http://localhost:8000
```

---

# 🧩 Step 4 — Core Pages

You only need **3 pages for MVP**:

## 1️⃣ Dashboard.jsx

Purpose:

* Show all services
* Display status
* Show response time
* Show uptime chart

UI sections:

* Navbar
* Service Cards
* Graph

Copilot prompt:

> create uptime monitoring dashboard UI like uptimerobot using react tailwind

---

## 2️⃣ AddService.jsx

Fields:

* Service name
* URL
* Check interval

Button:

* Add service

On submit:
POST → backend

---

## 3️⃣ Logs.jsx

Purpose:

* show history
* show failures

Table view:

| Service | Status | Response | Time |

---

# 🧱 Step 5 — Components

## ServiceCard.jsx

Shows:

* name
* url
* UP / DOWN badge
* response time

---

## StatusBadge.jsx

Color logic:

* green → UP
* red → DOWN
* yellow → slow

---

## ResponseChart.jsx

Line chart:

* X axis → time
* Y axis → response time

Use:
Chart.js

Copilot prompt:

> create chart.js response time line chart component

---

## Navbar.jsx

Items:

* Dashboard
* Add Service
* Logs

---

# 🔄 Step 6 — Routing

Use React Router.

Routes:

```
/ → Dashboard
/add → AddService
/logs → Logs
```

---

# 🧠 Step 7 — Data Flow

```
Dashboard loads
→ fetch services
→ fetch status
→ render cards
→ render graph
```

---

# 📊 Step 8 — Dashboard UI Layout

Layout idea:

```
----------------------------------
 Navbar
----------------------------------

  Service Cards Grid

----------------------------------

  Response Time Chart

----------------------------------
```

Design principles:

* minimal
* dark theme friendly
* status colors clear
* clean spacing

---

# 🧪 Step 9 — Testing UI

Test:

1. Add service
2. Check card appears
3. Check status updates
4. Graph renders
5. Logs visible

---

# 🎨 Step 10 — UI Styling Guide

Focus on:

### Colors

* Background → dark gray
* Card → slightly lighter
* UP → green
* DOWN → red

### Fonts

Use:

* Inter
* System UI

### Spacing

Use Tailwind classes:

* p-4
* gap-4
* rounded-xl

---

# 🧠 Copilot Prompts You Should Use

These make development 5x faster:

### For dashboard:

> build uptime monitoring dashboard in react tailwind

### For cards:

> create service status card component

### For API:

> create axios api service layer

### For charts:

> create chart.js uptime response graph

---

# ❗ Important Rules

### Do NOT build now:

* login system
* multi-user
* websocket
* docker UI
* notifications

Only MVP UI.

---

# ⏱️ 1-Day Implementation Timeline

## Hour 1–2

* Setup project
* Tailwind
* Router

## Hour 3–4

* Dashboard layout
* Service card

## Hour 5–6

* API integration

## Hour 7

* Add service page

## Hour 8

* Graphs

## Hour 9

* Logs page

## Hour 10

* Polish UI

---

# 🧾 MVP Completion Checklist

If these work → frontend done:

✔ Dashboard loads
✔ Add service works
✔ Cards show status
✔ Graph visible
✔ Logs page loads

---

# 🚀 Next After Frontend

Once UI ready:

1. connect backend scheduler
2. add alerts
3. add authentication
4. add NATS
5. dockerize

---

# 🧠 Final Advice

For MCA evaluation:

UI quality = marks.

Even if backend basic:

* clean UI
* working dashboard
* real-time feel

→ project looks advanced.

---

