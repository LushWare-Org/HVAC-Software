# T&S CRM — System Overview

> **Authoritative system reference.** Generated 2026-05-08 from full codebase audit + knowledge graph (600 files / 30,973 nodes / 2,339 flows / 10 communities).
> If you're a new Claude session: read this first, then `CLAUDE.md`, then `docs/PROJECT_STATUS.md` / `DEV_LOG.md`.

---

## 1. What this product is

SaaS Field Service Management (FSM) for trade businesses (HVAC, Plumbing, Electrical). Inspired by HousecallPro / ServiceTitan. Multi-tenant, multi-role: admin dashboard for office/dispatchers, customer portal for end-customers, technician mobile app for field crews.

Currently deployed to GCP (Cloud Run + Firebase Hosting). Branch `deployed-04/05` is the live deployment branch; `main` is the integration branch.

---

## 2. Repo layout (actual, current)

```
apps/                          (workspace packages)
  crm-service/                 NestJS 10 — port 3001, Postgres `crm` schema
  job-service/                 NestJS 10 — port 3002, Postgres `jobs` schema (+ Redis cache)
  scheduling-service/          Go 1.23 + Gin — port 3003, Postgres `scheduling` (PostGIS) + Redis pub/sub
  finance-service/             NestJS 10 — port 3004, Postgres `finance` schema
  comms-service/               NestJS 11 — port 3005, MongoDB + BullMQ + Socket.IO
  analytics-service/           NestJS 10 — port 3006, cross-schema raw SQL + Redis cache
  inventory-service/           NestJS 10 — port 3007, Postgres `inventory` schema
  agent-service/               (empty / placeholder for AI agent orchestration)
  churn-service/               FastAPI + scikit-learn / XGBoost — port 8000 (in Docker)
  admin-dashboard/             React 19 + Vite 7 + TanStack Query — port 5173
  customer-portal/             React 19 + Vite 7 — port 5174
  technician-app/              React Native + Expo SDK 54 (iOS + Android)
packages/
  types/                       Shared TS interfaces (AuthUser, JwtPayload, enums)
  auth-client/                 Auth0 JWT strategy, RBAC guards, decorators
  queue/                       BullMQ queue names, factories, job types
infrastructure/
  nginx/                       API gateway (dev: nginx.conf; prod: nginx.conf.template envsubst-driven)
  postgres/                    init.sql — PostGIS + pg_trgm + 6 schemas + grants
  prisma-migrate/              Helper migrations for cross-service ops
agent/                         Python ML agents (bandit-driven retention, followup, upsell, revenue)
analytics/                     Python — bandit_metrics, metrics_service
api/                           Python Flask routes — analytics_routes, bandit_routes
models/                        Pickled ML models (.pkl): bandits, demand-forecast, churn, pricing, etc.
services/ai/                   AI service helpers
Server/src/                    Standalone server module (legacy/aux — verify before touching)
scripts/                       db-migrate, db-seed, db-reset, generate-env, health-check, supabase migrate
tests/flows/                   Cross-service integration flow tests (10 flows, 107 tests, runs in-band)
docs/                          ALL design docs live here (not at repo root anymore)
```

**Note**: The repo root no longer holds `*.md` design docs — they were moved to `docs/`. `git status` may still show `??` entries from before the move; ignore them.

---

## 3. Current service inventory (every module)

### crm-service (port 3001) — `crm` schema
Modules: `auth`, `users`, `company`, `customers`, `contacts`, `addresses`, `leads`, `bookings`, `agreements`, `reviews`, `equipment` (customer-owned assets, e.g., installed AC units), `email`, `cron`, `queues`, `health`, **`agents`** (orchestration), **`ai`** (AI features), **`followup`** (automated lead/customer followup), **`upsell`** (upsell recommendations).

**`CompanyUser` model** (auth model): `approvalStatus` field (`APPROVED` / `PENDING` / `REJECTED`) — self-registered technicians land in `PENDING` and need admin approval. `mustResetPassword` flag for admin-provisioned temp passwords. `skills[]`, `latitude`, `longitude` for technician onboarding.

