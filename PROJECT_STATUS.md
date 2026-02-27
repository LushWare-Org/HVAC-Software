# Trade & Service CRM — Project Decision Log

> **Purpose:** Quick context-restoration file. Read this at the start of any new development session.
> **Last Updated:** Feb 2026 | **Status:** 🚧 Week 1 Foundation Built — Awaiting `pnpm install` + Auth0 Setup

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
- **Real-time:** Socket.IO + Redis Adapter
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

### Week 1 — Foundation ✅ BUILT (awaiting pnpm install)
- [x] Monorepo: Turborepo + pnpm workspaces, root configs
- [x] Docker Compose: PostgreSQL+PostGIS, Redis, MongoDB, MinIO, Nginx
- [x] Infrastructure: nginx.conf (6 service routes), init.sql (5 schemas + PostGIS)
- [x] Shared package: @tscrm/types (all enums + interfaces)
- [x] Shared package: @tscrm/auth-client (Auth0 JWT strategy, guards, decorators)
- [x] Shared package: @tscrm/queue (BullMQ factory, 9 queue names)
- [x] CRM Service (port 3001): full scaffold — Prisma schema, all 4 modules (customers, contacts, leads, bookings)
- [x] 4 service stubs: job, finance, comms, analytics (boot + /health each)
- [x] Scheduling service: README placeholder (Go — Week 4)
- [ ] YOU: `git init && git add . && git commit -m "feat: Week 1 foundation"`
- [ ] YOU: Auth0 account setup (see AUTH0_SETUP.md)
- [ ] YOU: `pnpm install && docker compose up -d`
- [ ] YOU: `cd apps/crm-service && pnpm prisma:generate && pnpm prisma:migrate`

### Week 2/3 — Job Management (NEXT)
- [ ] Job Management Service: full Prisma schema (jobs, work_orders, job_types, job_templates, price_book)
- [ ] Trade template system: HVAC/Plumbing/Electrical seed data
- [ ] Custom field system: dynamic fields per trade type
- [ ] Price book: parts, labour rates, packages
- [ ] Job state machine: pending → scheduled → en_route → on_site → completed → invoiced → paid

### Weeks 4-8 — Pending
- [ ] Week 4: Go scheduling service (GPS, dispatch board, AI assignment)
- [ ] Week 5: Finance service (quotes, invoices, Stripe, PDFs)
- [ ] Week 6: Comms service (BullMQ processors, SMS/email/push)
- [ ] Week 7: Analytics + React Native technician app
- [ ] Week 8: Integration testing, security audit, production deploy

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
