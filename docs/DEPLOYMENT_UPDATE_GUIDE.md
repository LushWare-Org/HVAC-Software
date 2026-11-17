# T&S CRM — Deployment Update Guide
> **For updating an existing Cloud Run deployment** (feat/marketing branch → production).
> The full from-scratch guide is in `docs/GCP_DEPLOYMENT_GUIDE.md`.
> This doc covers only what changed and needs to be redeployed.

---

## What Changed Since Last Deployment

| Area | Change | Action needed |
|------|--------|--------------|
| **chat-service** | New service — AI chatbot | Create + deploy (NEW) |
| **nginx-gateway** | Added `/api/chat/` route + SSE buffering | Rebuild + redeploy |
| **comms-service** | Marketing module (campaigns, templates, audiences), `@Roles` fixes | Rebuild + redeploy |
| **crm-service** | `@Roles` fixes for super_admin across all controllers | Rebuild + redeploy |
| **All NestJS services** | `@Roles` super_admin gap fixed | Rebuild + redeploy |
| **Email FROM address** | Changed from gmail to `info@lushware.net` | Update env var only |

---

## Prerequisites

```bash
export REGISTRY="us-central1-docker.pkg.dev/tscrm-demo-2026/tscrm-images"
export PROJECT_ROOT="/Users/ravishan/Desktop/Lush/T&SBCRM"
export REGION="us-central1"
export DOCKER_DEFAULT_PLATFORM="linux/amd64"

cd $PROJECT_ROOT

# Re-authenticate if needed
gcloud auth login
gcloud config set project tscrm-demo-2026
gcloud auth configure-docker us-central1-docker.pkg.dev

# Pull secrets (same as before)
export JWT_SECRET=$(gcloud secrets versions access latest --secret=tscrm-jwt-secret)
export REDIS_URL=$(gcloud secrets versions access latest --secret=tscrm-redis-url)
export SMTP_PASS=$(gcloud secrets versions access latest --secret=tscrm-smtp-pass)

# Pull existing service URLs (needed for wiring)
export CRM_URL=$(gcloud run services describe crm-service --region=$REGION --format="value(status.url)")
export JOBS_URL=$(gcloud run services describe job-service --region=$REGION --format="value(status.url)")
export SCHED_URL=$(gcloud run services describe scheduling-service --region=$REGION --format="value(status.url)")
export FINANCE_URL=$(gcloud run services describe finance-service --region=$REGION --format="value(status.url)")
export COMMS_URL=$(gcloud run services describe comms-service --region=$REGION --format="value(status.url)")
export ANALYTICS_URL=$(gcloud run services describe analytics-service --region=$REGION --format="value(status.url)")
export INV_URL=$(gcloud run services describe inventory-service --region=$REGION --format="value(status.url)")
export CHURN_URL=$(gcloud run services describe churn-service --region=$REGION --format="value(status.url)" 2>/dev/null || echo "https://placeholder.run.app")
export AGENT_URL=$(gcloud run services describe agent-service --region=$REGION --format="value(status.url)" 2>/dev/null || echo "https://placeholder.run.app")

export SUPABASE_USER="postgres.piezmopzxbuksjuuwwyw"
export SUPABASE_PASS="vnHoMrqPMHTRHOu6"
export SUPABASE_HOST="aws-1-ap-northeast-2.pooler.supabase.com"
export DB_RUNTIME="postgresql://${SUPABASE_USER}:${SUPABASE_PASS}@${SUPABASE_HOST}:6543/postgres"

echo "✅ Variables loaded"
echo "CRM:      $CRM_URL"
echo "COMMS:    $COMMS_URL"
echo "REGISTRY: $REGISTRY"
```

---

## Step 1 — Run Comms-Service DB Migrations (Marketing Schema)

The marketing module added new Prisma models to comms-service. Run migrations before deploying the new image.

