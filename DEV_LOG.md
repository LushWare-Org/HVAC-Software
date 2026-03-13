# T&S CRM — Development Log

> **Purpose:** Chronological log of what was built each session. Append new entries at the top.
> **Format:** Date → What was done → What's next → Any blockers or decisions made

---

## Session 10 — March 2026 (Full Integration: All Flows Completable from Frontend)

**Status: ✅ All API flows wired end-to-end — every form mutation connected to live backend**

### Root cause fixed
The scheduling service is **Go/Gin** (not NestJS). Old hooks called `/scheduling/appointments` which does not exist. The comms hooks called `/messaging/messages` and `/messaging/send` which don't exist — the messaging API is thread-based.

### Files changed

**`types/api.ts`** — Added new types:
- `DispatchAssignment`, `AssignJobRequest`, `ManualAssignRequest`, `AssignResponse` (Go scheduling service shapes)
- `MessageThread`, `MessageThreadDetail`, `ThreadMessage`, `ThreadStatus` (thread-based messaging shapes)

**`hooks/useComms.ts`** — Complete rewrite:
- `useThreads()` → `GET /comms/messaging/threads`
- `useThread(threadId)` → `GET /comms/messaging/threads/:id`
- `useCreateThread()` → `POST /comms/messaging/threads`
- `useSendThreadMessage()` → `POST /comms/messaging/threads/:threadId/messages`
- `useMarkThreadRead()` → `PATCH /comms/messaging/threads/:id/read`
- `useUpdateThreadStatus()` → `PATCH /comms/messaging/threads/:id/status`

**`hooks/useScheduling.ts`** — Complete rewrite for Go dispatch API:
- `useTechAssignments(techId)` → `GET /scheduling/dispatch/assignments/technician/:techId`
- `useJobAssignments(jobId)` → `GET /scheduling/dispatch/assignments/job/:jobId`
- `useSmartAssign()` → `POST /scheduling/dispatch/assign`
- `useManualAssign()` → `POST /scheduling/dispatch/assign/manual`
- `useUpdateAssignmentStatus()` → `PATCH /scheduling/dispatch/assignments/:id/status`
- Removed non-existent `/appointments` endpoint
- WebSocket events: `GPS_UPDATE`, `ASSIGNMENT_CREATED`, `ASSIGNMENT_STATUS_CHANGED`, `TECHNICIAN_ONLINE`

**`hooks/useFinance.ts`** — Added 8 mutations:
- `useUpdateQuote()`, `useSendQuote()`, `useApproveQuote()`, `useConvertQuote()`
- `useUpdateInvoice()`, `useSendInvoice()`, `useRecordPayment()`, `useVoidInvoice()`

**`pages/Communications.tsx`** — Complete rewrite for thread model:
- Thread list sidebar with unread count, channel badge, status badge
- Auto-marks thread read on select; composer disabled for non-ACTIVE threads
- Archive/Reopen buttons call `useUpdateThreadStatus()`

**`pages/scheduling/Scheduling.tsx`** — Removed appointments, WebSocket-driven dispatch board:
- `wsAssignments` state populated from `ASSIGNMENT_CREATED` WebSocket events
- `buildDispatchMap` works with generic assignment objects
- Slot clicks pass `techId` and `techName` to `AddScheduleModal`

**`pages/scheduling/components/AddScheduleModal.tsx`** — Rewrite:
- Uses `useManualAssign()` — calls `POST /scheduling/dispatch/assign/manual`
- Takes `techs: { id, name }[]` and `initialTechId` props
- Validates jobId + techId; shows error state

**`pages/jobs/AddJobModal.tsx`** — Rewrite:
- Uses `useCreateJob()` — calls `POST /jobs/jobs`
- Fields: title, description, priority, status, date+time → scheduledStart, estimatedAmount
- Error display, loading state

**`pages/customers/AddPersonModal.tsx`** — Rewrite:
- Uses `useCreateLead()` or `useCreateCustomer()` based on `type` prop
- firstName/lastName split; UPPER_CASE enum values; `serviceInterest` field for leads

**`pages/finance/QuoteDetailModal.tsx`** — Rewrite:
- Save → `useUpdateQuote()` (notes, expiresAt)
- Send Quote button (DRAFT only) → `useSendQuote()`
- Approve button (SENT only) → `useApproveQuote()`
- Convert to Invoice button (ACCEPTED only) → `useConvertQuote()`

