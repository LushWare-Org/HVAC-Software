# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

Trade & Service CRM — a Field Service Management (FSM) platform for trade businesses (HVAC, Plumbing, Electrical). Turborepo monorepo, pnpm workspaces. **Use `pnpm` only** (the `preinstall` hook rejects npm/yarn).

## Architecture

**Read `docs/SYSTEM_OVERVIEW.md` first — it's the authoritative system reference.** This file is the quick-start.

8 backend services + 3 frontends. Infrastructure (Redis, MongoDB, MinIO, Nginx, churn-service) runs in Docker; NestJS/Go services run on the host for hot-reload. Postgres lives in Supabase (cloud), not in `docker-compose.yml`.

| App | Port | Stack |
|---|---|---|
| `crm-service` | 3001 | NestJS + Prisma + Postgres (`crm`) — customers, leads, agreements, bookings, users, company, auth, equipment, followup, upsell, AI agents |
| `job-service` | 3002 | NestJS + Postgres (`jobs`) + Redis cache — jobs, work orders, trade templates, price book |
| `scheduling-service` | 3003 | Go 1.23 (Gin) + PostGIS + Redis — GPS, dispatch, Phase-1 AI assignment (40/35/25 distance/workload/rating), WebSocket |
| `finance-service` | 3004 | NestJS + Stripe + Puppeteer — quotes, invoices, payments, expenses, PDFs |
| `comms-service` | 3005 | NestJS + BullMQ + MongoDB + Socket.IO — SMS (Twilio), email (SendGrid), push (FCM), thread-based messaging, automation rules |
| `analytics-service` | 3006 | NestJS + cross-schema raw SQL + Redis cache — dashboards, reports, exports, recommendations, revenue-agent |
| `inventory-service` | 3007 | NestJS + Postgres (`inventory`) — items, warehouse + per-tech-van locations, stock movements, purchase orders, low-stock alerts |
| `partner-api` | 3009 | NestJS + Postgres (`partner`) + Redis — outward-facing integration surface for external partners (AI voice agents). API-key auth, per-key scopes, per-key rate limit, full call log |
| `churn-service` | 8000 | FastAPI + scikit-learn/XGBoost — churn / failure / revenue risk inference (runs in Docker) |
| `admin-dashboard` | 5173 | React 19 + Vite + TanStack Query — managers/dispatchers (incl. BanditDashboard ML ops page) |
| `customer-portal` | 5174 | React 19 + Vite — customer-facing |
| `technician-app` | mobile | Expo SDK 54 + React Native — offline-first field app |

Plus a separate Python ML tier at the repo root (`agent/`, `analytics/`, `api/`, `models/*.pkl`) running multi-armed bandits for followup, retention, upsell, revenue. `apps/agent-service/` is a small Python/FastAPI service (`server.py` + Dockerfile), not an empty placeholder.

### Cross-cutting

- **API gateway**: Nginx on port 80 in dev (`/api/<service>/*`; `/ws` for WebSocket; `/socket.io/` for comms). Vite proxies `/api` and `/ws` to it. **Prod is GCP Cloud Run**, where the gateway uses `nginx.conf.template` + `envsubst` driven by `<SERVICE>_SERVICE_URL` env vars — see "Cloud Run gotcha" below.
- **Database**: single PostgreSQL 16 + PostGIS instance with **7 schemas** (`crm`, `jobs`, `scheduling`, `finance`, `analytics`, `inventory`, `partner`). MongoDB only for `comms-service`. Redis for BullMQ queues, Socket.IO adapter, scheduling pub/sub, hot-path caching (job-service, analytics-service). MinIO/S3 for object storage. Each NestJS service uses its own `<SERVICE>_DATABASE_URL` (PgBouncer) + `<SERVICE>_DIRECT_DATABASE_URL` (session mode for `prisma migrate`/Studio).
- **Multi-tenancy**: every table carries `company_id`; enforce on every query.
- **Auth**: Auth0 RS256 in prod; local JWT (HS256) for dev/demo. Customer-portal token key `cp_token`; admin token key `tscrm_token`. JWT for CUSTOMER role includes `customer_id` → `AuthUser.customerId`; job/invoice endpoints **must** filter by `customerId` server-side when role=CUSTOMER. **Dev bypass headers** are honored when no JWT: `x-test-company-id`, `x-test-user-id`, `x-test-user-email`, `x-test-user-role`, `x-test-user-name`.
- **RBAC roles**: `super_admin`, `company_admin`, `office_manager`, `dispatcher`, `technician`, `customer`.
- **Tech approval workflow**: self-registered technicians get `CompanyUser.approvalStatus = PENDING` → admin approves before login works. `mustResetPassword` flag on admin-provisioned accounts.
- **Async jobs**: BullMQ (not Kafka). Real-time: gorilla/websocket + Redis pub/sub for scheduling; Socket.IO for comms.
- **Customer signup**: `POST /crm/auth/register` creates `CompanyUser(role=customer) + Customer + Lead(NEW)` — admin sees signups as leads. Preserve this flow.

