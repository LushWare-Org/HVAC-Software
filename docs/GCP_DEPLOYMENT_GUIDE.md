# T&S CRM — GCP Deployment Guide
> Complete step-by-step guide to deploy all services to Google Cloud Platform for your client demo.
> Updated for your actual infrastructure: **Supabase PostgreSQL already live**, Redis and MinIO are local and need cloud equivalents.
> **v2.2 — Updated to include AI/ML services. MongoDB removed — this system uses PostgreSQL + JSONL files only.**

---

## What Gets Deployed Where

| Component | Where | Cost |
|-----------|-------|------|
| PostgreSQL (all 6 schemas) | **Supabase** — already live ✅ | Free |
| Redis (BullMQ + WebSocket) | **Upstash** — free tier | Free |
| File storage (PDFs, photos) | **Google Cloud Storage** | ~$0.10/mo |
| 7 NestJS + Go backend services | **Cloud Run** — serverless | ~$0–5/mo |
| **churn-service** (Python FastAPI ML) | **Cloud Run** — NEW ✅ | ~$0 |
| **agent-service** (Python Flask AI) | **Cloud Run** — NEW ✅ | ~$0 |
| Nginx API Gateway | **Cloud Run** | ~$0 |
| Admin Dashboard | **Firebase Hosting** | Free |
| Customer Portal | **Firebase Hosting** | Free |

**Total estimated cost: ~$0 with GCP free credit ($300 for 90 days). ~$10–18/month after credit.**

---

## New AI/ML Features (agentic-2 branch)

This merged branch adds a full AI revenue intelligence layer on top of the CRM. Here are the new capabilities:

### 1. 🧠 Churn & Revenue Risk Prediction
- **What it does:** Predicts the probability a customer will churn, the probability of equipment failure, and the resulting revenue at risk. Also recommends upsell offers.
- **Where it appears:** Customer detail sidebar → AI Recommendations panel; Lead detail sidebar; CRM follow-up agent uses churn scores to decide when to reach out.
- **Tech:** Python FastAPI service (`churn-service`) running pre-trained XGBoost/scikit-learn models. Six `.pkl` model files: churn model, failure model, LTV model, upsell recommendation model, conversion model, churn features.
- **New service:** `churn-service` on port 8000 (already has Dockerfile).

### 2. 🎯 Contextual Bandit Agents (Reinforcement Learning)
Four epsilon-greedy contextual bandit agents that learn optimal business actions over time:
- **Revenue Agent** — dynamic pricing, discounts (10%/20%), capacity management, demand-gap fills
- **Retention Agent** — identifies at-risk high-value customers, decides channel + offer (premium contract, maintenance plan, discount)
- **Follow-up Agent** — decides when and how to follow up with customers/leads (email, call, WhatsApp)
- **Upsell Agent** — recommends the best service upsell offer per customer
- Each agent uses ε-greedy exploration (20% explore / 80% exploit). Decisions are logged to **JSONL files** (MongoDB is attempted with a 500ms timeout but gracefully skipped — no MongoDB config needed).
- **New service:** `agent-service` (Python Flask, needs a new Dockerfile).

### 3. 📊 Bandit Observability Dashboard
- **New admin page:** `/bandit-dashboard` — shows how the AI agents are learning in real-time.
- **Charts:** Learning curve (avg reward over time), action frequency distribution, exploration vs exploitation ratio, revenue uplift (actual − baseline), context performance table, regret analysis.
- **Data source:** Reads from JSONL log files via the agent-service (no database needed).

### 4. 🤖 Automated Follow-up Agent (in crm-service)
- **What it does:** Scans customers/leads automatically, uses churn predictions to decide who needs a follow-up, queues messages via BullMQ.
- **Actions:** RETENTION (churn > 70%), REENGAGEMENT (inactive/90+ days), LEAD_FOLLOWUP (cold leads)
- **Duplicate suppression:** `followup_attempts` table in Supabase prevents re-queuing within 48 hours.
- **Integrated in:** crm-service `FollowupAgent` class — triggered via cron or API call.

### 5. 💡 AI Revenue Recommendations Panel
- **New admin component:** Smart recommendations panel shows prioritised actions (discount campaigns, retention calls, etc.) derived from the revenue agent.
- **Executable actions:** Clicking "Execute" runs the action and logs the result.
- **Data source:** analytics-service `/recommendations` endpoint.

