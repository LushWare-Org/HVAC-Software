#!/bin/bash
# ============================================================================
# T&S CRM — Deploy the current release batch
#
# Batch contents (built on feat/marketing):
#   crm-service        technician avatars (object storage), posts URL trimming
#   comms-service      en-route customer notification (email+SMS), outreach
#                      email flag on thread messages
#   scheduling-service en-route trigger + OSRM ETA windows
#   admin-dashboard    Day Planner overhaul, map "Job details" toggles,
#                      z-index fixes, page titles, content image preview,
#                      Add Technician photo
#   customer-portal    full redesign (dashboard hero, booking wizard,
#                      My Jobs cards), Tips/Offers fixes
#
# Usage (from repo root):
#   bash scripts/deploy-latest.sh                  # backend images + frontends
#   bash scripts/deploy-latest.sh --setup-avatars  # + one-time GCS avatar setup
#   bash scripts/deploy-latest.sh --backend-only
#   bash scripts/deploy-latest.sh --frontend-only
#
# Notes
#   • Cloud Run deploys are image-updates only — existing env vars are KEPT.
#     New env vars are added with --update-env-vars (never --set-env-vars,
#     see docs/NGINX_FIX_GUIDE.md for why).
#   • --setup-avatars is required ONCE before technician photo uploads work
#     in prod: creates the public-read GCS bucket, an HMAC key for the
#     S3-interop API, and sets the S3_* env vars on crm-service.
# ============================================================================
set -euo pipefail

PROJECT="${GCP_PROJECT:-hvactor}"
REGISTRY="us-central1-docker.pkg.dev/${PROJECT}/tscrm-images"
REGION="us-central1"
GATEWAY="https://nginx-gateway-srkxrd2xka-uc.a.run.app"
AVATAR_BUCKET="${AVATAR_BUCKET:-tscrm-avatars-2026}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DOCKER_DEFAULT_PLATFORM="linux/amd64"

BACKEND=true
FRONTEND=true
SETUP_AVATARS=false
for arg in "$@"; do
  case "$arg" in
    --backend-only)  FRONTEND=false ;;
    --frontend-only) BACKEND=false ;;
    --setup-avatars) SETUP_AVATARS=true ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

cd "$PROJECT_ROOT"

echo "============================================="
echo " T&S CRM — deploy latest (en-route batch)"
echo "============================================="

# ── Preflight ───────────────────────────────────────────────────────────────
if ! gcloud auth print-access-token >/dev/null 2>&1; then
  echo "❌ gcloud auth expired — run: gcloud auth login"
  exit 1
fi
if $BACKEND && ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running"
  exit 1
fi

# ── One-time: avatar object storage (GCS via S3 interop) ───────────────────
if $SETUP_AVATARS; then
  echo ""
  echo "STEP 0: Avatar storage setup (one-time)"
  echo "---------------------------------------------"

  # Bucket: public read (photo URLs are embedded in customer emails)
  if gcloud storage buckets describe "gs://${AVATAR_BUCKET}" >/dev/null 2>&1; then
    echo "  Bucket gs://${AVATAR_BUCKET} already exists"
  else
    gcloud storage buckets create "gs://${AVATAR_BUCKET}" \
      --project="$PROJECT" --location="$REGION" --default-storage-class=STANDARD
    echo "  ✅ Bucket created"
  fi
  gcloud storage buckets add-iam-policy-binding "gs://${AVATAR_BUCKET}" \
    --member=allUsers --role=roles/storage.objectViewer >/dev/null
  echo "  ✅ Public read enabled"

  # Runtime service account of crm-service (falls back to default compute SA)
  RUN_SA=$(gcloud run services describe crm-service --region="$REGION" \
    --format='value(spec.template.spec.serviceAccountName)')
  if [ -z "$RUN_SA" ]; then
    PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
    RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  fi
  echo "  Runtime SA: $RUN_SA"

  # Write access for the service on this bucket only
  gcloud storage buckets add-iam-policy-binding "gs://${AVATAR_BUCKET}" \
    --member="serviceAccount:${RUN_SA}" --role=roles/storage.objectAdmin >/dev/null
  echo "  ✅ Write access granted"

  # HMAC key for the S3-interoperability API (secret is shown only at creation)
  echo "  Creating HMAC key…"
  HMAC_OUT=$(gcloud storage hmac create "$RUN_SA" --project="$PROJECT" --format=json)
  S3_ACCESS_KEY=$(echo "$HMAC_OUT" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["metadata"]["accessId"])')
  S3_SECRET_KEY=$(echo "$HMAC_OUT" | python3 -c 'import json,sys; print(json.load(sys.stdin)["secret"])')
  echo "  ✅ HMAC key created (accessId: ${S3_ACCESS_KEY})"

  echo "  Setting S3_* env vars on crm-service…"
  gcloud run services update crm-service --region="$REGION" \
    --update-env-vars="S3_ENDPOINT=https://storage.googleapis.com,S3_ACCESS_KEY=${S3_ACCESS_KEY},S3_SECRET_KEY=${S3_SECRET_KEY},S3_BUCKET_AVATARS=${AVATAR_BUCKET},S3_PUBLIC_BASE_URL=https://storage.googleapis.com/${AVATAR_BUCKET},S3_AUTO_CREATE_BUCKET=false" \
    >/dev/null
  echo "  ✅ crm-service env updated"
