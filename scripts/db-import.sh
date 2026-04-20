#!/usr/bin/env bash
# ============================================================
# db-import.sh — Import T&S CRM data from a shared archive
#
# Usage:
#   ./scripts/db-import.sh ./exports/tscrm-data-2026-03-31.tar.gz
#
# WARNING: This REPLACES all existing data in your local DB.
# ============================================================
set -euo pipefail

ARCHIVE="${1:-}"

if [[ -z "$ARCHIVE" ]]; then
  echo "Usage: ./scripts/db-import.sh <path-to-archive.tar.gz>"
  exit 1
fi

if [[ ! -f "$ARCHIVE" ]]; then
  echo "✗ File not found: $ARCHIVE"
  exit 1
fi

PG_CONTAINER="tscrm_postgres"
PG_USER="tscrm_user"
PG_DB="tscrm"

MONGO_CONTAINER="tscrm_mongodb"
MONGO_DB="tscrm_comms"

WORK_DIR="$(mktemp -d)"
cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       T&S CRM — Database Import          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Archive: $ARCHIVE"
echo ""

# ── Verify containers are running ──────────────────────────
for container in "$PG_CONTAINER" "$MONGO_CONTAINER"; do
  if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    echo "✗ Container '$container' is not running."
    echo "  Start it with: docker-compose up -d"
    exit 1
  fi
done
echo "✓ Containers verified"

# ── Confirm ─────────────────────────────────────────────────
echo ""
echo "⚠ WARNING: This will REPLACE all existing data in your local database."
read -r -p "  Continue? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "  Aborted."
  exit 0
fi

# ── Extract archive ─────────────────────────────────────────
echo ""
echo "▶ Extracting archive..."
tar -xzf "$ARCHIVE" -C "$WORK_DIR"
echo "  ✓ Extracted"

# ── PostgreSQL restore ──────────────────────────────────────
PG_DUMP="$WORK_DIR/postgres/tscrm.sql"
if [[ ! -f "$PG_DUMP" ]]; then
  echo "✗ PostgreSQL dump not found inside archive."
  exit 1
fi

echo ""
echo "▶ Restoring PostgreSQL..."

# Drop all existing schemas (data only — preserve structure from init.sql)
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -q <<'SQL'
DO $$
DECLARE
  s TEXT;
BEGIN
  FOR s IN SELECT schema_name FROM information_schema.schemata
    WHERE schema_name IN ('crm','jobs','scheduling','finance','inventory','analytics')
  LOOP
    EXECUTE format('DROP SCHEMA %I CASCADE', s);
    EXECUTE format('CREATE SCHEMA %I AUTHORIZATION tscrm_user', s);
  END LOOP;
END $$;
SQL

# Restore from dump
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -q < "$PG_DUMP"
echo "  ✓ PostgreSQL restored"

# ── MongoDB restore ─────────────────────────────────────────
MONGO_DUMP="$WORK_DIR/mongodb/$MONGO_DB"
if [[ ! -d "$MONGO_DUMP" ]]; then
  echo "  ⚠ No MongoDB data found in archive — skipping."
else
  echo ""
  echo "▶ Restoring MongoDB ($MONGO_DB)..."

  # Copy dump files into the container
  docker cp "$MONGO_DUMP" "$MONGO_CONTAINER:/tmp/mongorestore_data"

  # Drop and restore
  docker exec "$MONGO_CONTAINER" mongosh --quiet --eval \
    "db.getSiblingDB('$MONGO_DB').dropDatabase()" > /dev/null 2>&1 || true

  docker exec "$MONGO_CONTAINER" mongorestore \
    --db "$MONGO_DB" \
    --drop \
    "/tmp/mongorestore_data" \
    --quiet 2>/dev/null || true

  docker exec "$MONGO_CONTAINER" rm -rf /tmp/mongorestore_data
  echo "  ✓ MongoDB restored"
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║              Import complete             ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Your local database now matches the shared snapshot."
echo "  Restart any running services if needed."
echo ""
