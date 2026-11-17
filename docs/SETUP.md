# T&S CRM — Developer Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| pnpm | 9+ | `npm install -g pnpm@9` |
| Docker Desktop | Latest | [docker.com](https://docker.com/products/docker-desktop) |
| Go *(optional)* | 1.22+ | Only needed if editing scheduling-service |

## Quick Start (One Command)

```bash
git clone <repo-url> && cd T\&SBCRM
./scripts/setup.sh
```

That's it. The setup script will:
1. Check all prerequisites are installed
2. Create `.env` from template with dev defaults
3. Generate `.env` files for every service
4. Install all npm dependencies
5. Start Docker (PostgreSQL, Redis, MongoDB, MinIO, Nginx)
6. Wait for all infrastructure to be healthy
7. Create the MinIO storage bucket
8. Generate all Prisma clients
9. Run all database migrations (in correct order)
10. Seed demo data (company, users, customers, jobs, invoices)
11. Start dev tool GUIs (pgAdmin, Mongo Express, Redis Insight)

## Start Developing

After setup, open **3 terminals**:

```bash
# Terminal 1 — Backend services (6 microservices)
pnpm dev

# Terminal 2 — Admin dashboard
pnpm dev:admin

# Terminal 3 — Customer portal
pnpm dev:portal
```

Or start everything at once:
```bash
pnpm dev:all
```

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tsbrothers.com | Admin@2024! |
| Manager | manager@tsbrothers.com | Manager@2024! |
| Dispatcher | dispatch@tsbrothers.com | Dispatch@2024! |
| Technician | mike.wilson@tsbrothers.com | Tech@2024! |
| Technician | sarah.davis@tsbrothers.com | Tech@2024! |
| Technician | james.brown@tsbrothers.com | Tech@2024! |

**Customer signup:** Go to the Customer Portal and create a new account.

## URLs

| Service | URL |
|---------|-----|
| API Gateway | http://localhost/api/`<service>`/... |
| Admin Dashboard | http://localhost:5173 |
| Customer Portal | http://localhost:5174 |
| pgAdmin | http://localhost:5050 (admin@tscrm.com / admin) |
| Mongo Express | http://localhost:8081 |
| Redis Insight | http://localhost:5540 |
| MinIO Console | http://localhost:9001 (minioadmin / minioadmin) |

## Useful Commands

| Command | What it does |
|---------|--------------|
| `pnpm setup` | Full first-time setup (same as `./scripts/setup.sh`) |
| `pnpm dev` | Start all backend services |
| `pnpm dev:admin` | Start admin dashboard |
| `pnpm dev:portal` | Start customer portal |
| `pnpm dev:all` | Start everything |
| `pnpm db:migrate` | Run all pending migrations |
| `pnpm db:seed` | Re-seed demo data |
| `pnpm db:reset` | Nuke all data + re-migrate + re-seed |
| `pnpm db:studio` | Open Prisma Studio (CRM schema) |
| `pnpm docker:up` | Start Docker infrastructure |
| `pnpm docker:down` | Stop Docker infrastructure |
| `pnpm env:generate` | Regenerate all service .env files from root |
| `pnpm health` | Check if all services are running |
| `pnpm build` | Build all services |
| `pnpm lint` | Lint all services |
| `pnpm test` | Run all tests |

## Environment Variables

All config is in the root `.env` file. Service-level `.env` files are **auto-generated** by `scripts/generate-env.sh` — don't edit them manually.

To change a variable:
1. Edit the root `.env`
2. Run `pnpm env:generate` to propagate to all services
3. Restart the affected service

### Auth Mode

By default, `BYPASS_AUTH=true` is set for local development. This means:
- No Auth0 account needed
- Login works with local JWT (email + password from seed data)
- `x-test-*` headers work for API testing

To use Auth0 in dev, set `BYPASS_AUTH=false` and configure `AUTH0_DOMAIN` / `AUTH0_AUDIENCE`.

### Third-Party Services (Optional)

These are **not required** for local dev. Services gracefully handle missing credentials:

| Service | Env Vars | What happens without it |
|---------|----------|------------------------|
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Payment buttons show "Stripe not configured" |
| Twilio | `TWILIO_*` | SMS messages are logged, not sent |
| SendGrid | `SENDGRID_API_KEY` | Emails are logged, not sent |
| Expo Push | `EXPO_ACCESS_TOKEN` | Push notifications are logged |

## Architecture

```
apps/
  crm-service/         → Port 3001 (NestJS + PostgreSQL)
  job-service/         → Port 3002 (NestJS + PostgreSQL)
  scheduling-service/  → Port 3003 (Go + PostgreSQL + Redis)
  finance-service/     → Port 3004 (NestJS + PostgreSQL)
  comms-service/       → Port 3005 (NestJS + MongoDB + Redis)
  analytics-service/   → Port 3006 (NestJS + PostgreSQL)
  inventory-service/   → Port 3007 (NestJS + PostgreSQL)
  admin-dashboard/     → Port 5173 (React + Vite)
  customer-portal/     → Port 5174 (React + Vite)
packages/
  types/               → Shared TypeScript types
  auth-client/         → Shared auth utilities
infrastructure/
  nginx/               → API gateway config
  postgres/            → DB init script
scripts/
  setup.sh             → One-command setup
  db-migrate.sh        → Run all migrations
  db-seed.sh           → Seed demo data
  db-reset.sh          → Nuke + rebuild
  health-check.sh      → Verify everything works
  generate-env.sh      → Generate service .env files
```

## Troubleshooting

### "Foreign key constraint violated" on signup
Run `pnpm db:seed` — the company record needs to exist first.

### MongoDB "transaction not supported"
The MongoDB replica set may not have initialized. Run:
```bash
docker compose restart mongodb
sleep 20
```

### Port already in use
Check what's using the port: `lsof -i :<port>`

### Services return 502 via Nginx
The service isn't running yet. Start it with `pnpm dev` and wait a few seconds.

### Prisma "relation does not exist"
Migrations haven't run. Run `pnpm db:migrate`.

### Need a completely fresh start?
```bash
pnpm db:reset
```
This nukes all Docker volumes, re-creates containers, runs migrations, and seeds data.
