# Trade & Service CRM — Project Decision Log

> **Purpose:** Quick context-restoration file. Read this at the start of any new development session.
> **Last Updated:** March 2026 | **Status:** 🚧 Week 5 Done — Finance Service complete, awaiting `npm install` + `prisma generate` + `prisma migrate dev`

---

## What We're Building

SaaS Field Service Management (FSM) platform for trade businesses (HVAC, Plumbing, Electrical).
Acts as a middleman managing jobs between service companies and their customers.
Inspired by HousecallPro / ServiceTitan. Targeting small-to-mid trade companies.

---

## Confirmed Architecture: 6 Microservices

| # | Service | Tech | Port | Domain |
|---|---------|------|------|--------|
| 1 | CRM & Customer | NestJS + TypeScript + PostgreSQL | 3001 | Customers, leads, agreements, reviews, booking |
| 2 | Job Management | NestJS + TypeScript + PostgreSQL | 3002 | Jobs, work orders, trade templates, price book |
| 3 | Scheduling & Dispatch | **Go (Gin)** + PostGIS + Redis | 3003 | GPS, dispatch board, route opt, AI assignment |
| 4 | Finance | NestJS + Stripe + Puppeteer | 3004 | Quotes, invoices, payments, contracts, PDFs |
| 5 | Communication | NestJS + BullMQ + MongoDB | 3005 | SMS, email, push, automation, 2-way messaging |
| 6 | Analytics | NestJS + PG read replica | 3006 | Dashboards, reports, exports |

---

## All Confirmed Decisions

### Infrastructure
- **Monorepo:** Turborepo + pnpm workspaces
- **Async Events:** BullMQ (Redis-backed) — NOT Kafka at launch
- **Real-time:** gorilla/websocket (Go scheduling service) + Redis pub/sub fan-out; NestJS services use BullMQ events
- **WebSocket URL:** ws://localhost/ws (or ws://localhost:3003/ws directly)
- **Deployment DEV:** Docker Compose
- **Deployment PROD:** Docker Swarm OR AWS ECS Fargate — NOT Kubernetes at launch
- **Monitoring:** Better Stack (logs + uptime) + Sentry (error tracking)
- **CI/CD:** GitHub Actions → container registry → deploy

### Database (CONFIRMED)
- **Primary DB:** Single PostgreSQL 16 instance with PostGIS
- **Isolation:** Separate SCHEMAS per service (NOT separate databases)
  - `crm` schema → CRM & Customer Service
  - `jobs` schema → Job Management Service
  - `scheduling` schema → Scheduling & Dispatch Service
  - `finance` schema → Finance Service
  - `analytics` schema → Analytics Service (uses read replica + materialized views)
- **Communication DB:** MongoDB 7 — message threads, delivery logs (document model fits best)
- **Cache / Queues / Real-time:** Redis 7 — shared by all services
- **Object Storage:** AWS S3 / MinIO (local dev) — photos, PDFs, documents
- **Rationale for single PG instance:** Simpler ops, one backup, cross-schema joins for analytics, split later if needed

### Authentication & Security
- **Auth Provider:** Auth0 OR Keycloak — OAuth2 + JWT
- **Token expiry:** Access token: 60 min · Refresh token: 30 days
- **RBAC — 6 roles:** Super Admin · Company Admin · Office Manager · Dispatcher · Technician · Customer
- **Multi-tenancy:** `company_id` on ALL database tables, injected by NestJS middleware from JWT

### API Gateway (CONFIRMED)
- **Development:** Nginx reverse proxy (simple, no overhead)
- **Production:** Kong Gateway (Docker-based)
  - Kong JWT plugin — token validation at gateway (not per service)
  - Kong rate-limiting plugin
  - Kong CORS plugin
  - Kong request-transformer — injects `X-Company-ID` header
- **Alternative prod:** AWS ALB with path-based routing to ECS target groups

### Frontend (CONFIRMED — NO customer mobile app)
| App | Tech | Users |
|-----|------|-------|
| Admin Dashboard | React 18 + Vite + TanStack Query + Tailwind + shadcn/ui | Office, managers, dispatchers |
| Customer Portal + Booking | Next.js 14 App Router SSR + Tailwind | Customers (web only, mobile-responsive) |
| Technician App | React Native + Expo SDK 51 | Field technicians (iOS + Android) |

