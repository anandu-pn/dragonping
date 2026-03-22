# DragonPing 🐉

DragonPing is a modern uptime monitoring and predictive downtime solution.

## Architecture

- **Backend:** FastAPI (Python 3.11), SQLAlchemy, PostgreSQL (prod) / SQLite (tests), APScheduler (Background Jobs), Scikit-Learn (Anomaly Detection)
- **Frontend:** React, Tailwind CSS, Vite

## Quickstart (Development)

Requires Docker and Docker Compose.

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your settings
   ```bash
   cp .env.example .env
   ```
3. Run the development stack:
   ```bash
   make dev
   ```
4. Access the frontend at `http://localhost:5173` and backend API at `http://localhost:8000/api`

## Native Testing & Linting

Tests run natively using SQLite. No PostgreSQL instance is required to run the test suite.

```bash
# Setup virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install pytest pytest-asyncio httpx ruff

# Run tests
make test

# Run linter
make lint
```

## CI/CD 

GitHub Actions is configured to automatically run `ruff` and `pytest` on all pushes and pull requests to `main`.
