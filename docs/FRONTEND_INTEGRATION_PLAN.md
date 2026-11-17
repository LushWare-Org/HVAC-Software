# T&S CRM — Frontend ↔ Services Integration Plan

> **Created:** March 2026 | **Session:** 8 (Frontend Integration Phase)
> **Status:** Analysis complete — implementation starting
> **Goal:** Wire the admin-dashboard React app to all 6 backend services through the Nginx API gateway

---

## 1. Current State Assessment

### Admin Dashboard (apps/admin-dashboard)
| Property | Current |
|----------|---------|
| Framework | React 19 + Vite 7 + TypeScript 5.9 |
| Styling | Tailwind CSS 3 + custom CSS variables (theming) |
| Routing | React Router v7 |
| Data fetching | TanStack Query v5 installed, **NOT YET USED** |
| HTTP client | Axios installed, **NOT YET USED** |
| Charts | Recharts 3 + FullCalendar 6 |
| Data source | **100% hardcoded mock data** — zero API calls |
| Auth | **None** — no tokens, no headers |
| Env vars | **None** — no `.env` file, no `VITE_*` vars |
| API proxy | **None** — vite.config.ts had no proxy (now added) |

### Pages Implemented (all mock-only)
| Route | Page | Backend service(s) needed |
|-------|------|--------------------------|
| `/` | Dashboard | Analytics, Jobs, Scheduling |
| `/customers` | Customers + Leads + Agreements | CRM |
| `/jobs` | Jobs list + detail | Jobs |
| `/scheduling` | Dispatch board + calendar + live map | Scheduling, Jobs |
| `/finance` | Invoices + Quotes + Expenses | Finance, Analytics |
| `/communications` | Messages + notifications | Comms |
| `/analytics` | Revenue, job, customer, tech charts | Analytics |
| `/settings` | Profile + company + appearance + security | CRM, Auth0 |
| `/team` | Team members by role | Scheduling (techs), Auth0 (users) |

---

## 2. API Gateway — Current State

The Nginx gateway is **already configured** and running in Docker at `localhost:80`.

### Route Map (nginx → service)
| Frontend calls | Nginx location | Backend upstream | Port |
|---------------|----------------|-----------------|------|
| `GET /api/crm/**` | `/api/crm/` | crm_service | 3001 |
| `GET /api/jobs/**` | `/api/jobs/` | job_service | 3002 |
| `GET /api/scheduling/**` | `/api/scheduling/` | scheduling_service | 3003 |
| `GET /api/finance/**` | `/api/finance/` | finance_service | 3004 |
| `GET /api/comms/**` | `/api/comms/` | comms_service | 3005 |
| `GET /api/analytics/**` | `/api/analytics/` | analytics_service | 3006 |
| `ws://localhost/ws` | `/ws` | scheduling_service | 3003 |

### What was changed in nginx.conf
- Extended `Access-Control-Allow-Headers` to include the test-bypass headers
  (`x-test-company-id`, `x-test-user-id`, `x-test-user-email`, `x-test-user-role`, `x-test-user-name`)
  so the frontend can use dev-mode auth without real Auth0 during integration work.

### What was changed in vite.config.ts
- Added `server.proxy`: `/api` → `http://localhost:80` and `/ws` → `ws://localhost:80`
- This means the React dev server at `:5173` transparently proxies API calls to nginx,
  exactly mirroring the production topology (frontend → Kong → services).

---

## 3. Complete Endpoint Mapping (Frontend Page → Backend API)

### 3.1 Dashboard (`/`)
| UI Widget | Endpoint | Method | Notes |
|-----------|----------|--------|-------|
| KPI cards (revenue, jobs, customers, completion rate) | `/api/analytics/dashboard/kpis` | GET | `?period=30d` |
| Revenue area chart | `/api/analytics/revenue/series` | GET | `?granularity=month` |
| Job status pie chart | `/api/analytics/jobs-analytics/by-status` | GET | — |
| Recent jobs table | `/api/jobs/jobs` | GET | `?limit=10&sort=createdAt:desc` |
| Field team status | `/api/scheduling/technicians` | GET | Returns current status |
| Upcoming appointments | `/api/jobs/jobs` | GET | `?status=SCHEDULED&sort=scheduledStart:asc&limit=5` |

### 3.2 Customers (`/customers`)

