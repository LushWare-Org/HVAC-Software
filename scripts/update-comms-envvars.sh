#!/bin/bash
set -e

REDIS_URL="${REDIS_URL:?Set REDIS_URL before running}"
MARKETING_DB="${MARKETING_DB:?Set MARKETING_DB before running}"
SENDGRID_API_KEY="${SENDGRID_API_KEY:?Set SENDGRID_API_KEY before running}"
SMTP_PASS="${SMTP_PASS:?Set SMTP_PASS before running}"

gcloud run services update comms-service \
  --region=us-central1 \
  --project=tscrm-demo-2026 \
  --update-env-vars="REDIS_URL=${REDIS_URL},MARKETING_DATABASE_URL=${MARKETING_DB},SENDGRID_API_KEY=${SENDGRID_API_KEY},SMTP_PASS=${SMTP_PASS}"

echo "✅ comms-service env vars updated"
