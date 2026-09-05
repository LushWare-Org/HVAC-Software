#!/bin/bash
set -e

REGISTRY="us-central1-docker.pkg.dev/${GCP_PROJECT:-hvactor}/tscrm-images"
REGION="us-central1"

for SVC in job-service finance-service analytics-service inventory-service; do
  echo "Deploying ${SVC}..."
  gcloud run deploy "${SVC}" \
    --image="${REGISTRY}/${SVC}:latest" \
    --region="${REGION}" \
    --platform=managed \
    --project=${GCP_PROJECT:-hvactor} \
    --allow-unauthenticated
  echo "✅ ${SVC} deployed"
done
