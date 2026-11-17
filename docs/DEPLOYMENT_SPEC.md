# T&S CRM — Deployment Specification
> Field Service Management Platform · Turborepo Monorepo · 7 Microservices + 2 Web Apps + 1 Mobile App

**Document version:** 1.0 · March 2026
**Author:** Generated from full project analysis
**Branch:** technician-app (merge to `main` before any deployment)

---

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Option A — Quick Client Demo Deploy](#2-option-a--quick-client-demo-deploy)
   - [2B — DigitalOcean Droplet + PM2](#2b-step-by-step-demo-deploy-on-digitalocean-droplet)
   - [2F — Railway (Zero-Config PaaS)](#2f-deploy-on-railway-recommended-easiest)
   - [2G — GCP Cloud Run (Serverless Containers)](#2g-deploy-on-gcp-cloud-run)
3. [Option B — Production Deploy](#3-option-b--production-deploy)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Database Setup & Migrations](#5-database-setup--migrations)
6. [Mobile App Deployment (Technician App)](#6-mobile-app-deployment-technician-app)
7. [Cost Estimates](#7-cost-estimates)
8. [Recommendation Summary](#8-recommendation-summary)

---

## 1. System Architecture Overview

### What you have built

| Layer | Service | Port | Tech | Database |
|-------|---------|------|------|----------|
| API Gateway | Nginx (dev) / Kong (prod) | 80/443 | Nginx 1.25 | — |
| CRM Service | crm-service | 3001 | NestJS 10 + Prisma | PostgreSQL (crm schema) |
| Job Service | job-service | 3002 | NestJS 10 + Prisma | PostgreSQL (jobs schema) |
| Scheduling Service | scheduling-service | 3003 | **Go 1.23** + Gin + PostGIS | PostgreSQL (scheduling schema) |
| Finance Service | finance-service | 3004 | NestJS 10 + Stripe + Puppeteer | PostgreSQL (finance schema) |
| Communications Service | comms-service | 3005 | NestJS 11 + BullMQ + Socket.IO | **MongoDB 7** |
| Analytics Service | analytics-service | 3006 | NestJS 10 + ExcelJS | PostgreSQL (analytics schema) |
| Inventory Service | inventory-service | 3007 | NestJS 10 + Prisma | PostgreSQL (inventory schema) |
| Admin Dashboard | admin-dashboard | 5173 | React 19 + Vite 7 | — |
| Customer Portal | customer-portal | 5174 | React 19 + Vite 7 | — |
| Technician App | technician-app | Mobile | React Native + Expo 54 | — |

### Infrastructure dependencies

| Dependency | Version | Used by |
|------------|---------|---------|
| PostgreSQL | 16 + PostGIS 3.4 | All 6 backend services (separate schemas) |
| MongoDB | 7 (replica set rs0) | comms-service only |
| Redis | 7 (AOF persistence) | comms-service (BullMQ + Socket.IO), scheduling-service |
| MinIO / S3 | Latest | Photos, PDFs, documents |

### External services needed

| Service | Used for | Required for demo? |
|---------|---------|-------------------|
| Auth0 | Authentication (production) | ❌ (local JWT works for demo) |
| Stripe | Payments | ❌ (graceful fallback) |
| Twilio | SMS | ❌ |
| SendGrid | Email | ❌ |
| Firebase FCM | Push notifications | ❌ |

---

## 2. Option A — Quick Client Demo Deploy

### Goal
Get everything running on a single server that a client can access via browser and mobile in **less than a day**, with **minimum cost and complexity**. Show all features working end-to-end.

### Three Platform Options for Demo

| Platform | Setup Time | Cost/month | Best For |
|----------|-----------|------------|---------|
| **🚂 Railway** | **1–2 hrs** | **~$20–35** | Fastest possible — deploy from GitHub, zero server config |
| **☁️ GCP Cloud Run** | 2–3 hrs | ~$15–30 | Free-tier friendly, scales to zero, good if you have a GCP account |
| **🐳 DigitalOcean Droplet** | 3–5 hrs | ~$24 | Full control, Docker Compose, closest to local dev setup |

> **Recommendation:** Use **Railway** for the fastest client demo. Use **GCP Cloud Run** if you want near-zero idle cost. Use **DigitalOcean** if you want full control and the closest experience to your local dev environment.

All three options are detailed below (sections 2B, 2F, 2G).

---

### 2A. Architecture for Demo

```
Internet
    │
    ▼
[Single VPS / Railway / Render]
    │
    ├── Nginx (port 80) ← API Gateway
    │       ├── /api/crm/*       → crm-service:3001
    │       ├── /api/jobs/*      → job-service:3002
    │       ├── /api/scheduling/* → scheduling-service:3003
    │       ├── /api/finance/*   → finance-service:3004
    │       ├── /api/comms/*     → comms-service:3005
    │       ├── /api/analytics/* → analytics-service:3006
    │       ├── /api/inventory/* → inventory-service:3007
    │       ├── /ws              → scheduling-service (WebSocket)
    │       └── /socket.io/      → comms-service (Socket.IO)
    │
    ├── Admin Dashboard  (port 80, served as static files by Nginx)
    ├── Customer Portal  (port 80/customer, served as static files by Nginx)
    │
    ├── PostgreSQL 16 + PostGIS (Docker, port 5432)
    ├── MongoDB 7 (Docker, port 27017)
    ├── Redis 7 (Docker, port 6379)
    └── MinIO (Docker, ports 9000/9001)
```

Everything runs on **one machine** using Docker Compose (extended from your existing setup).

---

### 2B. Step-by-Step Demo Deploy on DigitalOcean Droplet

#### Step 1 — Provision the server

1. Create a **DigitalOcean Droplet**: Ubuntu 24.04, **4GB RAM / 2 vCPU / 80GB SSD** (~$24/month)
2. Assign a reserved IP address
3. Point your domain (or use the IP directly): e.g., `demo.yourcompany.com`
4. SSH into the server

```bash
ssh root@YOUR_SERVER_IP
```

#### Step 2 — Install dependencies on the server

```bash
# Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

# Docker Compose v2
apt install -y docker-compose-plugin

# pnpm + Node 20
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc
pnpm env use --global 20

# Go 1.23 (for scheduling service)
wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
```

#### Step 3 — Clone and configure the project

```bash
git clone https://github.com/LushWare-Org/T-SBCRM.git
cd T-SBCRM
git checkout main   # make sure you're on main, not technician-app
pnpm install
```

#### Step 4 — Create the production .env file

Create a root `.env` file with your server's actual IP or domain:

```bash
cat > .env << 'EOF'
# ── Core ──────────────────────────────────────────────────────────────
NODE_ENV=production
SERVER_HOST=YOUR_SERVER_IP_OR_DOMAIN
JWT_SECRET=<JWT_SECRET>

# ── PostgreSQL ────────────────────────────────────────────────────────
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tscrm
POSTGRES_USER=tscrm_user
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD

# ── MongoDB ──────────────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/tscrm_comms?replicaSet=rs0

# ── Redis ─────────────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379

# ── MinIO ─────────────────────────────────────────────────────────────
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_THIS_PASSWORD
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=CHANGE_THIS_PASSWORD
S3_BUCKET=tscrm-files
S3_REGION=us-east-1

# ── Database URLs (per service) ───────────────────────────────────────
CRM_DATABASE_URL=postgresql://tscrm_user:CHANGE_THIS_PASSWORD@localhost:5432/tscrm?schema=crm
JOBS_DATABASE_URL=postgresql://tscrm_user:CHANGE_THIS_PASSWORD@localhost:5432/tscrm?schema=jobs
FINANCE_DATABASE_URL=postgresql://tscrm_user:CHANGE_THIS_PASSWORD@localhost:5432/tscrm?schema=finance
ANALYTICS_DATABASE_URL=postgresql://tscrm_user:CHANGE_THIS_PASSWORD@localhost:5432/tscrm?schema=analytics
INVENTORY_DATABASE_URL=postgresql://tscrm_user:CHANGE_THIS_PASSWORD@localhost:5432/tscrm?schema=inventory
# Scheduling uses DATABASE_URL directly (Go service)
DATABASE_URL=postgresql://tscrm_user:CHANGE_THIS_PASSWORD@localhost:5432/tscrm

# ── Auth (Demo: bypass auth ON) ───────────────────────────────────────
BYPASS_AUTH=true

# ── Service Ports ─────────────────────────────────────────────────────
CRM_PORT=3001
JOBS_PORT=3002
SCHEDULING_PORT=3003
FINANCE_PORT=3004
COMMS_PORT=3005
ANALYTICS_PORT=3006
INVENTORY_PORT=3007

# ── Frontend URLs (for CORS and callbacks) ────────────────────────────
FRONTEND_URL=http://YOUR_SERVER_IP_OR_DOMAIN
EOF
```

> ⚠️ Replace `CHANGE_THIS_*` with real values and `YOUR_SERVER_IP_OR_DOMAIN` with your IP/domain.

#### Step 5 — Start infrastructure (Docker Compose)

```bash
# Start databases, Redis, MinIO, Nginx
docker compose up -d postgres redis mongodb minio nginx pgadmin mongo-express redisinsight

# Wait for postgres to be healthy
docker compose ps   # check all are "running"

# Initialize MinIO bucket
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/tscrm-files --ignore-existing
```

#### Step 6 — Run database migrations

```bash
# Run Prisma migrations for each NestJS service
cd apps/crm-service && npx prisma migrate deploy && cd ../..
cd apps/job-service && npx prisma migrate deploy && cd ../..
cd apps/finance-service && npx prisma migrate deploy && cd ../..
cd apps/comms-service && npx prisma migrate deploy && cd ../..
cd apps/analytics-service && npx prisma migrate deploy && cd ../..
cd apps/inventory-service && npx prisma migrate deploy && cd ../..

# The Go service (scheduling) manages its own schema via raw SQL in init.sql
# Verify it was created by the Postgres init script:
docker compose exec postgres psql -U tscrm_user -d tscrm -c "\dn"
# You should see: crm, jobs, scheduling, finance, analytics, inventory
```

#### Step 7 — Build and start all services

```bash
# Build shared packages first
pnpm --filter=@tscrm/types build
pnpm --filter=@tscrm/auth-client build

# Build and start each NestJS service (in separate terminals or use PM2)
pnpm --filter=crm-service build
pnpm --filter=job-service build
pnpm --filter=finance-service build
pnpm --filter=comms-service build
pnpm --filter=analytics-service build
pnpm --filter=inventory-service build

# Build Go scheduling service
cd apps/scheduling-service
CGO_ENABLED=0 go build -ldflags='-s -w' -o scheduling-service ./cmd/server
cd ../..
```

#### Step 8 — Use PM2 to run all services

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'crm-service',
      cwd: './apps/crm-service',
      script: 'dist/main.js',
      env: { PORT: 3001, NODE_ENV: 'production' },
    },
    {
      name: 'job-service',
      cwd: './apps/job-service',
      script: 'dist/main.js',
      env: { PORT: 3002, NODE_ENV: 'production' },
    },
    {
      name: 'scheduling-service',
      cwd: './apps/scheduling-service',
      script: './scheduling-service',
      interpreter: 'none',
      env: { PORT: 3003, NODE_ENV: 'production' },
    },
    {
      name: 'finance-service',
      cwd: './apps/finance-service',
      script: 'dist/main.js',
      env: { PORT: 3004, NODE_ENV: 'production' },
    },
    {
      name: 'comms-service',
      cwd: './apps/comms-service',
      script: 'dist/main.js',
      env: { PORT: 3005, NODE_ENV: 'production' },
    },
    {
      name: 'analytics-service',
      cwd: './apps/analytics-service',
      script: 'dist/main.js',
      env: { PORT: 3006, NODE_ENV: 'production' },
    },
    {
      name: 'inventory-service',
      cwd: './apps/inventory-service',
      script: 'dist/main.js',
      env: { PORT: 3007, NODE_ENV: 'production' },
    },
  ],
};
EOF

# Start all services
pm2 start ecosystem.config.js

# Save PM2 to restart on server reboot
pm2 save
pm2 startup
```

#### Step 9 — Build and serve the frontends

```bash
# Build admin dashboard
cd apps/admin-dashboard
echo "VITE_COMPANY_ID=co-demo-001" > .env.production
pnpm build
cd ../..

# Build customer portal
cd apps/customer-portal
echo "VITE_COMPANY_ID=co-demo-001" > .env.production
pnpm build
cd ../..
```

Update Nginx config to serve the built React apps as static files:

```nginx
# In infrastructure/nginx/nginx.conf, add these server blocks:

server {
  listen 80;
  server_name demo.yourcompany.com;  # or your IP

  # Admin Dashboard (default)
  root /path/to/T-SBCRM/apps/admin-dashboard/dist;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }

  # API proxy (keep existing)
  location /api/ { ... }
  location /ws { ... }
  location /socket.io/ { ... }
}

server {
  listen 80;
  server_name customer.yourcompany.com;  # or yourcompany.com:5174

  root /path/to/T-SBCRM/apps/customer-portal/dist;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location /api/ { ... same as above }
}
```

#### Step 10 — Verify everything works

```bash
# Health checks
curl http://YOUR_SERVER/health
curl http://YOUR_SERVER/api/crm/health
curl http://YOUR_SERVER/api/jobs/health
curl http://YOUR_SERVER/api/scheduling/health
curl http://YOUR_SERVER/api/finance/health
curl http://YOUR_SERVER/api/comms/health
curl http://YOUR_SERVER/api/inventory/health

# Check PM2 status
pm2 list
pm2 logs --lines 20
```

#### Step 11 — Seed demo data

```bash
# Run the job-service seeder (creates demo job types, templates, price book)
cd apps/job-service && npx prisma db seed && cd ../..

# Create a demo company record via API
curl -X POST http://YOUR_SERVER/api/crm/companies \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: COMPANY_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo HVAC Co","tradePrimary":"HVAC"}'
```

---

### 2C. Technician App for Demo (Expo Go)

For the demo, technicians can use **Expo Go** (free app from App Store/Play Store) — no build required:

```bash
cd apps/technician-app

# Update the API base URL to your server
echo "EXPO_PUBLIC_API_BASE_URL=http://YOUR_SERVER_IP" > .env
echo "EXPO_PUBLIC_COMPANY_ID=co-demo-001" >> .env

# Start Expo dev server
npx expo start --tunnel   # --tunnel works over internet (no LAN required)
```

The client scans the QR code shown in the terminal with their phone's camera (iOS) or Expo Go app (Android).

> **⚠️ Important:** `--tunnel` requires the Expo account. Run `npx expo login` first with your Expo account credentials.

---

### 2D. Demo Checklist

Before the client meeting, verify these work:

- [ ] Admin Dashboard loads at `http://YOUR_SERVER`
- [ ] Customer Portal loads at `http://customer.YOUR_SERVER`
- [ ] Login works (use bypass headers: add demo user via API or create via register)
- [ ] Jobs page loads, create a job
- [ ] Dispatch board shows map with technician
- [ ] Technician app: tech can see and update jobs
- [ ] Inventory tab in job detail shows van stock
- [ ] Communications: send a test message

---

### 2E. Demo Summary — All Platform Options

| Item | DigitalOcean Droplet | Railway | GCP Cloud Run |
|------|---------------------|---------|---------------|
| Setup time | 3–5 hrs | 1–2 hrs | 2–3 hrs |
| Databases | Docker Compose (self-hosted) | Railway managed PG + Redis | Cloud SQL + Upstash Redis |
| MongoDB | Docker Compose | MongoDB Atlas free | MongoDB Atlas free |
| Services | PM2 (7 processes) | 8 Railway services | 8 Cloud Run services |
| Frontends | Nginx static | Railway static service | Firebase Hosting (free) |
| Mobile | Expo Go | Expo Go | Expo Go |
| Auth | BYPASS_AUTH=true | BYPASS_AUTH=true | BYPASS_AUTH=true |
| HTTPS | No (HTTP only) | Auto (Railway provides) | Auto (Cloud Run provides) |
| Monthly cost | ~$24 | ~$20–35 | ~$15–30 |

---

## 2F. Deploy on Railway *(Recommended — Easiest)*

### Why Railway for Demo
- **Zero server management** — Railway handles OS, networking, TLS, scaling
- **Nixpacks** auto-detects Node.js — no Dockerfiles needed for NestJS services
- **Managed PostgreSQL + Redis** built-in add-ons
- **Deploy from GitHub** — push to branch = automatic redeploy
- **Free $5 trial credit**, Hobby plan at $5/month + usage (~$0.000463/GB-hr for RAM)
- Public HTTPS URL provided automatically for every service

### 2F-1. Prerequisites

1. Create a free account at [railway.app](https://railway.app)
2. Install Railway CLI:
```bash
npm install -g @railway/cli
railway login
```
3. Push your project to GitHub (Railway deploys from Git)

---

### 2F-2. Create Railway Project & Databases

```bash
# Create a new Railway project
railway init   # choose "Empty project", name it "tscrm-demo"

# Or do it via the Railway dashboard at railway.app/new
```

In the **Railway dashboard**, add the following **database add-ons** to your project:

1. Click **+ New** → **Database** → **PostgreSQL** → name it `tscrm-postgres`
2. Click **+ New** → **Database** → **Redis** → name it `tscrm-redis`

> For **MongoDB**, Railway doesn't have a managed offering. Use **MongoDB Atlas free tier** instead:
> - Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
> - Create a free M0 cluster
> - Create a database user + whitelist `0.0.0.0/0`
> - Get the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/tscrm_comms`

---

### 2F-3. Create a `railway.toml` Configuration

In the root of your project, create `railway.toml` to define all services:

```toml
[build]
  builder = "NIXPACKS"

# Each service is its own Railway service — configure via dashboard or CLI
# railway.toml drives per-service config when using monorepo
```

For **each microservice**, Railway needs to know the root directory. Do this via the dashboard:

1. Click **+ New** → **GitHub Repo** → select your repo
2. Set **Root Directory** to `apps/crm-service`
3. Set **Start Command** to `node dist/main.js`
4. Repeat for each service

Or use the CLI approach (faster):

```bash
# From your repo root, create each service:
railway service create crm-service
railway service create job-service
railway service create scheduling-service
railway service create finance-service
railway service create comms-service
railway service create analytics-service
railway service create inventory-service
railway service create admin-dashboard
railway service create customer-portal
```

---

### 2F-4. Configure Each NestJS Service

For each of the 7 NestJS services, in the Railway dashboard → service → **Settings**:

| Setting | Value |
|---------|-------|
| Root Directory | `apps/<service-name>` |
| Build Command | `pnpm install && pnpm --filter=@tscrm/types build && pnpm --filter=@tscrm/auth-client build && pnpm build` |
| Start Command | `node dist/main.js` |
| Watch Paths | `apps/<service-name>/**`, `packages/**` |

Then in **Variables** tab, add for **every NestJS service**:

```bash
NODE_ENV=production
BYPASS_AUTH=true
JWT_SECRET=<your-64-char-random-string>

# PostgreSQL — copy from Railway's postgres add-on "Connect" tab:
DATABASE_URL=${{tscrm-postgres.DATABASE_URL}}

# Per-service database URL (append ?schema=<name>):
# For crm-service:
CRM_DATABASE_URL=${{tscrm-postgres.DATABASE_URL}}?schema=crm

# Redis — copy from Railway's redis add-on:
REDIS_URL=${{tscrm-redis.REDIS_URL}}
REDIS_HOST=${{tscrm-redis.REDISHOST}}
REDIS_PORT=${{tscrm-redis.REDISPORT}}

# MongoDB (from MongoDB Atlas):
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tscrm_comms

# MinIO → use Cloudflare R2 free tier (S3-compatible) OR skip for demo
# S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
# S3_ACCESS_KEY=<r2-access-key>
# S3_SECRET_KEY=<r2-secret-key>
# S3_BUCKET=tscrm-files
```

Service-specific schema env vars:

| Service | Extra Variable |
|---------|----------------|
| crm-service | `CRM_DATABASE_URL=...$?schema=crm` |
| job-service | `JOBS_DATABASE_URL=...$?schema=jobs` |
| finance-service | `FINANCE_DATABASE_URL=...$?schema=finance` |
| analytics-service | `ANALYTICS_DATABASE_URL=...$?schema=analytics` |
| inventory-service | `INVENTORY_DATABASE_URL=...$?schema=inventory` |
| scheduling-service | `DATABASE_URL=...` (no schema suffix — Go manages its own) |
| comms-service | `MONGODB_URI=...` (uses MongoDB, not PG) |

---

### 2F-5. Configure the Go Scheduling Service

The Go service needs a **Dockerfile** since Nixpacks may not pick up the monorepo Go structure. Create `apps/scheduling-service/Dockerfile`:

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags='-s -w' -o scheduling-service ./cmd/server

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/scheduling-service .
EXPOSE 3003
CMD ["./scheduling-service"]
```

In Railway dashboard for `scheduling-service`:
- Set **Root Directory** → `apps/scheduling-service`
- Set **Start Command** → `./scheduling-service`
- Railway will auto-detect the Dockerfile

---

### 2F-6. Configure Frontend Services

**Admin Dashboard:**
- Root Directory: `apps/admin-dashboard`
- Build Command: `pnpm install && pnpm build`
- Start Command: `npx serve -s dist -l $PORT`
- Variables:
  ```
  VITE_COMPANY_ID=co-demo-001
  VITE_API_BASE_URL=https://<your-crm-service-url-on-railway>
  # Or set up a unified API gateway service (see below)
  ```

**Customer Portal:**
- Root Directory: `apps/customer-portal`
- Build Command: `pnpm install && pnpm build`
- Start Command: `npx serve -s dist -l $PORT`
- Variables:
  ```
  VITE_COMPANY_ID=co-demo-001
  ```

> **API Gateway on Railway:** The Vite proxy config expects `/api` → `localhost:80`. On Railway, each service has its own URL. Two options:
> 1. **Easiest**: Set `VITE_API_BASE_URL` per service URL in the frontend, and update `apps/admin-dashboard/src/lib/api.ts` to read from this env var
> 2. **Clean**: Deploy a thin Nginx service as your API gateway that reverse-proxies to all internal Railway service URLs

---

### 2F-7. Run Migrations on Railway

```bash
# Use Railway CLI to run one-off commands against each service:
railway run --service crm-service npx prisma migrate deploy
railway run --service job-service npx prisma migrate deploy
railway run --service finance-service npx prisma migrate deploy
railway run --service comms-service npx prisma migrate deploy
railway run --service analytics-service npx prisma migrate deploy
railway run --service inventory-service npx prisma migrate deploy
```

---

### 2F-8. Deploy

```bash
# Link your local project to the Railway project
railway link

# Deploy all services (Railway deploys on git push automatically after setup)
git push origin main
```

Railway auto-deploys on every push. Watch the **build logs** in the dashboard.

### 2F-9. Railway Cost Estimate

| Resource | Cost |
|----------|------|
| 7 NestJS services (~256MB RAM each) | ~$7/month |
| 1 Go service | ~$1/month |
| 2 frontend services | ~$2/month |
| Managed PostgreSQL (1GB) | $5/month |
| Managed Redis (256MB) | $2.50/month |
| MongoDB Atlas M0 | Free |
| **Total** | **~$17–35/month** |

> Railway Hobby plan: $5/month + usage billing. Starter plan (free) has 500 execution hours/month — enough for a demo.

---

## 2G. Deploy on GCP Cloud Run

### Why GCP Cloud Run for Demo
- **Scales to zero** — pay nothing when no one is using it (great for demos that sit idle)
- **Free tier**: 2M requests/month, 360K GB-seconds compute, 180K vCPU-seconds — demo traffic likely stays free
- **Auto-HTTPS** on `*.run.app` domains
- **Firebase Hosting** (free tier) for serving React frontends with CDN
- **Cloud SQL** for managed PostgreSQL (smallest instance: ~$7/month)

### Prerequisites
1. [Google Cloud account](https://cloud.google.com) — new accounts get $300 free credit
2. Install `gcloud` CLI:
```bash
# Mac
brew install google-cloud-sdk

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```
3. Enable required APIs:
```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  firebase.googleapis.com
```

---

### 2G-1. Set Up Managed Databases

#### PostgreSQL via Cloud SQL
```bash
# Create a Cloud SQL PostgreSQL 16 instance (smallest = db-f1-micro, ~$7/month)
gcloud sql instances create tscrm-demo \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=CHANGE_THIS

# Create the database
gcloud sql databases create tscrm --instance=tscrm-demo

# Create a user
gcloud sql users create tscrm_user \
  --instance=tscrm-demo \
  --password=CHANGE_THIS
```

#### Redis via Upstash (Free Tier — recommended over GCP Memorystore)
> GCP Memorystore Redis costs ~$50/month minimum — too expensive for demo. Use **Upstash** instead:
> 1. Go to [upstash.com](https://upstash.com) → create free Redis database
> 2. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
> 3. Or use the Redis connection string: `redis://:password@host:port`

#### MongoDB via MongoDB Atlas (Free Tier)
> Same as Railway option — create a free M0 cluster at [mongodb.com/atlas](https://mongodb.com/atlas)

#### File Storage via Google Cloud Storage (instead of MinIO)
```bash
# Create a GCS bucket
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l us-central1 gs://tscrm-demo-files

# Make it publicly readable for file serving (optional for demo)
gsutil iam ch allUsers:objectViewer gs://tscrm-demo-files
```

---

### 2G-2. Create Dockerfiles for NestJS Services

Cloud Run deploys containers, so each service needs a Dockerfile. Create this template and save it as `apps/<service-name>/Dockerfile`:

```dockerfile
# apps/crm-service/Dockerfile  (repeat for each NestJS service, changing service name)
FROM node:20-alpine AS builder
WORKDIR /app

# Copy monorepo structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/crm-service/ ./apps/crm-service/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build shared packages
RUN pnpm --filter=@tscrm/types build
RUN pnpm --filter=@tscrm/auth-client build

# Build the service
RUN pnpm --filter=crm-service build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/crm-service/dist ./apps/crm-service/dist
COPY --from=builder /app/apps/crm-service/package.json ./apps/crm-service/package.json

EXPOSE 3001
CMD ["node", "apps/crm-service/dist/main.js"]
```

> Create the same Dockerfile for: `job-service`, `finance-service`, `comms-service`, `analytics-service`, `inventory-service` (change port + service name). The `scheduling-service` Dockerfile was already defined in section 2F-5.

---

### 2G-3. Build & Push Images to Artifact Registry

```bash
# Create Artifact Registry repo
gcloud artifacts repositories create tscrm-demo \
  --repository-format=docker \
  --location=us-central1

# Set up Docker authentication for GCP
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and push each service image
REGISTRY="us-central1-docker.pkg.dev/YOUR_PROJECT_ID/tscrm-demo"

for SERVICE in crm-service job-service finance-service comms-service analytics-service inventory-service scheduling-service; do
  docker build -t $REGISTRY/$SERVICE:latest -f apps/$SERVICE/Dockerfile .
  docker push $REGISTRY/$SERVICE:latest
done
```

---

### 2G-4. Deploy Services to Cloud Run

```bash
REGISTRY="us-central1-docker.pkg.dev/YOUR_PROJECT_ID/tscrm-demo"
DB_URL="postgresql://tscrm_user:PASSWORD@/tscrm?host=/cloudsql/PROJECT:us-central1:tscrm-demo"

# Deploy crm-service
export DOCKER_DEFAULT_PLATFORM="linux/amd64"

gcloud run deploy crm-service \
  --image=$REGISTRY/crm-service:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=3001 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --add-cloudsql-instances=YOUR_PROJECT_ID:us-central1:tscrm-demo \
  --set-env-vars="NODE_ENV=production,BYPASS_AUTH=true,JWT_SECRET=YOUR_SECRET,CRM_DATABASE_URL=$DB_URL&schema=crm"

# Repeat for each service (change image name, port, and schema suffix):
# job-service        → port 3002, ?schema=jobs
# finance-service    → port 3004, ?schema=finance
# comms-service      → port 3005, MONGODB_URI=... (no PG)
# analytics-service  → port 3006, ?schema=analytics
# inventory-service  → port 3007, ?schema=inventory

# scheduling-service (Go, uses Cloud SQL directly)
gcloud run deploy scheduling-service \
  --image=$REGISTRY/scheduling-service:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=3003 \
  --add-cloudsql-instances=YOUR_PROJECT_ID:us-central1:tscrm-demo \
  --set-env-vars="DATABASE_URL=$DB_URL,REDIS_URL=YOUR_UPSTASH_REDIS_URL"
```

---

### 2G-5. Run Database Migrations on Cloud Run

```bash
# Run a one-off migration job per service using Cloud Run Jobs
for SERVICE in crm-service job-service finance-service analytics-service inventory-service; do
  gcloud run jobs create migrate-$SERVICE \
    --image=$REGISTRY/$SERVICE:latest \
    --region=us-central1 \
    --add-cloudsql-instances=YOUR_PROJECT_ID:us-central1:tscrm-demo \
    --command="npx" \
    --args="prisma,migrate,deploy" \
    --set-env-vars="DATABASE_URL=$DB_URL"

  gcloud run jobs execute migrate-$SERVICE --region=us-central1 --wait
done
```

---

### 2G-6. Deploy Frontends to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools
firebase login

# Initialize Firebase in your project
firebase init hosting   # choose "Use existing project" → your GCP project

# Build frontends
cd apps/admin-dashboard
echo "VITE_COMPANY_ID=co-demo-001" > .env.production
# Point API to your Cloud Run crm-service URL (update src/lib/api.ts baseURL)
pnpm build
cd ../..

cd apps/customer-portal
echo "VITE_COMPANY_ID=co-demo-001" > .env.production
pnpm build
cd ../..

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your frontends are now live at:
- `https://YOUR_PROJECT_ID.web.app` (admin dashboard)
- `https://customer.YOUR_PROJECT_ID.web.app` (customer portal — add second hosting site)

---

### 2G-7. API Gateway on Cloud Run (Nginx)

Since Cloud Run services each get their own URL, deploy a thin Nginx container as the API gateway:

```dockerfile
# infrastructure/nginx/Dockerfile
FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

Update `nginx.conf` to use Cloud Run service URLs as upstreams:

```nginx
upstream crm    { server crm-service-xxxx-uc.a.run.app:443; }
upstream jobs   { server job-service-xxxx-uc.a.run.app:443; }
# ... etc
```

Deploy the gateway:
```bash
# Cloud Run requires linux/amd64 images. On Apple Silicon, force this platform.
export DOCKER_DEFAULT_PLATFORM="linux/amd64"

docker build -t $REGISTRY/nginx-gateway:latest -f infrastructure/nginx/Dockerfile .
docker push $REGISTRY/nginx-gateway:latest

gcloud run deploy api-gateway \
  --image=$REGISTRY/nginx-gateway:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=80
```

---

### 2G-8. GCP Cost Estimate

| Resource | Cost |
|----------|------|
| Cloud Run (8 services, ~100K req/month demo traffic) | **~$0–5** (free tier covers demo) |
| Cloud SQL PostgreSQL db-f1-micro | **~$7/month** |
| Upstash Redis free tier | **Free** |
| MongoDB Atlas M0 | **Free** |
| Artifact Registry storage (~2GB images) | **~$0.20/month** |
| Firebase Hosting | **Free** (10GB storage, 360MB/day transfer) |
| Cloud Storage (file uploads) | **~$0.02/GB** |
| **Total** | **~$8–15/month** |

> With GCP's $300 free credit for new accounts, your demo runs free for months.

---

## 3. Option B — Production Deploy

### Goal
Fault-tolerant, scalable, secure, monitored, and maintainable deployment suitable for real paying customers. HTTPS everywhere, Auth0 authentication, external managed databases, CI/CD pipeline, zero-downtime deployments.

### Recommended Platform: **AWS ECS Fargate + RDS + DocumentDB + ElastiCache**
> This is the architecture recommended in your codebase's planning notes. Fully managed, auto-scales, no server management.

Alternative options: **Google Cloud Run + Cloud SQL**, **Azure Container Apps + Azure Database**, or **DigitalOcean Kubernetes** (cheapest managed K8s).

---

### 3A. Production Architecture

```
Internet (HTTPS)
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CloudFlare (DNS + DDoS protection + CDN for static assets)             │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ├── admin.yourcompany.com   → S3 + CloudFront (Admin Dashboard SPA)
    ├── portal.yourcompany.com  → S3 + CloudFront (Customer Portal SPA)
    └── api.yourcompany.com     → AWS ALB (Application Load Balancer)
                                        │
                               ┌────────┴────────┐
                               │    Kong Gateway  │  (ECS Fargate task)
                               │  Auth0 JWT verify│
                               │  Rate limiting   │
                               │  CORS policies   │
                               └────────┬────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼           ▼           ▼           ▼           ▼       ▼
     crm-service  job-service  scheduling  finance-svc  comms-svc  inventory
     (ECS Fargate)(ECS Fargate)(ECS Fargate)(ECS Fargate)(ECS Fargate)(ECS Fargate)
            │           │           │           │           │
    ┌───────────────────────────────────────────────────────────────────┐
    │                    AWS RDS (PostgreSQL 16 + PostGIS)               │
    │              Multi-AZ, automated backups, read replicas            │
    └───────────────────────────────────────────────────────────────────┘
                                        │
    ┌───────────────────────────────────────────────────────────────────┐
    │              AWS DocumentDB (MongoDB 7 compatible)                 │
    │                  comms-service only                                │
    └───────────────────────────────────────────────────────────────────┘
                                        │
    ┌───────────────────────────────────────────────────────────────────┐
    │              AWS ElastiCache (Redis 7)                             │
    │              comms-service + scheduling-service                    │
    └───────────────────────────────────────────────────────────────────┘
                                        │
    ┌───────────────────────────────────────────────────────────────────┐
    │              AWS S3 (object storage — replaces MinIO)              │
    │              Photos, PDFs, documents, exports                      │
    └───────────────────────────────────────────────────────────────────┘
```

---

### 3B. Pre-Production Tasks (Do These First — ~2 weeks)

These are the **gaps** in the current codebase that must be resolved before production:

#### Gap 1 — Add Dockerfiles to all NestJS services (CRITICAL)

Only the scheduling-service has a Dockerfile. You need one for each NestJS service.

Create `apps/crm-service/Dockerfile` (same pattern for all 5 other NestJS services):

```dockerfile
# ── Build Stage ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/

# Copy this service's package.json
COPY apps/crm-service/package.json ./apps/crm-service/
COPY apps/crm-service/prisma/ ./apps/crm-service/prisma/

# Install only this service's deps (including shared packages)
RUN pnpm install --frozen-lockfile --filter=crm-service...

# Copy source and build
COPY apps/crm-service/ ./apps/crm-service/
RUN pnpm --filter=@tscrm/types build
RUN pnpm --filter=@tscrm/auth-client build
RUN pnpm --filter=crm-service build

# Generate Prisma client
RUN cd apps/crm-service && npx prisma generate

# ── Runtime Stage ────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/apps/crm-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/crm-service/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/crm-service/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./.prisma

USER nestjs
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

Apply the same pattern for: `job-service`, `finance-service`, `comms-service`, `analytics-service`, `inventory-service` (change port numbers accordingly).

#### Gap 2 — Add GitHub Actions CI/CD pipeline

Create `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

env:
  AWS_REGION: ap-southeast-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.ap-southeast-1.amazonaws.com

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test   # add tests to each service

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        run: aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY

      - name: Build and push crm-service
        run: |
          docker build -f apps/crm-service/Dockerfile -t $ECR_REGISTRY/tscrm-crm:$GITHUB_SHA .
          docker push $ECR_REGISTRY/tscrm-crm:$GITHUB_SHA

      # Repeat for each service...

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Update ECS services
        run: |
          aws ecs update-service --cluster tscrm-prod --service crm-service \
            --force-new-deployment --region $AWS_REGION
          # Repeat for each service
```

#### Gap 3 — Switch to Auth0 in production

1. Create an Auth0 tenant at auth0.com
2. Create a Machine-to-Machine application for each service
3. Update nginx.conf to remove the `x-test-*` bypass headers
4. Set `BYPASS_AUTH=false` in all services
5. Configure Auth0 roles: `super_admin`, `company_admin`, `office_manager`, `dispatcher`, `technician`, `customer`

#### Gap 4 — Add database migration strategy

Add a migration script to run before each deploy:

```bash
#!/bin/bash
# scripts/migrate-all.sh
set -e

echo "Running Prisma migrations..."
cd apps/crm-service && npx prisma migrate deploy; cd ../..
cd apps/job-service && npx prisma migrate deploy; cd ../..
cd apps/finance-service && npx prisma migrate deploy; cd ../..
cd apps/comms-service && npx prisma migrate deploy; cd ../..
cd apps/analytics-service && npx prisma migrate deploy; cd ../..
cd apps/inventory-service && npx prisma migrate deploy; cd ../..
echo "All migrations complete."
```

#### Gap 5 — Add monitoring

```bash
# Add these to your docker-compose or ECS task definitions:
# - Prometheus + Grafana (metrics)
# - ELK Stack / CloudWatch (logs)
# - Uptime Robot or AWS Route53 health checks

# In each NestJS service, add @nestjs/terminus health endpoints (already there!)
# Point monitoring to /health on each service
```

---

### 3C. Step-by-Step Production Deploy (AWS)

#### Phase 1 — AWS Infrastructure Setup (~2 hours with Terraform)

```bash
# Install Terraform
brew install terraform

# Create infrastructure directory
mkdir infrastructure/terraform
cd infrastructure/terraform
```

Key resources to create (via Terraform or AWS Console):

```
VPC
├── 3 Private subnets (services, databases)
├── 3 Public subnets (load balancer, NAT)
├── NAT Gateway
├── Internet Gateway
└── Security Groups

ECS Fargate Cluster (tscrm-prod)
├── Task definitions for each service
├── ECS Services (1 per microservice)
└── Auto-scaling policies

RDS
├── Engine: PostgreSQL 16.x
├── Instance: db.t4g.medium (2 vCPU, 4GB) to start
├── Multi-AZ: Yes
├── Storage: 100GB gp3 (auto-scaling)
├── Extensions: PostGIS, pg_trgm, uuid-ossp
└── Automated backups: 7-day retention

DocumentDB (MongoDB-compatible)
├── Engine: 7.0.0
├── Instance: db.t4g.medium
└── TLS: enabled

ElastiCache (Redis)
├── Engine: Redis 7.x
├── Node type: cache.t4g.medium
├── Multi-AZ: Yes (cluster mode disabled for BullMQ)
└── Encryption in transit: Yes

S3 Buckets
├── tscrm-files (object storage, versioning on)
├── tscrm-admin-dashboard (static website hosting)
└── tscrm-customer-portal (static website hosting)

CloudFront Distributions
├── Admin dashboard → tscrm-admin-dashboard S3
└── Customer portal → tscrm-customer-portal S3

Application Load Balancer
└── Target groups: one per microservice

AWS Secrets Manager
└── Store all credentials (DB passwords, API keys)

ECR Repositories (one per service)
├── tscrm/crm-service
├── tscrm/job-service
├── tscrm/scheduling-service
├── tscrm/finance-service
├── tscrm/comms-service
├── tscrm/analytics-service
└── tscrm/inventory-service
```

#### Phase 2 — Configure Secrets

Store all secrets in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name tscrm/production/core \
  --secret-string '{
    "JWT_SECRET": "YOUR_64_CHAR_SECRET",
    "POSTGRES_PASSWORD": "YOUR_DB_PASSWORD",
    "AUTH0_DOMAIN": "your-tenant.auth0.com",
    "AUTH0_AUDIENCE": "https://api.yourapp.com",
    "STRIPE_SECRET_KEY": "sk_live_...",
    "STRIPE_WEBHOOK_SECRET": "whsec_...",
    "TWILIO_ACCOUNT_SID": "AC...",
    "TWILIO_AUTH_TOKEN": "...",
    "SENDGRID_API_KEY": "SG...",
    "FIREBASE_PRIVATE_KEY": "-----BEGIN RSA PRIVATE KEY-----..."
  }'
```

#### Phase 3 — Build and Push Docker Images

```bash
# Authenticate to ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com

# Build and push each service
for SERVICE in crm-service job-service finance-service comms-service analytics-service inventory-service; do
  docker build \
    -f apps/$SERVICE/Dockerfile \
    -t YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/tscrm/$SERVICE:latest \
    .
  docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/tscrm/$SERVICE:latest
done

# Build and push scheduling-service (Go)
docker build \
  -f apps/scheduling-service/Dockerfile \
  -t YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/tscrm/scheduling-service:latest \
  apps/scheduling-service/
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/tscrm/scheduling-service:latest
```

#### Phase 4 — Deploy Frontends to S3 + CloudFront

```bash
# Build admin dashboard
cd apps/admin-dashboard
cat > .env.production << EOF
VITE_COMPANY_ID=co-demo-001
VITE_API_BASE_URL=https://api.yourcompany.com
EOF
pnpm build

# Sync to S3
aws s3 sync dist/ s3://tscrm-admin-dashboard --delete
aws cloudfront create-invalidation \
  --distribution-id YOUR_CF_DISTRIBUTION_ID \
  --paths "/*"

# Build and deploy customer portal
cd ../customer-portal
pnpm build
aws s3 sync dist/ s3://tscrm-customer-portal --delete
```

#### Phase 5 — Run Database Migrations

```bash
# Run via a one-off ECS task (or Lambda) before deploying services
aws ecs run-task \
  --cluster tscrm-prod \
  --task-definition tscrm-migrations \
  --launch-type FARGATE \
  --network-configuration "..."
```

#### Phase 6 — Deploy ECS Services

```bash
# Register task definitions and create ECS services
# (Or use AWS console / Terraform)

for SERVICE in crm-service job-service scheduling-service finance-service comms-service analytics-service inventory-service; do
  aws ecs update-service \
    --cluster tscrm-prod \
    --service tscrm-$SERVICE \
    --force-new-deployment \
    --region ap-southeast-1
done
```

#### Phase 7 — Kong Gateway Setup

```bash
# Deploy Kong via ECS with a declarative config
# Configure plugins:
#   - JWT (Auth0 JWKS validation)
#   - CORS (allowed origins: your domains)
#   - Rate limiting (100 req/min per IP)
#   - Request size limit (25MB)
#   - Logging (to CloudWatch)
```

#### Phase 8 — Mobile App Store Release

```bash
cd apps/technician-app

# Configure for production
cat > .env.production << EOF
EXPO_PUBLIC_API_BASE_URL=https://api.yourcompany.com
EXPO_PUBLIC_COMPANY_ID=co-demo-001
EOF

# Build for iOS (TestFlight → App Store)
eas build --platform ios --profile production

# Build for Android (Play Store)
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

App Store / Play Store requirements:
- Apple Developer Account ($99/year)
- Google Play Developer Account ($25 one-time)
- App icons at all required resolutions (already configured in app.json)
- Privacy Policy URL
- Screenshots for each device size

---

### 3D. Production Architecture Summary

| Component | Solution | Notes |
|-----------|---------|-------|
| API Gateway | Kong Gateway on ECS | Auth0 JWT, rate limiting, CORS |
| Backend services | AWS ECS Fargate | Auto-scaling, no server management |
| Primary database | AWS RDS PostgreSQL 16 | Multi-AZ, 100GB gp3, automated backups |
| Document database | AWS DocumentDB 7 | MongoDB-compatible, TLS |
| Cache & Queue | AWS ElastiCache Redis 7 | Multi-AZ, BullMQ + Socket.IO adapter |
| Object storage | AWS S3 | Versioning, lifecycle policies |
| Admin Dashboard | S3 + CloudFront | Global CDN, HTTPS |
| Customer Portal | S3 + CloudFront | Global CDN, HTTPS |
| Technician App | EAS Build → App Stores | iOS + Android |
| CI/CD | GitHub Actions | Auto build/deploy on push to main |
| Container registry | AWS ECR | One repo per service |
| Secrets | AWS Secrets Manager | Injected into ECS task env |
| Monitoring | AWS CloudWatch + Grafana | Logs, metrics, alarms |
| DNS | AWS Route53 + CloudFlare | Health-check routing |
| HTTPS | AWS ACM (free TLS certs) | Attached to ALB and CloudFront |

---

## 4. Environment Variables Reference

### Critical variables that differ between demo and production

| Variable | Demo Value | Production Value |
|----------|-----------|-----------------|
| `BYPASS_AUTH` | `true` | `false` |
| `NODE_ENV` | `production` | `production` |
| `JWT_SECRET` | Any 32+ char string | 64+ char cryptographically random |
| `AUTH0_DOMAIN` | not needed | `your-tenant.auth0.com` |
| `AUTH0_AUDIENCE` | not needed | `https://api.yourcompany.com` |
| `STRIPE_SECRET_KEY` | not needed | `sk_live_...` |
| `MONGODB_URI` | `mongodb://localhost:27017/...?replicaSet=rs0` | `mongodb+srv://...@documentdb.amazonaws.com/...` |
| `CRM_DATABASE_URL` | `postgresql://...@localhost/...` | `postgresql://...@rds.amazonaws.com/...` |
| `REDIS_HOST` | `localhost` | `elasticache.amazonaws.com` |

### Full variable list per service

#### All NestJS services (shared)
```
NODE_ENV=production
JWT_SECRET=
AUTH0_DOMAIN=
AUTH0_AUDIENCE=
```

#### crm-service
```
CRM_PORT=3001
CRM_DATABASE_URL=postgresql://user:pass@host:5432/tscrm?schema=crm
COMMS_SERVICE_URL=http://comms-service:3005
APP_NAME=T&S CRM
```

#### job-service
```
JOBS_PORT=3002
JOBS_DATABASE_URL=postgresql://user:pass@host:5432/tscrm?schema=jobs
```

#### scheduling-service (Go)
```
SCHEDULING_PORT=3003
DATABASE_URL=postgresql://user:pass@host:5432/tscrm
REDIS_URL=redis://host:6379
BYPASS_AUTH=false
JWT_SECRET=
AUTH0_DOMAIN=
AUTH0_AUDIENCE=
```

#### finance-service
```
FINANCE_PORT=3004
DATABASE_URL=postgresql://user:pass@host:5432/tscrm?schema=finance
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CHROMIUM_PATH=/usr/bin/chromium-browser
```

#### comms-service
```
COMMS_PORT=3005
MONGODB_URI=mongodb://.../?replicaSet=rs0
REDIS_HOST=
REDIS_PORT=6379
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=no-reply@yourcompany.com
SENDGRID_FROM_NAME=T&S CRM
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_PHONE=+1XXXXXXXXXX
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FRONTEND_URL=https://yourcompany.com
```

#### analytics-service
```
ANALYTICS_PORT=3006
ANALYTICS_DATABASE_URL=postgresql://user:pass@host:5432/tscrm?schema=analytics
```

#### inventory-service
```
INVENTORY_PORT=3007
INVENTORY_DATABASE_URL=postgresql://user:pass@host:5432/tscrm?schema=inventory
```

#### admin-dashboard (.env.production)
```
VITE_COMPANY_ID=co-demo-001
VITE_API_BASE_URL=https://api.yourcompany.com
```

#### customer-portal (.env.production)
```
VITE_COMPANY_ID=co-demo-001
```

#### technician-app (.env)
```
EXPO_PUBLIC_API_BASE_URL=https://api.yourcompany.com
EXPO_PUBLIC_COMPANY_ID=co-demo-001
```

---

## 5. Database Setup & Migrations

### Initial setup order

**Run in this order — order matters due to cross-schema references:**

```bash
# 1. PostgreSQL schemas created by init.sql (automatic on first Docker start)
#    Creates: crm, jobs, scheduling, finance, analytics, inventory schemas

# 2. Run Prisma migrations (each generates its own tables)
cd apps/crm-service      && npx prisma migrate deploy && cd ../..
cd apps/job-service      && npx prisma migrate deploy && cd ../..
cd apps/finance-service  && npx prisma migrate deploy && cd ../..
cd apps/analytics-service && npx prisma migrate deploy && cd ../..
cd apps/inventory-service && npx prisma migrate deploy && cd ../..
cd apps/comms-service    && npx prisma migrate deploy && cd ../..

# 3. The Go scheduling service manages its own tables via SQL in init.sql

# 4. Seed demo data
cd apps/job-service && npx prisma db seed && cd ../..
```

### Adding new migrations (ongoing)

```bash
# Make schema changes in the relevant prisma/schema.prisma file
cd apps/crm-service
npx prisma migrate dev --name "add_customer_notes_field"
# This creates a migration file — commit it to git
# In production, run: npx prisma migrate deploy
```

### Backup strategy (production)

```bash
# PostgreSQL — AWS RDS automated backups
# Point-in-time recovery up to 7 days (configure in RDS settings)
# Additional manual snapshot before each deploy:
aws rds create-db-snapshot \
  --db-instance-identifier tscrm-prod \
  --db-snapshot-identifier tscrm-pre-deploy-$(date +%Y%m%d)

# MongoDB — AWS DocumentDB continuous backup
# Also export periodically:
mongodump --uri="mongodb://..." --out=backup-$(date +%Y%m%d)

# MinIO / S3 — S3 versioning handles this automatically
```

---

## 6. Mobile App Deployment (Technician App)

### Demo: Expo Go (0 cost, 15 minutes)

```bash
cd apps/technician-app
echo "EXPO_PUBLIC_API_BASE_URL=http://YOUR_SERVER_IP" > .env
npx expo login    # use your Expo account
npx expo start --tunnel
# Share the QR code with the client
```

### Production: EAS Build → App Stores

#### Prerequisites
- Expo account (free at expo.dev)
- Apple Developer account ($99/year) — required for iOS
- Google Play Console ($25 one-time) — required for Android

#### Configure EAS

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure builds
cd apps/technician-app
eas build:configure
```

#### Update app.json for production

```json
{
  "expo": {
    "name": "T&S Technician",
    "slug": "ts-technician",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.tscrm.technician",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.tscrm.technician",
      "versionCode": 1
    },
    "extra": {
      "apiBaseUrl": "https://api.yourcompany.com",
      "eas": { "projectId": "YOUR_EAS_PROJECT_ID" }
    }
  }
}
```

#### Build and submit

```bash
# iOS build (sends to TestFlight for testing, then App Store)
eas build --platform ios --profile production
eas submit --platform ios

# Android build (APK or AAB for Play Store)
eas build --platform android --profile production
eas submit --platform android
```

**Timeline:**
- iOS review: 1–3 days
- Android review: 1–3 days (usually faster)

### Over-the-Air (OTA) Updates

Expo supports OTA updates for JavaScript changes (no app store resubmission needed):

```bash
# After fixing a bug or updating UI (no native changes):
eas update --branch production --message "Fix jobs list sort"
# Users get the update automatically on next app launch
```

> ⚠️ OTA updates only work for JavaScript. Native changes (new permissions, new native modules) always require a full build and store submission.

---

## 7. Cost Estimates

### Option A — Demo (DigitalOcean)

| Item | Cost/month |
|------|-----------|
| DigitalOcean Droplet (4GB/2vCPU) | $24 |
| DigitalOcean Reserved IP | $4 |
| Domain name (optional) | ~$1 |
| **Total** | **~$29/month** |

### Option B — Production (AWS, small scale: 1–50 companies)

| Item | Estimated Cost/month |
|------|---------------------|
| ECS Fargate (7 services, 0.25vCPU/0.5GB each) | ~$80 |
| RDS PostgreSQL (db.t4g.medium, Multi-AZ) | ~$100 |
| DocumentDB (db.t4g.medium, 1 node) | ~$60 |
| ElastiCache Redis (cache.t4g.medium) | ~$50 |
| S3 + CloudFront (100GB, ~1M requests) | ~$15 |
| ALB (Application Load Balancer) | ~$20 |
| ECR (container registry, 7 images) | ~$5 |
| AWS Secrets Manager | ~$7 |
| CloudWatch (logs + metrics) | ~$20 |
| Data transfer | ~$10 |
| **Total** | **~$367/month** |

### Production at scale (50–500 companies)

| Item | Estimated Cost/month |
|------|---------------------|
| ECS Fargate (scaled out, 2–4 tasks per service) | ~$350 |
| RDS PostgreSQL (db.r7g.large, Multi-AZ, read replicas) | ~$400 |
| DocumentDB (db.r7g.large cluster) | ~$300 |
| ElastiCache Redis (cluster mode, 3 nodes) | ~$200 |
| S3 + CloudFront (1TB, 10M requests) | ~$100 |
| ALB + WAF | ~$50 |
| CloudWatch + X-Ray | ~$50 |
| Data transfer | ~$50 |
| **Total** | **~$1,500/month** |

### External services (additional)

| Service | Cost |
|---------|------|
| Auth0 | Free up to 7,500 MAU; then $23/month (Essential plan) |
| Stripe | 2.9% + $0.30 per transaction (no monthly fee) |
| Twilio SMS | ~$0.0079/message + $1/month/number |
| SendGrid | Free up to 100 emails/day; then $19.95/month |
| Firebase FCM | Free |
| Expo EAS Build | Free (30 builds/month); then $29/month (Production plan) |
| Apple Developer | $99/year |
| Google Play | $25 one-time |

---

## 8. Recommendation Summary

### For the client demo — do this now

| Priority | Action | Time |
|----------|--------|------|
| 🔴 1 | Merge `technician-app` branch → `main` | 5 min |
| 🔴 2 | Get a DigitalOcean 4GB Droplet + domain | 15 min |
| 🔴 3 | Run the Step-by-Step demo deploy (Section 2B) | 3 hours |
| 🔴 4 | Set up Expo Go tunnel for mobile demo (Section 2C) | 15 min |
| 🟡 5 | Seed demo data with realistic HVAC/Plumbing scenarios | 30 min |
| 🟡 6 | Prepare a demo script walking through each feature | 1 hour |

**Estimated total time to demo-ready: 5–6 hours**

---

### For production — do these in order

| Priority | Task | Estimated Time |
|----------|------|---------------|
| 🔴 1 | Write Dockerfiles for all 6 NestJS services | 1 day |
| 🔴 2 | Set up GitHub Actions CI/CD pipeline | 1 day |
| 🔴 3 | Configure Auth0 tenant with all roles | 2 hours |
| 🔴 4 | Set up AWS infrastructure (Terraform recommended) | 3 days |
| 🔴 5 | Push all Docker images to ECR | 1 hour |
| 🔴 6 | Configure Kong Gateway with Auth0 + rate limiting | 1 day |
| 🔴 7 | Run all database migrations in production | 30 min |
| 🟡 8 | Configure Stripe live keys + webhook | 2 hours |
| 🟡 9 | Configure Twilio + SendGrid | 2 hours |
| 🟡 10 | Configure Firebase for push notifications | 2 hours |
| 🟡 11 | EAS Build iOS + Android and submit to stores | 1 day |
| 🟡 12 | Set up CloudWatch monitoring + alerts | 1 day |
| 🟢 13 | Load testing (k6 or Apache JMeter) | 2 days |
| 🟢 14 | Security audit (OWASP, penetration testing) | 1 week |

**Estimated total time to production-ready: 2–3 weeks (with 1 developer)**

---

### Key decisions to make before production

1. **Region**: `ap-southeast-1` (Singapore) recommended given the target market — lowest latency for Australian/SEA users
2. **Multi-tenancy model**: Currently single-database multi-schema. Consider separate databases per enterprise customer if you sign large accounts.
3. **Scaling trigger**: comms-service handles WebSocket + BullMQ — scale this first when load increases.
4. **Backup retention**: 30-day PITR on RDS is recommended for field service data.
5. **Disaster recovery RTO/RPO**: Define recovery time and recovery point objectives before production.

---

*Document generated: March 2026 · T&S CRM v0.1.0 · Turborepo monorepo*
