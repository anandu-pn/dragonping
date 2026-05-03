#!/usr/bin/env bash
# =============================================================================
# DragonPing — HPC Install Script
# Configures environment, builds Docker images, starts all services,
# and creates the admin user in one shot.
#
# Usage:
#   chmod +x install.sh
#   ./install.sh
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
die()     { error "$*"; exit 1; }

# ── Banner ───────────────────────────────────────────────────────────────────
echo -e "${BOLD}${CYAN}"
cat << 'EOF'
  ____                              ____  _
 |  _ \ _ __ __ _  __ _  ___  _ _ |  _ \(_)_ __   __ _
 | | | | '__/ _` |/ _` |/ _ \| '_|| |_) | | '_ \ / _` |
 | |_| | | | (_| | (_| | (_) | |  |  __/| | | | | (_| |
 |____/|_|  \__,_|\__, |\___/|_|  |_|   |_|_| |_|\__, |
                  |___/                            |___/
              HPC Installer — Single Port Edition
EOF
echo -e "${RESET}"

# ── Prerequisite checks ───────────────────────────────────────────────────────
info "Checking prerequisites..."

command -v docker        >/dev/null 2>&1 || die "Docker is not installed or not in PATH."
command -v python3       >/dev/null 2>&1 || die "python3 is required (for JWT secret generation)."

# Accept both 'docker compose' (plugin) and 'docker-compose' (standalone)
if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
else
    die "docker compose plugin or docker-compose standalone is required."
fi
success "Docker OK  (compose: $COMPOSE)"

# Must be run from the project root (where docker-compose.hpc.yml lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
[[ -f "docker-compose.hpc.yml" ]] || die "Run this script from the dragonping project root (docker-compose.hpc.yml not found)."
success "Project root: $SCRIPT_DIR"

# ── Existing .env.hpc detection ───────────────────────────────────────────────
RECONFIGURE=false
if [[ -f ".env.hpc" ]]; then
    echo ""
    warn ".env.hpc already exists."
    read -rp "$(echo -e "${YELLOW}Reconfigure it? [y/N]:${RESET} ")" yn
    [[ "${yn,,}" == "y" ]] && RECONFIGURE=true || info "Keeping existing .env.hpc"
else
    RECONFIGURE=true
fi

# ── Interactive configuration ────────────────────────────────────────────────
if [[ "$RECONFIGURE" == "true" ]]; then
    echo ""
    echo -e "${BOLD}─── Database Configuration ──────────────────────────────────${RESET}"

    read -rp "  PostgreSQL password [default: auto-generate]: " DB_PASS
    if [[ -z "$DB_PASS" ]]; then
        DB_PASS=$(python3 -c "import secrets, string; \
            chars=string.ascii_letters+string.digits; \
            print(''.join(secrets.choice(chars) for _ in range(20)))")
        info "Generated DB password: ${BOLD}${DB_PASS}${RESET}"
    fi

    echo ""
    echo -e "${BOLD}─── Network Configuration ───────────────────────────────────${RESET}"

    read -rp "  HPC IP address [default: 192.168.200.75]: " HPC_IP
    HPC_IP="${HPC_IP:-192.168.200.75}"

    read -rp "  External port   [default: 7190]: " HPC_PORT
    HPC_PORT="${HPC_PORT:-7190}"

    echo ""
    echo -e "${BOLD}─── Email / SMTP (Gmail App Password required) ──────────────${RESET}"
    echo -e "  ${CYAN}Get App Password:${RESET} Google Account → Security → 2-Step"
    echo -e "  Verification → App Passwords → create 'DragonPing'"
    echo ""

    read -rp "  Gmail address (SMTP_USER):    " SMTP_USER
    while [[ -z "$SMTP_USER" ]]; do
        warn "Gmail address cannot be empty."
        read -rp "  Gmail address (SMTP_USER):    " SMTP_USER
    done

    read -rsp "  Gmail App Password (hidden):  " SMTP_PASS
    echo ""
    # Strip spaces — Gmail App Passwords look like "xxxx xxxx xxxx xxxx"
    # but spaces are cosmetic only; bash treats them as command separators.
    SMTP_PASS="${SMTP_PASS// /}"
    while [[ -z "$SMTP_PASS" ]]; do
        warn "App password cannot be empty."
        read -rsp "  Gmail App Password (hidden):  " SMTP_PASS
        echo ""
        SMTP_PASS="${SMTP_PASS// /}"
    done

    read -rp "  Alert recipient email [default: same as above]: " ADMIN_EMAIL
    ADMIN_EMAIL="${ADMIN_EMAIL:-$SMTP_USER}"

    echo ""
    echo -e "${BOLD}─── Admin User Account ──────────────────────────────────────${RESET}"

    read -rp "  Admin username  [default: admin]:              " ADMIN_USERNAME
    ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"

    read -rp "  Admin email     [default: $ADMIN_EMAIL]: " ADMIN_USER_EMAIL
    ADMIN_USER_EMAIL="${ADMIN_USER_EMAIL:-$ADMIN_EMAIL}"

    read -rsp "  Admin password  (min 8 chars, hidden):         " ADMIN_PASSWORD
    echo ""
    while [[ ${#ADMIN_PASSWORD} -lt 8 ]]; do
        warn "Password must be at least 8 characters."
        read -rsp "  Admin password  (min 8 chars, hidden):         " ADMIN_PASSWORD
        echo ""
    done

    # ── Generate JWT secret ───────────────────────────────────────────────────
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    info "Generated JWT secret (64-char hex)"

    # ── Write .env.hpc ─────────────────────────────────────────────────────────
    cat > .env.hpc << EOF
# =============================================================
# DragonPing — HPC Environment  (generated by install.sh)
# DO NOT commit this file to git.
# =============================================================

# Database
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="${DB_PASS}"
POSTGRES_DB="dragonping_db"
DATABASE_URL="postgresql://postgres:${DB_PASS}@db:5432/dragonping_db"

# Application
ENVIRONMENT="production"
DEBUG="False"
ENABLE_SLA="true"

# Security
JWT_SECRET_KEY="${JWT_SECRET}"
JWT_ALGORITHM="HS256"
JWT_EXPIRY_HOURS="24"

# SMTP / Email Alerts
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="${SMTP_USER}"
SMTP_PASS="${SMTP_PASS}"
SMTP_FROM_EMAIL="${SMTP_USER}"
ADMIN_EMAIL="${ADMIN_EMAIL}"

# Public Status Page
PUBLIC_DASHBOARD_URL="http://${HPC_IP}:${HPC_PORT}/public"

# Admin user (used by setup step below)
_SETUP_ADMIN_USERNAME="${ADMIN_USERNAME}"
_SETUP_ADMIN_EMAIL="${ADMIN_USER_EMAIL}"
_SETUP_ADMIN_PASSWORD="${ADMIN_PASSWORD}"
EOF

    chmod 600 .env.hpc
    success ".env.hpc written (permissions: 600)"
fi

# ── Load env for later use ────────────────────────────────────────────────────
# shellcheck disable=SC1091
# set -a exports all vars; set +a restores normal behaviour
set -a; source .env.hpc; set +a

# ── Build & start ─────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}─── Building and Starting Containers ────────────────────────${RESET}"
info "This may take 5–10 minutes on first run (downloading images, building)..."
echo ""

$COMPOSE -f docker-compose.hpc.yml --env-file .env.hpc up -d --build

echo ""
info "Waiting for database to become healthy..."
MAX_WAIT=60
WAITED=0
until $COMPOSE -f docker-compose.hpc.yml exec -T db \
        pg_isready -U "${POSTGRES_USER:-postgres}" -q 2>/dev/null; do
    sleep 3
    WAITED=$((WAITED + 3))
    if [[ $WAITED -ge $MAX_WAIT ]]; then
        error "Database did not become healthy within ${MAX_WAIT}s."
        error "Check logs: $COMPOSE -f docker-compose.hpc.yml logs db"
        exit 1
    fi
    echo -n "."
done
echo ""
success "Database is healthy."

info "Waiting for backend API to be ready..."
WAITED=0
until $COMPOSE -f docker-compose.hpc.yml exec -T backend \
        python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" 2>/dev/null; do
    sleep 3
    WAITED=$((WAITED + 3))
    if [[ $WAITED -ge $MAX_WAIT ]]; then
        error "Backend did not become ready within ${MAX_WAIT}s."
        error "Check logs: $COMPOSE -f docker-compose.hpc.yml logs backend"
        exit 1
    fi
    echo -n "."
done
echo ""
success "Backend is ready."

# ── Create admin user ─────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}─── Creating Admin User ─────────────────────────────────────${RESET}"

# Read setup vars from env (set during configuration step)
SETUP_USERNAME="${_SETUP_ADMIN_USERNAME:-admin}"
SETUP_EMAIL="${_SETUP_ADMIN_EMAIL:-admin@dragonping.local}"
SETUP_PASSWORD="${_SETUP_ADMIN_PASSWORD:-AdminPassword123!}"

$COMPOSE -f docker-compose.hpc.yml exec -T backend python3 - << PYEOF
import sys, os
sys.path.insert(0, "/app")

# Env vars are already injected by docker-compose env_file — no load_dotenv needed
from app.db import init_db, SessionLocal
from app.models import User
from app.auth import hash_password

init_db()
db = SessionLocal()

email    = "${SETUP_EMAIL}"
username = "${SETUP_USERNAME}"
password = "${SETUP_PASSWORD}"

existing = db.query(User).filter(User.email == email).first()
if existing:
    print(f"[SKIP] Admin '{email}' already exists (ID={existing.id})")
else:
    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        is_admin=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"[OK] Admin created: {email} (ID={user.id})")

db.close()
PYEOF

success "Admin user configured."

# ── Final status ──────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}─── Container Status ────────────────────────────────────────${RESET}"
$COMPOSE -f docker-compose.hpc.yml ps

# Re-source to get the public URL
set -a; source .env.hpc 2>/dev/null; set +a || true

echo ""
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}  DragonPing is running!${RESET}"
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "  ${BOLD}Dashboard:${RESET}  http://${HPC_IP:-192.168.200.75}:${HPC_PORT:-7190}"
echo -e "  ${BOLD}Login with:${RESET} ${SETUP_EMAIL}  /  (your chosen password)"
echo -e "  ${BOLD}API docs:${RESET}   http://${HPC_IP:-192.168.200.75}:${HPC_PORT:-7190}/docs"
echo -e "  ${BOLD}Public page:${RESET}${PUBLIC_DASHBOARD_URL:-http://192.168.200.75:7190/public}/<username>"
echo ""
echo -e "  ${BOLD}Useful commands:${RESET}"
echo -e "  ${CYAN}docker compose -f docker-compose.hpc.yml logs -f backend${RESET}   # live logs"
echo -e "  ${CYAN}docker compose -f docker-compose.hpc.yml down${RESET}              # stop"
echo -e "  ${CYAN}docker compose -f docker-compose.hpc.yml down -v${RESET}           # stop + wipe DB"
echo ""
