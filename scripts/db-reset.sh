#!/usr/bin/env bash
# ============================================================
# T&S CRM — Reset all databases (nuke + re-migrate + re-seed)
# WARNING: This destroys ALL data. Use for dev only.
# Usage: ./scripts/db-reset.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${RED}${BOLD}WARNING: This will destroy ALL database data and re-create everything.${NC}"
echo ""

# Auto-confirm if --yes flag passed
if [[ "${1:-}" != "--yes" ]]; then
  read -p "Are you sure? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
  fi
fi

echo -e "${YELLOW}Stopping Docker containers...${NC}"
docker compose down -v 2>/dev/null || true

echo -e "${YELLOW}Removing local database data...${NC}"
rm -rf .docker-data/postgres .docker-data/mongodb .docker-data/redis

echo -e "${YELLOW}Starting fresh Docker containers...${NC}"
docker compose up -d postgres redis mongodb minio nginx

# Wait for PostgreSQL
echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
RETRIES=30
until docker compose exec -T postgres pg_isready -U tscrm_user -d tscrm &>/dev/null || [ $RETRIES -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  sleep 2
done

# Wait for MongoDB replica set
echo -e "${YELLOW}Waiting for MongoDB replica set (~20s)...${NC}"
RETRIES=20
until docker compose exec -T mongodb mongosh --quiet --eval "rs.status().ok" 2>/dev/null | grep -q "1" || [ $RETRIES -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  sleep 3
done

# Wait for Redis
sleep 2

# Create MinIO bucket
curl -sf -X PUT http://minioadmin:minioadmin@localhost:9000/tscrm-files &>/dev/null 2>&1 || true

echo ""
echo -e "${GREEN}Running migrations...${NC}"
bash "$SCRIPT_DIR/db-migrate.sh"

echo ""
echo -e "${GREEN}Seeding demo data...${NC}"
bash "$SCRIPT_DIR/db-seed.sh"

echo ""
echo -e "${GREEN}${BOLD}Database reset complete! All data is fresh.${NC}"

# Start GUI tools
docker compose up -d pgadmin mongo-express redisinsight 2>/dev/null || true