```bash
export DIRECT_BASE="postgresql://${SUPABASE_USER}:${SUPABASE_PASS}@${SUPABASE_HOST}:5432/postgres"

# Update the existing migration job or create it
gcloud run jobs create migrate-comms-service \
  --image=$REGISTRY/prisma-migrate:latest \
  --region=$REGION \
  --memory=1Gi \
  --cpu=1 \
  --command=/usr/local/bin/run-prisma-migration.sh \
  --set-env-vars="SERVICE=comms-service,COMMS_DATABASE_URL=${DIRECT_BASE}?schema=comms,NODE_ENV=production" \
  2>/dev/null || \
gcloud run jobs update migrate-comms-service \
  --image=$REGISTRY/prisma-migrate:latest \
  --region=$REGION \
  --memory=1Gi \
  --cpu=1 \
  --command=/usr/local/bin/run-prisma-migration.sh \
  --set-env-vars="SERVICE=comms-service,COMMS_DATABASE_URL=${DIRECT_BASE}?schema=comms,NODE_ENV=production"

gcloud run jobs execute migrate-comms-service --region=$REGION --wait
echo "✅ Comms migrations complete"
```

---

## Step 2 — Build & Push Updated Images

Build only the services that changed. Run all builds in parallel if you have enough Docker resources, or one at a time.

### 2A. chat-service (NEW — must build from scratch)

```bash
docker build --platform linux/amd64 \
  -f apps/chat-service/Dockerfile \
  -t $REGISTRY/chat-service:latest \
  .
docker push $REGISTRY/chat-service:latest
echo "✅ chat-service image pushed"
```

### 2B. comms-service (marketing module changes)

```bash
docker build --platform linux/amd64 \
  -f apps/comms-service/Dockerfile \
  -t $REGISTRY/comms-service:latest \
  .
docker push $REGISTRY/comms-service:latest
echo "✅ comms-service image pushed"
```

### 2C. crm-service (@Roles fixes)

```bash
docker build --platform linux/amd64 \
  -f apps/crm-service/Dockerfile \
  -t $REGISTRY/crm-service:latest \
  .
docker push $REGISTRY/crm-service:latest
echo "✅ crm-service image pushed"
```

### 2D. Other services with @Roles fixes (job, finance, analytics, inventory)

```bash
for SVC in job-service finance-service analytics-service inventory-service; do
  echo "Building $SVC..."
  docker build --platform linux/amd64 \
    -f apps/$SVC/Dockerfile \
    -t $REGISTRY/$SVC:latest \
    .
  docker push $REGISTRY/$SVC:latest
  echo "✅ $SVC pushed"
done
```

### 2E. nginx-gateway (new /api/chat/ route + SSE buffering)

```bash
docker build \
  -f infrastructure/nginx/Dockerfile \
  -t $REGISTRY/nginx-gateway:latest \
  ./infrastructure/nginx
docker push $REGISTRY/nginx-gateway:latest
echo "✅ nginx-gateway image pushed"
```

---

## Step 3 — Deploy chat-service (NEW)

```bash
gcloud run deploy chat-service \
  --image=$REGISTRY/chat-service:latest \
  --region=$REGION \
  --allow-unauthenticated \
  --port=3008 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="\
NODE_ENV=production,\
CHAT_PORT=3008,\
BYPASS_AUTH=true,\
JWT_SECRET=${JWT_SECRET},\
OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE,\
OPENAI_MODEL_HELP=gpt-4o-mini,\
OPENAI_MODEL_DATA=gpt-4o,\
CHAT_HISTORY_TURNS=10,\
CRM_SERVICE_URL=${CRM_URL},\
JOBS_SERVICE_URL=${JOBS_URL},\
FINANCE_SERVICE_URL=${FINANCE_URL},\
ANALYTICS_SERVICE_URL=${ANALYTICS_URL}"

export CHAT_URL=$(gcloud run services describe chat-service \
  --region=$REGION --format="value(status.url)")
echo "✅ Chat Service: $CHAT_URL"
```

> ⚠️ Replace `YOUR_OPENAI_KEY_HERE` with your actual OpenAI API key from `apps/chat-service/.env`.

---

## Step 4 — Redeploy comms-service (with corrected email FROM address)

