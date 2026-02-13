# 🐉 DragonPing Backend

Production-ready backend for website uptime monitoring system.

## 🏗️ Architecture

```
┌─────────────┐
│  FastAPI    │  REST API
├─────────────┤
│  Routes     │  Services & Status endpoints
├─────────────┤
│  Services   │  Business Logic
├─────────────┤
│  Monitor    │  HTTP checks & response times
├─────────────┤
│ Scheduler   │  Background job runner (30s interval)
├─────────────┤
│ Database    │  PostgreSQL with SQLAlchemy ORM
└─────────────┘
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app & lifespan management
│   ├── db.py                   # Database configuration
│   ├── models.py               # SQLAlchemy models (Service, Check)
│   ├── schemas.py              # Pydantic request/response models
│   ├── monitor.py              # HTTP monitoring engine
│   ├── scheduler.py            # APScheduler background jobs
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── services.py         # CRUD endpoints for services
│   │   └── status.py           # Status & history endpoints
│   └── services/
│       ├── __init__.py
│       └── monitoring_service.py  # Business logic & orchestration
├── .env                        # Environment variables
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip/venv

### 2. Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Database Configuration

Create/update `.env`:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/dragonping_db
DEBUG=True
API_HOST=0.0.0.0
API_PORT=8000
```

**PostgreSQL Setup:**

```sql
CREATE DATABASE dragonping_db;
```

### 4. Run Server

```bash
uvicorn app.main:app --reload
```

Server runs at: `http://localhost:8000`

- API Docs: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

## 📚 API Endpoints

### Services Management

#### Create Service

```http
POST /api/services
Content-Type: application/json

{
  "name": "Google",
  "url": "https://google.com",
  "description": "Search engine",
  "interval": 30,
  "active": true
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "Google",
  "url": "https://google.com",
  "description": "Search engine",
  "interval": 30,
  "active": true,
  "created_at": "2024-02-13T10:00:00",
  "updated_at": "2024-02-13T10:00:00"
}
```

#### List Services

```http
GET /api/services?skip=0&limit=100&active_only=false
```

#### Get Service

```http
GET /api/services/{service_id}
```

#### Update Service

```http
PUT /api/services/{service_id}
Content-Type: application/json

{
  "name": "Updated Name",
  "active": false
}
```

#### Delete Service

```http
DELETE /api/services/{service_id}
```

### Status & Monitoring

#### Get Service Status

```http
GET /api/status/service/{service_id}
```

**Response:**

```json
{
  "service_id": 1,
  "name": "Google",
  "url": "https://google.com",
  "status": "UP",
  "uptime_percentage": 98.5,
  "avg_response_time": 145.23,
  "last_check": "2024-02-13T10:15:30",
  "last_check_response_time": 142.5,
  "total_checks": 100,
  "failed_checks": 2
}
```

#### Get Service Check History

```http
GET /api/status/service/{service_id}/checks?limit=50
```

**Response:**

```json
[
  {
    "id": 1,
    "service_id": 1,
    "status": "UP",
    "status_code": 200,
    "response_time": 142.5,
    "error_message": null,
    "checked_at": "2024-02-13T10:15:30"
  },
  {
    "id": 2,
    "service_id": 1,
    "status": "DOWN",
    "status_code": null,
    "response_time": 5000.0,
    "error_message": "Request timeout",
    "checked_at": "2024-02-13T10:16:00"
  }
]
```

#### Get All Services Status

```http
GET /api/status/summary
```

**Response:**

```json
{
  "total_services": 3,
  "up_services": 2,
  "down_services": 1,
  "services": [
    {
      "service_id": 1,
      "name": "Google",
      "url": "https://google.com",
      "status": "UP",
      "uptime_percentage": 98.5,
      "avg_response_time": 145.23,
      "last_check": "2024-02-13T10:15:30",
      "last_check_response_time": 142.5,
      "total_checks": 100,
      "failed_checks": 2
    }
  ]
}
```

## 🔧 Core Components

### 1. Database Layer (`app/db.py`)

- SQLAlchemy engine with connection pooling
- SessionLocal for dependency injection
- Declarative Base for model definitions
- `get_db()` dependency for FastAPI routes

### 2. Models (`app/models.py`)

**Service Model:**

- `id`: Primary key
- `name`: Service name
- `url`: URL to monitor (unique)
- `description`: Optional description
- `interval`: Check interval (seconds)
- `active`: Enable/disable monitoring
- `created_at`, `updated_at`: Timestamps
- Relationships: `checks` (one-to-many)

**Check Model:**

- `id`: Primary key
- `service_id`: Foreign key
- `status`: "UP" or "DOWN"
- `status_code`: HTTP status code
- `response_time`: Response time (milliseconds)
- `error_message`: Error details if failed
- `checked_at`: Check timestamp
- Relationships: `service` (many-to-one)

### 3. Monitoring Engine (`app/monitor.py`)

**`check_service(url, timeout=10)`**

Async function that:

- Sends HTTP GET request
- Measures response time
- Detects UP/DOWN status
- Handles timeouts and errors gracefully

Returns:

```python
{
  "status": "UP",  # or "DOWN"
  "status_code": 200,
  "response_time": 145.23,  # milliseconds
  "error_message": None
}
```

