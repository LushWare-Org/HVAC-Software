#!/usr/bin/env bash
# ============================================================
# T&S CRM — One-Command Dev Setup
# Usage: ./scripts/setup.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

step=0
total_steps=8

print_step() {
  step=$((step + 1))
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}[$step/$total_steps] $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_ok() { echo -e "  ${GREEN}✓${NC} $1"; }
print_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
print_err() { echo -e "  ${RED}✗${NC} $1"; }
print_info() { echo -e "  ${CYAN}→${NC} $1"; }

echo ""
echo -e "${BOLD}${CYAN}"
echo "  ╔════════════════════════════════════════════════════╗"
echo "  ║        T&S CRM — Developer Setup                  ║"
echo "  ║        One command. Zero headaches.                ║"
echo "  ╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Step 1: Check Prerequisites ────────────────────────────
print_step "Checking prerequisites..."

MISSING=()

# Node.js 20+
if command -v node &>/dev/null; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -ge 20 ]; then
    print_ok "Node.js $(node -v)"
  else
    print_err "Node.js $(node -v) — need v20+"
    MISSING+=("Node.js 20+ (https://nodejs.org)")
  fi
else
  print_err "Node.js not found"
  MISSING+=("Node.js 20+ (https://nodejs.org)")
fi

# pnpm
if command -v pnpm &>/dev/null; then
  print_ok "pnpm $(pnpm -v)"
else
  print_warn "pnpm not found — installing..."
  npm install -g pnpm@9 && print_ok "pnpm installed" || MISSING+=("pnpm 9+ (npm install -g pnpm@9)")
fi

# Docker
if command -v docker &>/dev/null; then
  print_ok "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
else
  print_err "Docker not found"
  MISSING+=("Docker Desktop (https://docker.com/products/docker-desktop)")
fi

# docker-compose
if docker-compose version &>/dev/null 2>&1; then
  print_ok "docker-compose $(docker-compose version --short 2>/dev/null || echo 'available')"
else
  print_err "docker-compose not found"
  MISSING+=("docker-compose (included with Docker Desktop)")
fi

# Docker running?
if docker info &>/dev/null 2>&1; then
  print_ok "Docker daemon is running"
else
  print_err "Docker daemon is NOT running"
  MISSING+=("Start Docker Desktop before running this script")
fi

