# Super Admin Activity Monitoring — Design Spec

Date: 2026-08-15
Status: Approved (pending user review of this file)
Related: docs/SYSTEM_OVERVIEW.md, docs/superpowers/specs/2026-07-03-enroute-notification-design.md (comms-service BullMQ/Mongo/Socket.IO precedent)

## Summary

A permanent, real-time activity-monitoring capability for `super_admin` — the one role
in this product whose purpose has been ill-defined until now (`company_admin` already
owns each tenant's day-to-day). Every API call across every backend service is
captured, redacted, given a human-readable description where one is known (a growing
template registry — nothing is ever silently missed, even for routes not yet
templated), and streamed live to a new super-admin-only dashboard page, tenant-wise,
with no polling or manual refresh. Built specifically to prove out an upcoming trial
with a real company: does the workflow actually work end-to-end, in real time, visibly.

This reuses `comms-service`'s existing infrastructure end to end — Postgres (via
Prisma, `comms` schema), BullMQ, and Socket.IO are all already there for messaging;
this is a new module and a new table on the same service, not a new one.

**Correction from the originally-discussed design:** the design was talked through
assuming `comms-service` still runs on MongoDB, per `docs/SYSTEM_OVERVIEW.md`'s
long-standing description of the service. Re-checking the actual code while writing
this spec found that `comms-service` was migrated off MongoDB to PostgreSQL (Prisma,
`comms` schema) some time ago — `apps/comms-service/prisma/schema.prisma` says so
explicitly in its header comment, and there's no Mongo driver in
`apps/comms-service/package.json` at all; `MONGODB_URI` in `app.config.ts` is dead
config nobody reads. So this design uses a Postgres table instead of a Mongo
collection — same shape, same behavior, just matching what's actually running. (Worth
fixing `SYSTEM_OVERVIEW.md`'s stale claim separately; out of scope here.)

## 1. Data model

New `ActivityLog` model in `apps/comms-service/prisma/schema.prisma` (schema `comms`,
same Postgres instance every other service already shares — no new database).

```prisma
model ActivityLog {
  id              String   @id @default(uuid())
  companyId       String?                      // null only for pre-auth actions (failed login, signup)
  companyName     String                        // denormalized at write time — no join needed to render
  service         String                        // crm | jobs | scheduling | finance | comms | analytics | inventory | churn
  method          String                        // GET/POST/PATCH/DELETE
  path            String                        // route PATTERN, e.g. /crm/jobs/:id/status — not the resolved path
  actorUserId     String?
  actorName       String?
  actorRole       String?                       // super_admin | company_admin | office_manager | dispatcher | technician | customer
  action          String                        // short machine code, e.g. "job.created", "email.sent", "auth.login"
  description     String                        // human sentence — from the template registry, or a generic fallback
  status          String                        // SUCCESS | FAILURE
  statusCode      Int
  durationMs      Int
  requestSummary  Json?                         // redacted, truncated (~2KB cap)
  responseSummary Json?                         // redacted, truncated (~2KB cap)
  errorMessage    String?                       // present only on FAILURE
  createdAt       DateTime @default(now())

  @@index([companyId, createdAt])
  @@index([action, createdAt])
  @@index([status, createdAt])
  @@index([createdAt])
}
```

90-day retention: Postgres has no native TTL index, so a BullMQ **repeatable** job
(`activity-log-cleanup`, scheduled daily via `queue.add(..., { repeat: { pattern:
'0 3 * * *' } })` — the same repeatable-job mechanism already available through
`packages/queue`) runs `DELETE FROM comms.activity_logs WHERE created_at < now() -
interval '90 days'` in batches. This is the one place this design's real-time,
zero-manual-intervention requirement doesn't apply — retention is a nightly
maintenance sweep, not a live concern.

Redaction happens before a body is ever attached to an event (Section 2) — a fixed
key-name blocklist (`password`, `token`, `secret`, `cardNumber`, `cvv`, `ssn`,
`authorization`, and case-insensitive variants) applied recursively to both
`requestSummary` and `responseSummary`, so raw sensitive values never reach Postgres
even in this "log everything" firehose.

## 2. Capture layer

New shared package `packages/activity-log`, consumed by every NestJS service the same
way `packages/auth-client` already is.

