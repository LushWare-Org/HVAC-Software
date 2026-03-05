# T&S CRM — Development Log

> **Purpose:** Chronological log of what was built each session. Append new entries at the top.
> **Format:** Date → What was done → What's next → Any blockers or decisions made

---

## Session 5 — March 2026 (Week 5: Finance Service + Cross-Service Testing)

**Status: ✅ Finance Service fully built and tested — ready for `npm install` + `npx prisma generate` + `npx prisma migrate dev`**

### What was built — finance-service (NestJS 10, port 3004)

**Finance schema (Prisma multi-schema, PostgreSQL finance schema):**
- `Quote` — full quote lifecycle: DRAFT→SENT→VIEWED→ACCEPTED/DECLINED/EXPIRED
  - Token-based e-signature (`approvalToken UUID @unique`) — no DocuSign dependency
  - Cascading `QuoteLineItem` (quantity×unitPrice Decimal, per-item taxable flag)
- `Invoice` — DRAFT→SENT→PARTIALLY_PAID→PAID/OVERDUE/VOID with Stripe fields
  - `stripePaymentIntentId` + `stripePaymentUrl` for hosted payment page
  - `amountPaid`, `balanceDue` tracked separately from `total`
  - Linked to optional `RecurringSchedule` for auto-generated invoices
  - Cascading `InvoiceLineItem`
- `Payment` — individual payment records; updated by Stripe webhooks or manual recording
  - `PaymentMethod` enum: CARD, ACH, CASH, CHECK, OTHER
- `RecurringSchedule` — WEEKLY/MONTHLY/QUARTERLY/ANNUALLY recurring billing
- `Expense` — job cost tracking (PARTS/FUEL/TOOLS/SUBCONTRACTOR/OTHER), receipt upload field

**All money fields use `@db.Decimal(10,2)` — no floating-point money math.**

**Modules built:**
- `PdfModule` — `PdfService` using puppeteer-core + @sparticuz/chromium + Handlebars
  - `quote.hbs` — status-coloured badge, line-item table, totals with discount, approval block
  - `invoice.hbs` — overdue banner, Stripe pay button, payment history table
  - Templates are logic-free — all formatting (USD currency, %, dates) done in service layer
- `QuotesModule` — full CRUD + send + token-approve + convertToInvoice + PDF download
  - State machine enforced: `QUOTE_TRANSITIONS` map, BadRequestException on invalid path
  - Auto-calculates subtotal/discountAmount/taxAmount/total on create AND on line-item update
  - `POST /quotes/approve/:token` is a **public** endpoint (no JWT, for customer email links)
- `InvoicesModule` — full CRUD + send + status update + Stripe payment-intent + manual payment + void + PDF download
  - State machine: `INVOICE_TRANSITIONS` map
  - `POST /webhooks/stripe` — raw body preserved for signature verification; `payment_intent.succeeded` updates amountPaid/balanceDue; `payment_intent.payment_failed` creates a FAILED payment record
  - `markOverdueInvoices()` batch method for cron job
- `PaymentsModule` — read-only list/single + revenue metrics (totalRevenue, outstandingBalance, byMethod breakdown)
- `ExpensesModule` — CRUD; any authenticated user can submit; ADMIN/MANAGER required to update/delete

**`src/main.ts`:** Raw body middleware applied to `/webhooks/stripe` before JSON parsing (critical for Stripe signature verification).

**`prisma/seed.ts`:** Demo data — 2 quotes, 1 paid invoice, 1 overdue invoice, 1 recurring schedule.

### Tests added

**Finance Service Unit Tests:**
- `quotes.service.spec.ts` — 15 tests: create (subtotal/tax/discount calculations, sequential numbering), send (token generation, idempotency), approve (token validation, idempotency), state machine (all valid/invalid transitions), convertToInvoice (preconditions, duplicate guard), delete (draft-only guard)
- `invoices.service.spec.ts` — 14 tests: create (total calculations, invoice numbering), send (status check), updateStatus (parameterised valid/invalid transition matrix), recordManualPayment (full/partial/already-paid cases), markOverdueInvoices (batch filter), voidInvoice (terminal state check)
- `payments.service.spec.ts` — 5 tests: findOne (found/not-found), findAll (pagination math), getMetrics (revenue aggregation, breakdown)

**Finance Service E2E Tests (`test/app.e2e-spec.ts`):**
- Full NestJS app bootstrapped with mocked PrismaService + mocked Stripe
- Auth mocking via `x-test-user` header (avoids real Auth0 JWT)
- 18 integration tests covering: auth guard (401/200), quotes CRUD + lifecycle, invoices CRUD + lifecycle, payments list + metrics, expense create (technician role), Stripe webhook

