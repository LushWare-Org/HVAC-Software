#!/usr/bin/env bash
# Deploy IoT integration with mock/seed data (no real Honeywell or Nest credentials needed)
#
# Uses BYPASS_AUTH=true (already set on Cloud Run) so the service reads from DB snapshots.
# After deploy, seed mock thermostats for a customer with the printed curl commands.

set -euo pipefail

REGISTRY="us-central1-docker.pkg.dev/${GCP_PROJECT:-hvactor}/tscrm-images"
REGION="us-central1"
PROJECT="${GCP_PROJECT:-hvactor}"
GATEWAY_URL="https://nginx-gateway-srkxrd2xka-uc.a.run.app"
ADMIN_URL="https://tscrm-demo-admin.web.app"
CUSTOMER_URL="https://tscrm-demo-customer.web.app"

BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RESET='\033[0m'
header() { echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n${BOLD}  $1${RESET}\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"; }
ok()     { echo -e "${GREEN}  ✓ $1${RESET}"; }
warn()   { echo -e "${YELLOW}  ⚠ $1${RESET}"; }

# ── prerequisites ─────────────────────────────────────────────────────────────
header "Checking prerequisites"
command -v gcloud   >/dev/null 2>&1 || { echo "gcloud not found"; exit 1; }
command -v docker   >/dev/null 2>&1 || { echo "docker not found"; exit 1; }
command -v firebase >/dev/null 2>&1 || { echo "firebase CLI not found — npm install -g firebase-tools"; exit 1; }
command -v pnpm     >/dev/null 2>&1 || { echo "pnpm not found"; exit 1; }

gcloud auth print-access-token >/dev/null 2>&1 || { echo "Not authenticated — run: gcloud auth login"; exit 1; }
gcloud config set project "$PROJECT" --quiet
docker info >/dev/null 2>&1 || { echo "Docker daemon not running"; exit 1; }
ok "All prerequisites met"

# ── generate encryption key ───────────────────────────────────────────────────
IOT_ENCRYPTION_KEY=$(openssl rand -hex 32)
warn "Generated IOT_ENCRYPTION_KEY — save this to your secrets manager:"
echo "  IOT_ENCRYPTION_KEY=$IOT_ENCRYPTION_KEY"

# ── build crm-service ─────────────────────────────────────────────────────────
header "Building crm-service (linux/amd64)"
cd "$(dirname "$0")/.."

docker build \
  --platform=linux/amd64 \
  -f apps/crm-service/Dockerfile \
  -t "$REGISTRY/crm-service:latest" \
  .
ok "Image built"

docker push "$REGISTRY/crm-service:latest"
ok "Image pushed"

# ── deploy crm-service with IoT vars (placeholder OAuth creds) ────────────────
header "Deploying crm-service"

# OAuth credentials are placeholders — real OAuth flows won't work but mock seed
# data will, because the service reads from DB snapshots when BYPASS_AUTH=true.
gcloud run deploy crm-service \
  --image="$REGISTRY/crm-service:latest" \
  --region="$REGION" \
  --allow-unauthenticated \
  --update-env-vars="\
RESIDEO_CLIENT_ID=placeholder,\
RESIDEO_CLIENT_SECRET=placeholder,\
RESIDEO_REDIRECT_URI=${GATEWAY_URL}/api/crm/iot/honeywell/callback,\
NEST_PROJECT_ID=placeholder,\
NEST_CLIENT_ID=placeholder,\
NEST_CLIENT_SECRET=placeholder,\
NEST_REDIRECT_URI=${GATEWAY_URL}/api/crm/iot/nest/callback,\
IOT_ENCRYPTION_KEY=${IOT_ENCRYPTION_KEY},\
CUSTOMER_PORTAL_URL=${CUSTOMER_URL}"

ok "crm-service deployed"

# ── build + deploy frontends ──────────────────────────────────────────────────
header "Building admin-dashboard"
cd apps/admin-dashboard && pnpm build && cd ../..
ok "admin-dashboard built"

firebase deploy --only hosting:tscrm-demo-admin --project "$PROJECT"
ok "admin-dashboard → $ADMIN_URL"

header "Building customer-portal"
cd apps/customer-portal && pnpm build && cd ../..
ok "customer-portal built"

firebase deploy --only hosting:tscrm-demo-customer --project "$PROJECT"
ok "customer-portal → $CUSTOMER_URL"

# ── print seed instructions ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  Deployed! Seed mock thermostat data with these steps:${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo "  1. Open the admin dashboard and go to any customer."
echo "     Copy the customer ID from the URL or IoT Devices tab."
echo ""
echo "  2. Run this curl command (replace CUSTOMER_ID):"
echo ""
echo "     curl -X POST \\"
echo "       '${GATEWAY_URL}/api/crm/iot/dev-seed/CUSTOMER_ID' \\"
echo "       -H 'x-test-company-id: co-demo-001' \\"
echo "       -H 'x-test-user-id: test-user-001' \\"
echo "       -H 'x-test-user-role: company_admin' \\"
echo "       -H 'x-test-user-name: Admin User' \\"
echo "       -H 'x-test-user-email: admin@demo.com'"
echo ""
echo "  3. Refresh the IoT Devices tab — two Honeywell + one Nest"
echo "     mock thermostats will appear with live-looking data."
echo ""
echo "  Admin  : $ADMIN_URL"
echo "  Portal : $CUSTOMER_URL"
echo ""
