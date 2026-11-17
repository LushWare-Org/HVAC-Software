#!/bin/bash
set -e

REDIS_URL="${REDIS_URL:?Set REDIS_URL before running}"

gcloud run services update scheduling-service \
  --region=us-central1 \
  --project=tscrm-demo-2026 \
  --update-env-vars="GIN_MODE=debug,REDIS_URL=${REDIS_URL}"

echo "✅ scheduling-service updated"