> **DECISION: NO customer mobile app.** Customers use the Next.js web portal (mobile-responsive). This saves 2-3 weeks of build time with no meaningful UX loss — most customers interact via a link from SMS/email.

### Trade Job Template System (CONFIRMED)
Database-driven, extensible — adding new trades requires NO code changes, only admin UI entry.

**DB tables:**
- `job_types` — trade types (HVAC, Plumbing, Electrical, + more)
- `job_templates` — per-trade task checklists and form definitions
- `job_template_tasks` — ordered task steps per template (can be marked complete in mobile app)
- `job_custom_field_definitions` — dynamic fields per trade (field_type: text/number/select/boolean/date)
- `job_custom_field_values` — stored as JSONB on each job record

**HVAC fields:** refrigerant_type, system_brand, filter_size, serial_number, tonnage, seer_rating
**Plumbing fields:** pipe_material, fixture_brand, water_pressure_psi, leak_location
**Electrical fields:** panel_brand, amperage, breaker_type, permit_required, wire_gauge

### AI Scheduling (CONFIRMED — Phased)
- **Phase 1 (at launch):** Rule-based smart assignment
  - Filter by: skill match (job_type), service area (PostGIS), no schedule conflicts
  - Score by: distance to customer (PostGIS nearest), current workload, historical job rating
  - Output: top 3 suggestions shown to dispatcher OR auto-assign if score ≥ 90%
- **Phase 2 (post-launch):** Machine learning + external APIs
  - OpenAI/Claude API for natural language scheduling commands
  - Google OR-Tools or OSRM for true multi-stop route optimization
  - Job duration prediction from historical data (regression model)
  - Demand forecasting for staffing recommendations

---

## Confirmed Features (All 67 from PRD mapped)

### CRM & Customer (Service 1)
- [x] Customer profiles + full contact history
- [x] Multiple contacts per customer account
- [x] Lead pipeline with conversion tracking
- [x] Service agreements + maintenance contracts (e-sign)
- [x] Review collection + reputation management
- [x] Online booking portal (embedded or standalone)

### Job Management (Service 2)
- [x] Job lifecycle state machine
- [x] Work order management + technician assignment
- [x] Trade templates: HVAC / Plumbing / Electrical (extensible)
- [x] Dynamic custom fields per trade type
- [x] Price book (parts, labour rates, packages, markups)
- [x] Job cost tracking (materials, labour, overhead)
- [x] Photo + document capture per job
- [x] Equipment tracking + warranty management

### Scheduling & Dispatch (Service 3)
- [x] Technician availability + shift management
- [x] Drag-and-drop dispatch board (real-time via Socket.IO)
- [x] GPS live tracking (broadcast to admin + customer)
- [x] Route optimisation (PostGIS Phase 1, OR-Tools Phase 2)
- [x] Service area management (geographic zones)
- [x] AI smart auto-assignment (Phase 1 rule-based, Phase 2 ML)

### Finance (Service 4)
- [x] Quote/proposal generation with line items + discounts
- [x] E-signature on quotes and contracts
- [x] Invoice creation (one-off + auto from completed job)
- [x] Recurring invoices (maintenance contracts)
- [x] Stripe payments: cards, ACH bank transfer, financing
- [x] Automated payment reminders + late fees
- [x] Expense tracking
- [x] Profit/loss per job and per technician
- [x] PDF generation for quotes, invoices, contracts (Puppeteer + Handlebars)

### Communication (Service 5)
- [x] SMS + WhatsApp (Twilio)
- [x] Email (SendGrid)
- [x] Push notifications (FCM/APNs via Expo Push Service)
- [x] Automated appointment reminders
- [x] Job status update notifications
- [x] Two-way customer messaging with threads
- [x] Notification template management
- [x] Review request automation (triggered post-payment)
- [x] Follow-up campaign management

### Analytics (Service 6)
- [x] Revenue dashboards (daily/weekly/monthly/yearly)
- [x] Technician performance metrics
- [x] Job type and trade analytics
- [x] Customer LTV, acquisition, retention
- [x] Seasonal demand patterns
- [x] Custom report builder + CSV/PDF export

---

## 8-Week Build Plan

