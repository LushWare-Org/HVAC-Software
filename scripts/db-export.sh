#!/usr/bin/env bash
# ============================================================
# db-export.sh — Export all T&S CRM data for sharing
# Creates a single .tar.gz with PostgreSQL + MongoDB dumps
#
# Usage:
#   ./scripts/db-export.sh
#   ./scripts/db-export.sh my-custom-name   (custom archive name)
#
# Output: ./exports/tscrm-data-<YYYY-MM-DD>.tar.gz
# ============================================================
set -euo pipefail

ARCHIVE_NAME="${1:-tscrm-data-$(date +%Y-%m-%d)}"
EXPORT_DIR="$(cd "$(dirname "$0")/.." && pwd)/exports"
WORK_DIR="$(mktemp -d)"

PG_CONTAINER="tscrm_postgres"
PG_USER="tscrm_user"
PG_DB="tscrm"

MONGO_CONTAINER="tscrm_mongodb"
MONGO_DB="tscrm_comms"

cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       T&S CRM — Database Export          ║"
echo "╚══════════════════════════════════════════╝"
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

mkdir -p "$WORK_DIR/postgres" "$WORK_DIR/mongodb" "$EXPORT_DIR"

# ── PostgreSQL dump ─────────────────────────────────────────
echo ""
echo "▶ Dumping PostgreSQL (all schemas)..."
docker exec "$PG_CONTAINER" pg_dump \
  -U "$PG_USER" \
  -d "$PG_DB" \
  --no-owner \
  --no-acl \
  -F plain \
  > "$WORK_DIR/postgres/tscrm.sql"

PG_SIZE=$(du -sh "$WORK_DIR/postgres/tscrm.sql" | cut -f1)
echo "  ✓ PostgreSQL dump: $PG_SIZE"

# ── MongoDB dump ────────────────────────────────────────────
echo ""
echo "▶ Dumping MongoDB ($MONGO_DB)..."
docker exec "$MONGO_CONTAINER" mongodump \
  --db "$MONGO_DB" \
  --out /tmp/mongodump \
  --quiet 2>/dev/null || true

docker cp "$MONGO_CONTAINER:/tmp/mongodump/$MONGO_DB" "$WORK_DIR/mongodb/$MONGO_DB"
docker exec "$MONGO_CONTAINER" rm -rf /tmp/mongodump

MONGO_SIZE=$(du -sh "$WORK_DIR/mongodb" | cut -f1)
echo "  ✓ MongoDB dump: $MONGO_SIZE"

# ── Write a README inside the archive ──────────────────────
cat > "$WORK_DIR/RESTORE.md" <<EOF
# T&S CRM — Database Snapshot

Exported: $(date '+%Y-%m-%d %H:%M:%S')
Schemas:  crm, jobs, scheduling, finance, inventory, analytics
MongoDB:  tscrm_comms

## How to restore

1. Make sure Docker is running and containers are up:
   \`\`\`
   docker-compose up -d
   \`\`\`

2. Run the import script from the project root:
   \`\`\`
   ./scripts/db-import.sh /path/to/$(basename "$EXPORT_DIR/${ARCHIVE_NAME}.tar.gz")
   \`\`\`

That's it. The import script will restore both PostgreSQL and MongoDB.
EOF

# ── Package everything ──────────────────────────────────────
echo ""
echo "▶ Packaging archive..."
tar -czf "$EXPORT_DIR/${ARCHIVE_NAME}.tar.gz" -C "$WORK_DIR" .

FINAL_SIZE=$(du -sh "$EXPORT_DIR/${ARCHIVE_NAME}.tar.gz" | cut -f1)

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║              Export complete             ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  File : exports/${ARCHIVE_NAME}.tar.gz"
echo "  Size : $FINAL_SIZE"
echo ""
echo "  Share this file with your colleague, then they run:"
echo "  ./scripts/db-import.sh exports/${ARCHIVE_NAME}.tar.gz"
echo ""