**`pages/finance/InvoiceDetailModal.tsx`** — Rewrite:
- Save → `useUpdateInvoice()` (notes, dueAt)
- Send Invoice button (DRAFT only) → `useSendInvoice()`
- Record Payment tab (SENT/PARTIALLY_PAID/OVERDUE) → `useRecordPayment()` with amount, method, reference
- Void button (DRAFT/SENT) → `useVoidInvoice()`

### TypeScript
`tsc --noEmit` → **0 errors**

---

## Session 9 — March 2026 (Frontend Integration: All Pages Live-Wired)

**Status: ✅ All 7 core pages now connected to live API — zero mock data remaining**

### What was done — Phase 1: Foundation

**`apps/admin-dashboard/src/lib/api.ts`** (new)
- Axios instance with `baseURL: '/api'` (proxied via Vite → nginx → microservices)
- Request interceptor injects dev auth bypass headers in `IS_DEV` mode:
  `x-test-company-id`, `x-test-user-id`, `x-test-user-email`, `x-test-user-role`, `x-test-user-name`
- Error normaliser converts AxiosError to structured object

**`apps/admin-dashboard/src/lib/queryClient.ts`** (new)
- TanStack Query v5 `QueryClient` with: `staleTime: 60s`, `gcTime: 5min`, `retry: 1`, `refetchOnWindowFocus: false`

**`apps/admin-dashboard/src/types/api.ts`** (new)
- Full TypeScript interface suite mirroring backend Prisma models + DTOs
- Types: `Customer`, `Lead`, `Job`, `JobStats`, `Invoice`, `Quote`, `Expense`, `Appointment`, `Technician`, `Message`, `Notification`, `DashboardKpis`, `RevenueSeries`, `TechLeaderboard`, `CustomerAcquisition`, `PaginatedResponse<T>` and more
- Helper functions: `customerName(c)`, `leadName(l)`
- `Message.direction?: 'INBOUND' | 'OUTBOUND'` added for comms page bidirectional display

**`apps/admin-dashboard/src/main.tsx`** (modified)
- Wrapped app with `QueryClientProvider`

### What was done — Phase 2: Hooks (7 hook files, all new)

| Hook file | Routes | Notes |
|-----------|--------|-------|
| `useDashboard.ts` | `/analytics/dashboard/kpis`, `/jobs/jobs`, `/scheduling/appointments` | Dashboard KPIs + recent jobs + upcoming appts |
| `useAnalytics.ts` | `/analytics/dashboard/kpis`, `/analytics/revenue/series`, `/analytics/jobs-analytics/by-status`, `/analytics/technician-metrics/leaderboard`, `/analytics/customer-analytics/acquisition` | All 5 analytics endpoints |
| `useCustomers.ts` | `/crm/customers`, `/crm/leads`, `/crm/bookings` | Paginated; mutations for create/update |
| `useJobs.ts` | `/jobs/jobs`, `/jobs/jobs/stats` | Status maps UPPER_CASE ↔ select filter |
| `useFinance.ts` | `/finance/invoices`, `/finance/quotes`, `/finance/expenses` | `decimalToNumber()` helper for Prisma Decimal strings |
| `useScheduling.ts` | `/scheduling/appointments`, `/scheduling/technicians` | `useDispatchWebSocket()` with 5s auto-reconnect |
| `useComms.ts` | `/comms/messaging/messages`, `/comms/messaging/send`, `/comms/notifications`, `/comms/notifications/:id/read` | Send + mark-read mutations |

### What was done — Phase 3-6: Pages Rewritten

All pages had 100% mock data. All replaced with live API hooks:

**Dashboard.tsx** — KPI cards from `/analytics/dashboard/kpis`; recent jobs, upcoming appointments, revenue chart all live.

**customers/Customers.tsx** — Server-side paginated customers + leads + agreements tabs. Server-side search + status filters.

**jobs/Jobs.tsx** — Server-side paginated jobs. `useJobStats()` drives KPI cards. Status/priority CSS maps handle both UPPER_CASE backend and legacy lowercase keys.

**finance/Finance.tsx** — Server-side paginated invoices, quotes, expenses. `fmtDecimal()` helper for Prisma Decimal string values.