**Job Service Unit Tests (`jobs.service.spec.ts`):**
- 30 tests across 3 suites:
  - `STATUS_TRANSITIONS map` — structural validation (all statuses covered, terminal states, recovery paths)
  - `updateJobStatus` — parameterised valid transitions (14 cases) + invalid transitions (8 cases) + timestamp side-effects (actualStart on ON_SITE, actualEnd+completedAt on COMPLETED) + NotFoundException
  - `create` — sequential job number generation, initial PENDING status

**Go Scheduling Service Tests (`assignment_service_test.go`):**
- 14 Go unit tests using stdlib `testing` package (no external test framework needed):
  - Perfect candidate (score = 100.0), max-distance clamping, beyond-max-distance clamping
  - Workload clamping (at capacity, over capacity), zero-rating, midpoint values (53.5 expected)
  - Weights sum to 1.0 regression, auto-assign threshold (≥90.0), below-threshold (61.0 exact)
  - Ranking order (3-tech scenario verifies A > B > C), `roundTwoDP` table tests, `parseTimes` (valid/nil/invalid)

### Key decisions
- Stripe: cards-only at launch (PaymentMethod enum includes ACH/CASH/CHECK for manual payments)
- E-signature: simple UUID token sent in email, stored as `approvalToken @unique` — customer clicks link, PATCH endpoint, no third-party
- PDF: puppeteer-core + @sparticuz/chromium (serverless-optimised binary, works in Lambda/Docker without system Chrome)
- Webhook raw body: `express.raw()` middleware applied before JSON parser specifically on `/webhooks/stripe`

---

## Session 4 — March 2026 (Week 4: Go Scheduling Service)

**Status: ✅ Scheduling service fully built — ready for `go mod tidy` + migration + `go run ./cmd/server`**

### What was built — scheduling-service (Go 1.22, port 3003)

**Technology choices:**
- `gin v1.9` — minimal, fast HTTP router (idiomatic Go, no annotation magic)
- `pgx/v5` — native PostgreSQL driver (better than database/sql for PostGIS JSONB/arrays)
- `go-redis/v9` — Redis pub/sub for WebSocket fan-out across pods
- `gorilla/websocket v1.5` — native WS (NOT Socket.IO — simpler, no JS runtime dependency)
- `lestrrat-go/jwx/v2` — Auth0 RS256 JWT + JWKS auto-cache (15-min refresh)
- Multi-stage Dockerfile: `go:1.22-alpine` → `alpine:3.19`, static binary, non-root user

**`migrations/001_scheduling_schema.sql`:**
- `scheduling.technicians` — GPS location (PostGIS geometry Point 4326), skills TEXT[], rating, max_daily_jobs
- `scheduling.technician_shifts` — per-day availability windows with UNIQUE(technician_id, shift_date)
- `scheduling.service_zones` — geographic boundary polygons for company service areas
- `scheduling.technician_zones` — junction table (technician ↔ zone M:M)
- `scheduling.dispatch_assignments` — core scheduling record with status ENUM, score, distance_km, timestamps (en_route_at, on_site_at, completed_at)
- `scheduling.gps_tracking` — high-frequency time-series GPS with PostGIS Point, speed, heading, battery

**`internal/config/config.go`:**
- Reads env vars at startup; `requireEnv()` causes fatal exit if missing
- Stores `AutoAssignThreshold` (90.0), `MaxDistanceKm` (50.0), `MaxActiveJobs` (5) for scoring

**`internal/database/postgres.go` + `redis.go`:**
- pgx pool (25 max, 3 min, 30min lifetime, 1min health check)
- Redis pool (10 connections, 2 idle min)
- Channel naming: `gps:<companyId>` and `assignment:<companyId>` (multi-tenant isolation)

**`internal/models/models.go`:**
- `Technician`, `TechnicianShift`, `DispatchAssignment`, `GPSTrackingPoint`
- Full request/response DTOs: `CreateTechnicianRequest`, `AssignJobRequest`, `ManualAssignRequest`, `ScoredTechnician`, `AssignResponse`, `GPSUpdateRequest`
- WebSocket envelope: `WSMessage { Type, CompanyID, Payload }` — frontend switches on `type`