**Tab: Customers**
| Action | Endpoint | Method |
|--------|----------|--------|
| List customers | `/api/crm/customers` | GET |
| Search/filter | `/api/crm/customers?search=&type=RESIDENTIAL` | GET |
| Customer detail (sidebar) | `/api/crm/customers/:id` | GET |
| Add customer | `/api/crm/customers` | POST |
| Edit customer | `/api/crm/customers/:id` | PATCH |
| Delete customer | `/api/crm/customers/:id` | DELETE |
| Customer LTV | `/api/analytics/customer-analytics/top-customers` | GET |

**Tab: Leads**
| Action | Endpoint | Method |
|--------|----------|--------|
| List leads | `/api/crm/leads` | GET |
| Add lead | `/api/crm/leads` | POST |
| Update lead status | `/api/crm/leads/:id` | PATCH |
| Convert lead to customer | `/api/crm/leads/:id` | PATCH (`status: WON`) |

**Tab: Agreements (Service Contracts)**
| Action | Endpoint | Method |
|--------|----------|--------|
| List agreements | `/api/crm/agreements` | GET |
| Create agreement | `/api/crm/agreements` | POST |

### 3.3 Jobs (`/jobs`)
| Action | Endpoint | Method |
|--------|----------|--------|
| KPI stats | `/api/jobs/jobs/stats` | GET |
| List jobs (paginated) | `/api/jobs/jobs` | GET |
| Filter by status | `/api/jobs/jobs?status=PENDING` | GET |
| Filter by job type | `/api/jobs/jobs?jobTypeId=` | GET |
| Filter by technician | `/api/jobs/jobs?technicianId=` | GET |
| Job detail | `/api/jobs/jobs/:id` | GET |
| Create job | `/api/jobs/jobs` | POST |
| Update job | `/api/jobs/jobs/:id` | PUT |
| Change job status | `/api/jobs/jobs/:id` | PATCH |
| Cancel job | `/api/jobs/jobs/:id` | PATCH (`status: CANCELLED`) |
| Job types (for filter dropdown) | `/api/jobs/trade/job-types` | GET |

### 3.4 Scheduling (`/scheduling`)

**Dispatch Board + Calendar View**
| Action | Endpoint | Method |
|--------|----------|--------|
| Technician roster | `/api/scheduling/technicians` | GET |
| Day's assignments | `/api/scheduling/dispatch/assignments` | GET |
| Smart assign job | `/api/scheduling/dispatch/assign` | POST |
| Manual assign | `/api/scheduling/dispatch/assign/manual` | POST |
| Update assignment status | `/api/scheduling/dispatch/assignments/:id/status` | PATCH |
| Scheduled jobs (calendar) | `/api/jobs/jobs?status=SCHEDULED` | GET |
| GPS live data | `ws://localhost/ws` | WebSocket |

**Live Map**
| Action | Endpoint | Notes |
|--------|----------|-------|
| Live tech locations | WebSocket `/ws` | `WSTypeGPSUpdate` messages |
| Technician GPS history | `/api/scheduling/gps` | GET (if implemented) |

### 3.5 Finance (`/finance`)

**Tab: Invoices**
| Action | Endpoint | Method |
|--------|----------|--------|
| KPI metrics | `/api/finance/payments/metrics` | GET |
| List invoices | `/api/finance/invoices` | GET |
| Invoice detail | `/api/finance/invoices/:id` | GET |
| Send invoice (email) | `/api/finance/invoices/:id/send` | POST |
| Record payment | `/api/finance/invoices/:id/payments` | POST |
| Download PDF | `/api/finance/invoices/:id/pdf` | GET |
| Void invoice | `/api/finance/invoices/:id/void` | POST |

**Tab: Quotes**
| Action | Endpoint | Method |
|--------|----------|--------|
| List quotes | `/api/finance/quotes` | GET |
| Create quote | `/api/finance/quotes` | POST |
| Quote detail | `/api/finance/quotes/:id` | GET |
| Send quote | `/api/finance/quotes/:id/send` | POST |
| Approve quote | `/api/finance/quotes/:id/approve` | POST |
| Convert to invoice | `/api/finance/quotes/:id/convert` | POST |
| Download PDF | `/api/finance/quotes/:id/pdf` | GET |

**Tab: Expenses**
| Action | Endpoint | Method |
|--------|----------|--------|
| List expenses | `/api/finance/expenses` | GET |
| Create expense | `/api/finance/expenses` | POST |
| Update expense | `/api/finance/expenses/:id` | PATCH |
| Delete expense | `/api/finance/expenses/:id` | DELETE |