### New services needed for deployment:
| Service | Port | Dockerfile? |
|---------|------|------------|
| `churn-service` (FastAPI ML inference) | 8000 | ✅ exists |
| `agent-service` (Flask bandit API) | 8080 | ❌ must create |

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [GCP Project Setup](#2-gcp-project-setup)
3. [Enable Required APIs](#3-enable-required-apis)
4. [Create Artifact Registry](#4-create-artifact-registry)
5. [Set Up External Services](#5-set-up-external-services)
   - 5A. Upstash Redis (free)
   - 5B. Google Cloud Storage
6. [Create Dockerfiles](#6-create-dockerfiles)
7. [Build & Push Docker Images](#7-build--push-docker-images)
8. [Store Secrets in Secret Manager](#8-store-secrets-in-secret-manager)
9. [Deploy Nginx API Gateway](#9-deploy-nginx-api-gateway)
10. [Deploy All Backend Services](#10-deploy-all-backend-services)
11. [Deploy AI/ML Services](#11-deploy-aiml-services)
12. [Run Database Migrations](#12-run-database-migrations)
13. [Deploy Frontends to Firebase Hosting](#13-deploy-frontends-to-firebase-hosting)
14. [Final Verification & Health Checks](#14-final-verification--health-checks)
15. [Common Errors & Fixes](#15-common-errors--fixes)
16. [Environment Variables Reference](#16-environment-variables-reference)
17. [Cost Breakdown](#17-cost-breakdown)

---

## 1. Prerequisites

### Tools to install

| Tool | Install Command | Verify |
|------|----------------|--------|
| `gcloud` CLI | `brew install google-cloud-sdk` | `gcloud --version` |
| Docker Desktop | [docker.com/desktop](https://docker.com/desktop) | `docker --version` |
| `firebase-tools` | `npm install -g firebase-tools` | `firebase --version` |
| `pnpm` | already installed | `pnpm --version` |

### Key facts about your system

- ✅ **PostgreSQL is already on Supabase** — no database setup needed on GCP
- ✅ **Email is already configured** — Brevo SMTP credentials are in your `.env`
- ✅ **No MongoDB** — comms-service uses PostgreSQL + Redis only; bandit agents write JSONL files (MongoDB is tried with a 500ms timeout and silently skipped if unavailable)
- ⚠️ **BYPASS_AUTH=true** — keeping this for demo simplicity (bypass auth headers work in production)
- ⚠️ **Twilio SMS** — credentials empty, SMS will not work unless you add them
- ⚠️ **Redis** — only running locally, must be replaced with Upstash
- ⚠️ **MinIO (file storage)** — only running locally, must be replaced with GCS

---

## 2. GCP Project Setup

### Via CLI

```bash
# Log in to your Google account
gcloud auth login

# Create a new project (all lowercase, hyphens only)
gcloud projects create tscrm-demo-2026 --name="TS CRM Demo"

# Set this as your active project
gcloud config set project tscrm-demo-2026

# Link billing account (required even for free trial — no charge until credit runs out)
# List your billing accounts first:
gcloud billing accounts list

# Link (replace XXXXXX-XXXXXX-XXXXXX with your billing account ID):
gcloud billing projects link tscrm-demo-2026 \
  --billing-account=XXXXXX-XXXXXX-XXXXXX
```

### Via Browser

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the **project dropdown** (top bar) → **New Project**
3. Name: `TS CRM Demo`, Project ID: `tscrm-demo-2026`
4. Click **Create**
5. Go to **Billing** → **Link a billing account** (add a card — won't be charged while you have free credit)

---

## 3. Enable Required APIs

### Via CLI (run all at once — takes ~60 seconds)

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  firebase.googleapis.com \
  firebasehosting.googleapis.com \
  storage.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com
```

### Via Browser

Go to **APIs & Services** → **Enable APIs and Services** → search and enable each:
- Cloud Run API
- Artifact Registry API
- Cloud Build API
- Secret Manager API
- Firebase Hosting API
- Cloud Storage API
- IAM API

---

## 4. Create Artifact Registry

This is where your Docker images are stored (private Docker Hub on GCP).

### Via CLI

```bash
gcloud artifacts repositories create tscrm-images \
  --repository-format=docker \
  --location=us-central1 \
  --description="T&S CRM Docker images"

# Authenticate Docker to push images to this registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Via Browser

1. Search "Artifact Registry" in GCP Console
2. Click **+ Create Repository**
3. Name: `tscrm-images`, Format: `Docker`, Region: `us-central1`
4. Click **Create**

> 💾 **Save this registry path — you'll use it in every docker command:**
> `us-central1-docker.pkg.dev/tscrm-demo-2026/tscrm-images`

---

## 5. Set Up External Services

### 5A. Upstash Redis (Free — replaces localhost Redis)

Your system uses Redis for:
- BullMQ job queues (email/SMS sending queue in comms-service)
- WebSocket pub/sub (live dispatch updates in scheduling-service)

#### Steps

1. Go to [upstash.com](https://upstash.com) → **Sign up free** (use Google account)
2. Go to **Redis** → **Create Database**
3. Fill in:
   - Name: `tscrm-redis`
   - Type: `Regional`
   - Region: `us-central1` (Google Cloud)
   - Enable **TLS** ✓ (required for production)
4. Click **Create**
5. On the database detail page, copy these two values:

```
Endpoint:  red-xxxxxxxxxxxx.upstash.io
Port:      6379
Password:  (shown in the dashboard)
Redis URL: rediss://:PASSWORD@red-xxxxxxxxxxxx.upstash.io:6379
```

> ⚠️ The URL starts with `rediss://` (double s) — this is TLS-encrypted Redis. Keep this URL safe.

---

### 5B. Google Cloud Storage (replaces local MinIO)

File uploads (PDFs, job photos) are currently stored in local MinIO. GCS replaces it with the same S3-compatible API.

```bash
# Create a storage bucket (name must be globally unique)
gsutil mb -p tscrm-demo-2026 \
  -c STANDARD \
  -l us-central1 \
  gs://tscrm-demo-files-2026

# Make uploaded files publicly readable (needed for serving PDFs via URL)
gsutil iam ch allUsers:objectViewer gs://tscrm-demo-files-2026
```

#### Via Browser

1. Go to **Cloud Storage** → **Buckets** → **Create**
2. Name: `tscrm-demo-files-2026`, Location: `us-central1`, Class: `Standard`
3. Access control: `Uniform` → Click **Create**
4. After creation → **Permissions** tab → **Grant Access**
   - New principal: `allUsers`, Role: `Storage Object Viewer` → **Save**

> ✅ **No data migration needed.** Your PostgreSQL data is already on Supabase. There is no MongoDB in this system — comms-service uses only PostgreSQL (Prisma) + Redis (BullMQ). Bandit agents write JSONL log files that start fresh and accumulate as agents run. Nothing to export or import.

#### 5B-1. Technician avatars (crm-service `StorageService`)

crm-service stores technician profile photos through an S3-compatible client
(MinIO in dev, GCS interop in prod). One-time prod setup:

```bash
# Bucket (public read — photo URLs go straight into customer emails)
gsutil mb -p tscrm-demo-2026 -c STANDARD -l us-central1 gs://tscrm-avatars-2026
gsutil iam ch allUsers:objectViewer gs://tscrm-avatars-2026

# HMAC key for the S3-interoperability API (note the Access Key + Secret it prints)
gcloud storage hmac create tscrm-run-sa@tscrm-demo-2026.iam.gserviceaccount.com
```

Then set on the **crm-service** Cloud Run service (`--update-env-vars`, never `--set-env-vars`):

| Env var | Value |
|---|---|
| `S3_ENDPOINT` | `https://storage.googleapis.com` |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | the HMAC pair from above |
| `S3_BUCKET_AVATARS` | `tscrm-avatars-2026` |
| `S3_PUBLIC_BASE_URL` | `https://storage.googleapis.com/tscrm-avatars-2026` |
| `S3_AUTO_CREATE_BUCKET` | `false` (bucket is provisioned above, not by the service) |

Also confirm **scheduling-service** has `COMMS_SERVICE_URL` set (the en-route
customer notification posts to `comms /notifications/en-route` with a local
HS256 system token, so `JWT_SECRET` must match across services).

---

## 6. Create Dockerfiles

Only the Go scheduling service has a Dockerfile. We need to create Dockerfiles for all 6 NestJS services and the Nginx gateway.

### 6A. NestJS Services Dockerfile Template

Create this file at `apps/crm-service/Dockerfile`:

```dockerfile
# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /repo

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests (for layer caching — only reinstall when these change)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/crm-service/ ./apps/crm-service/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first (required by services)
RUN pnpm --filter=@tscrm/types build 2>/dev/null || true
RUN pnpm --filter=@tscrm/auth-client build 2>/dev/null || true

# Build the service
RUN pnpm --filter=crm-service build

# Generate Prisma client
RUN cd apps/crm-service && npx prisma generate

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/crm-service/dist ./dist
COPY --from=builder /repo/apps/crm-service/prisma ./prisma
COPY --from=builder /repo/apps/crm-service/package.json ./

EXPOSE 3001
CMD ["node", "dist/main.js"]
```

Now run these commands to copy and adapt for all other NestJS services:

```bash
cd /Users/ravishan/Desktop/Lush/T&SBCRM

# job-service (port 3002)
cp apps/crm-service/Dockerfile apps/job-service/Dockerfile
sed -i '' 's/crm-service/job-service/g; s/EXPOSE 3001/EXPOSE 3002/' apps/job-service/Dockerfile

# finance-service (port 3004)
cp apps/crm-service/Dockerfile apps/finance-service/Dockerfile
sed -i '' 's/crm-service/finance-service/g; s/EXPOSE 3001/EXPOSE 3004/' apps/finance-service/Dockerfile

# comms-service (port 3005)
cp apps/crm-service/Dockerfile apps/comms-service/Dockerfile
sed -i '' 's/crm-service/comms-service/g; s/EXPOSE 3001/EXPOSE 3005/' apps/comms-service/Dockerfile

# analytics-service (port 3006)
cp apps/crm-service/Dockerfile apps/analytics-service/Dockerfile
sed -i '' 's/crm-service/analytics-service/g; s/EXPOSE 3001/EXPOSE 3006/' apps/analytics-service/Dockerfile

# inventory-service (port 3007)
cp apps/crm-service/Dockerfile apps/inventory-service/Dockerfile
sed -i '' 's/crm-service/inventory-service/g; s/EXPOSE 3001/EXPOSE 3007/' apps/inventory-service/Dockerfile
```

### 6B. Finance Service — Puppeteer / Chrome

The finance service uses Puppeteer (headless Chrome) for PDF generation. It needs extra dependencies. Open `apps/finance-service/Dockerfile` in your editor and add these lines **before** the `EXPOSE 3004` line:

```dockerfile
# Puppeteer requires Chromium to be pre-installed on Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### 6C. Scheduling Service (Go)

Already has a Dockerfile at `apps/scheduling-service/Dockerfile`. ✅ No changes needed.

### 6D. Churn Service (Python FastAPI — already has Dockerfile)

Already has a Dockerfile at `apps/churn-service/Dockerfile`. ✅ No changes needed.
The ML model `.pkl` files in `apps/churn-service/src/models/` are copied into the image automatically.

### 6E. Agent Service (Python Flask — create new Dockerfile)

The agent service combines the bandit agents, analytics API, and bandit observability API into one deployable container.

**Create the folder first:**
```bash
mkdir -p apps/agent-service
```

**Create `apps/agent-service/requirements.txt`:**
```
flask>=3.0
flask-cors>=4.0
joblib>=1.3
pandas>=2.0
xgboost>=2.0
pymongo>=4.6
scikit-learn>=1.4
numpy>=1.24
gunicorn>=21.0
```

> Note: `pymongo` is listed because the bandit code does `from pymongo import MongoClient` inside a try block. The import must succeed even if no MongoDB is configured — the actual connection attempt uses a 500ms timeout and falls back silently to JSONL files.

**Create `apps/agent-service/server.py`** — Flask app combining both APIs:

```python
"""
agent-service/server.py — Combined Flask server for AI agent APIs.

Serves two route groups on a single port (8080 in Cloud Run):
  /analytics/*  — Revenue agent metrics (accuracy, trends, logs)
  /bandit/*     — Bandit observability (reward trends, action stats, regret)
  /health       — Health check
"""
from __future__ import annotations

import os
import sys

ROOT = os.path.abspath(os.path.dirname(__file__))
if not os.path.isdir(os.path.join(ROOT, "agent")):
    ROOT = os.path.abspath(os.path.join(ROOT, "../../"))
sys.path.insert(0, ROOT)

from flask import Flask, jsonify
from flask_cors import CORS

try:
    from api.analytics_routes import create_flask_blueprint as analytics_bp
    from api.bandit_routes import create_flask_blueprint as bandit_bp
except ImportError as exc:
    raise RuntimeError(
        f"Could not import agent API modules from {ROOT}. "
        f"Ensure agent/, api/, analytics/ directories are present. Error: {exc}"
    ) from exc

app = Flask(__name__)
CORS(app, origins="*")

app.register_blueprint(analytics_bp())   # mounts at /analytics/*
app.register_blueprint(bandit_bp())      # mounts at /bandit/*


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "agent-service"})


@app.get("/")
def root():
    return jsonify({
        "service": "T&S CRM Agent Service",
        "endpoints": [
            "/health",
            "/analytics/summary",
            "/analytics/trends",
            "/analytics/logs",
            "/bandit/summary",
            "/bandit/reward-trend",
            "/bandit/actions",
            "/bandit/exploration",
            "/bandit/revenue-impact",
            "/bandit/context-performance",
            "/bandit/regret",
        ],
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
```

**Create `apps/agent-service/Dockerfile`:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (Docker layer caching — reinstall only when requirements change)
COPY apps/agent-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python agent code from the monorepo root
COPY agent/ ./agent/
COPY api/ ./api/
COPY analytics/ ./analytics/

# Copy the pre-trained model files used by the agents
COPY models/ ./models/

# Copy the Flask server entry point
COPY apps/agent-service/server.py ./server.py

ENV PORT=8080
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "60", "server:app"]
```

**Build test (verify it works locally first):**
```bash
cd /Users/ravishan/Desktop/Lush/T&SBCRM
docker build -f apps/agent-service/Dockerfile -t agent-service-test .
docker run -p 8080:8080 agent-service-test &
sleep 3
curl http://localhost:8080/health
curl http://localhost:8080/bandit/summary
curl http://localhost:8080/analytics/summary
docker stop $(docker ps -q --filter ancestor=agent-service-test)
```

### 6F. Nginx API Gateway

The production nginx config and Dockerfile have already been created at `infrastructure/nginx/`. They include routes for all 9 services including `churn-service` and `agent-service`. ✅ Already done — these files are on disk:

- `infrastructure/nginx/nginx.cloud.conf` — routes `/api/churn/`, `/api/analytics/bandit-api/`, `/api/analytics/revenue-agent-api/`, and all original routes
- `infrastructure/nginx/Dockerfile` — Alpine nginx with gettext for envsubst
- `infrastructure/nginx/docker-entrypoint-nginx.sh` — substitutes all 9 `*_SERVICE_URL` env vars

> ⚠️ **Key routing order:** `/api/analytics/bandit-api/` and `/api/analytics/revenue-agent-api/` are listed **before** the generic `/api/analytics/` block in nginx.cloud.conf. This is critical — nginx picks the first matching location.

---

## 7. Build & Push Docker Images

Set up your variables first:

```bash
export REGISTRY="us-central1-docker.pkg.dev/tscrm-demo-2026/tscrm-images"
export PROJECT_ROOT="/Users/ravishan/Desktop/Lush/T&SBCRM"
cd $PROJECT_ROOT

# Cloud Run requires linux/amd64 images. On Apple Silicon, force this platform.
export DOCKER_DEFAULT_PLATFORM="linux/amd64"
```

Build and push all images (run from project root — Docker context must be the whole monorepo):

```bash
# ── crm-service ──────────────────────────────────────────────────────────────
docker build --platform linux/amd64 -f apps/crm-service/Dockerfile -t $REGISTRY/crm-service:latest .
docker push $REGISTRY/crm-service:latest

# ── job-service ──────────────────────────────────────────────────────────────
docker build --platform linux/amd64 -f apps/job-service/Dockerfile -t $REGISTRY/job-service:latest .
docker push $REGISTRY/job-service:latest

# ── scheduling-service (Go — build context is the service folder) ─────────────
docker build --platform linux/amd64 -f apps/scheduling-service/Dockerfile \
  -t $REGISTRY/scheduling-service:latest \
  ./apps/scheduling-service
docker push $REGISTRY/scheduling-service:latest

# ── finance-service ───────────────────────────────────────────────────────────
docker build --platform linux/amd64 -f apps/finance-service/Dockerfile -t $REGISTRY/finance-service:latest .
docker push $REGISTRY/finance-service:latest

# ── comms-service ─────────────────────────────────────────────────────────────
docker build --platform linux/amd64 -f apps/comms-service/Dockerfile -t $REGISTRY/comms-service:latest .
docker push $REGISTRY/comms-service:latest

# ── analytics-service ─────────────────────────────────────────────────────────
docker build --platform linux/amd64 -f apps/analytics-service/Dockerfile -t $REGISTRY/analytics-service:latest .
docker push $REGISTRY/analytics-service:latest

# ── inventory-service ─────────────────────────────────────────────────────────
docker build --platform linux/amd64 -f apps/inventory-service/Dockerfile -t $REGISTRY/inventory-service:latest .
docker push $REGISTRY/inventory-service:latest

# ── nginx-gateway ─────────────────────────────────────────────────────────────
docker build -f infrastructure/nginx/Dockerfile \
  -t $REGISTRY/nginx-gateway:latest \
  ./infrastructure/nginx
docker push $REGISTRY/nginx-gateway:latest

# ── churn-service (Python FastAPI ML inference) ───────────────────────────────
# Build context is apps/churn-service (Dockerfile COPYs src/ which has the .pkl models)
docker build --platform linux/amd64 \
  -f apps/churn-service/Dockerfile \
  -t $REGISTRY/churn-service:latest \
  ./apps/churn-service
docker push $REGISTRY/churn-service:latest

# ── agent-service (Python Flask — bandit + analytics APIs) ────────────────────
# Build context is monorepo root — server.py imports agent/, api/, analytics/, models/
docker build --platform linux/amd64 \
  -f apps/agent-service/Dockerfile \
  -t $REGISTRY/agent-service:latest \
  .
docker push $REGISTRY/agent-service:latest
```

> ⏱️ **Expected time:** NestJS services: 3–8 min each. Python services: 2–4 min each. Subsequent builds are faster via Docker layer cache.

**Verify all 10 images were pushed:**
```bash
gcloud artifacts docker images list $REGISTRY
# Expected: crm-service, job-service, scheduling-service, finance-service,
#           comms-service, analytics-service, inventory-service,
#           nginx-gateway, churn-service, agent-service
```

---

## 8. Store Secrets in Secret Manager

Never put passwords directly in Cloud Run env vars (they appear in the console). Use Secret Manager for sensitive values.

```bash
# ── JWT Secret — generate a strong 64-char random string ────────────────────
openssl rand -base64 48 | tr -d '\n' | \
  gcloud secrets create tscrm-jwt-secret --data-file=-

# ── Supabase Database Password ───────────────────────────────────────────────
echo -n "vnHoMrqPMHTRHOu6" | \
  gcloud secrets create tscrm-db-password --data-file=-

# ── Upstash Redis URL ─────────────────────────────────────────────────────────
echo -n "rediss://:YOUR_UPSTASH_PASSWORD@red-xxxxxxxxxxxx.upstash.io:6379" | \
  gcloud secrets create tscrm-redis-url --data-file=-

# ── Brevo SMTP Password (for email) ──────────────────────────────────────────
echo -n "<BREVO_SMTP_KEY>" | \
  gcloud secrets create tscrm-smtp-pass --data-file=-

echo "✅ All secrets stored"
gcloud secrets list
```

### Via Browser

1. Go to **Security** → **Secret Manager**
2. Click **+ Create Secret** for each:

| Secret Name | Value |
|------------|-------|
| `tscrm-jwt-secret` | 64-char random string (`openssl rand -base64 48`) |
| `tscrm-db-password` | `vnHoMrqPMHTRHOu6` |
| `tscrm-redis-url` | Full Upstash `rediss://` URL |
| `tscrm-smtp-pass` | Your Brevo SMTP password |

---

## 9. Deploy Nginx API Gateway

The gateway must be deployed first (with placeholder URLs), then updated after all services are live.

```bash
export REGISTRY="us-central1-docker.pkg.dev/tscrm-demo-2026/tscrm-images"

# Deploy with placeholder URLs — we update these in Step 10 after each service deploys
gcloud run deploy nginx-gateway \
  --image=$REGISTRY/nginx-gateway:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="\
CRM_SERVICE_URL=https://placeholder.run.app,\
JOBS_SERVICE_URL=https://placeholder.run.app,\
SCHEDULING_SERVICE_URL=https://placeholder.run.app,\
FINANCE_SERVICE_URL=https://placeholder.run.app,\
COMMS_SERVICE_URL=https://placeholder.run.app,\
ANALYTICS_SERVICE_URL=https://placeholder.run.app,\
INVENTORY_SERVICE_URL=https://placeholder.run.app,\
CHURN_SERVICE_URL=https://placeholder.run.app,\
AGENT_SERVICE_URL=https://placeholder.run.app"

# Save the gateway URL — you need this for the frontend .env.production files
GATEWAY_URL=$(gcloud run services describe nginx-gateway \
  --region=us-central1 --format="value(status.url)")
echo ""
echo "==================================================="
echo "  GATEWAY URL: $GATEWAY_URL"
echo "==================================================="
echo "Save this! You need it in Step 12 for the frontends."
```

---

## 10. Deploy All Backend Services

### Set shared variables

```bash
export REGISTRY="us-central1-docker.pkg.dev/tscrm-demo-2026/tscrm-images"
export SUPABASE_HOST="aws-1-ap-northeast-2.pooler.supabase.com"
export SUPABASE_USER="postgres.piezmopzxbuksjuuwwyw"
export SUPABASE_PASS="vnHoMrqPMHTRHOu6"
export SUPABASE_DB="postgres"

# Runtime DB URL (pgbouncer port 6543 — used by app at runtime)
export DB_RUNTIME="postgresql://${SUPABASE_USER}:${SUPABASE_PASS}@${SUPABASE_HOST}:6543/${SUPABASE_DB}"

# Get the JWT secret we generated in Step 8
export JWT_SECRET=$(gcloud secrets versions access latest --secret=tscrm-jwt-secret)
export REDIS_URL=$(gcloud secrets versions access latest --secret=tscrm-redis-url)
export SMTP_PASS=$(gcloud secrets versions access latest --secret=tscrm-smtp-pass)

# Frontend URL for email links (we'll update this after Firebase deploy in Step 12)
export ADMIN_URL="https://tscrm-demo-admin.web.app"
export CUSTOMER_URL="https://tscrm-demo-customer.web.app"
```

---

### CRM Service (port 3001)

```bash
gcloud run deploy crm-service \
  --image=$REGISTRY/crm-service:latest \
  --region=us-central1 \
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
CRM_DIRECT_DATABASE_URL=postgresql://${SUPABASE_USER}:${SUPABASE_PASS}@${SUPABASE_HOST}:5432/${SUPABASE_DB}?schema=crm,\
COMMS_SERVICE_URL=https://comms-service-XXXX-uc.a.run.app,\
SMTP_HOST=smtp-relay.brevo.com,\
SMTP_PORT=587,\
SMTP_SECURE=false,\
SMTP_USER=a4ff37001@smtp-brevo.com,\
SMTP_PASS=${SMTP_PASS},\
SMTP_FROM_EMAIL=pasinduravishan88@gmail.com,\
SMTP_FROM_NAME=T%26S Services,\
FRONTEND_URL=${ADMIN_URL},\
APP_NAME=T%26S Services"

CRM_URL=$(gcloud run services describe crm-service \
  --region=us-central1 --format="value(status.url)")
echo "✅ CRM: $CRM_URL"
```

> ⚠️ The `COMMS_SERVICE_URL` won't be known yet — come back and update it after comms-service is deployed (see "Update Gateway" step at the end).

---

### Job Service (port 3002)

```bash
gcloud run deploy job-service \
  --image=$REGISTRY/job-service:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=3002 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="\
NODE_ENV=production,\
JOBS_PORT=3002,\
BYPASS_AUTH=true,\
JWT_SECRET=${JWT_SECRET},\
JOBS_DATABASE_URL=${DB_RUNTIME}?schema=jobs&pgbouncer=true&connection_limit=5,\
REDIS_URL=${REDIS_URL}"

JOBS_URL=$(gcloud run services describe job-service \
  --region=us-central1 --format="value(status.url)")
echo "✅ Job: $JOBS_URL"
```

---

### Scheduling Service — Go (port 3003)

```bash
gcloud run deploy scheduling-service \
  --image=$REGISTRY/scheduling-service:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=3003 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="\
GIN_MODE=release,\
SCHEDULING_PORT=3003,\
BYPASS_AUTH=true,\
JWT_SECRET=${JWT_SECRET},\
DATABASE_URL=${DB_RUNTIME}?search_path=scheduling,public&pgbouncer=true&connection_limit=5&sslmode=require,\
REDIS_URL=${REDIS_URL}"

SCHED_URL=$(gcloud run services describe scheduling-service \
  --region=us-central1 --format="value(status.url)")
echo "✅ Scheduling: $SCHED_URL"
```

---

### Finance Service (port 3004)

> This service gets more RAM because Puppeteer (headless Chrome for PDF generation) is memory-intensive.

```bash
gcloud run deploy finance-service \
  --image=$REGISTRY/finance-service:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=3004 \
  --memory=1Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="\
NODE_ENV=production,\
FINANCE_PORT=3004,\
BYPASS_AUTH=true,\
JWT_SECRET=${JWT_SECRET},\
FINANCE_DATABASE_URL=${DB_RUNTIME}?schema=finance&pgbouncer=true&connection_limit=5,\
DATABASE_URL=${DB_RUNTIME}?schema=finance&pgbouncer=true&connection_limit=5,\
DIRECT_DATABASE_URL=postgresql://${SUPABASE_USER}:${SUPABASE_PASS}@${SUPABASE_HOST}:5432/${SUPABASE_DB}?schema=finance,\
REDIS_URL=${REDIS_URL},\
S3_ENDPOINT=https://storage.googleapis.com,\
S3_BUCKET=tscrm-demo-files-2026,\
S3_REGION=us-central1,\
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true,\
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser"

FINANCE_URL=$(gcloud run services describe finance-service \
  --region=us-central1 --format="value(status.url)")
echo "✅ Finance: $FINANCE_URL"
```

---

### Comms Service (port 3005)

> comms-service uses PostgreSQL (Prisma) + Redis (BullMQ) only — no MongoDB.

```bash
gcloud run deploy comms-service \
  --image=$REGISTRY/comms-service:latest \
  --region=us-central1 \
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
SENDGRID_FROM_EMAIL=pasinduravishan88@gmail.com,\
SENDGRID_FROM_NAME=T%26S Services,\
EMAIL_PROVIDER=sendgrid,\
SMTP_HOST=smtp-relay.brevo.com,\
SMTP_PORT=587,\
SMTP_SECURE=false,\
SMTP_USER=a4ff37001@smtp-brevo.com,\
SMTP_PASS=${SMTP_PASS},\
SMTP_FROM_EMAIL=pasinduravishan88@gmail.com,\
SMTP_FROM_NAME=T%26S Services,\
FRONTEND_URL=${ADMIN_URL}"

COMMS_URL=$(gcloud run services describe comms-service \
  --region=us-central1 --format="value(status.url)")
echo "✅ Comms: $COMMS_URL"
```

---

### Analytics Service (port 3006)

```bash
gcloud run deploy analytics-service \
  --image=$REGISTRY/analytics-service:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=3006 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="\
NODE_ENV=production,\
ANALYTICS_PORT=3006,\
BYPASS_AUTH=true,\
JWT_SECRET=${JWT_SECRET},\
ANALYTICS_DATABASE_URL=${DB_RUNTIME}?schema=analytics&pgbouncer=true&connection_limit=5"

ANALYTICS_URL=$(gcloud run services describe analytics-service \
  --region=us-central1 --format="value(status.url)")
echo "✅ Analytics: $ANALYTICS_URL"
```

---

### Inventory Service (port 3007)

```bash
gcloud run deploy inventory-service \
  --image=$REGISTRY/inventory-service:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=3007 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="\
NODE_ENV=production,\
INVENTORY_PORT=3007,\
BYPASS_AUTH=true,\
JWT_SECRET=${JWT_SECRET},\
INVENTORY_DATABASE_URL=${DB_RUNTIME}?schema=inventory&pgbouncer=true&connection_limit=5"

INV_URL=$(gcloud run services describe inventory-service \
  --region=us-central1 --format="value(status.url)")
echo "✅ Inventory: $INV_URL"
```

---

### Update Gateway with Real Service URLs

Now that all 7 NestJS/Go services are deployed, update the gateway. The AI services (churn + agent) will be added in Step 11 after they are deployed.

```bash
gcloud run services update nginx-gateway \
  --region=us-central1 \
  --set-env-vars="\
CRM_SERVICE_URL=${CRM_URL},\
JOBS_SERVICE_URL=${JOBS_URL},\
SCHEDULING_SERVICE_URL=${SCHED_URL},\
FINANCE_SERVICE_URL=${FINANCE_URL},\
COMMS_SERVICE_URL=${COMMS_URL},\
ANALYTICS_SERVICE_URL=${ANALYTICS_URL},\
INVENTORY_SERVICE_URL=${INV_URL},\
CHURN_SERVICE_URL=https://placeholder.run.app,\
AGENT_SERVICE_URL=https://placeholder.run.app"

echo "✅ Gateway updated (AI service URLs will be filled in after Step 11)"
echo "Your API Gateway: $GATEWAY_URL"
```

Also update the CRM service's `COMMS_SERVICE_URL` (now that we have the real URL):

```bash
gcloud run services update crm-service \
  --region=us-central1 \
  --update-env-vars="COMMS_SERVICE_URL=${COMMS_URL}"
```

#### Via Browser (if you prefer)

1. Go to **Cloud Run** → click `nginx-gateway`
2. Click **Edit & Deploy New Revision** (top toolbar)
3. Scroll to **Variables & Secrets** tab
4. Update each `*_SERVICE_URL` with the real Cloud Run URL
5. Click **Deploy**

---

## 11. Deploy AI/ML Services

These two Python services power all the AI features: churn prediction, upsell recommendations, contextual bandit agents, and the observability dashboard.

### Set variables (if your terminal is fresh — add to existing session variables from Step 10)

```bash
export REGISTRY="us-central1-docker.pkg.dev/tscrm-demo-2026/tscrm-images"
export SUPABASE_USER="postgres.piezmopzxbuksjuuwwyw"
export SUPABASE_PASS="vnHoMrqPMHTRHOu6"
export JWT_SECRET=$(gcloud secrets versions access latest --secret=tscrm-jwt-secret)
```

---

### Churn Service (Python FastAPI, port 8000)

Serves: `/predict/churn`, `/predict/failure`, `/predict/revenue`, `/recommend-offer`
Used by: crm-service (churn prediction for follow-up agent) + admin dashboard (customer AI recommendations)

```bash
gcloud run deploy churn-service \
  --image=$REGISTRY/churn-service:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=8000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars="\
PORT=8000"

CHURN_URL=$(gcloud run services describe churn-service \
  --region=us-central1 --format="value(status.url)")
echo "✅ Churn Service: $CHURN_URL"
```

> ⚠️ Cloud Run rewrites the PORT env var automatically. The Dockerfile uses port 8000 (`uvicorn main:app --port 8000`). Cloud Run will handle it.

---

### Agent Service (Python Flask bandit + analytics, port 8080)

Serves:
- `/bandit/*` — bandit observability API (reward trends, action stats, regret)
- `/analytics/*` — revenue agent metrics
- `/health` — health check

Used by: analytics-service (via `REVENUE_AGENT_URL`) + admin dashboard bandit observability dashboard

> **No MongoDB needed.** The bandit agents try MongoDB with a 500ms timeout and silently fall back to reading JSONL log files. The service works fully without any `MONGO_URI` env var. JSONL logs are stored in the container's `/tmp` — they reset on container restart, which is fine for a demo.

```bash
gcloud run deploy agent-service \
  --image=$REGISTRY/agent-service:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars="\
PORT=8080"

AGENT_URL=$(gcloud run services describe agent-service \
  --region=us-central1 --format="value(status.url)")
echo "✅ Agent Service: $AGENT_URL"
```

---

### Update crm-service with Churn Service URL

```bash
gcloud run services update crm-service \
  --region=us-central1 \
  --update-env-vars="\
CHURN_SERVICE_URL=${CHURN_URL},\
UPSELL_SERVICE_URL=${CHURN_URL}"

echo "✅ CRM service now knows how to reach churn-service"
```

### Update analytics-service with Agent Service URL

```bash
gcloud run services update analytics-service \
  --region=us-central1 \
  --update-env-vars="\
REVENUE_AGENT_URL=${AGENT_URL},\
BANDIT_API_URL=${AGENT_URL}"

echo "✅ Analytics service now knows how to reach agent-service"
```

### Final Gateway Update — now with real AI service URLs

```bash
# Pull all other URLs from previous step (if terminal was reset, re-run the describe commands)
CRM_URL=$(gcloud run services describe crm-service --region=us-central1 --format="value(status.url)")
JOBS_URL=$(gcloud run services describe job-service --region=us-central1 --format="value(status.url)")
SCHED_URL=$(gcloud run services describe scheduling-service --region=us-central1 --format="value(status.url)")
FINANCE_URL=$(gcloud run services describe finance-service --region=us-central1 --format="value(status.url)")
COMMS_URL=$(gcloud run services describe comms-service --region=us-central1 --format="value(status.url)")
ANALYTICS_URL=$(gcloud run services describe analytics-service --region=us-central1 --format="value(status.url)")
INV_URL=$(gcloud run services describe inventory-service --region=us-central1 --format="value(status.url)")

gcloud run services update nginx-gateway \
  --region=us-central1 \
  --set-env-vars="\
CRM_SERVICE_URL=${CRM_URL},\
JOBS_SERVICE_URL=${JOBS_URL},\
SCHEDULING_SERVICE_URL=${SCHED_URL},\
FINANCE_SERVICE_URL=${FINANCE_URL},\
COMMS_SERVICE_URL=${COMMS_URL},\
ANALYTICS_SERVICE_URL=${ANALYTICS_URL},\
INVENTORY_SERVICE_URL=${INV_URL},\
CHURN_SERVICE_URL=${CHURN_URL},\
AGENT_SERVICE_URL=${AGENT_URL}"

echo "✅ All services wired up — gateway fully configured!"
```

---

## 12. Run Database Migrations

Your Supabase schemas already exist (Prisma already ran migrations against them locally). But run this to ensure any schema changes are applied in production.

> ⚠️ **Use the DIRECT URL (port 5432, no pgbouncer)** for migrations — Prisma cannot run DDL through pgbouncer.
>
> This step uses a dedicated migration image (`prisma-migrate`) so the container has the Prisma CLI available. Do not reuse the runtime app images for this step.

```bash
export SUPABASE_USER="postgres.piezmopzxbuksjuuwwyw"
export SUPABASE_PASS="vnHoMrqPMHTRHOu6"
export SUPABASE_HOST="aws-1-ap-northeast-2.pooler.supabase.com"
export DIRECT_BASE="postgresql://${SUPABASE_USER}:${SUPABASE_PASS}@${SUPABASE_HOST}:5432/postgres"
export REGISTRY="us-central1-docker.pkg.dev/tscrm-demo-2026/tscrm-images"

# Build and push the dedicated migration image once
docker build --platform linux/amd64 \
  -f infrastructure/prisma-migrate/Dockerfile \
  -t $REGISTRY/prisma-migrate:latest \
  .
docker push $REGISTRY/prisma-migrate:latest

# Run migrations for each Prisma service
# ────────────────────────────────────────────────────────────────────────────

# CRM Service
gcloud run jobs create migrate-crm-service \
  --image=$REGISTRY/prisma-migrate:latest \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=1 \
  --command=/usr/local/bin/run-prisma-migration.sh \
  --set-env-vars="SERVICE=crm-service,CRM_DATABASE_URL=${DIRECT_BASE}?schema=crm,CRM_DIRECT_DATABASE_URL=${DIRECT_BASE}?schema=crm,NODE_ENV=production" \
  2>/dev/null || gcloud run jobs update migrate-crm-service \
    --image=$REGISTRY/prisma-migrate:latest \
    --region=us-central1 \
    --memory=1Gi \
    --cpu=1 \
    --command=/usr/local/bin/run-prisma-migration.sh \
    --set-env-vars="SERVICE=crm-service,CRM_DATABASE_URL=${DIRECT_BASE}?schema=crm,CRM_DIRECT_DATABASE_URL=${DIRECT_BASE}?schema=crm,NODE_ENV=production" >/dev/null

gcloud run jobs execute migrate-crm-service --region=us-central1 --wait
echo "✅ CRM migrations complete"

# Job Service
gcloud run jobs create migrate-job-service \
  --image=$REGISTRY/prisma-migrate:latest \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=1 \
  --command=/usr/local/bin/run-prisma-migration.sh \
  --set-env-vars="SERVICE=job-service,JOBS_DATABASE_URL=${DIRECT_BASE}?schema=jobs,NODE_ENV=production" \
  2>/dev/null || gcloud run jobs update migrate-job-service \
    --image=$REGISTRY/prisma-migrate:latest \
    --region=us-central1 \
    --memory=1Gi \
    --cpu=1 \
    --command=/usr/local/bin/run-prisma-migration.sh \
    --set-env-vars="SERVICE=job-service,JOBS_DATABASE_URL=${DIRECT_BASE}?schema=jobs,NODE_ENV=production" >/dev/null

gcloud run jobs execute migrate-job-service --region=us-central1 --wait
echo "✅ Job Service migrations complete"

# Finance Service
gcloud run jobs create migrate-finance-service \
  --image=$REGISTRY/prisma-migrate:latest \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=1 \
  --command=/usr/local/bin/run-prisma-migration.sh \
  --set-env-vars="SERVICE=finance-service,DATABASE_URL=${DIRECT_BASE}?schema=finance,DIRECT_DATABASE_URL=${DIRECT_BASE}?schema=finance,NODE_ENV=production" \
  2>/dev/null || gcloud run jobs update migrate-finance-service \
    --image=$REGISTRY/prisma-migrate:latest \
    --region=us-central1 \
    --memory=1Gi \
    --cpu=1 \
    --command=/usr/local/bin/run-prisma-migration.sh \
    --set-env-vars="SERVICE=finance-service,DATABASE_URL=${DIRECT_BASE}?schema=finance,DIRECT_DATABASE_URL=${DIRECT_BASE}?schema=finance,NODE_ENV=production" >/dev/null

gcloud run jobs execute migrate-finance-service --region=us-central1 --wait
echo "✅ Finance Service migrations complete"

# Analytics Service
gcloud run jobs create migrate-analytics-service \
  --image=$REGISTRY/prisma-migrate:latest \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=1 \
  --command=/usr/local/bin/run-prisma-migration.sh \
  --set-env-vars="SERVICE=analytics-service,ANALYTICS_DATABASE_URL=${DIRECT_BASE}?schema=analytics,NODE_ENV=production" \
  2>/dev/null || gcloud run jobs update migrate-analytics-service \
    --image=$REGISTRY/prisma-migrate:latest \
    --region=us-central1 \
    --memory=1Gi \
    --cpu=1 \
    --command=/usr/local/bin/run-prisma-migration.sh \
    --set-env-vars="SERVICE=analytics-service,ANALYTICS_DATABASE_URL=${DIRECT_BASE}?schema=analytics,NODE_ENV=production" >/dev/null

gcloud run jobs execute migrate-analytics-service --region=us-central1 --wait
echo "✅ Analytics Service migrations complete"

# Inventory Service
gcloud run jobs create migrate-inventory-service \
  --image=$REGISTRY/prisma-migrate:latest \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=1 \
  --command=/usr/local/bin/run-prisma-migration.sh \
  --set-env-vars="SERVICE=inventory-service,INVENTORY_DATABASE_URL=${DIRECT_BASE}?schema=inventory,NODE_ENV=production" \
  2>/dev/null || gcloud run jobs update migrate-inventory-service \
    --image=$REGISTRY/prisma-migrate:latest \
    --region=us-central1 \
    --memory=1Gi \
    --cpu=1 \
    --command=/usr/local/bin/run-prisma-migration.sh \
    --set-env-vars="SERVICE=inventory-service,INVENTORY_DATABASE_URL=${DIRECT_BASE}?schema=inventory,NODE_ENV=production" >/dev/null

gcloud run jobs execute migrate-inventory-service --region=us-central1 --wait
echo "✅ Inventory Service migrations complete"

echo ""
echo "All database migrations complete! ✅"
```

> If you hit errors like "database already exists", it's fine — migrations are idempotent.

---

## 13. Deploy Frontends to Firebase Hosting

### 13A. Firebase Hosting Setup

Do not run `firebase init hosting` in the monorepo root. Firebase CLI will probe the repo root as a Vite app and fail because Vite is only installed inside the frontend workspace, not at the root.

This repo now includes checked-in Firebase config at the root, so you can skip initialization and go straight to deploy.

```bash
# Login to Firebase
firebase login

# Confirm you are at the repo root with the checked-in config
cd /Users/ravishan/Desktop/Lush/T&SBCRM

# Optional sanity check: these files should already exist
ls firebase.json .firebaserc
```

If you do want to regenerate the config manually, use the values already checked into `firebase.json` instead of accepting the framework detector prompts.

### 13B. Create Two Hosting Sites

```bash
# Create separate sites for admin and customer portals
firebase hosting:sites:create tscrm-demo-admin --project tscrm-demo-2026
firebase hosting:sites:create tscrm-demo-customer --project tscrm-demo-2026
```

### 13C. Update `firebase.json`

The checked-in `firebase.json` already uses the correct site IDs and hosting roots. If you need to adjust it, keep the same `site` values and output paths.

```json
{
  "hosting": [
    {
      "target": "admin",
      "public": "apps/admin-dashboard/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }],
      "headers": [
        {
          "source": "**/*.@(js|css)",
          "headers": [{ "key": "Cache-Control", "value": "max-age=31536000" }]
        }
      ]
    },
    {
      "target": "customer",
      "public": "apps/customer-portal/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

### 13D. Configure Frontend to Point to Your Gateway

The frontends currently use `baseURL: '/api'` which works via the Vite dev proxy. In production (Firebase Hosting), there's no proxy — you need to point directly to the gateway.

**Update `apps/admin-dashboard/src/lib/api.ts`** — change the `baseURL` line:

```typescript
// FROM:
const api = axios.create({
  baseURL: '/api',
  ...
})

// TO:
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  ...
})
```

**Update `apps/customer-portal/src/lib/api.ts`** — same change:

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  ...
})
```

**Create `apps/admin-dashboard/.env.production`:**

```bash
# Replace nginx-gateway-xxxx-uc.a.run.app with YOUR actual gateway URL from Step 9
cat > apps/admin-dashboard/.env.production << 'EOF'
VITE_COMPANY_ID=co-demo-001
VITE_API_BASE_URL=https://nginx-gateway-xxxx-uc.a.run.app
EOF
```

**Create `apps/customer-portal/.env.production`:**

```bash
cat > apps/customer-portal/.env.production << 'EOF'
VITE_COMPANY_ID=co-demo-001
VITE_API_BASE_URL=https://nginx-gateway-xxxx-uc.a.run.app
EOF
```

> ⚠️ **Critical:** Replace `nginx-gateway-xxxx-uc.a.run.app` with your actual gateway URL from Step 9.

### 13E. Also Update CORS in Comms Service

The comms service has hardcoded CORS origins for localhost. Update it for production:

In `apps/comms-service/src/main.ts`, the CORS line currently allows only localhost. Add your Firebase URLs:

```typescript
// Find this line in main.ts:
app.enableCors({ origin: ['http://localhost:3000', 'http://localhost:5173'] });

// Change to:
app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://tscrm-demo-admin.web.app',
    'https://tscrm-demo-customer.web.app',
  ],
  credentials: true,
});
```

Then rebuild and redeploy comms-service:
```bash
export REGISTRY="us-central1-docker.pkg.dev/tscrm-demo-2026/tscrm-images"

docker build -f apps/comms-service/Dockerfile -t $REGISTRY/comms-service:latest .
docker push $REGISTRY/comms-service:latest
gcloud run deploy comms-service --image=$REGISTRY/comms-service:latest --region=us-central1
```

### 13F. Build & Deploy Both Frontends

```bash
cd /Users/ravishan/Desktop/Lush/T&SBCRM

# Build Admin Dashboard (uses .env.production automatically)
pnpm --filter=admin-dashboard build

# Build Customer Portal
pnpm --filter=customer-portal build

# Deploy both hosting sites from the repo root
firebase deploy --only hosting
```

You will see output like:
```
✔  Deploy complete!
Hosting URL (admin):    https://tscrm-demo-admin.web.app
Hosting URL (customer): https://tscrm-demo-customer.web.app
```

---

## 14. Final Verification & Health Checks

### 14A. Check all Cloud Run services are healthy

```bash
gcloud run services list --region=us-central1
```

All services should show green status. Then test the gateway:

```bash
GATEWAY="https://nginx-gateway-xxxx-uc.a.run.app"  # Replace with yours

# Gateway health
curl $GATEWAY/health

# Each service health
for SVC in crm jobs scheduling finance comms analytics inventory; do
  echo -n "$SVC: "
  curl -s "$GATEWAY/api/$SVC/health" | head -c 100
  echo ""
done
```

### 14B. Test Authentication

```bash
GATEWAY="https://nginx-gateway-xxxx-uc.a.run.app"

# Test login (your demo admin account)
curl -X POST $GATEWAY/api/crm/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pasinduravishan.22@cse.mrt.ac.lk","password":"your_password"}' \
  | python3 -m json.tool
```

### 14C. Test API with Bypass Auth Headers

```bash
# List customers (bypass auth — works because BYPASS_AUTH=true)
curl $GATEWAY/api/crm/customers \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: COMPANY_ADMIN" \
  -H "x-test-user-id: user-001" \
  -H "x-test-user-name: Demo Admin"

# List jobs
curl $GATEWAY/api/jobs/jobs \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: COMPANY_ADMIN" \
  -H "x-test-user-id: user-001" \
  -H "x-test-user-name: Demo Admin"

# List technicians (dispatch)
curl $GATEWAY/api/scheduling/technicians \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: COMPANY_ADMIN" \
  -H "x-test-user-id: user-001" \
  -H "x-test-user-name: Demo Admin"

# List inventory
curl $GATEWAY/api/inventory/items \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: COMPANY_ADMIN" \
  -H "x-test-user-id: user-001" \
  -H "x-test-user-name: Demo Admin"
```

### 14D. Test Email Sending

```bash
# Trigger a test welcome email (provision a test technician)
curl -X POST $GATEWAY/api/crm/auth/provision-technician \
  -H "Content-Type: application/json" \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: COMPANY_ADMIN" \
  -H "x-test-user-id: user-001" \
  -H "x-test-user-name: Demo Admin" \
  -d '{"name":"Test Tech","email":"pasinduravishan.22@cse.mrt.ac.lk","companyId":"co-demo-001"}'
```

### 14E. Test AI/ML Services ⭐ NEW

```bash
GATEWAY="https://nginx-gateway-xxxx-uc.a.run.app"  # Replace with yours

# Test churn-service directly
CHURN_URL="https://churn-service-xxxx-uc.a.run.app"  # Replace with yours
curl $CHURN_URL/health
# Expected: {"status": "ok"}

# Test churn prediction
curl -X POST $CHURN_URL/predict/churn \
  -H "Content-Type: application/json" \
  -d '{"days_since_last_service": 120, "service_count_last_year": 1, "avg_monthly_spend": 150, "customer_tenure_days": 365}'
# Expected: {"churn_probability": 0.XX}

# Test upsell recommendation
curl -X POST $CHURN_URL/recommend-offer \
  -H "Content-Type: application/json" \
  -d '{"equipment_age": 5, "failure_count": 2, "last_service_days": 60, "avg_spend": 300, "usage_hours_per_week": 8}'
# Expected: {"recommended_offer": "...", "confidence": 0.XX, ...}

# Test agent-service (bandit observability) directly
AGENT_URL="https://agent-service-xxxx-uc.a.run.app"  # Replace with yours
curl $AGENT_URL/health
curl $AGENT_URL/bandit/summary
# Expected: {"avg_reward": 0, "exploration_rate": 0, ...} (empty until agents run)

# Test via gateway (production path)
curl $GATEWAY/api/churn/health
curl "$GATEWAY/api/analytics/bandit-api/bandit/summary"
curl "$GATEWAY/api/analytics/revenue-agent-api/analytics/summary"
```

### 14F. Via Cloud Run Console

1. Go to **Cloud Run** → each service → **Logs** tab
2. Look for:
   - NestJS: `[NestJS] Application is running on port XXXX` — success
   - Go: `server is running on :3003` — success
   - Any `ERROR` or `FATAL` lines — investigate

### 14G. Via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com) → your project → **Hosting**
2. Both sites should show "Deployed" with green status
3. Click the URL to open your app

---

## 15. Common Errors & Fixes

### Error: `pnpm: not found` during Docker build

The Dockerfile uses `corepack enable && corepack prepare pnpm@latest`. If this fails, pin a specific pnpm version:

```dockerfile
# Replace this line:
RUN corepack enable && corepack prepare pnpm@latest --activate
# With:
RUN npm install -g pnpm@9
```

---

### Error: `@tscrm/types: build script not found`

Some shared packages may not have a build step. The Dockerfile uses `|| true` to handle this. If it still fails, check `packages/types/package.json` for a `build` script.

---

### Error: `Prisma Client not found` or `ENOENT prisma/schema.prisma`

The Prisma client must be generated in the Docker build. Verify the Dockerfile includes:
```dockerfile
RUN cd apps/crm-service && npx prisma generate
```
And the `prisma/` folder is copied to the runtime stage.

---

### Error: Cloud Run returns 500 on first request

Cloud Run scales to zero when idle. The first request after a cold start wakes the container. This can cause a 500 if the service isn't ready yet. Check logs:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=crm-service" \
  --limit=20 --format="value(textPayload)"
```

---

### Error: `ETIMEDOUT` connecting to Supabase from Cloud Run

The Supabase pooler requires `sslmode=require`. Ensure your connection strings have:
- Runtime (pgbouncer): `?pgbouncer=true&connection_limit=5` on port `6543`
- Migrations (direct): port `5432` without pgbouncer flag

If you still get timeouts, check the Supabase dashboard → **Settings** → **Database** → confirm the pooler is enabled and the password is correct.

---

### Error: `connect ECONNREFUSED redis` (comms or scheduling service)

The `REDIS_URL` env var must start with `rediss://` (TLS) for Upstash, not `redis://`. Verify:

```bash
gcloud run services describe comms-service --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

---

### Error: Frontend shows blank page or API calls fail with CORS

1. Check that `.env.production` has the correct `VITE_API_BASE_URL` (your gateway URL)
2. Rebuild and redeploy: `pnpm --filter=admin-dashboard build && firebase deploy --only hosting:admin`
3. Check the browser console for the actual error URL

---

### Error: WebSocket not connecting (dispatch map)

Cloud Run doesn't support WebSocket natively — it times out after 60 seconds. For the demo:
- Live GPS updates via WebSocket will disconnect after 60s on Cloud Run
- Map still works, just won't get real-time updates unless you reconnect

**For a proper fix:** Use Cloud Run with `--session-affinity` or deploy the scheduling service to a GCP VM instead.

---

### Error: `ModuleNotFoundError: No module named 'agent'` in agent-service

The `server.py` uses `sys.path.insert(0, ROOT)` to find `agent/`, `api/`, `analytics/` from the project root. If the Dockerfile's COPY structure doesn't match, this fails.

**Fix:** Verify the Dockerfile COPYs `agent/`, `api/`, `analytics/`, `models/` to `/app/` and `server.py` is also at `/app/server.py`. Then `ROOT = /app` and all imports resolve correctly. Check with:
```bash
docker run --rm $REGISTRY/agent-service:latest python -c "import agent; print('ok')"
```

---

### Error: `RuntimeError: Model artifact not found: .../models/churn_model.pkl` in churn-service

The churn-service Dockerfile uses `context: ./apps/churn-service` and copies `src/` directory. The `.pkl` files are at `apps/churn-service/src/models/`. If the build path is wrong they won't be included.

**Verify:**
```bash
docker run --rm $REGISTRY/churn-service:latest python -c "
import joblib; m = joblib.load('/app/src/models/churn_model.pkl'); print('model ok:', type(m))
"
```

---

### Bandit dashboard shows all zeros / empty charts

This is **expected on a fresh deployment** — the bandit agents haven't run yet so there are no JSONL log entries. The charts populate as agents run over time.

The agents write decision logs to JSONL files in the container's filesystem. Note that Cloud Run containers are stateless — logs reset if the container restarts. For a demo this is fine; the dashboard will show data from the current container's session.

If you want to pre-warm the bandit data, trigger the revenue agent via an API call through the deployed crm-service or analytics-service endpoints.

---

### Error: `churn-service` 500 on `/predict/churn` in production

The churn-service loads models at startup (`preload_models()`). If it returns 500, check Cloud Run logs:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=churn-service" \
  --limit=20 --format="value(textPayload)"
```
Most likely cause: the `.pkl` files weren't copied into the image. Rebuild the churn-service image.

---

## 16. Environment Variables Reference

Complete reference of what each service needs in production:

### Supabase Connection Strings

```bash
# Runtime (use for all services except Prisma migrations)
RUNTIME_BASE="postgresql://postgres.piezmopzxbuksjuuwwyw:<DB_PASSWORD>@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

# Schema-specific runtime URLs:
CRM_DATABASE_URL="${RUNTIME_BASE}?schema=crm&pgbouncer=true&connection_limit=5"
JOBS_DATABASE_URL="${RUNTIME_BASE}?schema=jobs&pgbouncer=true&connection_limit=5"
FINANCE_DATABASE_URL="${RUNTIME_BASE}?schema=finance&pgbouncer=true&connection_limit=5"
COMMS_DATABASE_URL="${RUNTIME_BASE}?schema=comms&pgbouncer=true&connection_limit=5"
ANALYTICS_DATABASE_URL="${RUNTIME_BASE}?schema=analytics&pgbouncer=true&connection_limit=5"
INVENTORY_DATABASE_URL="${RUNTIME_BASE}?schema=inventory&pgbouncer=true&connection_limit=5"

# Scheduling (Go) uses search_path:
DATABASE_URL="${RUNTIME_BASE}?search_path=scheduling,public&pgbouncer=true&connection_limit=5&sslmode=require"

# Migration (Prisma only — direct port 5432, no pgbouncer):
DIRECT_BASE="postgresql://postgres.piezmopzxbuksjuuwwyw:<DB_PASSWORD>@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

### Per-Service Env Vars

| Service | Required Env Vars |
|---------|------------------|
| **crm-service** | `CRM_PORT=3001`, `CRM_DATABASE_URL`, `JWT_SECRET`, `BYPASS_AUTH=true`, `SMTP_*`, `COMMS_SERVICE_URL`, `CHURN_SERVICE_URL`, `UPSELL_SERVICE_URL` |
| **job-service** | `JOBS_PORT=3002`, `JOBS_DATABASE_URL`, `JWT_SECRET`, `BYPASS_AUTH=true`, `REDIS_URL` |
| **scheduling-service** | `SCHEDULING_PORT=3003`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `BYPASS_AUTH=true`, `GIN_MODE=release` |
| **finance-service** | `FINANCE_PORT=3004`, `FINANCE_DATABASE_URL`, `DATABASE_URL` (same), `DIRECT_DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `BYPASS_AUTH=true`, `S3_*`, `PUPPETEER_*` |
| **comms-service** | `COMMS_PORT=3005`, `COMMS_DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `BYPASS_AUTH=true`, `SENDGRID_*` or `SMTP_*`, `EMAIL_PROVIDER` |
| **analytics-service** | `ANALYTICS_PORT=3006`, `ANALYTICS_DATABASE_URL`, `JWT_SECRET`, `BYPASS_AUTH=true`, `REVENUE_AGENT_URL`, `BANDIT_API_URL` |
| **inventory-service** | `INVENTORY_PORT=3007`, `INVENTORY_DATABASE_URL`, `JWT_SECRET`, `BYPASS_AUTH=true` |
| **churn-service** ⭐ NEW | `PORT=8000` (Cloud Run sets this automatically) |
| **agent-service** ⭐ NEW | `PORT=8080` only — no MongoDB needed, agents fall back to JSONL files |
| **nginx-gateway** | `*_SERVICE_URL` for all 9 services (including `CHURN_SERVICE_URL` and `AGENT_SERVICE_URL`) |

---

## 17. Cost Breakdown

### Monthly estimate for demo traffic

| Resource | Spec | Cost/month |
|----------|------|-----------|
| **Cloud Run** — 10 services, ~50K req/month | 256MB–1GB RAM | **~$0–8** (free tier: 2M req/month) |
| **churn-service** (Python FastAPI ML) | 512MB RAM | **Included above** |
| **agent-service** (Python Flask bandit) | 512MB RAM | **Included above** |
| **Upstash Redis** — free tier | 10K cmd/day | **Free** |
| **Firebase Hosting** — 2 sites | 10GB, 360MB/day egress | **Free** |
| **Artifact Registry** — ~12GB images | $0.10/GB | **~$1.20/month** |
| **Cloud Storage** — PDFs, photos | ~$0.02/GB | **~$0.10/month** |
| **Supabase** — PostgreSQL | Free tier | **Free** |
| **GCP free credit** | $300 | **Offsets everything** |
| | | |
| **Total without credit** | | **~$9–12/month** |
| **Total with credit** | | **$0 for ~3 months** |

---

## Quick Reference — All URLs

After completing deployment, fill in your actual URLs here:

```
GCP Project ID:   tscrm-demo-2026
GCP Region:       us-central1
Docker Registry:  us-central1-docker.pkg.dev/tscrm-demo-2026/tscrm-images

Supabase:         aws-1-ap-northeast-2.pooler.supabase.com (already live)
Upstash Redis:    red-xxxx.upstash.io (fill after Step 5A)
GCS Bucket:       tscrm-demo-files-2026

Live Service URLs (fill in after Step 10):
  Gateway:          https://nginx-gateway-xxxx-uc.a.run.app
  CRM Service:      https://crm-service-xxxx-uc.a.run.app
  Job Service:      https://job-service-xxxx-uc.a.run.app
  Scheduling:       https://scheduling-service-xxxx-uc.a.run.app
  Finance:          https://finance-service-xxxx-uc.a.run.app
  Comms:            https://comms-service-xxxx-uc.a.run.app
  Analytics:        https://analytics-service-xxxx-uc.a.run.app
  Inventory:        https://inventory-service-xxxx-uc.a.run.app
  Churn (ML):       https://churn-service-xxxx-uc.a.run.app
  Agent (Bandit):   https://agent-service-xxxx-uc.a.run.app

Frontend URLs (fill in after Step 13):
  Admin Dashboard:  https://tscrm-demo-admin.web.app
  Customer Portal:  https://tscrm-demo-customer.web.app
```

---

## Deployment Order Summary

For quick reference, here is the exact order to do everything:

```
1.  Install tools (gcloud, Docker, firebase-tools)
2.  GCP project + billing
3.  Enable APIs
4.  Create Artifact Registry
5.  Set up Upstash Redis → copy rediss:// URL
6.  Create GCS bucket
7.  Create Dockerfiles:
      - 6 NestJS services (crm, job, finance, comms, analytics, inventory)
      - agent-service (NEW: apps/agent-service/Dockerfile + server.py)
      - churn-service (already has Dockerfile ✅)
      - nginx gateway (already has Dockerfile ✅)
8.  Build & push all 10 Docker images
9.  Store secrets in Secret Manager (JWT, DB password, Redis URL, SMTP pass)
10. Deploy nginx-gateway (placeholder URLs) → save GATEWAY_URL
11. Deploy 7 NestJS/Go backend services → save each URL
12. Update nginx-gateway with real service URLs (placeholders for AI services)
13. Update crm-service with real COMMS_SERVICE_URL
14. Deploy churn-service → save CHURN_URL
15. Deploy agent-service → save AGENT_URL
16. Update crm-service with CHURN_SERVICE_URL + UPSELL_SERVICE_URL
17. Update analytics-service with REVENUE_AGENT_URL + BANDIT_API_URL
18. Final gateway update with all 9 real service URLs (including CHURN + AGENT)
19. Run Prisma migrations (via Cloud Run Jobs)
20. Update api.ts baseURL in both frontends
21. Create .env.production for both frontends
22. Build frontends
23. Firebase init + create 2 hosting sites
24. Deploy frontends to Firebase
25. Verify health checks + AI endpoints
26. Demo! 🎉
```

---

*Document version: 2.2 · April 2026*
*Platform: GCP Cloud Run + Firebase Hosting + Supabase + Upstash*