```bash
gcloud run deploy comms-service \
  --image=$REGISTRY/comms-service:latest \
  --region=$REGION \
  --allow-unauthenticated \
  --port=3005 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="\
NODE_ENV=production,\
COMMS_PORT=3005,\
BYPASS_AUTH=true,\
JWT_SECRET=${JWT_SECRET},\
COMMS_DATABASE_URL=${DB_RUNTIME}?schema=comms&pgbouncer=true&connection_limit=5,\
REDIS_URL=${REDIS_URL},\
SENDGRID_API_KEY=<SENDGRID_API_KEY>,\
SENDGRID_FROM_EMAIL=info@lushware.net,\
SENDGRID_FROM_NAME=T%26S Services,\
SMTP_HOST=smtp-relay.brevo.com,\
SMTP_PORT=587,\
SMTP_SECURE=false,\
SMTP_USER=a4ff37001@smtp-brevo.com,\
SMTP_PASS=${SMTP_PASS},\
SMTP_FROM_EMAIL=info@lushware.net,\
SMTP_FROM_NAME=T%26S Services,\
MARKETING_CLICK_BASE_URL=https://nginx-gateway-REPLACE_ME-uc.a.run.app,\
FRONTEND_URL=https://tscrm-demo-admin.web.app"

echo "✅ comms-service redeployed"
```

> ⚠️ Replace `nginx-gateway-REPLACE_ME-uc.a.run.app` with your actual gateway URL.

---

## Step 5 — Redeploy crm-service (with corrected email FROM address)

```bash
gcloud run services update crm-service \
  --region=$REGION \
  --update-env-vars="\
SMTP_FROM_EMAIL=info@lushware.net,\
SMTP_FROM_NAME=T%26S Services,\
SMTP_FROM=T%26S Services <info@lushware.net>"

echo "✅ crm-service email vars updated"
```

Then redeploy the new image:

```bash
gcloud run deploy crm-service \
  --image=$REGISTRY/crm-service:latest \
  --region=$REGION \
  --allow-unauthenticated \
  --port=3001 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="\
NODE_ENV=production,\
CRM_PORT=3001,\
BYPASS_AUTH=true,\
JWT_SECRET=${JWT_SECRET},\
CRM_DATABASE_URL=${DB_RUNTIME}?schema=crm&pgbouncer=true&connection_limit=5,\
CRM_DIRECT_DATABASE_URL=postgresql://${SUPABASE_USER}:${SUPABASE_PASS}@${SUPABASE_HOST}:5432/postgres?schema=crm,\
COMMS_SERVICE_URL=${COMMS_URL},\
CHURN_SERVICE_URL=${CHURN_URL},\
SMTP_HOST=smtp-relay.brevo.com,\
SMTP_PORT=587,\
SMTP_SECURE=false,\
SMTP_USER=a4ff37001@smtp-brevo.com,\
SMTP_PASS=${SMTP_PASS},\
SMTP_FROM_EMAIL=info@lushware.net,\
SMTP_FROM_NAME=T%26S Services,\
FRONTEND_URL=https://tscrm-demo-admin.web.app"

echo "✅ crm-service redeployed"
```

---

## Step 6 — Redeploy other services with @Roles fixes

These just need the new image — no env var changes:

```bash
for SVC in job-service finance-service analytics-service inventory-service; do
  echo "Deploying $SVC..."
  gcloud run deploy $SVC \
    --image=$REGISTRY/$SVC:latest \
    --region=$REGION \
    --platform=managed \
    --project=tscrm-demo-2026 \
    --allow-unauthenticated
  echo "✅ $SVC deployed"
done
```

---

## Step 7 — Update nginx-gateway with chat-service URL

⚠️ **Use `--update-env-vars` (NOT `--set-env-vars`)** — using `--set-env-vars` replaces ALL env vars and breaks the other service URLs.

```bash
gcloud run services update nginx-gateway \
  --region=$REGION \
  --update-env-vars="CHAT_SERVICE_URL=${CHAT_URL}"

echo "✅ Gateway updated with chat-service URL"
```

Then redeploy the gateway image (new nginx config with /api/chat/ route):

```bash
gcloud run deploy nginx-gateway \
  --image=$REGISTRY/nginx-gateway:latest \
  --region=$REGION \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5

echo "✅ nginx-gateway redeployed with chat route"
```

---

## Step 8 — Rebuild & Redeploy Frontends

The admin dashboard and customer portal have chat UI changes. Rebuild both.