### 3.6 Communications (`/communications`)

**Tab: Messages**
| Action | Endpoint | Method |
|--------|----------|--------|
| List message threads | `/api/comms/messaging/threads` | GET |
| Thread messages | `/api/comms/messaging/threads/:id/messages` | GET |
| Send message | `/api/comms/messaging/threads/:id/messages` | POST |
| Mark thread read | `/api/comms/messaging/threads/:id/read` | PATCH |

**Tab: Notifications**
| Action | Endpoint | Method |
|--------|----------|--------|
| List notifications | `/api/comms/notifications` | GET |
| Notification stats | `/api/comms/notifications/stats` | GET |

### 3.7 Analytics (`/analytics`)
| Widget | Endpoint | Method |
|--------|----------|--------|
| Revenue area chart (monthly/yearly toggle) | `/api/analytics/revenue/series` | GET |
| Revenue vs Jobs correlation | `/api/analytics/revenue/series` + `/api/analytics/jobs-analytics/trends` | GET |
| Job status pie | `/api/analytics/jobs-analytics/by-status` | GET |
| Service categories pie | `/api/analytics/jobs-analytics/by-trade` | GET |
| Customer acquisition bar | `/api/analytics/customer-analytics/acquisition-sources` | GET |
| Technician leaderboard | `/api/analytics/technician-metrics/leaderboard` | GET |
| Export CSV | `/api/analytics/exports/revenue/csv` | GET |
| Export Excel | `/api/analytics/exports/revenue/excel` | GET |

### 3.8 Team (`/team`)
| Action | Endpoint | Method | Gap? |
|--------|----------|--------|------|
| List technicians | `/api/scheduling/technicians` | GET | ✅ exists |
| List admin/dispatcher/office users | Auth0 Management API OR new users endpoint | — | ⚠️ GAP |
| Edit technician profile | `/api/scheduling/technicians/:id` | PATCH | ✅ exists |
| Team member online status | `/api/scheduling/technicians` (has last_seen) | GET | ✅ exists |

### 3.9 Settings (`/settings`)
| Tab | Action | Endpoint | Gap? |
|-----|--------|----------|------|
| Profile | Get/update current user | Auth0 Management API | ⚠️ no dedicated endpoint |
| Company | Get company details | `/api/crm/companies/:id` | ⚠️ endpoint may not exist |
| Appearance | Theme (client-side only) | — | ✅ no API needed |
| Security | Change password | Auth0 (password change flow) | ⚠️ Auth0 only |

---

## 4. Data Mapping: Status Enums

The frontend uses lowercase underscore status names; backend uses uppercase enums. A mapping layer is required.

### Job Status Mapping
| Frontend label | Frontend value | Backend enum |
|----------------|---------------|-------------|
| Pending | `pending` | `PENDING` |
| Scheduled | `scheduled` | `SCHEDULED` |
| In Progress | `in_progress` | `EN_ROUTE` or `ON_SITE` ← merged |
| Completed | `completed` | `COMPLETED` |
| Invoiced | `invoiced` | `INVOICED` |
| Cancelled | `cancelled` | `CANCELLED` |
| _(not shown)_ | — | `ON_HOLD`, `PAID` |

**Action needed:** Frontend should either show `EN_ROUTE` and `ON_SITE` as distinct states, or collapse them to `in_progress` with a display adapter. Recommend making them distinct (adds detail to the dispatch board).

### Quote Status Mapping
| Frontend | Backend |
|----------|---------|
| `draft` | `DRAFT` |
| `sent` | `SENT` |
| `accepted` | `ACCEPTED` |
| `rejected` | `DECLINED` ← rename |
| `expired` | `EXPIRED` |
| _(not shown)_ | `VIEWED` |

### Invoice Status Mapping
| Frontend | Backend |
|----------|---------|
| `draft` | `DRAFT` |
| `sent` | `SENT` |
| `paid` | `PAID` |
| `overdue` | `OVERDUE` |
| _(not shown)_ | `PARTIALLY_PAID`, `VOID` |

---

## 5. Data Shape Differences

### Customer Name
- **Backend:** `{ firstName: string, lastName: string }` (separate fields)
- **Frontend expects:** `"Sarah Mitchell"` (full name string)
- **Fix:** Create a `fullName` computed property in the API adapter: `${firstName} ${lastName}`