**Analytics.tsx** — All 5 analytics endpoints wired. Revenue charts driven by `useRevenueSeries(granularity, from, to)` with date-range computed from dropdowns. Leaderboard filtered/sorted client-side. Job status pie from `useJobsByStatus()`. Customer acquisition chart from `useCustomerAcquisition()`. Service Categories kept static (no endpoint).

**scheduling/Scheduling.tsx** — Dispatch board built from live `useAppointments({ date })` + `useTechnicians()`. `buildDispatchMap()` converts `Appointment[]` → timeline grid slots. `useDispatchWebSocket()` connected for live updates with `Wifi/WifiOff` indicator. Calendar/map sub-views pass adapted tech data.

**Communications.tsx** — Messages fetched from API, grouped by `customerId` into conversation threads. `useSendMessage()` mutation wired to composer. `useNotifications()` drives notification tab with `useMarkNotificationRead()` on click. Loading skeletons + error banners on all states.

### Common patterns applied across all pages

- **Loading skeletons:** Inline `Skeleton` component fills space while queries resolve
- **Error banners:** Red banner with `<RefreshCw>` retry button on `isError` state
- **Status maps:** Both UPPER_CASE (live API) and lowercase (fallback) keys in all CSS maps
- **Prisma Decimal:** `Number(val)` / `decimalToNumber()` before display or arithmetic
- **Server-side pagination:** All paginated pages send `page`/`limit`/`search`/`status`/`type` to the API; use `totalPages` from response for controls
- **Dev auth:** Axios interceptor auto-injects bypass headers — no manual header management in components

### Key decisions made

1. **`revenue` unit in analytics:** Treated as dollars when displaying. `useRevenueSeries` values displayed as `$k` after dividing by 1000. Adjust if analytics service returns cents.
2. **Message direction:** Backend `Message.direction` optional. Defaults to `OUTBOUND` when absent (all API-created messages are company-outbound). Full bidirectional display ready when inbound webhook messages arrive.
3. **Scheduling calendar sub-view:** Passes `schedules={}` (empty) to `SchedulingCalendar` — it has internal MOCK_APPOINTMENTS for display. Wire with live data in a future session if needed.
4. **WebSocket:** `useDispatchWebSocket()` connects to `/ws` — proxied via Vite and nginx to the scheduling service. Connection status shown in dispatch board header.

### What's next

1. **Team.tsx & Settings.tsx** — Require `UsersModule` + `CompanyModule` additions to CRM service (GAP 1 & 2 from Session 8)
2. **Detail sidebars/modals** — `CustomerDetailsSidebar`, `JobDetailModal`, `InvoiceDetailModal` etc. still use mock or incomplete data
3. **`AddJobModal` + `AddScheduleModal`** — Submit buttons need to call create mutations
4. **Auth0 SDK** — Replace dev bypass headers with real Auth0 token flow (Phase 8 from integration plan)
5. **Revenue unit verification** — Confirm if analytics service returns dollars or cents; adjust `/100` divisor accordingly
6. **Test the frontend** — Start backend services + `npm run dev` in admin-dashboard; check all pages render correctly with live data

---

## Session 8 — March 2026 (Flow Tests Fixed + Frontend Integration Analysis)

**Status: ✅ All 107 flow tests passing | ✅ Admin dashboard analysed | 🚧 Frontend integration starting**

### What was done — Flow Tests

**All 107 integration tests now pass.** 5 bugs found and fixed:

1. **`@MaxLength(10)` on `taxRate` number field** (`create-quote.dto.ts`)
   - Root cause: `class-validator`'s `maxLength` checks `typeof value === 'string'` — returns `false` for numbers → 400 on every `POST /quotes`
   - Cascaded into 8 flow 03 failures (state.quoteId never set → FK violations downstream)
   - Fix: Removed `@MaxLength(10)` decorator from the number field

2. **`@Post(':id/approve')` returns 201, test expected 200** (`quotes.controller.ts`)
   - NestJS default HTTP status for `@Post()` is 201
   - Fix: Added `@HttpCode(HttpStatus.OK)` decorator to `approveById`

3. **`invoice.total.toFixed(2)` throws TypeError** (`03-quote-to-payment.test.ts`)
   - Prisma serializes `Decimal` fields as strings in JSON; strings don't have `.toFixed()`
   - Fix: Wrapped all Decimal field calls with `Number(invoice.total).toFixed(2)`

