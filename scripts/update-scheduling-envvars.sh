#!/bin/bash
set -e

# No Redis credential here. This script used to hardcode one, which meant a
# working password sat in a public repo, and it also silently re-broke the
# service whenever that hardcoded host went stale.
#
# --update-env-vars only touches the variables it names, so leaving REDIS_URL
# out keeps whatever the service already has. Pass REDIS_URL in the environment
# only when you actually intend to change it.
VARS="GIN_MODE=debug"
VARS="${VARS},ENABLE_GPS_SIMULATION=${ENABLE_GPS_SIMULATION:-false}"
VARS="${VARS},GPS_SIMULATION_COMPANIES=${GPS_SIMULATION_COMPANIES:-}"
if [ -n "${REDIS_URL:-}" ]; then
  VARS="${VARS},REDIS_URL=${REDIS_URL}"
  echo "Overriding REDIS_URL on scheduling-service."
fi

gcloud run services update scheduling-service \
  --region=us-central1 \
  --project=${GCP_PROJECT:-hvactor} \
  --update-env-vars="${VARS}"

echo "✅ scheduling-service updated"
echo
echo "GPS simulation: ENABLE_GPS_SIMULATION=${ENABLE_GPS_SIMULATION:-false}, companies=${GPS_SIMULATION_COMPANIES:-none}"
echo "  Both must be set for the Demo mode button to appear. To turn it on:"
echo "    ENABLE_GPS_SIMULATION=true GPS_SIMULATION_COMPANIES=co-demo-001 ./scripts/update-scheduling-envvars.sh"
echo "  To turn it off after the trial, run this script with no env vars set."