**Auth endpoints**: `POST /auth/login`, `POST /auth/register`, `POST /auth/change-password`. JWT (HS256) for local dev/demo, Auth0 RS256 for prod. Customer JWT carries `customer_id` claim → `AuthUser.customerId`.

### job-service (port 3002) — `jobs` schema
Modules: `jobs`, `work-orders`, `trade-templates`, `price-book`, plus a `redis-cache.service.ts` for hot-path caching.

**Trade-template system** is DB-driven (no code changes for new trades): `JobType` → `JobTemplate` (with `requiredParts: Json[]` for inventory wiring) → `JobTemplateTask` (ordered checklist) + `JobCustomFieldDef` (TEXT/NUMBER/SELECT/BOOLEAN/DATE/MULTI_SELECT/TEXTAREA per trade).

**Job state machine**:
```
PENDING → SCHEDULED | CANCELLED
SCHEDULED → EN_ROUTE | ON_HOLD | CANCELLED
EN_ROUTE → ON_SITE | SCHEDULED
ON_SITE → COMPLETED | ON_HOLD
COMPLETED → INVOICED
INVOICED → PAID
ON_HOLD → SCHEDULED | CANCELLED
CANCELLED → PENDING (reopen)
```
Enforced via `STATUS_TRANSITIONS` map + `BadRequestException` on invalid transitions. Status changes write `JobStatusHistory` audit rows.

### scheduling-service (port 3003) — Go, `scheduling` schema (+ PostGIS)
**Phase 1 AI scoring**:
```
distanceScore = max(0, 100 - (distanceKm / 50.0 × 100))   // weight 40%
workloadScore = max(0, 100 - (activeJobs / 5.0 × 100))     // weight 35%
ratingScore   = (rating / 5.0) × 100                        // weight 25%
total         = 0.40·distance + 0.35·workload + 0.25·rating
```
- `total ≥ 90` → auto-assign + broadcast `WSTypeAssigned`
- `< 90` → return top-3 suggestions to dispatcher

**Real-time**: gorilla/websocket hub with company-scoped rooms (`clients map[companyID][]*Client`). Pattern-subscribes to `gps:*` + `assignment:*` Redis channels (`PSubscribe`) so all pods fan out. Ping/pong every 54s.

**Endpoints**: `GET /health`, `/health/ready`; `GET/POST/PATCH /technicians`, `/technicians/me`; `POST /dispatch/assign`, `/dispatch/assign/manual`; `GET /dispatch/assignments/:id|/job/:jobId|/technician/:techId`; `PATCH /dispatch/assignments/:id/status`; `POST /gps`; `GET /ws` (role-gated to DISPATCHER/OFFICE_MANAGER/COMPANY_ADMIN).

### finance-service (port 3004) — `finance` schema
Modules: `quotes`, `invoices`, `payments`, `expenses`, `pdf` (Puppeteer-core + `@sparticuz/chromium` + Handlebars; `quote.hbs` and `invoice.hbs`), `notification-client` (calls comms-service for delivery).

**State machines**:
- Quote: `DRAFT → SENT → VIEWED → ACCEPTED/DECLINED/EXPIRED` (UUID `approvalToken` for public e-sign URL `POST /quotes/approve/:token`).
- Invoice: `DRAFT → SENT → PARTIALLY_PAID → PAID/OVERDUE/VOID`.

All money fields use `Prisma.Decimal @db.Decimal(10,2)` — Prisma serializes Decimal as **strings** in JSON, so frontends must wrap with `Number(v)` before `.toFixed()`. (This bug bit `flow 03`; helper `decimalToNumber()` in admin-dashboard hooks.)

**Stripe webhook**: raw body preserved via `express.raw()` middleware **before** JSON parsing — required for signature verification. `payment_intent.succeeded` → updates `amountPaid`/`balanceDue`. `payment_intent.payment_failed` → creates FAILED Payment.