```bash
cd /Users/ravishan/Desktop/Lush/T&SBCRM

# Build (uses .env.production automatically — make sure VITE_API_BASE_URL is your gateway URL)
pnpm --filter=admin-dashboard build
pnpm --filter=customer-portal build

# Deploy to Firebase
firebase deploy --only hosting

echo "✅ Frontends deployed"
```

---

## Step 9 — Verify Everything

### Health checks

```bash
GATEWAY=$(gcloud run services describe nginx-gateway --region=$REGION --format="value(status.url)")

echo "Gateway: $GATEWAY"
echo ""

# Gateway itself
curl -s $GATEWAY/health

# All backend services
for SVC in crm jobs scheduling finance comms analytics inventory; do
  echo -n "$SVC: "
  curl -s "$GATEWAY/api/$SVC/health" | head -c 60
  echo ""
done

# Chat service
echo -n "chat: "
curl -s "$GATEWAY/api/chat/health" | head -c 60
echo ""
```

### Test chat endpoint

```bash
curl -s -X POST "$GATEWAY/api/chat/message" \
  -H "Content-Type: application/json" \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-id: user-admin-001" \
  -H "x-test-user-role: super_admin" \
  -H "x-test-user-email: admin@tsbrothers.com" \
  -d '{"message": "how many customers do we have?", "history": []}' \
  --no-buffer 2>&1 | head -20
```

### Test marketing API (should now work for super_admin)

```bash
curl -s "$GATEWAY/api/comms/m/settings" \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: super_admin" \
  -H "x-test-user-id: user-admin-001" \
  -H "x-test-user-email: admin@tsbrothers.com"
```

---

## Checklist

- [ ] Comms-service migrations run (marketing schema)
- [ ] chat-service image built and pushed
- [ ] comms-service image built and pushed
- [ ] crm-service image built and pushed
- [ ] Other service images built and pushed (job, finance, analytics, inventory)
- [ ] nginx-gateway image built and pushed (new /api/chat/ route)
- [ ] chat-service deployed to Cloud Run
- [ ] comms-service redeployed (email FROM fixed to info@lushware.net)
- [ ] crm-service redeployed (email FROM fixed to info@lushware.net)
- [ ] Other services redeployed (@Roles fixes)
- [ ] nginx-gateway env updated with CHAT_SERVICE_URL
- [ ] nginx-gateway redeployed
- [ ] Frontends rebuilt and deployed to Firebase
- [ ] Health checks pass for all services including /api/chat/health
- [ ] Chat endpoint responds with SSE stream
- [ ] Marketing settings API returns 200 for super_admin role

---

## Common Errors

### `gcloud run deploy` uses old image

Cloud Run caches image digests. If you push `:latest` and redeploy, force a new revision:
```bash
gcloud run deploy <service> --image=$REGISTRY/<service>:latest --region=$REGION
```
This always pulls the latest digest even if the tag didn't change.

### Chat SSE stream cuts off after 60s

Cloud Run has a 60-second request timeout by default. The chat stream usually finishes in 10–30s, so this is fine. If you hit it, increase the timeout:
```bash
gcloud run services update chat-service --region=$REGION --timeout=300
```

### `--set-env-vars` wipes other gateway env vars

Always use `--update-env-vars` when adding/changing individual env vars on the gateway. `--set-env-vars` replaces the entire set. See `docs/NGINX_FIX_GUIDE.md`.

### Prisma migration `schema already exists`

Safe to ignore — Prisma migrations are idempotent.

### `OPENAI_API_KEY` not set → chat-service 500

Check your local `apps/chat-service/.env` for the key, then set it in Cloud Run:
```bash
gcloud run services update chat-service --region=$REGION \
  --update-env-vars="OPENAI_API_KEY=sk-..."
```

---

## Files Changed in This Update

| File | Change |
|------|--------|
| `apps/chat-service/Dockerfile` | **Created** — new service Dockerfile |
| `infrastructure/nginx/nginx.cloud.conf` | Added `/api/chat/` location block with SSE settings |
| `infrastructure/nginx/docker-entrypoint-nginx.sh` | Added `${CHAT_SERVICE_URL}` to envsubst list |
| `apps/comms-service/.env` | `SENDGRID_FROM_EMAIL` → `info@lushware.net` |

---

*Updated: 2026-05-21 · Branch: feat/marketing*
