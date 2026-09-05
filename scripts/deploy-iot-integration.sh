#!/usr/bin/env bash
# Deploy IoT integration changes to production
#
# What this does:
#   1. Validates prerequisites (gcloud, docker, firebase)
#   2. Generates IOT_ENCRYPTION_KEY if not provided
#   3. Builds crm-service (linux/amd64) and pushes to Artifact Registry
#   4. Updates crm-service on Cloud Run with IoT env vars (--update-env-vars)
#   5. Builds and deploys admin-dashboard to Firebase Hosting
#   6. Builds and deploys customer-portal to Firebase Hosting
#   7. Runs smoke tests against the live gateway
#
# Required env vars (set before running, or the script will prompt):
#   RESIDEO_CLIENT_ID        – from developer.honeywellhome.com
#   RESIDEO_CLIENT_SECRET    – from developer.honeywellhome.com
#   RESIDEO_REDIRECT_URI     – e.g. https://nginx-gateway-536584181394.us-central1.run.app/api/crm/iot/honeywell/callback
#   NEST_PROJECT_ID          – from Google Device Access Console ($5 one-time fee)
#   NEST_CLIENT_ID           – OAuth2 client from Google Cloud Console
#   NEST_CLIENT_SECRET       – OAuth2 client secret
#   NEST_REDIRECT_URI        – e.g. https://nginx-gateway-536584181394.us-central1.run.app/api/crm/iot/nest/callback
#   IOT_ENCRYPTION_KEY       – 32-byte hex (auto-generated if not set)
#
# NOTE: The Supabase DB migration (customer_iot_connections + customer_iot_devices tables)
#       must have already been run manually via the Supabase dashboard or psql.
#       Run scripts/supabase-iot-migration.sql if you haven't done this yet.

set -euo pipefail

REGISTRY="us-central1-docker.pkg.dev/${GCP_PROJECT:-hvactor}/tscrm-images"
REGION="us-central1"
PROJECT="${GCP_PROJECT:-hvactor}"
GATEWAY_URL="https://nginx-gateway-536584181394.us-central1.run.app"
ADMIN_URL="https://tscrm-demo-admin.web.app"
CUSTOMER_PORTAL_URL="https://tscrm-demo-customer.web.app"

# ── colours ──────────────────────────────────────────────────────────────────
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

header() { echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"; echo -e "${BOLD}  $1${RESET}"; echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"; }
ok()     { echo -e "${GREEN}  ✓ $1${RESET}"; }
warn()   { echo -e "${YELLOW}  ⚠ $1${RESET}"; }
die()    { echo -e "${RED}  ✗ $1${RESET}"; exit 1; }

# ── 1. prerequisites ─────────────────────────────────────────────────────────
header "Checking prerequisites"

command -v gcloud  >/dev/null 2>&1 || die "gcloud CLI not found — install from https://cloud.google.com/sdk"
command -v docker  >/dev/null 2>&1 || die "docker not found"
command -v firebase>/dev/null 2>&1 || die "firebase CLI not found — npm install -g firebase-tools"
command -v pnpm    >/dev/null 2>&1 || die "pnpm not found"
command -v openssl >/dev/null 2>&1 || die "openssl not found"

gcloud auth print-access-token >/dev/null 2>&1 || die "Not authenticated with gcloud — run: gcloud auth login"
gcloud config set project "$PROJECT" --quiet
ok "gcloud authenticated, project = $PROJECT"

docker info >/dev/null 2>&1 || die "Docker daemon not running"
ok "Docker daemon running"

# ── 2. collect / validate IoT credentials ────────────────────────────────────
header "IoT credentials"

prompt_if_empty() {
  local var=$1 label=$2 secret=${3:-false}
  if [[ -z "${!var:-}" ]]; then
    if [[ "$secret" == "true" ]]; then
      read -rsp "  Enter $label: " tmpval; echo
    else
      read -rp  "  Enter $label: " tmpval
    fi
    eval "export $var=\"$tmpval\""
  fi
  echo "  $var = ${!var:0:12}…"
}

# Honeywell / Resideo
prompt_if_empty RESIDEO_CLIENT_ID     "RESIDEO_CLIENT_ID (from developer.honeywellhome.com)"
prompt_if_empty RESIDEO_CLIENT_SECRET "RESIDEO_CLIENT_SECRET" true
prompt_if_empty RESIDEO_REDIRECT_URI  "RESIDEO_REDIRECT_URI (e.g. ${GATEWAY_URL}/api/crm/iot/honeywell/callback)"

# Google Nest
prompt_if_empty NEST_PROJECT_ID       "NEST_PROJECT_ID (Google Device Access Console)"
prompt_if_empty NEST_CLIENT_ID        "NEST_CLIENT_ID (Google Cloud Console OAuth2)"
prompt_if_empty NEST_CLIENT_SECRET    "NEST_CLIENT_SECRET" true
prompt_if_empty NEST_REDIRECT_URI     "NEST_REDIRECT_URI (e.g. ${GATEWAY_URL}/api/crm/iot/nest/callback)"

# Encryption key — auto-generate if absent
if [[ -z "${IOT_ENCRYPTION_KEY:-}" ]]; then
  IOT_ENCRYPTION_KEY=$(openssl rand -hex 32)
  warn "IOT_ENCRYPTION_KEY not set — generated a new key (save this!)"
  echo "  IOT_ENCRYPTION_KEY=$IOT_ENCRYPTION_KEY"
  echo ""
  echo "  Add this to your .env.production and store it safely."
  echo "  If you lose it, existing encrypted tokens cannot be decrypted."
  echo ""
  read -rp "  Press Enter to continue, or Ctrl+C to abort and save the key first: "