| Week | Focus | Key Output |
|------|-------|-----------|
| 1 | Foundation | Turborepo, Docker Compose, Auth, Nginx, CI/CD pipeline |
| 2 | CRM & Customer | Customer CRUD, lead pipeline, booking API, admin screens |
| 3 | Job Management | Job state machine, trade templates, price book, mobile job screens |
| 4 | Scheduling | Go service, dispatch board, GPS, PostGIS route opt, Phase 1 AI assign |
| 5 | Finance | Quotes, invoices, Stripe integration, PDF gen, recurring billing |
| 6 | Communication | BullMQ processors, SMS/email/push delivery, automation workflows |
| 7 | Analytics + Mobile | Dashboards, reports, technician app polish, push notifications |
| 8 | Integration & Launch | E2E + load testing, security audit, prod deploy, monitoring, launch |

---

## Reference Documents

| File | Purpose |
|------|---------|
| `Trade_Service_CRM_Architecture_Final.docx` | Full architecture reference with all technical details |
| `Architecture_Quick_Reference_Final.docx` | Visual quick reference — architecture diagram + decisions |
| `PROJECT_STATUS.md` | **This file** — decision log for context restoration |

---

## Development Progress

### Week 1 — Foundation ✅ DONE
- [x] Monorepo: Turborepo + pnpm workspaces, root configs
- [x] Docker Compose: PostgreSQL+PostGIS, Redis, MongoDB, MinIO, Nginx
- [x] Infrastructure: nginx.conf (6 service routes), init.sql (5 schemas + PostGIS)
- [x] Shared package: @tscrm/types (all enums + interfaces)
- [x] Shared package: @tscrm/auth-client (Auth0 JWT strategy, guards, decorators)
- [x] Shared package: @tscrm/queue (BullMQ factory, 9 queue names)
- [x] CRM Service (port 3001): Prisma schema + customers, contacts, leads, bookings modules
- [x] 4 service stubs: job, finance, comms, analytics
- [x] Git committed, Docker running, pnpm installed

### Week 2/3 — Job Management ✅ DONE
- [x] Prisma schema: JobType, JobTemplate, JobTemplateTask, JobCustomFieldDef/Value, Job, WorkOrder, WorkOrderTaskCompletion, WorkOrderLineItem, PriceBookItem, JobStatusHistory, JobPhoto
- [x] Seed: 3 trades, 5 templates with full task lists, 31 custom field defs, 17 price book items
- [x] TradeTemplatesModule: job type CRUD, template CRUD + task management, custom field CRUD
- [x] PriceBookModule: paginated search, category filter, CRUD
- [x] JobsModule: full CRUD + state machine (validates transitions) + custom field update endpoint
- [x] WorkOrdersModule: create from job template, check-in/out, task tick-off, line items
- [ ] YOU: `cd apps/job-service && pnpm prisma:generate && pnpm prisma:migrate && pnpm prisma:seed`
- [ ] YOU: `git add . && git commit -m "feat: Week 2/3 — Job Management Service complete"`

### Week 4 — Scheduling & Dispatch ✅ DONE
- [x] SQL migration: scheduling schema (technicians, shifts, service_zones, dispatch_assignments, gps_tracking) + PostGIS
- [x] go.mod with all dependencies (gin, pgx/v5, go-redis/v9, gorilla/websocket, lestrrat-go/jwx/v2)
- [x] config/config.go — env var loading with required/optional helpers
- [x] database/postgres.go — pgx/v5 connection pool (25 max conns)
- [x] database/redis.go — go-redis/v9 client + channel naming helpers (gps:<companyId>, assignment:<companyId>)
- [x] models/models.go — all domain structs + request/response DTOs + WS message envelope
- [x] ws/hub.go — gorilla/websocket hub: company-scoped broadcast, Redis pub/sub fan-out, ping/pong, write+read pumps
- [x] middleware/auth.go — Auth0 JWT validation (lestrrat-go/jwx JWKS auto-cache, RS256, company_id guard)
- [x] repository/technician_repo.go — PostGIS ST_Distance/ST_DWithin queries, GPS update, skill filter
- [x] repository/assignment_repo.go — assignment CRUD, status transitions with timestamp fields, GPS time-series insert
- [x] service/assignment_service.go — Phase 1 scoring (distance×40% + workload×35% + rating×25%), auto-assign ≥90
- [x] handler/health_handler.go — /health + /health/ready (DB + Redis check)
- [x] handler/technician_handler.go — technician CRUD, /me endpoint
- [x] handler/dispatch_handler.go — smart assign, manual assign, assignment queries, status update
- [x] handler/gps_handler.go — GPS ingestion: persist + update current_location + broadcast to WS hub
- [x] handler/websocket_handler.go — WS upgrade with role guard (DISPATCHER, OFFICE_MANAGER, COMPANY_ADMIN)
- [x] cmd/server/main.go — Gin router with graceful shutdown, dependency wiring
- [x] Dockerfile — multi-stage build (go:1.22-alpine → alpine:3.19), non-root user, static binary
- [x] nginx.conf updated: /socket.io/ → /ws (native WebSocket, not Socket.IO)
- [ ] YOU: `cd apps/scheduling-service && go mod tidy` (requires Go 1.22 installed)
- [ ] YOU: Run migration: `psql $DATABASE_URL -f migrations/001_scheduling_schema.sql`
- [ ] YOU: `go run ./cmd/server` to start on port 3003
- [ ] YOU: `git add . && git commit -m "feat: Week 4 — Go Scheduling Service + Phase 1 AI assignment"`

