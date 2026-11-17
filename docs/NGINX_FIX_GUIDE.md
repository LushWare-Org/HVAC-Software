# NGINX Gateway Fix - Root Cause & Solution

## Problem Identified
The `/api/crm/auth/login` endpoint returns **404** because the nginx gateway's environment variables are **incomplete and empty**.

### Root Cause
When gcloud deploy commands were run with `--set-env-vars` instead of `--update-env-vars`, it **replaced ALL environment variables** with just a few new ones. The result:

**Current nginx-gateway env vars:**
- ✅ `CRM_SERVICE_URL=https://crm-service-2ohuhmktua-uc.a.run.app`
- ❌ `JOBS_SERVICE_URL` (missing)
- ❌ `SCHEDULING_SERVICE_URL` (missing)
- ❌ `FINANCE_SERVICE_URL` (missing)
- ❌ `COMMS_SERVICE_URL` (missing)
- ❌ `ANALYTICS_SERVICE_URL` (missing)
- ❌ `INVENTORY_SERVICE_URL` (missing)
- ❌ `CHURN_SERVICE_URL` (missing)
- ❌ `AGENT_SERVICE_URL` (missing)

### What Happens When Env Vars Are Missing
1. At nginx startup, the entrypoint script runs: `envsubst '${CRM_SERVICE_URL} ${JOBS_SERVICE_URL} ...' < nginx.conf.template > nginx.conf`
2. Missing env vars get substituted with **empty strings**: `set $upstream "";`
3. Nginx config becomes invalid: `proxy_pass "";` ← invalid syntax
4. Nginx fails to start or fails to route requests properly
5. Requests fall through to the catch-all `location /` handler
6. Returns `404: route not found`

## Solution
Run this command to update ALL the missing SERVICE_URL env vars:

```bash
#!/bin/bash
PROJECT=tscrm-demo-2026
REGION=us-central1

# Get all service URLs
CRM_SERVICE_URL=$(gcloud run services describe crm-service --region=$REGION --project=$PROJECT --format="value(status.url)")
JOBS_SERVICE_URL=$(gcloud run services describe job-service --region=$REGION --project=$PROJECT --format="value(status.url)")
SCHEDULING_SERVICE_URL=$(gcloud run services describe scheduling-service --region=$REGION --project=$PROJECT --format="value(status.url)")
FINANCE_SERVICE_URL=$(gcloud run services describe finance-service --region=$REGION --project=$PROJECT --format="value(status.url)")
COMMS_SERVICE_URL=$(gcloud run services describe comms-service --region=$REGION --project=$PROJECT --format="value(status.url)")
ANALYTICS_SERVICE_URL=$(gcloud run services describe analytics-service --region=$REGION --project=$PROJECT --format="value(status.url)")
INVENTORY_SERVICE_URL=$(gcloud run services describe inventory-service --region=$REGION --project=$PROJECT --format="value(status.url)")

# Update nginx-gateway with ALL SERVICE_URLs
gcloud run deploy nginx-gateway \
  --region=$REGION --project=$PROJECT \
  --update-env-vars=\
"CRM_SERVICE_URL=$CRM_SERVICE_URL,"\
"JOBS_SERVICE_URL=$JOBS_SERVICE_URL,"\
"SCHEDULING_SERVICE_URL=$SCHEDULING_SERVICE_URL,"\
"FINANCE_SERVICE_URL=$FINANCE_SERVICE_URL,"\
"COMMS_SERVICE_URL=$COMMS_SERVICE_URL,"\
"ANALYTICS_SERVICE_URL=$ANALYTICS_SERVICE_URL,"\
"INVENTORY_SERVICE_URL=$INVENTORY_SERVICE_URL,"\
"CHURN_SERVICE_URL=https://localhost,"\
"AGENT_SERVICE_URL=https://localhost"

sleep 10

# Test
GATEWAY_URL=$(gcloud run services describe nginx-gateway --region=$REGION --project=$PROJECT --format="value(status.url)")
echo "Testing: ${GATEWAY_URL}/api/crm/auth/login"
curl -X POST "${GATEWAY_URL}/api/crm/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpass"}'
```

## Expected Outcome
- ✅ **401 Unauthorized** - login endpoint works (invalid credentials)
- ❌ **404** - routing still broken (env vars still missing)
- ❌ **500** - backend error (routing works but service has issue)

## Key Learning
- Always use `--update-env-vars` to add/modify individual env vars while keeping existing ones
- Never use `--set-env-vars` unless you intentionally want to replace the entire env var set
- The nginx entrypoint script relies on these env vars being present at startup
