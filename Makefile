.PHONY: dev build up down logs test lint format

# Development
dev:
	docker compose -f docker-compose.dev.yml up --build

# Production
build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

# Testing & Quality
test:
	cd backend && pytest tests/ -v

lint:
	cd backend && ruff check app/

format:
	cd backend && ruff check app/ --fix