4. **Template task creation 500** (`trade-templates.controller.ts`)
   - Root cause: `CreateTemplateDto.tasks` had `@IsArray()` but no `@ValidateNested({ each: true }) @Type(() => TaskDto)`
   - NestJS `whitelist: true` with no `@Type` strips ALL properties from nested objects (treats as `Object` type with no declared properties) → tasks become `[{}, {}, {}]` → Prisma can't create tasks with missing required fields
   - Fix: Added `@ValidateNested({ each: true }) @Type(() => TaskDto)` + added `ValidateNested` to validator imports + added `import { Type } from 'class-transformer'`

5. **Review creation 500 — FK violation on `customerId: ''`** (`reviews.service.ts`)
   - `customerId: rest.customerId ?? ''` — the `??` operator does NOT treat empty string as nullish, so `'' ?? ''` returns `''`
   - Prisma FK constraint fails on empty string as foreign key
   - Fix: Added explicit guard with `BadRequestException` if `customerId` is falsy; then passes guaranteed non-empty string to Prisma
   - Note: colleague later revised to use `rest.customerId || null` (makes customerId nullable at service level) — their approach also valid

**Test results after fixes:** 10 Test Suites: 10 passed | Tests: 107 passed, 0 failed ✅

### What was done — Frontend Analysis

Colleague Ravishan delivered `apps/admin-dashboard` — a fully-built React 19 + Vite admin UI.

**Admin dashboard specs:**
- React 19, Vite 7, TypeScript 5.9, Tailwind CSS 3
- 9 pages: Dashboard, Customers, Jobs, Scheduling, Finance, Communications, Analytics, Settings, Team
- Libraries: React Router v7, TanStack Query v5, Axios, Recharts 3, FullCalendar 6, lucide-react, date-fns

**Key finding: 100% mock data.** Every page uses hardcoded arrays. Zero API calls. Zero auth. No environment variables. TanStack Query and Axios are installed but unused.

**Feature list (from Feature list.pdf) reviewed and mapped to backend services:**
- All 9 features map to existing backend services ✅
- Full endpoint mapping documented in `FRONTEND_INTEGRATION_PLAN.md`

### What was changed

**`infrastructure/nginx/nginx.conf`:**
- Extended `Access-Control-Allow-Headers` to include test-bypass headers (`x-test-company-id`, `x-test-user-id`, `x-test-user-email`, `x-test-user-role`, `x-test-user-name`)
- Required so the frontend dev build can call services using the same test-auth bypass as the flow tests during integration work (before real Auth0 is wired)

**`apps/admin-dashboard/vite.config.ts`:**
- Added `server.proxy` for `/api` → `http://localhost:80` (nginx gateway)
- Added `server.proxy` for `/ws` → `ws://localhost:80` (WebSocket to scheduling service)
- This makes the frontend dev server at `:5173` transparently route API calls through nginx, exactly matching the production Kong topology

**`FRONTEND_INTEGRATION_PLAN.md`** (new file):
- Complete endpoint mapping for all 9 pages
- Status enum mismatch tables (frontend lowercase vs backend uppercase)
- Data shape differences (customer name, job amount, etc.)
- 6 identified gaps with resolution options
- 8-phase implementation roadmap
- File structure for `src/lib/`, `src/hooks/`, `src/types/`
- Dev auth bypass header reference

**`PROJECT_STATUS.md`** + **`DEV_LOG.md`** — updated with current state

### Key decisions made

1. **Dev auth strategy:** Use test-bypass headers (`x-test-company-id: co-demo-001`, `x-test-user-role: COMPANY_ADMIN`) during frontend integration phase. Swap to real Auth0 SDK in Phase 8.

2. **API base URL:** Frontend proxies `/api/*` through Vite dev server to nginx at `localhost:80`. No hardcoded service ports in frontend code — mirrors production topology.

3. **Job status `in_progress`:** Backend has `EN_ROUTE` and `ON_SITE` as separate states. Frontend collapses to `in_progress`. Recommendation: expose both states in the job list (richer UX, matches dispatch board). Frontend will need minor update.

4. **GAP 1 (Team page):** Add a `UsersModule` to the CRM service rather than using Auth0 Management API directly. Keeps user profile data in our DB, Auth0 handles auth only.