### comms-service (port 3005) — MongoDB + BullMQ
Modules: `notifications`, `templates`, `messaging`, `automation`, providers `sms` (Twilio), `email` (SendGrid), `push` (Firebase Admin SDK), `workers` (Bull processors).

**Three queue workers**: `SmsProcessor`, `EmailProcessor`, `PushProcessor` — each follows `QUEUED → SENT → DELIVERED` (+ DeliveryLog) or `FAILED` (+ DeliveryLog + throw, BullMQ exponential retry).

**Messaging is thread-based**, NOT message-list-based. The frontend used to call `/messaging/messages` and `/messaging/send` — those endpoints **do not exist**. Use `/messaging/threads` and `POST /messaging/threads/:id/messages`.

**Twilio inbound webhook** (`POST /webhooks/twilio/inbound`) is unauthenticated — signature is validated internally. Raw body middleware applied to `/webhooks/twilio` in `main.ts`.

**AutomationModule**: rule engine — load active rules by trigger → match conditions (simple equality) → render template → dispatch via NotificationsService (with optional `delayMinutes`). Triggers: `JOB_STATUS_CHANGED`, `INVOICE_SENT`, `PAYMENT_RECEIVED`, `QUOTE_APPROVED`, `APPOINTMENT_BOOKED`. Internal endpoints (`POST /automation/events/*`) protected by `x-internal-api-key` header — called from job-service & finance-service.

### analytics-service (port 3006) — `analytics` schema (anchor only)
Modules: `dashboard`, `revenue`, `jobs-analytics`, `customer-analytics`, `technician-metrics`, `exports`, `events`, **`recommendations`**, **`revenue-agent`** (server-side AI revenue agent), `redis-cache.service`.

**Architecture**: Cross-schema raw SQL (`prisma.$queryRaw`) with fully-qualified table names (`crm.customers`, `jobs.jobs`, `finance.invoices`). Read-only — no Prisma models for business schemas (only a minimal `AnalyticsEvent` anchor).

**Exports**: `revenue/csv` (RFC 4180 escaping), `revenue/excel` (ExcelJS, frozen header, SUM formula), `jobs/excel` (multi-sheet: All Jobs + By Trade), `technicians/csv`.

### inventory-service (port 3007) — `inventory` schema
Modules: `inventory-items`, `locations`, `stock-operations`, `availability`, `purchase-orders`, `alerts`.

**Two location types only**: WAREHOUSE (1 per company) and VAN (1 per technician). Stock movements via `INTAKE`, `TRANSFER`, `CONSUME`, `ADJUST`, `RETURN`. Auto-deduction from van on work-order line-item add (BullMQ event from job-service). Reserved-qty mechanism prevents double-booking parts across scheduled jobs.

**Scheduling integration (planned/wired)**: `parts_availability` becomes a 25% factor in the AI score (`distance·0.30 + workload·0.25 + rating·0.20 + parts·0.25`). Exposed via `GET /inventory/check-availability?items=…&techId=…`.

### churn-service (port 8000) — Python FastAPI
ML inference for churn / failure / revenue risk. Models in `models/*.pkl` (e.g. `call_model.pkl`, `pricing_model.pkl`, `demand_forecast_model.pkl`, `utilization_model.pkl`, `discount_10_model.pkl`, `discount_20_model.pkl`).

### Python ML layer (top-level `agent/`, `analytics/`, `api/`, `models/`)
A separate Flask/Python tier alongside the NestJS world:
- `agent/` — multi-armed bandit agents: `followup_bandit.py`, `retention_bandit.py`, `upsell_bandit.py`, `revenue_agent.py` + decision_engine, executor, feedback_logger, state_builder.
- `analytics/bandit_metrics.py` + `metrics_service.py` — bandit reward tracking.
- `api/` — Flask blueprints `analytics_routes.py`, `bandit_routes.py`.
- `models/` — pickled `*_bandit.pkl`, `action_effect_models.pkl`, `discount_*.pkl`, `pricing_model.pkl`, `utilization_model.pkl`, etc.