**`internal/ws/hub.go` — WebSocket hub:**
- `clients map[companyID][]*Client` — company-scoped rooms
- `StartRedisSubscriber(ctx)` — pattern subscribes to `gps:*` + `assignment:*` via PSubscribe
- `BroadcastMessage()` — encodes to JSON, publishes to Redis (all pods fan out)
- `ServeWS()` — upgrades HTTP, registers client, spawns read+write pump goroutines
- Ping/pong every 54s; dead connections auto-closed; send buffer 256 frames

**`internal/middleware/auth.go`:**
- `JWTMiddleware(domain, audience)` — builds JWKS cache at startup (pre-warms)
- Validates RS256 token: issuer, audience, expiry
- Extracts `company_id` + `role` custom claims (injected by Auth0 Actions)
- Guards: `company_id` must be present; `RequireRole(...)` middleware for role checks

**`internal/repository/technician_repo.go`:**
- `FindCandidatesNearby()` — `ST_DWithin` radius pre-filter + `ST_Distance` exact km
- `CountActiveJobsForTechnicians()` — single query for all candidates at once (ASSIGNED + EN_ROUTE + ON_SITE)
- `UpdateLocation()` — `ST_SetSRID(ST_MakePoint(lng, lat), 4326)` + `last_seen_at`
- Skill filter done in Go (avoids complex array-overlap SQL that interferes with spatial index)

**`internal/repository/assignment_repo.go`:**
- Status transitions with per-status timestamp fields (en_route_at, on_site_at, completed_at)
- `InsertGPSPoint()` — PostGIS point insert, called async in goroutine (non-blocking main path)
- `FindByTechnician()` with optional `[]AssignmentStatus` filter

**`internal/service/assignment_service.go` — Phase 1 scoring:**
```
distanceScore = max(0, 100 - (distanceKm / 50.0 × 100))   // weight 40%
workloadScore = max(0, 100 - (activeJobs / 5.0 × 100))     // weight 35%
ratingScore   = (rating / 5.0) × 100                        // weight 25%
totalScore    = distanceScore×0.40 + workloadScore×0.35 + ratingScore×0.25
```
- If `totalScore >= 90.0` → auto-assign, broadcast WSTypeAssigned, return `{autoAssigned: true}`
- Otherwise → return top-3 `ScoredTechnician[]` for dispatcher `{autoAssigned: false}`
- `ManualAssign()` — dispatcher explicit pick, still computes score for record-keeping
- `UpdateAssignmentStatus()` — transitions + broadcasts `WSTypeStatusChanged`

**Handlers:**
- `GET /health` + `GET /health/ready` — liveness + readiness (DB + Redis ping)
- `GET/POST/PATCH /technicians` + `GET /technicians/me` — profile CRUD
- `POST /dispatch/assign` — smart Phase 1 scoring
- `POST /dispatch/assign/manual` — dispatcher override
- `GET /dispatch/assignments/:id` + `/job/:jobId` + `/technician/:techId`
- `PATCH /dispatch/assignments/:id/status` — with role-based transition guard
- `POST /gps` — GPS ingest: persist + update location + broadcast
- `GET /ws` — WebSocket upgrade (DISPATCHER/OFFICE_MANAGER/COMPANY_ADMIN only)