fi

# ── Backend: build, push, deploy ────────────────────────────────────────────
if $BACKEND; then
  SERVICES=(crm-service comms-service scheduling-service)

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
  echo "STEP 2: Deploy to Cloud Run (env vars preserved)"
  echo "---------------------------------------------"
  for SVC in "${SERVICES[@]}"; do
    echo "→ ${SVC}…"
    gcloud run deploy "$SVC" \
      --image="${REGISTRY}/${SVC}:latest" \
      --region="$REGION" \
      --allow-unauthenticated \
      --quiet
    # Guard against pinned traffic: a service stuck on an old named revision
    # silently ignores every new deploy (this bit us on comms-service).
    gcloud run services update-traffic "$SVC" --to-latest --region="$REGION" --quiet >/dev/null
    echo "✅ ${SVC} deployed (traffic → latest)"
  done

  # The en-route flow needs scheduling → comms; make sure the URL is set.
  echo ""
  echo "STEP 3: Wire scheduling → comms (en-route notifications)"
  echo "---------------------------------------------"
  COMMS_URL=$(gcloud run services describe comms-service --region="$REGION" --format='value(status.url)')
  gcloud run services update scheduling-service --region="$REGION" \
    --update-env-vars="COMMS_SERVICE_URL=${COMMS_URL}" >/dev/null
  echo "✅ COMMS_SERVICE_URL=${COMMS_URL}"
fi

# ── Frontends: build + Firebase Hosting ─────────────────────────────────────
if $FRONTEND; then
  echo ""
  echo "STEP 4: Build frontends"
  echo "---------------------------------------------"
  pnpm --filter admin-dashboard build
  pnpm --filter customer-portal build

  echo ""
  echo "STEP 5: Deploy Firebase Hosting (admin + portal)"
  echo "---------------------------------------------"
  npx firebase-tools deploy --only hosting --project "$PROJECT"
fi

# ── Health checks ────────────────────────────────────────────────────────────
echo ""
echo "STEP 6: Health checks"
echo "---------------------------------------------"
for SVC in crm comms scheduling; do
  printf "  %-12s " "$SVC:"
  curl -s --max-time 10 "${GATEWAY}/api/${SVC}/health" 2>/dev/null | head -c 80
  echo ""
done

# The avatar route 404s on the OLD revision — anything but 404 means the new
# code is live (401/400 are expected without auth/file).
printf "  %-12s " "avatar api:"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST "${GATEWAY}/api/crm/users/me/avatar")
if [ "$CODE" = "404" ]; then
  echo "❌ still 404 — old crm-service revision serving?"
else
  echo "✅ route live (HTTP ${CODE})"
fi

echo ""
echo "============================================="
echo "✅ DEPLOY COMPLETE"
echo "============================================="
echo "  Admin:   https://tscrm-demo-admin.web.app"
echo "  Portal:  https://tscrm-demo-customer.web.app"
echo "  Gateway: ${GATEWAY}"
if ! $SETUP_AVATARS; then
  echo ""
  echo "  ⚠ Reminder: if avatar storage was never set up in prod, run once:"
  echo "    bash scripts/deploy-latest.sh --setup-avatars --backend-only"
fi
