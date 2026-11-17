#!/usr/bin/env bash
# Deploy Stripe + QuickBooks (finance-service) and Meta (crm-service) env vars
# Uses --update-env-vars to preserve all existing vars

set -euo pipefail

REGION="us-central1"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Updating finance-service (Stripe + QuickBooks)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
gcloud run services update finance-service \
  --region="$REGION" \
  --update-env-vars="\
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:?Set STRIPE_SECRET_KEY before running},\
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:?Set STRIPE_WEBHOOK_SECRET before running},\
CUSTOMER_PORTAL_URL=https://tscrm-demo-customer.web.app,\
QB_CLIENT_ID=${QB_CLIENT_ID:?Set QB_CLIENT_ID before running},\
QB_CLIENT_SECRET=${QB_CLIENT_SECRET:?Set QB_CLIENT_SECRET before running},\
QB_REDIRECT_URI=https://nginx-gateway-2ohuhmktua-uc.a.run.app/quickbooks/callback,\
QB_ENVIRONMENT=sandbox,\
FRONTEND_URL=https://tscrm-demo-admin.web.app"

echo ""
echo "✓ finance-service updated"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Updating crm-service (Meta / Facebook Lead Ads)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
gcloud run services update crm-service \
  --region="$REGION" \
  --update-env-vars="\
FACEBOOK_COMPANY_ID=co-demo-001,\
FACEBOOK_PAGE_ACCESS_TOKEN=${FACEBOOK_PAGE_ACCESS_TOKEN:?Set FACEBOOK_PAGE_ACCESS_TOKEN before running},\
FACEBOOK_VERIFY_TOKEN=${FACEBOOK_VERIFY_TOKEN:?Set FACEBOOK_VERIFY_TOKEN before running},\
FACEBOOK_PAGE_ID=341766239018120,\
FACEBOOK_APP_SECRET=${FACEBOOK_APP_SECRET:?Set FACEBOOK_APP_SECRET before running}"

echo ""
echo "✓ crm-service updated"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Verifying deployments"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "finance-service status:"
gcloud run services describe finance-service --region="$REGION" \
  --format="value(status.conditions[0].type,status.conditions[0].status)"

echo ""
echo "crm-service status:"
gcloud run services describe crm-service --region="$REGION" \
  --format="value(status.conditions[0].type,status.conditions[0].status)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Smoke tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "QuickBooks status endpoint:"
curl -sf "https://nginx-gateway-2ohuhmktua-uc.a.run.app/api/finance/quickbooks/status" \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: company_admin" \
  -H "x-test-user-id: test-user-001" | python3 -m json.tool || echo "  (QB status check failed)"

echo ""
echo "Meta webhook verification:"
curl -sf "https://nginx-gateway-2ohuhmktua-uc.a.run.app/api/crm/meta/webhook\
?hub.mode=subscribe\
&hub.verify_token=${FACEBOOK_VERIFY_TOKEN}\
&hub.challenge=hello_from_deploy_script" || echo "  (Meta verification failed)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Done! Both services redeployed."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