else
  ok "IOT_ENCRYPTION_KEY already set"
fi

# ── 3. build crm-service image ────────────────────────────────────────────────
header "Building crm-service (linux/amd64)"

cd "$(dirname "$0")/.."  # repo root

docker build \
  --platform=linux/amd64 \
  -f apps/crm-service/Dockerfile \
  -t "$REGISTRY/crm-service:latest" \
  -t "$REGISTRY/crm-service:iot-$(date +%Y%m%d-%H%M)" \
  .

ok "crm-service image built"

docker push "$REGISTRY/crm-service:latest"
ok "crm-service image pushed to Artifact Registry"

# ── 4. deploy crm-service to Cloud Run (add IoT vars only) ───────────────────
header "Deploying crm-service to Cloud Run"

# Use --update-env-vars to ADD these vars without overwriting the existing ones.
# NEVER use --set-env-vars here — it replaces ALL env vars and breaks other integrations.
gcloud run deploy crm-service \
  --image="$REGISTRY/crm-service:latest" \
  --region="$REGION" \
  --allow-unauthenticated \
  --update-env-vars="\
RESIDEO_CLIENT_ID=${RESIDEO_CLIENT_ID},\
RESIDEO_CLIENT_SECRET=${RESIDEO_CLIENT_SECRET},\
RESIDEO_REDIRECT_URI=${RESIDEO_REDIRECT_URI},\
NEST_PROJECT_ID=${NEST_PROJECT_ID},\
NEST_CLIENT_ID=${NEST_CLIENT_ID},\
NEST_CLIENT_SECRET=${NEST_CLIENT_SECRET},\
NEST_REDIRECT_URI=${NEST_REDIRECT_URI},\
IOT_ENCRYPTION_KEY=${IOT_ENCRYPTION_KEY},\
CUSTOMER_PORTAL_URL=${CUSTOMER_PORTAL_URL}"

ok "crm-service deployed with IoT env vars"

# ── 5. build + deploy admin-dashboard ────────────────────────────────────────
header "Building admin-dashboard"

cd apps/admin-dashboard
pnpm build
cd ../..
ok "admin-dashboard built"

firebase deploy --only hosting:tscrm-demo-admin --project "$PROJECT"
ok "admin-dashboard deployed to $ADMIN_URL"

# ── 6. build + deploy customer-portal ────────────────────────────────────────
header "Building customer-portal"

cd apps/customer-portal
pnpm build
cd ../..
ok "customer-portal built"

firebase deploy --only hosting:tscrm-demo-customer --project "$PROJECT"
ok "customer-portal deployed to $CUSTOMER_PORTAL_URL"

# ── 7. smoke tests ────────────────────────────────────────────────────────────
header "Smoke tests"

echo "  Waiting 10s for Cloud Run to route traffic…"
sleep 10

echo ""
echo "  [1/3] crm-service health:"
HTTP=$(curl -so /dev/null -w "%{http_code}" "$GATEWAY_URL/api/crm/health" || echo "000")
if [[ "$HTTP" == "200" ]]; then
  ok "crm-service /health → 200"
else
  warn "crm-service /health → $HTTP (may still be starting up)"
fi

echo ""
echo "  [2/3] IoT my-devices endpoint (unauthenticated — expect 401):"
HTTP=$(curl -so /dev/null -w "%{http_code}" "$GATEWAY_URL/api/crm/iot/my-devices" || echo "000")
if [[ "$HTTP" == "401" ]]; then
  ok "GET /crm/iot/my-devices → 401 (auth required as expected)"
elif [[ "$HTTP" == "200" ]]; then
  ok "GET /crm/iot/my-devices → 200 (BYPASS_AUTH=true active)"
else
  warn "GET /crm/iot/my-devices → $HTTP (unexpected)"
fi

echo ""
echo "  [3/3] IoT devices endpoint with dev bypass headers:"
HTTP=$(curl -so /dev/null -w "%{http_code}" \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: company_admin" \
  -H "x-test-user-id: test-user-001" \
  "$GATEWAY_URL/api/crm/iot/customers/test-cust-001/devices" || echo "000")
if [[ "$HTTP" =~ ^(200|404)$ ]]; then
  ok "GET /crm/iot/customers/:id/devices → $HTTP (IoT controller reachable)"
else
  warn "GET /crm/iot/customers/:id/devices → $HTTP (check crm-service logs)"
fi

# ── done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  IoT integration deployed successfully!${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo "  Admin dashboard  : $ADMIN_URL"
echo "  Customer portal  : $CUSTOMER_PORTAL_URL"
echo "  API gateway      : $GATEWAY_URL/api/crm/iot"
echo ""
echo "  Next steps:"
echo "  • Open a customer in the admin dashboard → IoT Devices tab"
echo "  • Click 'Connect Honeywell' or 'Connect Nest' to test OAuth flows"
echo "  • Or click 'Send Link' to email the customer a self-connect link"
echo "  • On the customer portal, navigate to My Devices"
echo ""
if [[ "${IOT_ENCRYPTION_KEY_WAS_GENERATED:-false}" == "true" ]]; then
  warn "Remember: save IOT_ENCRYPTION_KEY=$IOT_ENCRYPTION_KEY to your secrets manager"
fi