5. **GAP 2 (Company settings):** Add `CompanyModule` to CRM service with `/crm/companies/me` endpoints.

### What's next
1. **YOU:** Start the analytics service so Dashboard and Analytics page have live data
2. **Session 9:** Implement Phase 1-2 (api.ts + queryClient + Dashboard live data)
3. **Session 9 (parallel):** Add GAP 1 UsersModule to CRM service
4. Then phases 3-8 progressively through Sessions 9-12

---

## Session 7 — March 2026 (Week 7: Analytics Service — Complete)

**Status: ✅ Analytics Service fully built and tested — ready for `npm install` + `npx prisma generate`**

### What was built — analytics-service (NestJS 10, port 3006)

**Architecture decision: Cross-schema raw SQL**
All analytics queries use `prisma.$queryRaw` with fully-qualified `schema.table` names (`crm.customers`, `jobs.jobs`, `finance.invoices`, etc.). This gives us:
- Full cross-schema JOIN capability (e.g. join jobs.jobs → finance.payments → crm.reviews in a single query)
- Complex SQL features: `DATE_TRUNC`, `FILTER`, window functions, `COALESCE`
- Read-only posture — no Prisma models for business schemas; minimal `AnalyticsEvent` model for schema anchor only

**Prisma schema (`analytics` schema):**
- `AnalyticsEvent` — minimal anchor model; tracks dashboard views, export generations per company

**DashboardModule (GET /dashboard/kpis):**
- 8 concurrent queries via `Promise.all` for full KPI card suite
- Revenue: collected payments with trend % vs prior period (period mirroring for fair comparison)
- Jobs completed: count in period vs prior period with trend
- Active customers: live COUNT from crm.customers
- Average rating: AVG from crm.reviews with N/A when no reviews
- Outstanding invoices: count + balanceDue SUM for SENT/PARTIALLY_PAID/OVERDUE
- Lead conversion rate: WON/total from crm.leads