The admin dashboard surfaces this via the **BanditDashboard page** + `useBanditDashboard.ts` hook.

### admin-dashboard (port 5173)
Pages: `Dashboard`, `Customers` (+ `LeadDetailsSidebar`, `CustomerDetailsSidebar`), `Jobs` (+ `JobDetailModal`), `Scheduling`, `dispatch/DispatchBoard`, `Finance`, `Communications`, `Analytics`, `Settings`, `Team`, `Profile`, `Login`, `Inventory`, **`BanditDashboard`** (ML/agent ops surface).

Hooks: `useDashboard`, `useAnalytics`, `useCustomers`, `useJobs`, `useFinance`, `useScheduling`, `useComms`, `useInventory`, `useTeam`, `useSettings`, `useEquipment`, `useReviews`, `useAddresses`, `useSocket` (WebSocket), `useBanditDashboard`.

### customer-portal (port 5174)
Pages: `Dashboard`, `Login`, `ForceResetPassword`, `Profile`, `jobs/`, `invoices/`, `quotes/`, `messages/`. JWT key `cp_token` (vs admin's `tscrm_token`).

### technician-app
Expo SDK 54, file-based router. Background GPS via `expo-location` (30s while EN_ROUTE, 60s while ON_SITE, off otherwise; ≤120s under 15% battery). Photo capture via `expo-camera`. Offline-first via TanStack Query persist + MMKV — checklist updates, line-item adds, status transitions, photos, GPS, expenses all queue locally.

---

## 4. Data plane

| Store | Use |
|---|---|
| PostgreSQL 16 + PostGIS 3.4 | Primary DB; **6 schemas** (`crm`, `jobs`, `scheduling`, `finance`, `analytics`, `inventory`) — single instance, not multi-DB |
| MongoDB 7 (replica set `rs0`) | comms-service only — message threads with embedded Message[], delivery logs, automation rules |
| Redis 7 (AOF) | BullMQ queues, Socket.IO adapter, scheduling pub/sub, hot-path caching (job-service, analytics-service) |
| MinIO / S3 | Photos, PDFs, receipts |

**Multi-tenancy**: `company_id` on every business table, injected by NestJS middleware from JWT. Every Prisma query filters by it.

**Connection strings**: each NestJS service uses its own `<SERVICE>_DATABASE_URL` (PgBouncer) plus a `<SERVICE>_DIRECT_DATABASE_URL` (session mode for Prisma migrations / Studio). Scheduling Go uses raw `DATABASE_URL`.

---

## 5. Auth model

- **Prod**: Auth0 RS256 + JWKS auto-cache. NestJS via `packages/auth-client` (JwtStrategy, JwtAuthGuard, RolesGuard). Go scheduling via `lestrrat-go/jwx/v2`.
- **Dev / demo**: Local JWT (HS256). Customer-portal token key `cp_token`; admin-dashboard token key `tscrm_token`. The CRM service issues these via `/auth/login` and `/auth/register`.
- **Dev bypass headers** (recognized when no JWT): `x-test-company-id`, `x-test-user-id`, `x-test-user-email`, `x-test-user-role`, `x-test-user-name`. Nginx CORS allows them.
- **Roles**: `super_admin`, `company_admin`, `office_manager`, `dispatcher`, `technician`, `customer`. Customer JWT includes `customer_id` claim → `AuthUser.customerId`.
- **Approval workflow**: self-registered technicians land as `CompanyUser.approvalStatus = PENDING`; admin must approve. `mustResetPassword=true` flag forces a password change on next login (admin-provisioned accounts).
- **Server-side scoping rule**: any endpoint reachable by `role=CUSTOMER` MUST filter by `customerId` from the token. Job & invoice controllers already enforce this — preserve when extending.

---

## 6. API gateway

- **Dev**: nginx on port 80; `/api/<service>/*` → upstream `host.docker.internal:<port>`. WebSocket on `/ws`. Socket.IO on `/socket.io/`. CORS allows test-bypass headers.
- **Prod (current)**: GCP Cloud Run nginx-gateway; uses `nginx.conf.template` + `envsubst` driven by `<SERVICE>_SERVICE_URL` env vars. **Foot-gun documented in `docs/NGINX_FIX_GUIDE.md`**: `gcloud run deploy --set-env-vars` REPLACES the entire env-var set; if you forget any service URL, the template substitutes empty strings and routing silently 404s. Always use `--update-env-vars`.
- **Prod (planned)**: Kong Gateway with JWT plugin (validate at gateway → services trust headers), rate-limit, CORS, request-transformer (inject `X-Company-ID`).

---

## 7. Cross-service flows (top criticality from graph)

From the graph (2,339 detected flows; top by criticality):

| Flow | Criticality | Notes |
|---|---|---|
| `App` (admin-dashboard root) | 0.97 | 141 nodes — entire dashboard composition tree |
| `Customers` | 0.94 | 99 nodes — customer detail sidebar is the largest single component |
| `Team` | 0.94 | — |
| `Finance` | 0.94 | 32 nodes |
| `Jobs` | 0.94 | 17 nodes |
| `DispatchBoard` | 0.93 | 50 nodes — WebSocket-driven |
| `Scheduling` | 0.93 | — |
| `Communications` | 0.92 | 24 nodes — thread-based |
| `Inventory` | 0.92 | 23 nodes |
| `Analytics` | 0.865 | 32 nodes |
| Technician-app `App`, `JobDetailScreen`, `MyJobs` | 0.70–0.72 | Mobile flows |

Largest hand-written code units (post-build / non-Prisma-generated):
- `admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx` — **2,334 lines**, single component (`CustomerDetailsSidebar` is 2,052 lines). Decomposition candidate.
- `technician-app/app/job/[id].tsx` — 1,812 lines.
- `admin-dashboard/src/pages/jobs/JobDetailModal.tsx` — 1,357 lines.
- `admin-dashboard/src/pages/Communications.tsx` — 1,213 lines.
- `admin-dashboard/src/pages/dispatch/DispatchBoard.tsx` — 1,024 lines.
- `crm-service/src/customers/customers.service.ts` — 821 lines / `CustomersService` class 805 lines.
- `customer-portal/src/hooks/useCustomerPortal.ts` — 811 lines.

These are the natural targets for the upcoming optimization pass.

---

## 8. Known issues, gaps, and rough edges

### Resolved (don't re-flag)
- ~~GAP 1: `UsersModule` in CRM~~ — `apps/crm-service/src/users/` exists with `/users/me`.
- ~~GAP 2: `CompanyModule`~~ — `apps/crm-service/src/company/` exists.
- ~~GAP 5: Analytics service not running~~ — built and deployed; has its own deploy script.
- ~~GAP 3: scheduling Go test-bypass headers~~ — implemented via `BYPASS_AUTH=true` env flag (gated by `GIN_MODE != "release"`). Honors `x-test-company-id`, `x-test-user-id`, `x-test-user-role`, `x-test-user-email`, `x-test-user-name` (header or `?query` for native WS). See `apps/scheduling-service/internal/middleware/auth.go`.
- ~~GAP 4: Job amount strategy~~ — **decided: add `Job.estimatedValue Decimal?(10,2)`** (denorm consistent with the existing `customerName/Phone` pattern). Set on create from quote total or template estimate; backfilled by finance-service on quote conversion only when null (never overwrites a manual estimate). Invoice remains the authoritative billed amount. Migration: `apps/job-service/prisma/migrations/20260508120000_add_job_estimated_value/`. Run `pnpm --filter job-service prisma:migrate` to apply.
- ~~Push token registration~~ — **decided: store on `CompanyUser`** (JWT-aligned, role-agnostic, persists across role changes). New columns: `pushToken`, `pushPlatform`, `pushTokenUpdatedAt`. Endpoints: `POST /crm/users/me/push-token { token, platform }` (idempotent) and `DELETE /crm/users/me/push-token`. Migration: `apps/crm-service/prisma/migrations/20260508120100_add_push_token/`. Run `pnpm --filter crm-service prisma:migrate` to apply.
- ~~Analytics demo-data fallback~~ — kept; **plus** added a `useAnalyticsServiceHealth()` hook (60s ping of `/analytics/health`) and a degraded banner on Analytics + Dashboard pages that surfaces "service unreachable, showing demo data" instead of silently degrading. Per-query `[Analytics]`-prefixed logs remain.
- ~~WebSocket auth in dev~~ (resolved 2026-05-08): the dispatch `/ws` works in dev. Server (Go middleware) reads JWT from `?access_token=…` (peeks header to auto-route HS256→local secret vs RS256→Auth0 JWKS) and falls back to `x-test-*` query params when `BYPASS_AUTH=true && GIN_MODE != "release"`. Client (`useDispatchWebSocket`) now picks `token`/`user` from `AuthContext` instead of hardcoded demo values, and reconnects on identity change. Native browser WS can't send custom headers — query params are the only viable transport, which both server branches support.
- ~~Status enum mapping~~ (resolved 2026-05-08): all admin-dashboard CSS maps now key on UPPER_SNAKE_CASE only. Lookups normalize via a shared `normalizeStatus()` helper; display goes through `humanizeStatus()`. Removed the lowercase fallback rows in `Dashboard.tsx`, `Finance.tsx`, `ExpenseDetailModal.tsx`. Helpers live in `apps/admin-dashboard/src/lib/format.ts`. (`useJobs.ts` still emits a lowercase-keyed `JobStats` object — that's a *type contract*, not a CSS map; intentional.)
- ~~Revenue unit ambiguity~~ (resolved 2026-05-08): confirmed end-to-end **dollars** by reading analytics-service raw queries — `SUM(amount)` from `finance.payments.amount Decimal(10,2)` and `SUM(i.total)` from `finance.invoices.total Decimal(10,2)`, parsed to `number` in revenue.service.ts. Replaced magic `Math.round(d.revenue / 100) / 10` and `(p.value / 1000).toFixed(0)` with shared `dollarsToK()` / `formatRevenueK()` helpers (both documented as "input is dollars"). Single place to update if the unit ever changes.
- ~~Communications direction default~~ (resolved 2026-05-08): backend always sets `direction` (comms `MessageDirection` enum is required, not nullable; messaging.service.ts:273 sets it explicitly via sender role). Doc note was stale. Tightened admin-dashboard `Message.direction` from optional to required + added a comment on the type. Communications.tsx logic (`msg.direction === 'OUTBOUND'`) is correct as-is — undefined direction renders on the inbound side, not OUTBOUND.

### Open / live
1. **Stripe**: not configured in dev; `PayInvoiceModal` (admin) and `customer-portal/src/pages/invoices/PayInvoiceModal.tsx` have graceful fallbacks for unconfigured Stripe — preserve.
2. **Push integration in comms-service**: `NotificationsService.sendPush` still requires the caller to pass `pushToken` directly. Orchestrators (automation rules, job-service event resolvers) should look up `CompanyUser.pushToken` by `recipientId` before queueing — wire this when migrating push paths off direct-token APIs.

### Bugs that bit us before — keep these in mind
- `class-validator @MaxLength(N)` on **number** fields silently passes (only checks strings). Use `@Max(N)` or a custom rule.
- NestJS `ValidationPipe { whitelist: true }` strips ALL properties from nested objects unless you decorate them with `@ValidateNested({ each: true }) @Type(() => SomeDto)` — silently ends up with `[{}, {}]` arrays.
- `@Post()` defaults to **HTTP 201**. If a flow test expects 200, add `@HttpCode(HttpStatus.OK)`.
- Prisma Decimal serializes as **string** in JSON; never call `.toFixed()` directly — wrap with `Number()`.
- `??` does **not** treat `''` as nullish; use `||` or an explicit guard if empty string should be rejected.
- nginx-gateway `--set-env-vars` foot-gun (see §6).

---

## 9. Optimization candidates (for the upcoming production-ready pass)

Order roughly by ROI, not by the order to do them in:

1. **Decompose the giant React components**: `CustomerDetailsSidebar.tsx` (2,334 lines), `JobDetailModal.tsx` (1,357), `DispatchBoard.tsx` (1,024), `Communications.tsx` (1,213). These are the longest functions/files in the graph and the most-touched flows.
2. **Cache more analytics**: analytics-service already has Redis cache; expand to `dashboard/kpis` and `revenue/series` with short TTLs.
3. **Server-side pagination is in place**, but several list endpoints don't enforce a max `limit` — add hard ceilings (e.g., 100) to avoid runaway queries.
4. **Connection pool tuning**: pgx pool is 25 max; verify against Supabase / Cloud SQL connection caps before scaling pods.
5. **WebSocket fanout**: scheduling hub broadcasts via Redis pub/sub — fine. But the in-process `clients map[companyID][]*Client` is unbounded; add per-company connection caps + read-deadline enforcement.
6. **Inventory parts-score in Go scheduler**: spec'd at 25% weight; verify if wired in `internal/service/assignment_service.go` (the recorded scoring is still 40/35/25 distance/workload/rating).
7. **PDF generation**: Puppeteer is heavy. Consider a dedicated PDF worker (BullMQ queue) so finance API stays responsive under burst.
8. **Tenant isolation tests**: write a fixed corpus of cross-company access attempts (forge `company_id` in JWT) and prove every endpoint rejects them.
9. **Bandit ML production hardening**: the Python tier uses pickled models loaded from disk; for prod, formalize the model registry, version pinning, and a canary path for new models.
10. **Customer-portal `useCustomerPortal.ts`** (811 lines) is a god-hook — split per-page hooks.
11. **`crm-service/src/customers/customers.service.ts`** (821 lines / `CustomersService` 805 lines) is the largest service class; split by sub-domain (search, segments, recommendations, mutations).
12. **Frontend bundle audit**: admin-dashboard pulls FullCalendar 6 + Recharts 3 + Leaflet + react-leaflet + socket.io-client + lucide-react + date-fns. Verify code-splitting on the route boundaries.

---

## 10. Operational notes

- **Demo / dev DB**: company `co-demo-001` is the seeded tenant. `customer-portal/.env` sets `VITE_COMPANY_ID=co-demo-001`.
- **Prod DB**: Supabase (cloud Postgres). Local docker-compose's Postgres service is gone — only Redis, Mongo, MinIO, Nginx, churn-service in compose; backend services run on host for hot-reload.
- **Deployment**: `deploy-services.sh`, `deploy-analytics-service.sh`, `deploy-admin-dashboard.sh`, `deploy-nginx-gateway-fix.sh` at repo root. Firebase Hosting for admin dashboard; Cloud Run for every backend.
- **Tests**: `pnpm test` per service. Cross-service integration: `tests/flows/` (10 flows, 107 tests, runs in-band against Docker stack). Go tests: `go test ./internal/service/...` from `apps/scheduling-service`.
- **Environment files**: `.env.example` at root is the canonical template; per-service `.env` files exist; customer-portal has its own `.env`.

---

## 11. When working on this codebase

1. **Always use the code-review-graph MCP first** for exploration. The graph is up to date as of 2026-05-08 (full rebuild). Re-run `build_or_update_graph_tool` after large changes.
2. **Check `docs/` before assuming a doc doesn't exist** — root-level design docs were moved.
3. **Don't add a second Postgres database** — use a new schema instead (e.g., a future `notifications` schema would still live in the same instance).
4. **Don't break the CUSTOMER-role server-side filter** in jobs/invoices controllers when refactoring.
5. **When changing nginx env vars on Cloud Run, use `--update-env-vars`** — never `--set-env-vars`.
6. **The bandit / agent layer is real** — the BanditDashboard page is not a mock. Don't treat `agent/`, `models/`, `api/` as dead code.
