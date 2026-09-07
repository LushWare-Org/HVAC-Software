#!/bin/bash
# ============================================================================
# T&S CRM — Deploy everything (migrations + all 8 backends + both frontends)
#
# Ships whatever is currently committed on the checked-out branch, including
# the Housing Scheme project-template feature (crm-service, job-service,
# customer-portal) that was committed but never deployed, plus today's
# Agreements + Customer Details admin-dashboard redesign.
#
# Usage (from repo root):
#   bash scripts/deploy-all.sh                  # migrations + backend + frontend
#   bash scripts/deploy-all.sh --skip-migrations
#   bash scripts/deploy-all.sh --backend-only
#   bash scripts/deploy-all.sh --frontend-only   # implies --skip-migrations
#
# Safety notes
#   • Cloud Run deploys are IMAGE-UPDATES ONLY — no --set-env-vars, no
#     --update-env-vars. Existing env vars on every service are left exactly
#     as they are. If a service ever needs a new/changed env var, that's a
#     separate, deliberate step — never bundle it into this script.
#   • Migrations run via scripts/apply-migrations.mjs, which is idempotent
#     (tracks applied migrations in _prisma_migrations per schema) — safe to
#     re-run, will skip anything already applied.
#   • Requires `gcloud auth login` to have been run already (interactive —
#     this script cannot do it for you) and Docker Desktop running.
# ============================================================================
set -euo pipefail

PROJECT="hvactor"
REGISTRY="us-central1-docker.pkg.dev/${PROJECT}/tscrm-images"
REGION="us-central1"
GATEWAY="https://nginx-gateway-536584181394.us-central1.run.app"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DOCKER_DEFAULT_PLATFORM="linux/amd64"

MIGRATIONS=true
BACKEND=true
FRONTEND=true
for arg in "$@"; do
  case "$arg" in
    --skip-migrations) MIGRATIONS=false ;;
    --backend-only)    FRONTEND=false ;;
    --frontend-only)   BACKEND=false; MIGRATIONS=false ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

cd "$PROJECT_ROOT"

echo "============================================="
echo " T&S CRM — deploy all"
echo "============================================="
date

# ── Preflight ───────────────────────────────────────────────────────────────
if ! gcloud auth print-access-token >/dev/null 2>&1; then
  echo "❌ gcloud auth expired or missing — run: gcloud auth login"
  exit 1
fi
if ($BACKEND) && ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running"
  exit 1
fi

# ── Step 0: pending DB migrations (Housing Scheme — crm + jobs schemas) ─────
if $MIGRATIONS; then
  echo ""
  echo "STEP 0: Apply pending migrations"
  echo "---------------------------------------------"
  # Checked here rather than letting it fail inside the runner, so a missing
  # credential stops the deploy before any image is built.
  if [ -z "${MIGRATIONS_DATABASE_URL:-}" ]; then
    echo "❌ MIGRATIONS_DATABASE_URL is not set."
    echo "   source ~/tscrm-env-restore.sh   (or export it), then re-run."
    echo "   To deploy without touching the database: --skip-migrations"
    exit 1
  fi
  node scripts/apply-migrations.mjs
  echo "✅ Migrations applied (or already up to date)"
fi

# ── Backend: build, push, deploy (image-only — env vars untouched) ─────────
if $BACKEND; then
  SERVICES=(crm-service job-service finance-service comms-service scheduling-service analytics-service inventory-service chat-service)

  echo ""
  echo "STEP 1: Build & push images (${SERVICES[*]})"
  echo "---------------------------------------------"
  for SVC in "${SERVICES[@]}"; do
    echo ""
    echo "🔨 Building ${SVC}…"
    docker build --platform linux/amd64 \
      -f "apps/${SVC}/Dockerfile" \
      -t "${REGISTRY}/${SVC}:latest" \
      .
    docker push "${REGISTRY}/${SVC}:latest"
    echo "✅ ${SVC} pushed"
  done

  echo ""
  echo "STEP 2: Deploy to Cloud Run (image update only — env vars preserved)"
  echo "---------------------------------------------"
  for SVC in "${SERVICES[@]}"; do
    echo "→ ${SVC}…"
    gcloud run deploy "$SVC" \
      --image="${REGISTRY}/${SVC}:latest" \
      --region="$REGION" \
      --allow-unauthenticated \
      --quiet
    # Guard against pinned traffic: a service stuck on an old named revision
    # silently ignores every new deploy (bit us on comms-service before).
    gcloud run services update-traffic "$SVC" --to-latest --region="$REGION" --quiet >/dev/null
    echo "✅ ${SVC} deployed (traffic → latest)"
  done
fi

# ── Frontends: build + Firebase Hosting ─────────────────────────────────────
if $FRONTEND; then
  echo ""
  echo "STEP 3: Build frontends"
  echo "---------------------------------------------"
  pnpm --filter admin-dashboard build
  pnpm --filter customer-portal build
  pnpm --filter hvac-landing build

  echo ""
  echo "STEP 4: Deploy Firebase Hosting (admin + portal)"
  echo "---------------------------------------------"
  npx firebase-tools deploy --only hosting --project "$PROJECT"
fi

# ── Health checks ────────────────────────────────────────────────────────────
echo ""
echo "STEP 5: Health checks"
echo "---------------------------------------------"
for SVC in crm jobs scheduling finance comms analytics inventory chat; do
  printf "  %-12s " "$SVC:"
  curl -s --max-time 10 "${GATEWAY}/api/${SVC}/health" 2>/dev/null | head -c 80
  echo ""
done

echo ""
echo "============================================="
echo "✅ DEPLOY COMPLETE"
echo "============================================="
date
echo "  Admin:   https://hvactor-admin.web.app"
echo "  Portal:  https://hvactor-customer.web.app"
echo "  Landing: https://hvactor-landing.web.app"
echo "  Gateway: ${GATEWAY}"