### Job "Amount"
- **Backend:** Jobs have no direct `amount` — the invoice/payment tracks money
- **Frontend shows:** A dollar amount per job row
- **Fix:** Join with finance service data OR use `estimatedRevenue` if added to Job model.
  Short-term: query `/api/finance/invoices?jobId=:id` and show invoice total.

### KPI numbers on Dashboard
- **Backend Analytics:** Returns real calculated values with trend percentages
- **Frontend currently shows:** Hardcoded `$81,240`, `71`, `1,248`, `92%`
- **Fix:** Replace with `GET /api/analytics/dashboard/kpis` response

### Technician "Rating"
- **Backend:** `rating Decimal` on the scheduling.technicians table (average stored)
- **Backend CRM:** `reviews` table has per-job ratings
- **Frontend shows:** `4.8` style decimal  — aligns well ✅

---

## 6. Identified Gaps

### GAP 1 — No Team/Users Management Service (HIGH priority)
The `Team` page shows admins, dispatchers, and technicians by role. The backend has:
- `scheduling.technicians` → field technicians only
- Auth0 → all user accounts, but no dedicated API in our services

**Resolution options:**
- **Option A (recommended):** Add a `UsersModule` to the CRM service with a `users` table that stores company user profiles (name, email, role, status). Auth0 remains the auth provider but our service holds the profile data. This aligns with multi-tenant architecture.
- **Option B (quick):** Use Auth0 Management API directly from frontend. Requires Management API token — security risk.
- **Option C (minimal):** Show only technicians on Team page (from scheduling service) and label non-tech admins as "manage via Auth0".

### GAP 2 — No Company Settings Endpoint (MEDIUM priority)
The `Settings > Company` tab needs to read/write company-level data (VAT number, address, registration number). The CRM service has a `Company` model in the DB but no controller/endpoints for reading or updating it.

**Resolution:** Add `CompanyModule` with `GET /crm/companies/me` and `PATCH /crm/companies/me` to CRM service. The "me" variant uses `companyId` from the JWT token.

### GAP 3 — No User Profile Endpoint (MEDIUM priority)
`Settings > Profile` needs to read/update the logged-in user's name, email, bio, phone.

**Resolution:** Part of the `UsersModule` from GAP 1 — add `GET /crm/users/me` and `PATCH /crm/users/me`.

### GAP 4 — Job "Amount" Not on Job Record (LOW priority)
The Jobs list table shows a financial amount per job. This isn't on the job record itself — it comes from the invoice or work order line items.

**Resolution (short-term):** Query invoice amount separately and merge on client. Or add an `estimatedValue` field to the Job model that finance service writes when creating an invoice.

### GAP 5 — Analytics Service Not Yet Running (HIGH priority)
The Analytics service (port 3006) was built in Session 7 but the `YOU:` steps (`prisma generate`, `migrate`, launch) are pending. Dashboard and Analytics page need it.

**Resolution:** Run the setup steps documented in DEV_LOG. The endpoints are ready.

### GAP 6 — Auth Integration (HIGH priority)
The frontend has no authentication whatsoever. Services validate JWT tokens from Auth0.

**Dev strategy:** Use the test-bypass headers (`x-test-company-id: co-demo-001`, `x-test-user-role: COMPANY_ADMIN`) to build and test frontend API integration first, then swap in real Auth0 later.

**Production strategy:** Install `@auth0/auth0-react` SDK, wrap app in `Auth0Provider`, use `useAuth0()` hook to get access token, attach as `Authorization: Bearer <token>` on every request.

---

## 7. Implementation Roadmap

### Phase 1 — Foundation (do first, unblocks everything)
1. Create `src/lib/api.ts` — axios instance pointing to `/api` (proxy handles routing)
   - In dev: inject `x-test-*` headers from a dev config object
   - In prod: inject `Authorization: Bearer <token>` from Auth0
2. Create `src/lib/queryClient.ts` — TanStack Query client with sensible defaults
3. Create `src/contexts/AuthContext.tsx` — dev: returns hardcoded COMPANY_ADMIN user; prod: wraps Auth0Provider
4. Wire `QueryClientProvider` in `main.tsx`

### Phase 2 — Analytics + Dashboard (high impact, visible immediately)
1. Build `src/hooks/useAnalytics.ts` — hooks for all analytics endpoints
2. Replace Dashboard mock data with real API calls (KPIs, revenue chart, job status pie, recent jobs)
3. Replace Analytics page mock data with real API calls
4. Add loading skeletons (the design system has CSS variables that support this)

