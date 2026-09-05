#!/bin/bash
set -e

REDIS_URL="rediss://default:AZ7uAAIgcDFlZTc0MDExNWY3OTY0MjVkYWE3ZDNhZjU2OWRjODVkNA@more-mastodon-40686.upstash.io:6379"

gcloud run services update scheduling-service \
  --region=us-central1 \
  --project=tscrm-demo-2026 \
  --update-env-vars="GIN_MODE=debug,REDIS_URL=${REDIS_URL},ENABLE_GPS_SIMULATION=${ENABLE_GPS_SIMULATION:-false},GPS_SIMULATION_COMPANIES=${GPS_SIMULATION_COMPANIES:-}"

echo "✅ scheduling-service updated"
echo
echo "GPS simulation: ENABLE_GPS_SIMULATION=${ENABLE_GPS_SIMULATION:-false}, companies=${GPS_SIMULATION_COMPANIES:-none}"
echo "  Both must be set for the Demo mode button to appear. To turn it on:"
echo "    ENABLE_GPS_SIMULATION=true GPS_SIMULATION_COMPANIES=co-demo-001 ./scripts/update-scheduling-envvars.sh"
echo "  To turn it off after the trial, run this script with no env vars set."