### Shared packages

- `packages/types` — shared TS interfaces (`AuthUser`, `JwtPayload`, domain enums). Edit here, not per-service.
- `packages/auth-client` — JWT strategy, RBAC guards, decorators. The JWT strategy maps `customer_id` → `AuthUser.customerId`.
- `packages/queue` — BullMQ queue names, factories, job types.

When you change anything in `packages/*`, every consuming service rebuilds via Turbo's `^build` dependency.

## Commands

All commands run from the repo root unless noted.

```bash
# Setup
pnpm install
docker compose up -d                    # bring up Postgres/Redis/Mongo/MinIO/Nginx/churn
pnpm --filter crm-service prisma:migrate

# Dev (host processes; hot-reload)
pnpm dev               # all backends (no frontends)
pnpm dev:admin         # admin-dashboard only (port 5173)
pnpm dev:portal        # customer-portal only (port 5174)
pnpm dev:all           # everything, concurrency=20

# Per-service
pnpm --filter <service-name> dev
pnpm --filter <service-name> build
pnpm --filter <service-name> test
pnpm --filter <service-name> test -- <pattern>      # single Jest test
pnpm --filter <service-name> type-check
pnpm --filter <service-name> lint

# Repo-wide
pnpm build | pnpm lint | pnpm test | pnpm type-check | pnpm format

# DB
pnpm db:migrate | pnpm db:seed | pnpm db:reset | pnpm db:studio

# Health / infra
pnpm health
pnpm docker:up | pnpm docker:down | pnpm docker:reset   # reset wipes .docker-data
```

Go scheduling-service: `cd apps/scheduling-service && go run ./cmd/server` (loads `.env` via godotenv).

Frontend builds use `tsc -b && vite build`; there is **no** `test` or `type-check` script in admin-dashboard/customer-portal — `tsc -b` (run via `build`) is the type check.

## Conventions worth knowing