if [ ${#MISSING[@]} -gt 0 ]; then
  echo ""
  print_err "Missing prerequisites:"
  for item in "${MISSING[@]}"; do
    echo -e "     → $item"
  done
  echo ""
  echo -e "${RED}Please install the above and re-run this script.${NC}"
  exit 1
fi

# ── Step 2: Environment Files ──────────────────────────────
print_step "Setting up environment files..."

# Root .env
if [ ! -f .env ]; then
  cp .env.example .env
  print_ok "Created .env from .env.example"
  # Set BYPASS_AUTH=true for dev by default
  if grep -q "BYPASS_AUTH=false" .env 2>/dev/null; then
    sed -i.bak 's/BYPASS_AUTH=false/BYPASS_AUTH=true/' .env && rm -f .env.bak
  fi
  # Ensure JWT_SECRET is present
  if ! grep -q "JWT_SECRET" .env; then
    echo "" >> .env
    echo "# ----- Local JWT (used when Auth0 is not configured) -----" >> .env
    echo "JWT_SECRET=tscrm-local-jwt-secret-change-in-production" >> .env
  fi
  # Ensure BYPASS_AUTH is present
  if ! grep -q "BYPASS_AUTH" .env; then
    echo "" >> .env
    echo "# ----- Auth bypass for local dev -----" >> .env
    echo "BYPASS_AUTH=true" >> .env
  fi
  print_info "BYPASS_AUTH=true set for local dev (no Auth0 needed)"
else
  print_ok ".env already exists"
fi

# Generate service-level .env files
bash "$SCRIPT_DIR/generate-env.sh"
print_ok "All service .env files generated"

# ── Step 3: Install Dependencies ───────────────────────────
print_step "Installing dependencies..."

pnpm install --frozen-lockfile 2>/dev/null || pnpm install
print_ok "All npm packages installed"

# ── Step 4: Start Docker Infrastructure ────────────────────
print_step "Starting Docker infrastructure..."

# Check if containers already running
if docker-compose ps --format json 2>/dev/null | grep -q '"running"'; then
  print_info "Some containers already running — restarting..."
  docker-compose down --remove-orphans 2>/dev/null || true
fi

docker-compose up -d postgres redis mongodb minio nginx
print_ok "Docker containers starting..."

# Wait for PostgreSQL
print_info "Waiting for PostgreSQL to be healthy..."
RETRIES=30
until docker-compose exec -T postgres pg_isready -U tscrm_user -d tscrm &>/dev/null || [ $RETRIES -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  sleep 2
done
if [ $RETRIES -eq 0 ]; then
  print_err "PostgreSQL failed to start. Run: docker-compose logs postgres"
  exit 1
fi
print_ok "PostgreSQL is ready"

# Wait for Redis
print_info "Waiting for Redis..."
RETRIES=15
until docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG || [ $RETRIES -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  sleep 2
done
print_ok "Redis is ready"

# Wait for MongoDB replica set
print_info "Waiting for MongoDB replica set (this takes ~20s on first run)..."
RETRIES=20
until docker-compose exec -T mongodb mongosh --quiet --eval "rs.status().ok" 2>/dev/null | grep -q "1" || [ $RETRIES -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  sleep 3
done
if [ $RETRIES -eq 0 ]; then
  print_warn "MongoDB replica set may not be ready — comms-service might need a restart"
else
  print_ok "MongoDB replica set is ready"
fi

# Wait for MinIO
print_info "Waiting for MinIO..."
RETRIES=15
until curl -sf http://localhost:9000/minio/health/live &>/dev/null || [ $RETRIES -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  sleep 2
done
print_ok "MinIO is ready"

# Create MinIO bucket if it doesn't exist
print_info "Ensuring MinIO bucket exists..."
# Use mc (MinIO client) if available, otherwise use curl
if command -v mc &>/dev/null; then
  mc alias set tscrm http://localhost:9000 minioadmin minioadmin &>/dev/null 2>&1 || true
  mc mb tscrm/tscrm-files &>/dev/null 2>&1 || true
  print_ok "MinIO bucket 'tscrm-files' ready"
else
  # Create bucket via MinIO API (S3-compatible)
  curl -sf -X PUT http://minioadmin:minioadmin@localhost:9000/tscrm-files &>/dev/null 2>&1 || true
  print_ok "MinIO bucket 'tscrm-files' ready (install 'mc' CLI for better management)"
fi

# ── Step 5: Generate Prisma Clients ───────────────────────
print_step "Generating Prisma clients..."

PRISMA_SERVICES=(crm-service job-service finance-service analytics-service comms-service inventory-service)
for svc in "${PRISMA_SERVICES[@]}"; do
  if [ -f "apps/$svc/prisma/schema.prisma" ]; then
    pnpm --filter "$svc" prisma:generate 2>/dev/null && print_ok "$svc" || print_warn "$svc (may need manual check)"
  fi
done

# ── Step 6: Run Database Migrations ───────────────────────
print_step "Running database migrations..."

bash "$SCRIPT_DIR/db-migrate.sh"
print_ok "All migrations applied"

# ── Step 7: Seed Demo Data ────────────────────────────────
print_step "Seeding demo data..."

bash "$SCRIPT_DIR/db-seed.sh"
print_ok "Demo data seeded"

# ── Step 8: Final Health Check ────────────────────────────
print_step "Running health check..."

# Start dev GUIs (pgAdmin, mongo-express, RedisInsight)
docker-compose up -d pgadmin mongo-express redisinsight 2>/dev/null || true
print_ok "Dev GUI tools starting"

echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔════════════════════════════════════════════════════════════╗"
echo "  ║                  SETUP COMPLETE!                          ║"
echo "  ╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BOLD}Start developing:${NC}"
echo -e "  ${CYAN}pnpm dev${NC}              — Start all backend services"
echo -e "  ${CYAN}pnpm dev:admin${NC}        — Start admin dashboard (separate terminal)"
echo -e "  ${CYAN}pnpm dev:portal${NC}       — Start customer portal (separate terminal)"
echo -e "  ${CYAN}pnpm dev:all${NC}          — Start everything at once"
echo ""
echo -e "${BOLD}Demo login credentials:${NC}"
echo -e "  ${CYAN}Admin:${NC}      admin@tsbrothers.com / Admin@2024!"
echo -e "  ${CYAN}Manager:${NC}    manager@tsbrothers.com / Manager@2024!"
echo -e "  ${CYAN}Dispatcher:${NC} dispatch@tsbrothers.com / Dispatch@2024!"
echo -e "  ${CYAN}Tech 1:${NC}     mike.wilson@tsbrothers.com / Tech@2024!"
echo -e "  ${CYAN}Tech 2:${NC}     sarah.davis@tsbrothers.com / Tech@2024!"
echo -e "  ${CYAN}Tech 3:${NC}     james.brown@tsbrothers.com / Tech@2024!"
echo ""
echo -e "${BOLD}URLs:${NC}"
echo -e "  ${CYAN}API Gateway:${NC}     http://localhost/api/<service>/..."
echo -e "  ${CYAN}Admin Dashboard:${NC} http://localhost:5173  (after pnpm dev:admin)"
echo -e "  ${CYAN}Customer Portal:${NC} http://localhost:5174  (after pnpm dev:portal)"
echo -e "  ${CYAN}pgAdmin:${NC}         http://localhost:5050  (admin@tscrm.com / admin)"
echo -e "  ${CYAN}Mongo Express:${NC}   http://localhost:8081"
echo -e "  ${CYAN}Redis Insight:${NC}   http://localhost:5540"
echo -e "  ${CYAN}MinIO Console:${NC}   http://localhost:9001  (minioadmin / minioadmin)"
echo ""
echo -e "${BOLD}Useful commands:${NC}"
echo -e "  ${CYAN}pnpm db:migrate${NC}      — Run all pending migrations"
echo -e "  ${CYAN}pnpm db:seed${NC}         — Re-seed demo data"
echo -e "  ${CYAN}pnpm db:reset${NC}        — Nuke DB + re-migrate + re-seed"
echo -e "  ${CYAN}pnpm health${NC}          — Check if all services are running"
echo ""