### Week 5 — Finance Service ✅ DONE
- [x] Prisma schema: Quote, QuoteLineItem, Invoice, InvoiceLineItem, Payment, RecurringSchedule, Expense (all Decimal money fields)
- [x] Stripe integration: payment intents, payment links, webhook (`payment_intent.succeeded` / `payment_intent.payment_failed`)
- [x] PDF generation: PdfService (Puppeteer-core + @sparticuz/chromium + Handlebars) — quote.hbs + invoice.hbs templates
- [x] Quote approval flow: token-based e-signature (UUID token, public `/approve/:token` endpoint)
- [x] Quote → Invoice conversion (ACCEPTED quotes only)
- [x] State machines: QuotesService (6 statuses) + InvoicesService (6 statuses) with BadRequestException guards
- [x] Manual payment recording (CASH, CHECK, ACH) with partial/full detection
- [x] Batch `markOverdueInvoices()` method for cron job
- [x] Expenses CRUD with job-level cost aggregation
- [x] Revenue metrics endpoint (totalRevenue, outstandingBalance, byMethod breakdown)
- [x] Seed: 2 quotes, 2 invoices (paid + overdue), 1 recurring schedule
- [x] **Unit tests:** 34 tests across QuotesService, InvoicesService, PaymentsService
- [x] **E2E tests:** 18 integration tests with mocked Prisma + Stripe
- [x] **Job Service state machine tests:** 30 tests (valid/invalid transitions matrix, timestamp side-effects)
- [x] **Go scoring algorithm tests:** 14 go test cases (formula correctness, edge cases, ranking order, roundTwoDP)
- [ ] YOU: `cd apps/finance-service && pnpm install` (adds stripe, puppeteer-core, @sparticuz/chromium, handlebars)
- [ ] YOU: `npx prisma generate && npx prisma migrate dev --name finance-service-init`
- [ ] YOU: `npx prisma db seed`
- [ ] YOU (Go tests): `cd apps/scheduling-service && go test ./internal/service/...`
- [ ] YOU (Job Service tests): `cd apps/job-service && pnpm test`
- [ ] YOU: `git add . && git commit -m "feat: Week 5 — Finance Service complete + cross-service testing"`

### Week 6 — Communication Service (NEXT)
- [ ] BullMQ processors for SMS (Twilio), email (SendGrid), push (FCM/APNs)
- [ ] Automated appointment reminders (job status → comms trigger)
- [ ] Two-way customer messaging with MongoDB thread store
- [ ] Notification template management
- [ ] Review request automation (triggered post-payment)

### Weeks 7-8 — Pending
- [ ] Week 7: Analytics service + admin dashboard UI + customer portal UI
- [ ] Week 8: Technician React Native app, integration testing, prod deploy

---

## Open Items (Decisions Pending)

- [x] ~~Auth provider~~ → **Auth0** (confirmed)
- [x] ~~Dev OS~~ → **macOS** (confirmed, host.docker.internal in nginx.conf)
- [ ] Production deployment: **Docker Swarm** vs **AWS ECS Fargate**?
- [ ] AI API for Phase 2 scheduling: **OpenAI GPT-4o** vs **Claude API**?
- [ ] Confirm Stripe payment methods required for target market (ACH? financing?)
- [ ] Domain name + SSL provisioning
- [ ] Seed data for HVAC/Plumbing/Electrical task templates — who writes the initial checklists?
- [ ] Phase 2 AI scheduling timeline — target post-launch sprint?