- **No `npm` / no `yarn`** — `preinstall` will fail the install.
- Don't introduce a second Postgres database — add a schema instead.
- All design docs live in `docs/` (PROJECT_STATUS, DEV_LOG, FRONTEND_INTEGRATION_PLAN, INVENTORY_SERVICE_PLAN, TECHNICIAN_APP_SPEC, NGINX_FIX_GUIDE, README_ANALYTICS_FIX, DEPLOYMENT_SPEC, GCP_DEPLOYMENT_GUIDE, plus the bandit/agent specs). The authoritative system map is **`docs/SYSTEM_OVERVIEW.md`**.
- Customer-portal env: `VITE_COMPANY_ID=co-demo-001` (demo tenant).
- Stripe is not configured in dev; `PayInvoiceModal` has a graceful fallback — keep it.
- Analytics page hooks (`useAnalytics.ts`) catch fetch errors and fall back to demo data, logged with `[Analytics]` prefix — do NOT strip this without replacement; it's load-bearing for prod when the analytics service is briefly unreachable. A `useAnalyticsServiceHealth()` hook pings `/analytics/health` every 60s and drives a degraded banner on Analytics + Dashboard pages.
- **Money is always in dollars** end-to-end (analytics-service Decimal(10,2) → number; no cents anywhere). Format via `formatDollars` / `formatRevenueK` / `dollarsToK` from `apps/admin-dashboard/src/lib/format.ts` — don't reinvent `/100/10` or `/1000` math inline.
- **Status enums are UPPER_SNAKE_CASE** (PENDING, EN_ROUTE, PARTIALLY_PAID, …). CSS maps key on UPPER_CASE only; normalize lookups with `normalizeStatus()` and display via `humanizeStatus()` — both in `lib/format.ts`. Don't add lowercase fallback rows.
- **Message.direction is always present** (comms-service Prisma enforces it). Don't add `direction?` optional or fall back to OUTBOUND in client code.
- **Dispatch /ws auth contract**: token via `?access_token=…` (Go peeks alg, HS256→local secret, RS256→Auth0 JWKS); else dev test-bypass via `?x-test-*` query params (server requires `BYPASS_AUTH=true && GIN_MODE != "release"`). Client pulls identity from `AuthContext`, not hardcoded values.
- **Pagination**: every NestJS service uses `clampPagination({ page, limit })` from `@tscrm/types` (max 100 per page by default). Don't hand-roll `Math.min(limit, …)` inline.
- **Caller lookup**: `CustomersLookupService` (crm-service) resolves an inbound caller to **exactly one** customer — `GET /customers/lookup/by-phone`, `POST /customers/lookup/match`. Returns `found` / `not_found` / `ambiguous`; never a list. Phone matching compares the trailing 9 digits with all formatting stripped, backed by **expression indexes** in `20260902000000_customer_phone_lookup_index`. The SQL and the index expression must stay character-identical or Postgres silently falls back to a seq scan — and the digit count must be `Prisma.raw`, not a bound parameter (Prisma binds JS numbers as bigint; there is no `right(text, bigint)`).
- **partner-api → other services**: `InternalTokenService` mints a short-lived **HS256** JWT (`JWT_SECRET`) carrying the partner key's `company_id` and role `office_manager`. The shared `JwtStrategy` accepts HS256 in every environment, so this works in prod — don't reach for the dev-bypass headers, which downstream services refuse when `NODE_ENV=production`.
- **Partner sandbox**: keys carry `environment: LIVE | SANDBOX`. Sandbox keys (`pk_test_`) run the **real** code paths against the seeded `co-partner-sandbox` tenant, but every outward side effect is simulated at the last moment — after all validation — so no SMS/email is sent and no Stripe session is created. Never short-circuit a *guard* on sandbox; only the delivery. Seed with `pnpm --filter partner-api seed:sandbox`. Self-onboarding docs: `/guide` (HTML), `/capabilities` (JSON), `/docs` (Swagger) — all `@PartnerPublic()`.
- **Partner events**: services publish business events with `emitPartnerEvent()` from `@tscrm/queue` (job.completed, invoice.paid, quote.accepted, booking.confirmed). It never throws — a webhook must not roll back the transaction that triggered it. partner-api is the **only** consumer of the `partner-events` queue; don't add a second worker to it (workers on one queue compete for jobs). Deliveries are HMAC-signed over `"<timestamp>.<body>"`; `PARTNER_WEBHOOK_ALLOW_HTTP` and `PARTNER_WEBHOOK_ALLOW_PRIVATE_HOST` are **separate** flags on purpose — never re-merge them, or the local-test convenience becomes an SSRF hole.
- **partner-api auth**: `ApiKeyGuard` → `RateLimitGuard` → `ScopesGuard` are registered **globally** in `app.module.ts`, so a new partner endpoint is protected by default. Opting out takes an explicit `@PartnerPublic()` (health, and the JWT-guarded `admin/keys` routes). Declare required scopes with `@Scopes(PARTNER_SCOPES.X)` from `src/auth/scopes.ts` — there is deliberately **no** customer list/search scope; partners resolve one caller at a time.
- **Pool tunables** (env vars; defaults are safe): `PG_POOL_MAX_CONNS`/`PG_POOL_MIN_CONNS` for the Go scheduling pool; `WS_MAX_CONNS_PER_COMPANY` for the WS hub per-tenant cap. Bump in prod, not in code.
- **Analytics caching**: `dashboard/kpis` (2 min), `revenue/series` (3 min day/week, 10 min month+), `jobs-analytics/by-status` (2 min). All cache misses fall through to live SQL — Redis being down never breaks correctness.
- **PDF generation**: `PdfService` uses a Chromium singleton with bounded concurrency (`PDF_MAX_CONCURRENT`, default 4). Don't reintroduce per-request `puppeteer.launch()` — that's the cold-start anti-pattern we removed.
- **Customer-portal hooks**: per-page files (`useMyJobs`, `useMyFinance`, `useMyMessages`, `useMyProfile`, `useCustomerDashboard`). The legacy `useCustomerPortal` import path is a barrel that re-exports everything for back-compat — new code should import from the per-page module for better tree-shaking.
- **Leaflet/MapPicker**: import the `MapPickerLazy` wrapper, never `MapPicker` directly — the wrapper keeps Leaflet (~150 KB gz) out of the chunk until the modal that needs it opens.
- Push tokens for staff/technicians live on `CompanyUser.pushToken` (+ `pushPlatform`, `pushTokenUpdatedAt`). Register/refresh: `POST /crm/users/me/push-token { token, platform }`; clear: `DELETE /crm/users/me/push-token`. comms-service's `sendPush` still takes a token directly — orchestrators look up the user's token from CRM before queueing.
- Job dollar estimates: prefer `Job.estimatedValue` (denorm). It's settable on create + via `PATCH /jobs/:id`, and finance-service backfills it on quote→invoice conversion **only when null**. Invoice total stays authoritative once billed.
- Go scheduling-service test-bypass: enabled when `BYPASS_AUTH=true` AND `GIN_MODE != "release"`. Reads `x-test-company-id|user-id|user-role|user-email|user-name` from header OR `?query` (the latter needed for native browser WebSockets).
- Messaging is **thread-based**: use `/comms/messaging/threads`. Endpoints `/messaging/messages` and `/messaging/send` do NOT exist.
- Money is `Prisma.Decimal @db.Decimal(10,2)` — JSON-serialized as **string**. Always wrap with `Number()` before arithmetic / `.toFixed()`.
- `class-validator` foot-guns: `@MaxLength` only checks strings (use `@Max` for numbers); nested DTOs need `@ValidateNested({ each: true }) @Type(() => Dto)` or `whitelist: true` strips them silently.
- `@Post()` defaults to **HTTP 201**. If a test expects 200, use `@HttpCode(HttpStatus.OK)`.
- Webhook raw bodies preserved via `express.raw()` BEFORE JSON parser: Stripe (`/webhooks/stripe`) in finance-service, Twilio (`/webhooks/twilio`) in comms-service.

