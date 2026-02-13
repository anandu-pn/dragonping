# 🐉 DragonPing — Quick Start Guide

Get DragonPing running in 5 minutes!

## ⚡ Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+ (running on localhost:5432)
- Git (optional)

---

## 🚀 Quick Start (Windows)

### 1. PostgreSQL Setup

```sql
-- Open PostgreSQL and create database
CREATE DATABASE dragonping_db;
```

### 2. Backend Setup

```powershell
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (already exists, check it)
# DATABASE_URL should be set to postgresql://postgres:password@localhost:5432/dragonping_db

# Start server
uvicorn app.main:app --reload
```

**Backend is ready at:** http://localhost:8000

**API Docs:** http://localhost:8000/docs

### 3. Frontend Setup (New Terminal)

```powershell
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend is ready at:** http://localhost:5173

---

## 🎯 First Test

1. Open http://localhost:5173 in browser
2. Click "Add Service"
3. Fill in:
   - **Name:** Google
   - **URL:** https://www.google.com
   - **Interval:** 30 (seconds)
4. Click "Add Service"
5. Wait 30 seconds for first check
6. Dashboard will show status

---

## 📊 Test Services

Try adding these URLs to test:

```
https://www.google.com          (Always UP)
https://www.example.com         (Always UP)
https://www.github.com          (Always UP)
https://nonexistent12345.com    (Will show DOWN)
```

---

## 🔍 View Logs

1. Navigate to "Logs" page
2. Select a service
3. View check history
4. Click "Export as CSV" to download

---

## 📊 Dashboard

On Dashboard page you'll see:

- **Summary Cards:** Total services, online, offline, uptime %
- **Service Cards:** Status, response time, uptime, last check
- **Response Chart:** Line chart of response times over time

---

## 🐛 Troubleshooting

### Backend won't start

```
Error: Database connection failed

Solution:
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in backend/.env
3. Verify database exists: CREATE DATABASE dragonping_db;
```

### Frontend won't load

```
Error: Cannot GET /api/services

Solution:
1. Ensure backend is running (http://localhost:8000)
2. Check VITE_API_URL in frontend/.env
3. Clear browser cache and refresh
```

### No checks showing up

```
Issue: Services added but no checks recorded

Solution:
1. Wait 30 seconds (scheduler runs every 30s)
2. Check backend logs for errors
3. Verify service URL is valid (not localhost)
```

---

## 📁 Important Files

**Backend:**

- `backend/app/main.py` — FastAPI app
- `backend/app/scheduler.py` — Monitoring scheduler
- `backend/app/monitor.py` — HTTP checking logic
- `backend/.env` — Configuration

**Frontend:**

- `frontend/src/pages/Dashboard.jsx` — Main dashboard
- `frontend/src/api/services.js` — API client
- `frontend/.env` — Configuration

---

## 🎨 UI Overview

### Dashboard

- View all services
- Quick status overview
- Response time chart
- Delete services

### Add Service

- Simple form
- URL validation
- Configurable check interval

### Logs

- Complete check history
- Sortable table
- CSV export
- Statistics

---

## 🔧 Useful Commands

```bash
# Backend: List all services
curl http://localhost:8000/api/services

# Backend: Get status summary
curl http://localhost:8000/api/status/summary

# Backend: Get service status
curl http://localhost:8000/api/status/service/1

# Backend: Get check history
curl http://localhost:8000/api/status/service/1/checks
```

---

## 📚 Full Documentation

See `README.md` in project root for complete documentation including:

- Architecture diagrams
- API reference
- Database schema
- Deployment guide
- Security considerations
- Future enhancements

---

## ✅ Checklist

- [ ] PostgreSQL running
- [ ] Backend started (`http://localhost:8000/docs`)
- [ ] Frontend started (`http://localhost:5173`)
- [ ] Added first service
- [ ] Waited 30 seconds for check
- [ ] Saw service on dashboard
- [ ] Viewed logs page
- [ ] Ready to demo!

---

## 🎓 Learning Path

1. **Explore Dashboard** — See real-time updates
2. **Add Services** — Test with different URLs
3. **View Logs** — See detailed check history
4. **Check API Docs** — Visit http://localhost:8000/docs
5. **Modify Components** — Edit frontend code and see hot-reload
6. **Read Documentation** — Deep dive into architecture

---

## 💡 Pro Tips

1. **Fast Refresh:** Set interval to 10s for testing (production: 30-300s)
2. **Test Failures:** Add invalid domain to see error handling
3. **Performance:** Check "Response Time Trend" chart for patterns
4. **Export Data:** Use Logs CSV export for analysis
5. **Mobile Test:** Open http://localhost:5173 on phone to test responsive design

---

## 🆘 Need Help?

1. Check terminal for error messages
2. Open http://localhost:8000/docs for API testing
3. Check browser console (F12) for frontend errors
4. Review logs in Logs page
5. Check connection to PostgreSQL

---

**Ready? Open http://localhost:5173 and start monitoring! 🚀**
