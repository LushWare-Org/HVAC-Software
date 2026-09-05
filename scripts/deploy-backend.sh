#!/bin/bash
# T&S CRM — Backend Deployment Script (image-update only)
# Migrations already applied. This builds + deploys 7 services.
# Run from repo root: bash scripts/deploy-backend.sh

set -e

REGISTRY="us-central1-docker.pkg.dev/${GCP_PROJECT:-hvactor}/tscrm-images"
PROJECT_ROOT="/Users/ravishan/Desktop/Lush/T&SBCRM"
REGION="us-central1"
export DOCKER_DEFAULT_PLATFORM="linux/amd64"

cd "$PROJECT_ROOT"

echo "======================================"
echo "T&S CRM Backend Deployment"
echo "(Migrations already applied — image updates only)"
echo "======================================"

SERVICES=(crm-service job-service comms-service analytics-service chat-service finance-service inventory-service)

# ============================================================
# STEP 1 — BUILD & PUSH DOCKER IMAGES
# ============================================================
echo ""
echo "STEP 1: Build & Push Docker Images"
echo "--------------------------------------"

for SVC in "${SERVICES[@]}"; do
  echo ""
  echo "🔨 Building $SVC..."
  docker build --platform linux/amd64 \
    -f apps/$SVC/Dockerfile \
    -t $REGISTRY/$SVC:latest \
    .
  docker push $REGISTRY/$SVC:latest
  echo "✅ $SVC pushed"
done

# ============================================================
# STEP 2 — DEPLOY TO CLOUD RUN (image update — keeps existing env vars)
# ============================================================
echo ""
echo "STEP 2: Deploy to Cloud Run"
echo "--------------------------------------"

for SVC in "${SERVICES[@]}"; do
  echo "→ Deploying $SVC..."
  gcloud run deploy $SVC \
    --image=$REGISTRY/$SVC:latest \
    --region=$REGION \
    --allow-unauthenticated
  echo "✅ $SVC deployed"
done

# ============================================================
# STEP 3 — HEALTH CHECKS
# ============================================================
echo ""
echo "STEP 3: Health Checks"
echo "--------------------------------------"

GATEWAY="https://nginx-gateway-srkxrd2xka-uc.a.run.app"

for SVC in crm jobs scheduling finance comms analytics inventory chat; do
  printf "  %-12s " "$SVC:"
  curl -s --max-time 10 "$GATEWAY/api/$SVC/health" 2>/dev/null | head -c 80
  echo ""
done

echo ""
echo "======================================"
echo "✅ DEPLOYMENT COMPLETE"
echo "======================================"
echo "  Admin:  https://tscrm-demo-admin.web.app"
echo "  Portal: https://tscrm-demo-customer.web.app"