## Cloud Run gotcha

When updating the prod `nginx-gateway` service on Cloud Run, **always use `gcloud run deploy --update-env-vars`**. `--set-env-vars` REPLACES the entire env-var set; missing `<SERVICE>_SERVICE_URL` vars cause `envsubst` to substitute empty strings → invalid `proxy_pass` → silent 404s on `/api/<service>/*`. See `docs/NGINX_FIX_GUIDE.md`.

## Big files (decomposition candidates)

These dominate the graph and are the most-touched flows — keep them in mind when planning the optimization pass:

- `apps/admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx` — 2,334 lines (single component is 2,052 lines)
- `apps/technician-app/app/job/[id].tsx` — 1,812 lines
- `apps/admin-dashboard/src/pages/jobs/JobDetailModal.tsx` — 1,357 lines
- `apps/admin-dashboard/src/pages/Communications.tsx` — 1,213 lines
- `apps/admin-dashboard/src/pages/dispatch/DispatchBoard.tsx` — 1,024 lines
- `apps/crm-service/src/customers/customers.service.ts` — 821 lines (`CustomersService` 805 lines)
- `apps/customer-portal/src/hooks/useCustomerPortal.ts` — 811 lines

## Knowledge graph (MCP)

This repo is indexed by the `code-review-graph` MCP server. Prefer it for exploration:
- `semantic_search_nodes` / `query_graph` before Grep
- `detect_changes` + `get_review_context` for code review
- `get_impact_radius` / `get_affected_flows` before refactors
- `query_graph` with `pattern=tests_for` to check coverage

Fall back to Grep/Read only when the graph doesn't cover what you need.



## How Claude Code Should Behave

**Rule: Challenge the direction**
Think critically before executing. If there's a faster or smarter way to reach the goal, suggest it. Don't just blindly follow — push back when it makes sense.

**Rule: Test before responding**
After any code change, run the relevant tests before saying "done". Never respond with "complete" if the code is untested. For Phase 1-2 tasks, always run `pytest tests/` before confirming.

**Rule: Reduce context usage**
Always look for ways to reduce context window usage. Keep files lean. Remove redundant code or comments. If context is getting too full, suggest a fresh session and recap the current state in TASKS.md first.

**Rule: Explain like I'm new to this**
For every response include:
- **What I just did** — plain English, no jargon
- **What you need to do** — step by step
- **Next step** — one clear action
- **Errors** — if something broke, explain simply and say exactly how to fix it

**Rule: Prompt the next step**
End every response with the next action to take. Example: "Tests passing — ready to start Phase 2, Task 2.1. Should I proceed?" This keeps momentum and prevents losing track.

**Rule: Update TASKS.md after corrections**
If a major correction was made during a session (wrong format, bad assumption, missing step), update TASKS.md or ARCHITECTURE.md to reflect it before closing. This prevents the same mistake next session.

**Rule: One task at a time**
Complete one task from TASKS.md fully (implement + test + commit) before moving to the next. Never work on two tasks simultaneously.