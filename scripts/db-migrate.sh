#!/usr/bin/env bash
# ============================================================
# T&S CRM — Run all database migrations (correct order)
# Uses "prisma migrate deploy" (non-interactive, applies existing migrations)
# Usage: ./scripts/db-migrate.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Running database migrations...${NC}"
echo ""

# Order matters: CRM first (company table is FK'd by other services)
SERVICES_ORDER=(
  "crm-service"
  "job-service"
  "finance-service"
  "analytics-service"
  "inventory-service"
)

FAILED=0
for svc in "${SERVICES_ORDER[@]}"; do
  if [ -d "apps/$svc/prisma/migrations" ]; then
    echo -n "  Migrating $svc... "
    # Use migrate:deploy (non-interactive — just applies existing migration files)
    if OUTPUT=$(pnpm --filter "$svc" prisma:migrate:deploy 2>&1); then
      echo -e "${GREEN}done${NC}"
    else
      echo -e "${RED}FAILED${NC}"
      echo "$OUTPUT" | tail -5
      echo -e "${YELLOW}  Try running manually: pnpm --filter $svc prisma:migrate:deploy${NC}"
      FAILED=$((FAILED + 1))
    fi
  else
    echo -e "  ${YELLOW}Skipping $svc (no migrations folder)${NC}"
  fi
done

# Comms service uses MongoDB — push schema instead of migrate
if [ -f "apps/comms-service/prisma/schema.prisma" ]; then
  echo -n "  Pushing comms-service schema (MongoDB)... "
  if OUTPUT=$(pnpm --filter comms-service prisma:push 2>&1); then
    echo -e "${GREEN}done${NC}"
  else
    echo -e "${YELLOW}skipped (may need MongoDB replica set — restart mongodb and retry)${NC}"
  fi
fi

echo ""
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All migrations complete.${NC}"
else
  echo -e "${RED}$FAILED migration(s) failed. Check errors above.${NC}"
  exit 1
fi