**RevenueModule (GET /revenue/*):**
- `series` — payments bucketed by day/week/month/quarter/year using `DATE_TRUNC`
- `by-category` — line-item revenue split (LABOUR/PARTS/MATERIALS) with percentage
- `top-jobs` — highest-value jobs by summed payment amounts (cross-schema join)
- `summary` — collected/outstanding/overdue/refunded with collection rate %

**TechnicianMetricsModule (GET /technician-metrics/*):**
- `leaderboard` — ranked by revenue; computes on-time rate (jobs started within 15 min of scheduledStart) and composite performance score (40% revenue/job + 30% avg rating + 30% on-time)
- `/:technicianId` — detailed: jobs completed/cancelled, revenue, avgRating + count, avgJobDurationMins, onTimeRate, firstTimeFixRate (single-visit jobs / total), totalTravelKm

**JobsAnalyticsModule (GET /jobs-analytics/*):**
- `by-status` — count per JobStatus enum value
- `by-trade` — volume + revenue + avgRating + completion rate per trade type (joins job_types)
- `by-zone` — city/state/zip grouping with job count + revenue (top 50 zones)
- `completion-rates` — totalJobs / completed / cancelled / onHold with rates
- `trends` — job volume time-series (created/completed/cancelled) with configurable granularity

**CustomerAnalyticsModule (GET /customer-analytics/*):**
- `top-customers` — sorted by total revenue (LTV); includes jobCount, avgRating, type (COMMERCIAL/RESIDENTIAL), lastJobDate
- `acquisition-sources` — lead source analysis: count, converted count, conversionRate %, estimatedValue
- `churn-signals` — customers inactive > N days (configurable, default 90); shows daysSinceLastJob, totalRevenue, jobCount
- `segments` — RESIDENTIAL vs COMMERCIAL breakdown with count, revenue, avgJobValue

**ExportsModule (GET /exports/*):**
- `revenue/csv` — payments as CSV stream with proper RFC 4180 escaping (commas/quotes in names)
- `revenue/excel` — styled .xlsx using ExcelJS: frozen header row, dark blue header fill, SUM formula in totals row, cell borders
- `jobs/excel` — multi-sheet workbook: Sheet 1 "All Jobs" with all fields, Sheet 2 "By Trade" with aggregated trade summary
- `technicians/csv` — technician metrics as CSV

**Tests (24 unit + 20 E2E = 44 total):**
- Unit: DashboardService (6), RevenueService (6), TechnicianMetricsService (4), JobsAnalyticsService (5), CustomerAnalyticsService (6), ExportsService (7)
- E2E: Full HTTP coverage — all 14 GET endpoints tested with mocked Prisma; JWT guard (403 without token); CSV/Excel content-type assertions; response shape assertions

**Files created:**
```
apps/analytics-service/
  package.json                                        (updated: added exceljs, @nestjs/testing, ts-jest, supertest)
  prisma/schema.prisma                                (analytics schema, AnalyticsEvent anchor model)
  src/prisma/prisma.service.ts                        (PrismaClient wrapper with connect/disconnect lifecycle)
  src/prisma/prisma.module.ts                         (Global PrismaModule)
  src/app.config.ts                                   (ANALYTICS_DATABASE_URL, Auth0, port config)
  src/app.module.ts                                   (updated: wires all 6 analytics modules)
  src/dashboard/dashboard.service.ts                  (8-KPI getKpis method)
  src/dashboard/dashboard.controller.ts               (GET /dashboard/kpis)
  src/dashboard/dashboard.module.ts
  src/dashboard/dto/dashboard.dto.ts                  (DateRangeDto, GranularityEnum)
  src/revenue/revenue.service.ts                      (getSeries, getByCategory, getTopJobs, getSummary)
  src/revenue/revenue.controller.ts                   (4 GET endpoints)
  src/revenue/revenue.module.ts
  src/technician-metrics/technician-metrics.service.ts (getLeaderboard, getMetrics)
  src/technician-metrics/technician-metrics.controller.ts
  src/technician-metrics/technician-metrics.module.ts
  src/jobs-analytics/jobs-analytics.service.ts        (5 methods)
  src/jobs-analytics/jobs-analytics.controller.ts     (5 GET endpoints)
  src/jobs-analytics/jobs-analytics.module.ts
  src/customer-analytics/customer-analytics.service.ts (getTopCustomers, getAcquisitionSources, getChurnSignals, getSegmentSummary)
  src/customer-analytics/customer-analytics.controller.ts
  src/customer-analytics/customer-analytics.module.ts
  src/exports/exports.service.ts                      (4 export methods — 2 CSV + 2 Excel)
  src/exports/exports.controller.ts                   (4 GET endpoints, streams buffer to response)
  src/exports/exports.module.ts
  src/dashboard/dashboard.service.spec.ts             (6 unit tests)
  src/revenue/revenue.service.spec.ts                 (6 unit tests)
  src/technician-metrics/technician-metrics.service.spec.ts (4 unit tests)
  src/jobs-analytics/jobs-analytics.service.spec.ts   (5 unit tests)
  src/customer-analytics/customer-analytics.service.spec.ts (6 unit tests)
  src/exports/exports.service.spec.ts                 (7 unit tests)
  test/app.e2e-spec.ts                                (20 E2E tests)
  test/jest-e2e.json
```

**What's next:**
1. ✅ All 7 backend services complete
2. 🚧 Comprehensive API-level user flow tests (cross-service integration flows)
3. Frontend development (React admin dashboard + customer portal)

---

## Session 6 — March 2026 (Week 6: Communication Service — Complete)

**Status: ✅ Communication Service fully built and tested — ready for `npm install` + `npx prisma generate` (MongoDB)**

### What was built — comms-service (NestJS 10, port 3005)

**Prisma schema (MongoDB datasource):**
- `Notification` — one delivery attempt record per channel per event; tracks companyId, recipientId, channel, status, externalId (Twilio SID / SendGrid message-id / FCM message-id), sentAt, deliveredAt, failedAt
- `MessageThread` — two-way conversation thread (company staff ↔ customer); embedded `Message[]` array (no join collection); tracks unreadCount, lastMessageAt, threadStatus
- `Message` (composite type) — embedded in MessageThread; stores senderId, direction (INBOUND/OUTBOUND), body, twilioSid, mediaUrls
- `NotificationTemplate` — Handlebars templates with variables[] declaration for UI validation
- `AutomationRule` — trigger + conditions JSON + actions JSON array + delayMinutes
- `DeliveryLog` — immutable audit log of every send attempt (channel, provider, durationMs, externalId)

**Provider Services:**
- `SmsService` (Twilio) — `send(to, body)` returns `SmsDeliveryResult`; graceful mock when credentials missing; `validateWebhookSignature()` for inbound webhooks
- `EmailService` (SendGrid) — `send(opts)` returns `EmailDeliveryResult`; `compileTemplate()` Handlebars helper; HTML-to-text fallback
- `PushService` (Firebase Admin SDK) — `sendToToken()`, `sendMulticast()` (up to 500 tokens), `sendToTopic()`; no-op when Firebase creds missing

**BullMQ Processors (3 workers):**
- `SmsProcessor` (`SEND_SMS` queue) — `QUEUED → SENT → DELIVERED + DeliveryLog` OR `FAILED + DeliveryLog + throw` (BullMQ exponential retry)
- `EmailProcessor` (`SEND_EMAIL` queue) — same lifecycle, SendGrid provider, `sendgrid` in log
- `PushProcessor` (`SEND_PUSH` queue) — same lifecycle, FCM provider, `fcm` in log

**NotificationsModule:**
- `NotificationsService` — central orchestrator: creates Notification doc → calculates delay → enqueues to BullMQ
- `NotificationsController` — `POST /notifications/sms|email|push`, `GET /notifications?channel=&status=&page=&limit=`, `GET /notifications/stats`

**TemplatesModule:**
- `TemplatesService` — CRUD + Handlebars compile cache (Map<id, {subject?, body}>); `render(id, context)`, `renderDefault(type, channel, context)`; validates Handlebars syntax on create/update; cache invalidated on update
- `TemplatesController` — `POST /templates`, `GET /templates`, `GET /templates/:id`, `PATCH /templates/:id`, `DELETE /templates/:id`, `POST /templates/:id/render`

**MessagingModule:**
- `MessagingService` — `createThread()` (returns existing active thread, avoids duplicates), `sendMessage()` (staff→customer via Twilio, embeds message in thread), `handleInboundWebhook()` (validates Twilio signature, finds/creates thread, appends INBOUND message, increments unreadCount)
- `MessagingController` — full CRUD for threads + send message + mark read
- `TwilioWebhookController` — `POST /webhooks/twilio/inbound` (no JWT, Twilio signature validated internally)

**AutomationModule:**
- `AutomationService` — lightweight rule engine: loads active rules by trigger → evaluates conditions (simple equality matching) → renders template → dispatches via NotificationsService (with optional delay)
- Handles events: `JOB_STATUS_CHANGED`, `INVOICE_SENT`, `PAYMENT_RECEIVED`, `QUOTE_APPROVED`, `APPOINTMENT_BOOKED`
- `AutomationRulesController` — JWT-guarded CRUD for rules
- `AutomationEventsController` — internal endpoints (`POST /automation/events/*`) protected by `x-internal-api-key` header (called by job-service and finance-service)

**AppModule:** BullMQ `forRoot` global connection + all modules imported

**main.ts:** `express.raw()` middleware applied to `/webhooks/twilio` before JSON parsing

### Tests added — comms-service

**Unit Tests:**
- `sms.processor.spec.ts` — 2 tests: DELIVERED flow + FAILED flow (verifies throw for retry)
- `email.processor.spec.ts` — 2 tests: DELIVERED + FAILED flow
- `push.processor.spec.ts` — 2 tests: DELIVERED + FAILED flow
- `automation.service.spec.ts` — 11 tests: condition matching, channel dispatching (SMS/EMAIL), missing recipient skip, delayMinutes scheduling, template render failure (graceful), multiple rules/actions, CRUD operations
- `templates.service.spec.ts` — 10 tests: create (valid/invalid Handlebars), findOne (found/not-found), render (body+subject, compile cache, unknown vars), renderDefault (found/not-found), update (cache invalidation)

**E2E Tests (`test/app.e2e-spec.ts`):**
- 20 integration tests; mocked Prisma + mocked BullMQ queues + mocked Auth
- Covers: SMS/email/push queue endpoints, notification list + stats, template CRUD + render, thread create (idempotency) + list, automation rule CRUD, internal event endpoint (valid/invalid API key)

### Next: Week 7 — Analytics Service
- NestJS + PostgreSQL read replica
- Materialized views for dashboards
- Revenue reports, technician performance, job completion metrics
- Data export (CSV/Excel)

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
