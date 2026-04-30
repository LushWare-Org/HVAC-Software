# Trade & Service CRM

Field Service Management (FSM) platform for trade businesses — HVAC, Plumbing, Electrical.

## Architecture

7 microservices in a Turborepo monorepo. Infrastructure (databases, cache, gateway) runs in Docker. Services run on host for hot-reload during development, except the FastAPI churn inference service which runs in Docker.

| Service | Port | Tech |
|---------|------|------|
| CRM & Customer | 3001 | NestJS + PostgreSQL (crm schema) |
| Job Management | 3002 | NestJS + PostgreSQL (jobs schema) |
| Scheduling & Dispatch | 3003 | Go + Gin + PostGIS |
| Finance | 3004 | NestJS + Stripe + Puppeteer |
| Communication | 3005 | NestJS + BullMQ + MongoDB |
| Analytics | 3006 | NestJS + PostgreSQL (analytics schema) |
| Churn Inference | 8000 | FastAPI + scikit-learn/XGBoost |

## Prerequisites

- Node.js 20 LTS
- pnpm 9.x (`npm install -g pnpm@9`)
- Docker Desktop
- Go 1.22+ (for scheduling service)

## Quick Start

```bash
# 1. Clone + install
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Auth0 credentials

# 3. Start infrastructure
docker compose up -d

# 4. Run database migrations (first time)
pnpm --filter crm-service prisma:migrate

# 5. Start all services in dev mode
pnpm dev
```

## Project Structure

```
apps/
  crm-service/          NestJS — Customers, leads, agreements, booking
  job-service/          NestJS — Jobs, work orders, trade templates, price book
  scheduling-service/   Go    — GPS, dispatch board, route optimization, AI assign
  finance-service/      NestJS — Quotes, invoices, Stripe payments, PDF generation
  comms-service/        NestJS — SMS, email, push, automation workflows
  analytics-service/    NestJS — Dashboards, reports, exports
  churn-service/        FastAPI — Churn, failure, and revenue risk inference
  admin-dashboard/      React 18 + Vite + TanStack Query + shadcn/ui
  customer-portal/      Next.js 14 App Router (mobile-responsive)
packages/
  types/                Shared TypeScript interfaces and enums
  auth-client/          JWT helpers, RBAC guards, decorators
  queue/                BullMQ queue names, factories, job types
infrastructure/
  nginx/                API gateway config (dev)
  postgres/             Database init SQL (schemas + PostGIS)
```

## Auth

Auth0 is used for authentication. Configure `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` in `.env`. See `docs/auth0-setup.md` for setup instructions.

## Documentation

- `Trade_Service_CRM_Architecture_Final.docx` — Full architecture reference
- `Architecture_Quick_Reference_Final.docx` — Visual quick reference
- `PROJECT_STATUS.md` — Decision log and build tracker
- `DEV_LOG.md` — Daily development log
