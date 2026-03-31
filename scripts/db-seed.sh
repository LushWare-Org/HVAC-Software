#!/usr/bin/env bash
# ============================================================
# T&S CRM — Seed all services with demo data (correct order)
# Usage: ./scripts/db-seed.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Seeding demo data...${NC}"
echo ""

# CRM must seed FIRST (creates the company + users that other services reference)
SEED_ORDER=(
  "crm-service"
  "job-service"
  "finance-service"
)

for svc in "${SEED_ORDER[@]}"; do
  SEED_FILE="apps/$svc/prisma/seed.ts"
  if [ -f "$SEED_FILE" ]; then
    echo -n "  Seeding $svc... "
    if pnpm --filter "$svc" prisma:seed 2>&1 | tail -3 | head -1; then
      echo -e "  ${GREEN}done${NC}"
    else
      echo -e "  ${RED}FAILED${NC}"
      echo -e "${YELLOW}  Try running manually: pnpm --filter $svc prisma:seed${NC}"
    fi
  else
    echo -e "  ${YELLOW}Skipping $svc (no seed file)${NC}"
  fi
done

echo ""
echo -e "${GREEN}Seeding complete.${NC}"
echo ""
echo "Demo credentials:"
echo "  Admin:      admin@tsbrothers.com / Admin@2024!"
echo "  Manager:    manager@tsbrothers.com / Manager@2024!"
echo "  Dispatcher: dispatch@tsbrothers.com / Dispatch@2024!"
echo "  Tech 1:     mike.wilson@tsbrothers.com / Tech@2024!"
echo "  Tech 2:     sarah.davis@tsbrothers.com / Tech@2024!"
echo "  Tech 3:     james.brown@tsbrothers.com / Tech@2024!"