- **`ActivityLogInterceptor`** — a global NestJS interceptor
  (`app.useGlobalInterceptors(new ActivityLogInterceptor(queue))`), registered once per
  service's `main.ts`. Wraps every route: reads `companyId`/`actorUserId`/`actorName`/
  `actorRole` off the already-authenticated `AuthUser` (the same object every
  controller already receives via `@CurrentUser()` — no new auth plumbing), captures
  the route's *pattern* (not the resolved path, so entries group correctly across
  different ids), times the request, and records status/outcome whether the handler
  resolves or throws. Enqueuing happens after the response is already on its way to
  the caller — logging never adds latency to the real request.
- **`describeAction(service, method, path, requestBody, responseBody)`** — looks up
  the route pattern in a small per-service template registry (e.g.
  `packages/activity-log/templates/jobs.ts`), mapping something like
  `"POST /jobs/jobs"` to a function producing `action: "job.created"` and
  `description: Created job "${res.title}"`. Seeded first with the highest-value
  routes: job create/status-change, customer/lead create, agreement create/confirm,
  quote/invoice create/send/paid, comms email/SMS send, auth login/logout, technician
  assignment. A route with no template entry still gets logged in full — just with a
  generic fallback (`action: "http.request"`, `description: "POST /jobs/jobs → 201"`)
  — coverage is never gapped; readability grows incrementally as more routes get
  templated.
- **`redact(obj)`** — the recursive blocklist redaction from Section 1, applied inside
  the interceptor to a copy of the request/response, never touching the real objects.