### 4. Monitoring Service (`app/services/monitoring_service.py`)

Business logic orchestration:

**`run_checks(db)`**

- Fetches all active services
- Runs monitoring checks
- Saves results to database
- Logs issues

**`get_service_stats(db, service_id)`**

- Calculates uptime percentage
- Computes average response time
- Returns current status
- Provides historical data

**`get_recent_checks(db, service_id, limit)`**

- Retrieves recent checks
- Ordered by latest first

### 5. Scheduler (`app/scheduler.py`)

**APScheduler Integration:**

- Runs monitoring every 30 seconds
- Background job execution
- Graceful startup/shutdown
- Error handling and logging

### 6. Routes

**Services Router (`app/routes/services.py`)**

- POST /api/services - Create
- GET /api/services - List
- GET /api/services/{id} - Read
- PUT /api/services/{id} - Update
- DELETE /api/services/{id} - Delete

**Status Router (`app/routes/status.py`)**

- GET /api/status/service/{id} - Service stats
- GET /api/status/service/{id}/checks - Check history
- GET /api/status/summary - All services status

### 7. Main Application (`app/main.py`)

FastAPI setup:

- Application factory pattern
- Lifespan context manager
- CORS middleware configuration
- Router integration
- Health check endpoint

## 🔄 Data Flow

```
1. Frontend adds service
   └─> POST /api/services
       └─> Store in PostgreSQL

2. Scheduler triggers (every 30s)
   └─> Fetch active services
   └─> For each service:
       ├─> check_service() [HTTP request]
       └─> Store result in checks table

3. Frontend requests status
   └─> GET /api/status/service/{id}
       └─> Calculate stats from checks
       └─> Return to frontend

4. Dashboard updates
   └─> Display current status
   └─> Show uptime %
   └─> Plot response times
```

## 🧪 Testing Endpoints

### Using curl

```bash
# Create service
curl -X POST http://localhost:8000/api/services \
  -H "Content-Type: application/json" \
  -d '{"name":"Google","url":"https://google.com","interval":30,"active":true}'

# List services
curl http://localhost:8000/api/services

# Get status
curl http://localhost:8000/api/status/service/1

# Get summary
curl http://localhost:8000/api/status/summary
```

### Using FastAPI Docs

1. Visit `http://localhost:8000/docs`
2. Expand endpoint
3. Click "Try it out"
4. Enter parameters
5. Click "Execute"

## 📊 Database Schema

```sql
-- Services table
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL UNIQUE,
  description VARCHAR(1024),
  interval INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Checks table
CREATE TABLE checks (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time FLOAT,
  error_message VARCHAR(1024),
  checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX ix_checks_service_id ON checks(service_id);
CREATE INDEX ix_checks_service_id_checked_at ON checks(service_id, checked_at);
```

## 🔐 Security Considerations

Current MVP:

- No authentication (implement in Phase 2)
- CORS allows all origins (restrict in production)
- HTTP GET only for checks
- Input validation with Pydantic

Production recommendations:

- Add JWT authentication
- Restrict CORS origins
- Use HTTPS
- Add rate limiting
- Implement API key authentication
- Add request/response logging

## 🚨 Error Handling

All endpoints return standard error responses:

```json
{
  "detail": "Service not found"
}
```

Status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `409`: Conflict (duplicate URL)
- `500`: Server Error

## 📈 Performance Optimization

- Connection pooling (10 connections, 20 overflow)
- Database indexes on foreign keys
- Pagination support (skip/limit)
- Async HTTP checks
- Efficient query caching

## 🛠️ Development

### Add new endpoint

1. Create route in `app/routes/`
2. Import in `app/main.py`
3. Include router: `app.include_router(router)`

### Add new model

1. Create in `app/models.py`
2. Create schema in `app/schemas.py`
3. Create service logic
4. Create routes

### Logging

Configured to show:

- Timestamp
- Logger name
- Log level
- Message

### Environment Variables

```
DATABASE_URL      # PostgreSQL connection string
DEBUG             # Debug mode
API_HOST          # Server host
API_PORT          # Server port
```

## 📝 Logs

Monitor logs for:

- `INFO`: Normal operations
- `WARNING`: Service down
- `ERROR`: Monitoring/database errors

## 🐛 Troubleshooting

### Database connection fails

- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

### Scheduler not running

- Check logs for errors
- Verify no other instance running
- Check APScheduler installation

### Services not being checked

- Verify services are marked `active=true`
- Check scheduler logs
- Verify database connectivity

## 📚 Dependencies

- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **sqlalchemy**: ORM
- **psycopg2**: PostgreSQL driver
- **httpx**: Async HTTP client
- **apscheduler**: Background scheduling
- **python-dotenv**: Environment variables
- **pydantic**: Data validation

## 🚀 Production Deployment

### Using Gunicorn + Uvicorn

```bash
pip install gunicorn

gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Environment

```
DATABASE_URL=postgresql://user:pass@db.example.com/dragonping_db
DEBUG=False
API_HOST=0.0.0.0
API_PORT=8000
```

## 📖 Further Documentation

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [APScheduler Docs](https://apscheduler.readthedocs.io/)
- [httpx Documentation](https://www.python-httpx.org/)

## 📄 License

MIT License

---

**Version:** 0.1.0  
**Last Updated:** February 2024
