#!/bin/bash

# Deployment script for all services with CORS updates
# Rebuilds Docker images, pushes to Artifact Registry, and deploys to Cloud Run

set -e

REGISTRY="us-central1-docker.pkg.dev/${GCP_PROJECT:-hvactor}/tscrm-images"
PROJECT="${GCP_PROJECT:-hvactor}"
REGION="us-central1"

# Services to deploy (skip comms-service as it was already deployed)
SERVICES=(
  "crm-service"
  "job-service"
  "finance-service"
  "analytics-service"
  "inventory-service"
)

echo "🚀 Starting deployment of services with CORS updates..."
echo "Registry: $REGISTRY"
echo "Project: $PROJECT"
echo "Region: $REGION"
echo ""

for SERVICE in "${SERVICES[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📦 Building & deploying: $SERVICE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Build Docker image with amd64 platform (required for Cloud Run)
  echo "🔨 Building Docker image for $SERVICE (platform: linux/amd64)..."
  docker build \
    --platform=linux/amd64 \
    -f "apps/$SERVICE/Dockerfile" \
    -t "$REGISTRY/$SERVICE:latest" \
    .
  
  # Push image to Artifact Registry
  echo "📤 Pushing image to Artifact Registry..."
  docker push "$REGISTRY/$SERVICE:latest"
  
  # Deploy to Cloud Run
  echo "☁️  Deploying to Cloud Run..."
  gcloud run deploy "$SERVICE" \
    --image="$REGISTRY/$SERVICE:latest" \
    --region="$REGION" \
    --platform=managed \
    --project="$PROJECT" \
    --allow-unauthenticated
  
  echo "✅ $SERVICE deployed successfully!"
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All services deployed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
