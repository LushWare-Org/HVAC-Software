#!/bin/bash
set -e

# The live Upstash database. The previous value here pointed at
# more-mastodon-40686, which was deleted during the Redis migration and no
# longer resolves (NXDOMAIN), so every run of this script silently re-broke
# scheduling-service. Verified 2026-09-06: natural-ape-42315 resolves and is
# the host job-service and comms-service already use.
REDIS_URL="${REDIS_URL:-rediss://default:AaVLAAIgcDExY2FkOTY4MzczNDY0MDFhYThjZTYwOGZmOWNjZmRiYg@natural-ape-42315.upstash.io:6379}"

gcloud run services update scheduling-service \
  --region=us-central1 \
  --project=${GCP_PROJECT:-hvactor} \
  --update-env-vars="GIN_MODE=debug,REDIS_URL=${REDIS_URL},ENABLE_GPS_SIMULATION=${ENABLE_GPS_SIMULATION:-false},GPS_SIMULATION_COMPANIES=${GPS_SIMULATION_COMPANIES:-}"

echo "✅ scheduling-service updated"
echo
echo "GPS simulation: ENABLE_GPS_SIMULATION=${ENABLE_GPS_SIMULATION:-false}, companies=${GPS_SIMULATION_COMPANIES:-none}"
echo "  Both must be set for the Demo mode button to appear. To turn it on:"
echo "    ENABLE_GPS_SIMULATION=true GPS_SIMULATION_COMPANIES=co-demo-001 ./scripts/update-scheduling-envvars.sh"
echo "  To turn it off after the trial, run this script with no env vars set."