### Phase 3 — Customers + Jobs (core CRM)
1. Build `src/hooks/useCustomers.ts`, `useLeads.ts`, `useAgreements.ts`
2. Build `src/hooks/useJobs.ts`, `useJobTypes.ts`
3. Replace mock data in Customers and Jobs pages
4. Wire up create/edit/delete actions (modals already exist — just need to call API)

### Phase 4 — Finance
1. Build `src/hooks/useInvoices.ts`, `useQuotes.ts`, `useExpenses.ts`
2. Replace Finance page mock data
3. Wire PDF download, send invoice, approve quote actions

### Phase 5 — Scheduling + Live Map
1. Build `src/hooks/useTechnicians.ts`, `useAssignments.ts`
2. Wire WebSocket connection for real-time GPS and assignment updates
3. Replace Scheduling page mock data
4. Wire dispatch actions (assign, status update)

### Phase 6 — Communications
1. Build `src/hooks/useThreads.ts`, `useNotifications.ts`
2. Replace Communications page mock data
3. Wire send message + mark read

### Phase 7 — Team + Settings (gaps to resolve first)
1. Build `UsersModule` in CRM service (GAP 1)
2. Build `CompanyModule` in CRM service (GAP 2)
3. Replace Team and Settings page mock data

### Phase 8 — Auth0 Production Auth
1. Install `@auth0/auth0-react`
2. Replace dev auth context with real Auth0Provider
3. Update API client to use access token from `useAuth0()`
4. Remove test-bypass headers

---

## 8. File Structure to Create

```
apps/admin-dashboard/src/
  lib/
    api.ts              ← axios instance + auth header injection
    queryClient.ts      ← TanStack Query client config
    adapters.ts         ← status/field name transformers (backend ↔ frontend)
  contexts/
    AuthContext.tsx      ← dev mode test auth / prod Auth0 wrapper (exists, extend it)
    ThemeContext.tsx     ← already exists ✅
  hooks/
    useAnalytics.ts     ← dashboard kpis, revenue, job stats
    useCustomers.ts     ← customers CRUD
    useLeads.ts         ← leads CRUD
    useAgreements.ts    ← service agreements
    useJobs.ts          ← jobs list, detail, status update
    useJobTypes.ts      ← trade types (filter dropdown)
    useTechnicians.ts   ← scheduling technicians
    useAssignments.ts   ← dispatch assignments
    useInvoices.ts      ← invoices CRUD + actions
    useQuotes.ts        ← quotes CRUD + actions
    useExpenses.ts      ← expenses CRUD
    useThreads.ts       ← comms message threads
    useNotifications.ts ← comms notifications
    useTeam.ts          ← team members (after GAP 1 resolved)
    useCompany.ts       ← company settings (after GAP 2 resolved)
  types/
    api.ts              ← TypeScript interfaces matching backend DTOs
```

---

## 9. API Gateway — Future (Kong Production)

When moving to production the architecture plan confirms Kong Gateway will handle:
- **JWT validation** at gateway (not per-service) — services trust gateway-injected headers
- **Rate limiting** per client IP / per API key
- **CORS** (replace nginx `add_header` directives)
- **Request transformer** — inject `X-Company-ID` from verified JWT claim
- **Path routing** — same `/api/<service>/` structure, different upstream targets (ECS/Swarm)

Dev Nginx config is a faithful simplification of this. No frontend changes needed when switching to Kong — URL structure stays identical.

---

## 10. Quick Reference — Dev Auth Bypass

During frontend development (before Auth0 is integrated), add these headers to every request:

```typescript
// src/lib/api.ts (DEV MODE)
const DEV_HEADERS = {
  'x-test-company-id':  'co-demo-001',
  'x-test-user-id':     'usr-admin-001',
  'x-test-user-email':  'admin@tscrm.dev',
  'x-test-user-role':   'COMPANY_ADMIN',
  'x-test-user-name':   'Admin User',
}
```

These bypass JWT validation in all 5 NestJS services (they use `JwtAuthGuard` which reads the test headers in dev mode). The Go scheduling service uses its own middleware — check `internal/middleware/auth.go` for test bypass support.

---

*Next step: Implement Phase 1 (api.ts + queryClient.ts + AuthContext dev mode), then Phase 2 (Dashboard live data).*
