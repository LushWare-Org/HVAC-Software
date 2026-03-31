#!/usr/bin/env bash
# ============================================================
# T&S CRM — Health Check (verify all services are running)
# Usage: ./scripts/health-check.sh
# ============================================================
set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${BOLD}T&S CRM — Health Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PASS=0
FAIL=0

check() {
  local name=$1
  local url=$2
  local timeout=${3:-3}

  if curl -sf --max-time "$timeout" "$url" &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $name"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $name"
    FAIL=$((FAIL + 1))
  fi
}

check_port() {
  local name=$1
  local port=$2

  if nc -z localhost "$port" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $name (port $port)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $name (port $port)"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo -e "${CYAN}Infrastructure:${NC}"
check_port "PostgreSQL" 5432
check_port "Redis" 6379
check_port "MongoDB" 27017
check     "MinIO" "http://localhost:9000/minio/health/live"
check     "Nginx Gateway" "http://localhost/health"

echo ""
echo -e "${CYAN}Backend Services:${NC}"
check "CRM Service" "http://localhost:3001/crm/health" 5
check "Job Service" "http://localhost:3002/jobs/health" 5
check "Scheduling Service" "http://localhost:3003/health" 5
check "Finance Service" "http://localhost:3004/finance/health" 5
check "Comms Service" "http://localhost:3005/comms/health" 5
check "Analytics Service" "http://localhost:3006/analytics/health" 5
check "Inventory Service" "http://localhost:3007/inventory/health" 5

echo ""
echo -e "${CYAN}Frontend Apps:${NC}"
check_port "Admin Dashboard" 5173
check_port "Customer Portal" 5174

echo ""
echo -e "${CYAN}Dev Tools:${NC}"
check "pgAdmin" "http://localhost:5050" 3
check "Mongo Express" "http://localhost:8081" 3
check_port "Redis Insight" 5540

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}${BOLD}All $PASS checks passed!${NC}"
else
  echo -e "${YELLOW}${BOLD}$PASS passed, $FAIL failed${NC}"
  echo -e "${YELLOW}Tip: Run 'pnpm dev' to start backend services${NC}"
fi
echo ""
