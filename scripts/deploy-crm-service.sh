#!/bin/bash
set -e

REGISTRY="us-central1-docker.pkg.dev/tscrm-demo-2026/tscrm-images"
REGION="us-central1"

# Secrets come from the environment (never hardcode them here)
DB_URL="${DB_URL:?Set DB_URL before running}"
DB_DIRECT="${DB_DIRECT:?Set DB_DIRECT before running}"
SMTP_PASS="${SMTP_PASS:?Set SMTP_PASS before running}"
JWT_SECRET=$(gcloud secrets versions access latest --secret=tscrm-jwt-secret)

# Fetch live service URLs
COMMS_URL=$(gcloud run services describe comms-service --region=$REGION --format="value(status.url)")
CHURN_URL=$(gcloud run services describe churn-service --region=$REGION --format="value(status.url)" 2>/dev/null || echo "https://placeholder.run.app")

echo "COMMS_URL: $COMMS_URL"
echo "Deploying crm-service..."

gcloud run deploy crm-service \
  --image=$REGISTRY/crm-service:latest \
  --region=$REGION \
  --allow-unauthenticated \
  --port=3001 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="NODE_ENV=production,CRM_PORT=3001,BYPASS_AUTH=true,JWT_SECRET=${JWT_SECRET},CRM_DATABASE_URL=${DB_URL},CRM_DIRECT_DATABASE_URL=${DB_DIRECT},COMMS_SERVICE_URL=${COMMS_URL},CHURN_SERVICE_URL=${CHURN_URL},SMTP_HOST=smtp-relay.brevo.com,SMTP_PORT=587,SMTP_SECURE=false,SMTP_USER=a4ff37001@smtp-brevo.com,SMTP_PASS=${SMTP_PASS},SMTP_FROM_EMAIL=info@lushware.net,SMTP_FROM_NAME=T%26S Services,FRONTEND_URL=https://tscrm-demo-admin.web.app"

echo "✅ crm-service deployed"