**nginx.conf updated:**
- Removed `/socket.io/` proxy (we don't use Socket.IO)
- Added `/ws` proxy with `proxy_http_version 1.1`, `Upgrade` + `Connection: upgrade` headers, 1-hour read/send timeout

### Your actions needed
1. `cd apps/scheduling-service && go mod tidy` (requires Go 1.22)
2. Run migration: `psql $DATABASE_URL -f migrations/001_scheduling_schema.sql`
3. `go run ./cmd/server` — starts on port 3003
4. `git add . && git commit -m "feat: Week 4 — Go Scheduling Service + Phase 1 AI assignment"`

### What's next (Week 5)
- Finance Service: NestJS + Prisma, quotes/invoices, Stripe integration, Puppeteer PDF generation

---

## Session 3 — Feb 2026 (Week 2/3: Job Management Service)

**Status: ✅ Job service fully built — ready for `prisma:generate && prisma:migrate && prisma:seed`**

### What was built — job-service (port 3002)

**Prisma schema (`prisma/schema.prisma` — `jobs` schema):**
- `JobType` — trade types (HVAC/Plumbing/Electrical + any new ones via admin, no code needed)
- `JobTemplate` — templates per trade (e.g. "Annual AC Tune-Up", "Water Heater Replacement")
- `JobTemplateTask` — ordered checklist tasks per template (with safety notes, photo requirements)
- `JobCustomFieldDef` — dynamic field definitions per trade type (TEXT/NUMBER/SELECT/BOOLEAN/DATE)
- `JobCustomFieldValue` — JSONB values per job, linked to definitions
- `Job` — core entity with full address, GPS coordinates, scheduling, finance refs, status, history
- `JobStatusHistory` — full audit trail of every status transition with actor + timestamp
- `JobPhoto` — before/after/general photos (S3 keys), typed by PhotoType enum
- `PriceBookItem` — parts, labour, materials, equipment rental (company-specific pricing)
- `WorkOrder` — per-technician per-visit document with check-in/out timestamps
- `WorkOrderTaskCompletion` — tracks each template task tick-off, photo capture, notes
- `WorkOrderLineItem` — parts and labour used on-site (feeds directly into invoice)

**Seed (`prisma/seed.ts`) — real trade data:**
- 3 job types: HVAC (blue), Plumbing (cyan), Electrical (amber) with icons
- 5 templates with full task lists: Annual AC Tune-Up (11 tasks), AC Install (11), Leak Repair (8), WH Replacement (11), Electrical Panel Upgrade (12), Outlet Install (5)
- 13 HVAC custom fields (refrigerant type, tonnage, SEER, pressures, temps, equipment details)
- 9 Plumbing custom fields (pipe material, diameter, pressure, fuel type, permit)
- 9 Electrical custom fields (amperage, voltage, circuits, gauge, GFCI/AFCI, permit)
- 17 price book items (labour rates × 3, HVAC parts, plumbing parts, electrical parts)

**TradeTemplatesModule — 4 controllers:**
- `GET/POST/PUT /trade/job-types` — manage trade types (admin only)
- `GET/POST/PUT /trade/job-types/:id/templates` — templates per type
- `POST/PUT/DELETE/PATCH /trade/templates/:id/tasks` — individual tasks + reorder
- `GET/POST/PUT /trade/job-types/:id/custom-fields` — dynamic field definitions

**PriceBookModule:**
- `GET /price-book` — paginated, searchable, filterable by category
- `GET/POST/PUT/DELETE /price-book/:id` — CRUD with soft-delete

**JobsModule — state machine enforced:**
- `GET /jobs` — paginated list with filters (status, technician, date range, search, job type)
- `GET /jobs/stats` — dashboard counts by status + today's schedule count
- `GET /jobs/:id` — full detail with work orders, custom fields, template tasks, history, photos
- `POST /jobs` — create with optional template + custom field values in one request
- `PUT /jobs/:id` — update non-status fields
- `PATCH /jobs/:id/status` — state machine transition (validates allowed transitions, rejects invalid)
- `PATCH /jobs/:id/custom-fields` — update trade-specific custom values on existing job

**Job State Machine transitions:**
```
PENDING → SCHEDULED | CANCELLED
SCHEDULED → EN_ROUTE | ON_HOLD | CANCELLED
EN_ROUTE → ON_SITE | SCHEDULED (back if wrong address etc.)
ON_SITE → COMPLETED | ON_HOLD
COMPLETED → INVOICED
INVOICED → PAID
ON_HOLD → SCHEDULED | CANCELLED
CANCELLED → PENDING (reopen)
```

**WorkOrdersModule — technician-facing:**
- `POST /work-orders` — create from job (auto-populates template checklist)
- `GET /work-orders/by-job/:jobId` — all work orders for a job
- `GET /work-orders/:id` — single with tasks + line items
- `GET /work-orders/invoice-summary/:jobId` — aggregated subtotal + taxable for finance-service
- `PATCH /work-orders/:id/check-in` — technician arrives on site
- `PATCH /work-orders/:id/check-out` — technician marks complete
- `PATCH /work-orders/:id/tasks/:taskId` — tick off / un-tick checklist task + photo URL + notes
- `POST/DELETE /work-orders/:id/line-items` — add/remove parts or labour

### What's next (Week 4)
- YOU: Run `cd apps/job-service && pnpm prisma:generate && pnpm prisma:migrate && pnpm prisma:seed`
- YOU: `git add . && git commit -m "feat: Week 2/3 — Job Management Service complete"`
- NEXT SESSION: Go Scheduling Service (GPS, dispatch board, route optimization, AI assignment)

---

## Session 2 — Feb 2026 (Week 1: Foundation)

**Status: ✅ Foundation complete — ready for first `pnpm install`**

### What was built

**Monorepo scaffold (Turborepo + pnpm workspaces):**
- `package.json` — root monorepo config, Node 20 / pnpm 9 enforced
- `pnpm-workspace.yaml` — points to `apps/*` and `packages/*`
- `turbo.json` — build/dev/lint/test/type-check tasks defined
- `tsconfig.base.json` — strict TS 5.4 config inherited by all packages
- `.gitignore` — covers node_modules, dist, .env, .docker-data, *.docx
- `.env.example` — full template with all service env vars documented
- `README.md` — quick start guide

**Docker Compose (infrastructure only):**
- PostgreSQL 16 + PostGIS (port 5432, healthcheck)
- Redis 7 (port 6379, AOF persistence, healthcheck)
- MongoDB 7 (port 27017, for comms-service)
- MinIO S3-compatible storage (port 9000/9001)
- Nginx API gateway (port 80, routes by /api/<service>/ prefix)

**Infrastructure configs:**
- `infrastructure/nginx/nginx.conf` — 6 upstreams to host.docker.internal, WebSocket support for Socket.IO
- `infrastructure/postgres/init.sql` — creates PostGIS, pg_trgm extensions + 5 schemas (crm, jobs, scheduling, finance, analytics) + grants

**Shared packages:**
- `packages/types` — Role enum, JwtPayload, AuthUser, JobStatus, TradeType, InvoiceStatus, QuoteStatus, BullMQ payload types, pagination helpers
- `packages/auth-client` — JwtStrategy (Auth0 RS256 JWKS), JwtAuthGuard, RolesGuard, @Roles() decorator, @CurrentUser() decorator, AuthModule (NestJS importable)
- `packages/queue` — QueueName enum (9 queues), createRedisConnection(), createQueue() factory, BullMQ re-exports

**CRM Service (apps/crm-service) — FULL SCAFFOLD:**
- `prisma/schema.prisma` — Company, Customer (RESIDENTIAL/COMMERCIAL), Contact, Lead (full pipeline), ServiceAgreement, Booking, Review
- `prisma/seed.ts` — demo company + demo customer
- `src/main.ts` — NestJS bootstrap, global ValidationPipe, CORS, Swagger on /docs
- `src/app.module.ts` — wires ConfigModule, AuthModule, PrismaModule, HealthModule, CustomersModule, ContactsModule, LeadsModule, BookingsModule
- `src/prisma/` — PrismaService (connect/disconnect lifecycle) + PrismaModule (global)
- `src/health/` — HealthController using @nestjs/terminus (Prisma ping)
- `src/customers/` — full CRUD: CreateCustomerDto, UpdateCustomerDto, CustomersService (paginated search, stats, soft-delete), CustomersController (role-gated)
- `src/contacts/` — list/create/delete contacts per customer
- `src/leads/` — list, create, update status, pipeline summary
- `src/bookings/` — list, create, confirm, convert-to-job

**Service stubs (apps/<service>) — minimal boot + /health:**
- `job-service` (port 3002) — TODO Week 3
- `scheduling-service` (port 3003) — Go, README only, TODO Week 4
- `finance-service` (port 3004) — TODO Week 5
- `comms-service` (port 3005) — TODO Week 6
- `analytics-service` (port 3006) — TODO Week 7

### Decisions confirmed this session
- **Auth provider:** Auth0 (not Keycloak) — RS256, JWKS endpoint
- **Dev OS:** macOS — `host.docker.internal` used in Nginx config
- **Production host:** Decide later (Docker Swarm vs AWS ECS Fargate)

### What's next (Week 1 completion)
1. ✅ **YOU (Ravishan):** `git init && git add . && git commit -m "feat: Week 1 foundation"` — tell me when done
2. **YOU:** Set up Auth0 (see AUTH0_SETUP.md)
3. **YOU:** Run `pnpm install && docker compose up -d`
4. **YOU:** `cd apps/crm-service && pnpm prisma:generate && pnpm prisma:migrate`
5. Then we build **Job Management Service** (Week 2/3)

---

## Session 1 — Feb 2026 (Architecture & Planning)

**Status: ✅ Architecture complete, all decisions documented**

- PDF-to-architecture conversation: 14 → 8 → 6 services final
- All 67 features mapped to 6 services
- Database strategy: single PG + separate schemas
- Trade template system designed (DB-driven, no code changes for new trades)
- AI scheduling: Phase 1 rule-based Go, Phase 2 ML post-launch
- Frontend: React 18 Admin + Next.js 14 Customer Portal + React Native Technician App
- Removed customer mobile app (saves 2-3 weeks)
- Auth: Auth0 (RS256), 6 RBAC roles, multi-tenant via company_id
- API Gateway: Nginx dev, Kong prod
- Documents created: Architecture Final.docx, Quick Reference.docx, PROJECT_STATUS.md