- **Go `scheduling-service`** — an equivalent Gin middleware
  (`internal/activitylog/middleware.go`) building the same event shape, but instead of
  enqueuing BullMQ (a format Go doesn't share), it fires a non-blocking `POST` to a
  small ingest endpoint on `comms-service` (Section 3).

## 3. Ingestion pipeline

New BullMQ queue added to the existing shared `packages/queue` (`ACTIVITY_LOG_QUEUE`),
alongside every other queue name/job type this repo already centralizes there.

- **Producer** (every NestJS service, via `ActivityLogInterceptor`):
  `activityLogQueue.add('log-event', event, { removeOnComplete: true, removeOnFail: 100 })`
  — a cheap in-memory Redis push, decoupled from the Mongo write and the Socket.IO
  broadcast entirely.
- **Consumer** — new `comms-service` module, `activity-log/activity-log.processor.ts`:
  a BullMQ worker that picks up `log-event` jobs, writes the (already-redacted) event
  into the `ActivityLog` table via `PrismaService`, then immediately triggers the
  Socket.IO broadcast (Section 4).
  One worker, one write path — the single choke point for consistent
  formatting/redaction/broadcast, regardless of which of the 8 services originated
  the event.
- **Go ingest endpoint**: `POST /comms/activity-log/ingest` — internal, service-to-
  service auth only (the same `x-test-*`/service-JWT pattern already used for
  cross-service calls elsewhere in this repo, e.g. job-service ↔ crm-service). Accepts
  one event in the shared shape and pushes it onto the same BullMQ queue, so it flows
  through the identical write+broadcast path as every NestJS-originated event. Go
  never needs a BullMQ or Mongo client of its own.
- **Failure isolation**: if `comms-service` or Mongo is briefly unavailable, BullMQ
  jobs simply queue in Redis and drain on recovery (standard BullMQ retry/backoff,
  already this codebase's pattern for every other queue) — a monitoring hiccup never
  becomes a product outage, since the interceptor never awaits any of this.

## 4. Real-time delivery

New Socket.IO namespace on `comms-service`'s existing Socket.IO server: `/activity`.

- **Auth on connect**: reuses the JWT auth middleware the existing messaging namespace
  already has, plus one additional check — the connecting user's role must be
  `super_admin`, or the connection is rejected outright. This is the one deliberate,
  narrow exception to this app's usual strict `companyId` scoping, enforced at the
  socket layer itself, not merely hidden in the UI.
- **Rooms**: on connect, a super-admin client joins `company:<id>` per tenant it wants
  to watch, or `company:all` for the cross-tenant firehose. Changing the dashboard's
  tenant filter joins/leaves rooms on the existing connection — no reconnect needed.
- **Broadcast**: immediately after the BullMQ worker (Section 3) writes an event, it
  emits `activity:new` with the full entry to both `company:<event.companyId>` and
  `company:all`. Every connected, matching-room super-admin socket receives it
  instantly — no polling, no manual refresh.
- **Reconnect/gap handling**: on reconnect (sleep, brief network drop), the dashboard
  calls the historical query API (Section 5) for anything since its last-seen
  timestamp before resuming live streaming, so a connection blip never silently drops
  entries.

## 5. Query API + admin-dashboard UI

**Query API** — new `activity-log.controller.ts` in `comms-service`,
`Role.SUPER_ADMIN`-gated exclusively (not `company_admin`):
- `GET /comms/activity-log?companyId=&service=&action=&status=&actorUserId=&from=&to=&page=&limit=`
  — paginated via the existing `clampPagination` helper, `createdAt desc`.
  `companyId` omitted or `all` spans every tenant.
- `GET /comms/activity-log/companies` — distinct `{companyId, companyName}` pairs seen
  in the log, populating the tenant filter without a separate cross-service lookup.

**New admin-dashboard page**, route `/system-activity`, added to the sidebar/routing
**only when `user.role === 'super_admin'`** — every other role never sees it exist.

- **Header controls**: tenant selector (All / specific company), service filter,
  action-type filter, status filter (success/failure), free-text search over
  `description`.
- **Live feed**: newest-first, auto-appending, Socket-driven. Each row: timestamp,
  tenant badge, actor (name + role chip), the human `description`, a success/failure
  status dot, expandable to method/path/duration/redacted request-response detail and
  (on failure) `errorMessage`. A "Live" indicator with pause/resume — pausing halts
  auto-scroll without dropping the connection, so an entry can be inspected mid-stream
  without the feed jumping away underneath it.
- **Historical scroll-back**: scrolling past the in-memory window calls the query API
  for the next page — the same infinite-scroll pattern already used elsewhere in this
  app.
- **Failure emphasis**: failed entries render with a red-tinted left border, matching
  the visual language `ComponentIssuesAlert`/open-issue badges already use elsewhere,
  so a trial-breaking error is visually obvious in the stream without reading every line.

## RBAC & multi-tenancy

Every piece of this — the Socket.IO namespace, the query API, the dashboard route —
is gated to `Role.SUPER_ADMIN` only. This is the single explicit, narrow exception to
this codebase's otherwise-universal "every query filtered by companyId" rule
(CLAUDE.md), and it's enforced at every layer (socket connect, controller guard,
route visibility) rather than relying on any one of them alone.

## Testing

- `packages/activity-log`: unit tests for `redact()` (nested objects, arrays, case-
  insensitive key matching, values not stripped when key doesn't match) and
  `describeAction()` (templated route match, generic fallback for unknown routes).
- `comms-service`: Jest — the BullMQ processor writes a well-formed `ActivityLog` row
  from a raw queue job; the query controller's `companyId`/`service`/`status`/date-
  range filters compose correctly; `Role.SUPER_ADMIN`-only guard rejects every other
  role including `company_admin`; the Socket.IO namespace rejects a non-super-admin
  JWT on connect.
- Manual verification (documented, not automated — no headless-browser test runner in
  this app per repo convention): create a job as a test company_admin, confirm the
  entry appears in the super-admin live feed within ~1s with a readable description
  and correct tenant tag; trigger a deliberate failure (e.g. an invalid request) and
  confirm it renders with the red failure treatment and `errorMessage`; reconnect the
  dashboard mid-session and confirm no entries are lost.

## Out of scope (this design)

- Expanding the description-template registry to every route in the system — starts
  seeded with the highest-value routes per Section 2; growing coverage is ongoing,
  incremental work, not a blocking dependency of this design shipping.
- Alerting (push notification / sound / email on failure) — the live feed's visual
  failure emphasis is the v1 signal; proactive alerting is a natural follow-up once
  the trial is underway and it's clear which failures actually warrant interrupting
  someone.
- Per-tenant activity analytics/charts on top of the log (e.g. "requests per hour by
  company") — this design is the raw monitoring feed; aggregate reporting on top of it
  is a separate, later capability.
- Frontend-only actions with no backend API call (e.g. viewing a page that renders
  from already-cached data) — every example in the original ask ("customer creates a
  job," "email sent") is backend-actioned, so backend interception already covers it
  without separate frontend instrumentation.
