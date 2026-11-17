#!/bin/bash
set -e

REGISTRY="us-central1-docker.pkg.dev/tscrm-demo-2026/tscrm-images"
REGION="us-central1"
OPENAI_API_KEY="${OPENAI_API_KEY:?Set OPENAI_API_KEY before running}"

JWT_SECRET=$(gcloud secrets versions access latest --secret=tscrm-jwt-secret)

CRM_URL=$(gcloud run services describe crm-service --region=$REGION --format="value(status.url)")
JOBS_URL=$(gcloud run services describe job-service --region=$REGION --format="value(status.url)")
FINANCE_URL=$(gcloud run services describe finance-service --region=$REGION --format="value(status.url)")
ANALYTICS_URL=$(gcloud run services describe analytics-service --region=$REGION --format="value(status.url)")

echo "Building chat-service image..."
docker build --platform linux/amd64 -f apps/chat-service/Dockerfile -t $REGISTRY/chat-service:latest .
docker push $REGISTRY/chat-service:latest
echo "✅ chat-service image pushed"

echo "Deploying chat-service to Cloud Run..."
gcloud run deploy chat-service \
  --image=$REGISTRY/chat-service:latest \
  --region=$REGION \
  --allow-unauthenticated \
  --port=3008 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="NODE_ENV=production,CHAT_PORT=3008,BYPASS_AUTH=true,JWT_SECRET=${JWT_SECRET},OPENAI_API_KEY=${OPENAI_API_KEY},OPENAI_MODEL_HELP=gpt-4o-mini,OPENAI_MODEL_DATA=gpt-4o,CHAT_HISTORY_TURNS=10,CRM_SERVICE_URL=${CRM_URL},JOBS_SERVICE_URL=${JOBS_URL},FINANCE_SERVICE_URL=${FINANCE_URL},ANALYTICS_SERVICE_URL=${ANALYTICS_URL}"

CHAT_URL=$(gcloud run services describe chat-service --region=$REGION --format="value(status.url)")
echo "✅ chat-service deployed: $CHAT_URL"
