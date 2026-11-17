#!/bin/bash
set -e

REGISTRY="us-central1-docker.pkg.dev/tscrm-demo-2026/tscrm-images"
REGION="us-central1"
SUPABASE_USER="postgres.piezmopzxbuksjuuwwyw"
SUPABASE_PASS="vnHoMrqPMHTRHOu6"
SUPABASE_HOST="aws-1-ap-northeast-2.pooler.supabase.com"
DIRECT_BASE="postgresql://${SUPABASE_USER}:${SUPABASE_PASS}@${SUPABASE_HOST}:5432/postgres"

echo "Creating migrate-comms-service job..."

gcloud run jobs create migrate-comms-service \
  --image="${REGISTRY}/prisma-migrate:latest" \
  --region="${REGION}" \
  --memory=1Gi \
  --cpu=1 \
  --command=/usr/local/bin/run-prisma-migration.sh \
  --set-env-vars="SERVICE=comms-service,COMMS_DATABASE_URL=${DIRECT_BASE}?schema=comms,COMMS_DIRECT_DATABASE_URL=${DIRECT_BASE}?schema=comms,NODE_ENV=production"

echo "Running migration..."
gcloud run jobs execute migrate-comms-service --region="${REGION}" --wait
echo "✅ Comms migrations complete"
