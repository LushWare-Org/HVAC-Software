# Job Rescheduling — Design

**Date:** 2026-08-05
**Status:** Approved, ready for implementation planning

## Purpose

Today a customer books a job with a preferred date/time, an admin schedules it, and a
technician is dispatched. There is no path for either side to move an appointment once
it exists. In practice appointments move constantly — parts don't arrive, technicians
call in sick, customers aren't home. Right now that renegotiation happens over phone
calls the system never sees, and the calendar silently drifts out of date.

This feature makes rescheduling a first-class, two-way, auditable flow: either side can
open a request, both sides can propose or ask, and the outcome writes back to the
calendar with a record of how it was reached.

## Scope

**In scope:** reschedule negotiation on existing jobs — request, respond, apply — with
in-app + email notification on both sides, reason codes for analytics, a staleness nudge,
and status visible on every surface that displays a job time.

**Out of scope:** the initial booking flow (customer books → admin schedules) is
unchanged. Cancellation is unchanged and remains a separate action.

## Existing-code context

Findings from exploring the codebase before designing:

- **No rescheduling infrastructure exists.** The concept is absent from schema, API and UI.
- **`Job.scheduledStart` is overloaded.** `BookServiceModal.tsx:156` writes the customer's
  *preferred* time directly into `scheduledStart` at booking. So on a `PENDING` job it means
  "what the customer asked for" and on a `SCHEDULED` job it means "the appointment we
  committed to", with nothing distinguishing them. **This spec does not fix that** — it is
  pre-existing debt, recorded here as a follow-up. Rescheduling works either way because a
  request stores its own candidate slots; applying one overwrites `scheduledStart`, which is
  correct in both readings.
- **Reusable vocabulary already exists:** the portal's booking modal offers Morning
  (8:00–12:00), Afternoon (12:00–16:00), Evening (16:00–19:00) windows. Reschedule slots
  reuse these labels rather than inventing a second scheme.
- **In-app notifications work on both sides** via the `Notification` model
  (`channel = IN_APP`). `recipientId` is the staff `userId` for admins and the `customerId`
  for customers — see `notifications.service.ts:373`.
- **Scheduled work in this repo does not use `@nestjs/schedule`.** `agreements.cron.ts`
  uses a plain `setInterval` in `OnModuleInit` with an `isRunning` guard; `ScheduleModule`
  is never registered despite the dependency being installed. The nudge sweep follows that
  house pattern.
- **Technician assignments live in scheduling-service** (Go) and are cancelled via
  `PATCH /dispatch/assignments/:id/status` with `CANCELLED` (`models.go:60`).

## Decisions taken

| Question | Decision |
|---|---|
| Who has final authority over the calendar? | **Staff always confirm.** No calendar write happens without an explicit staff action. |
| How is a proposed time expressed? | **1–3 candidate slots**, the other side picks one. An open ask carries no slots. |
| What is a "customer preference"? | Just the content of that request — an open ask, or specific proposed slots. It varies per request; there is **no** learned profile or standing preference. |
| What happens to the assigned technician on apply? | **Auto-unassign.** The job returns to the dispatch queue. |

## Architecture

**Approach: a dedicated request table plus one denormalized pointer column on `Job`.**

`RescheduleRequest` holds the full negotiation. `Job` gains a single nullable
`rescheduleState` column, written in the same transaction so it cannot drift.

That one column is what makes the "visible everywhere" requirement structurally cheap
rather than a discipline problem: every job list on every surface already selects `Job`,
so a status badge costs zero extra queries — no join, no N+1, and no per-surface fetch
that a developer has to remember to add. It is also indexable, which is exactly what the
staff inbox query needs.

Alternatives rejected:

- **Request table only, joined where needed.** Purer, but each of ~14 surfaces needs its
  own join or follow-up query and must independently remember to do it. That is how the
  badge ends up on the jobs list and missing from the day planner.
- **Everything as columns on `Job`.** Fewest moving parts, but each counter-proposal
  overwrites the last, so the negotiation history is lost. For a negotiation feature,
  that is the wrong thing to lose.

## Data model

New tables in the `jobs` schema.

```prisma
model RescheduleRequest {
  id             String   @id @default(uuid())
  companyId      String
  jobId          String
  job            Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)

  openedBy       RescheduleActor   // ADMIN | CUSTOMER
  openedByUserId String?
  openedByName   String?
  mode           RescheduleMode    // PROPOSE_SLOTS | OPEN_ASK
  reasonCode     RescheduleReason  // required — see enum below
  reason         String?           // free text, shown verbatim to the other side

  slots          RescheduleSlot[]  // 1–3 when PROPOSE_SLOTS, empty when OPEN_ASK

  status          RescheduleStatus
  pickedSlotId    String?
  responseNote    String?
  respondedAt     DateTime?
  respondedByName String?
  appliedAt       DateTime?
  nudgedAt        DateTime?        // set by the staleness sweep; null = not yet nudged

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([companyId, jobId])
  @@index([companyId, status])
}

model RescheduleSlot {
  id        String   @id @default(uuid())
  requestId String
  request   RescheduleRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  startAt   DateTime
  endAt     DateTime
  window    String?  // 'morning' | 'afternoon' | 'evening' — display label only
}

enum RescheduleActor  { ADMIN  CUSTOMER }
enum RescheduleMode   { PROPOSE_SLOTS  OPEN_ASK }

enum RescheduleStatus {
  AWAITING_RESPONSE   // ball is with the other side
  SLOT_PICKED         // customer chose one of staff's slots; awaiting staff apply
  DECLINED
  SUPERSEDED          // replaced by a counter-proposal
  APPLIED
  CANCELLED
}

enum RescheduleReason {
  PARTS_DELAY  TECH_UNAVAILABLE  WEATHER  EMERGENCY_BUMP  CAPACITY  // staff-side
  CUSTOMER_UNAVAILABLE  ACCESS_ISSUE                                 // customer-side
  OTHER                                                              // both
}
```

Slots are a child table rather than a JSON column because `pickedSlotId` writes directly
to a customer's calendar. A foreign key makes "the applied slot is one we actually
offered" a database guarantee rather than something the service is trusted to have
validated.

**How `startAt` / `endAt` are derived.** A slot is always stored as a concrete UTC
interval, but there are two ways to author one and they must not be conflated:

- **Window slot** (the portal default, and what customers always get): the proposer picks
  a date and one of Morning / Afternoon / Evening. `startAt` and `endAt` are that window's
  bounds on that date — Morning is 08:00–12:00, Afternoon 12:00–16:00, Evening
  16:00–19:00, in the company timezone. `window` records which one, so the UI can render
  "Tue 12 · Morning" rather than a raw time range.
- **Exact slot** (staff only, in the admin modal): the proposer picks a specific start
  time. `endAt` is `startAt + Job.estimatedDurationMins`, falling back to 2 hours when the
  job has no estimate. `window` is `null`.

On apply, `Job.scheduledStart` / `scheduledEnd` take the slot's `startAt` / `endAt`
verbatim in both cases, so a window slot produces a genuinely 4-hour-wide appointment —
which is the honest representation of what the customer actually agreed to.

`reasonCode` is required on both sides. An optional analytics field is an empty analytics
field. The UI offers each actor only its own subset — an admin never sees `ACCESS_ISSUE`,
a customer never sees `PARTS_DELAY` — with `OTHER` plus the free-text `reason` as the
escape hatch.

On `Job`, one new column:

```prisma
rescheduleState  RescheduleState?   // AWAITING_CUSTOMER | AWAITING_ADMIN | READY_TO_APPLY

enum RescheduleState { AWAITING_CUSTOMER  AWAITING_ADMIN  READY_TO_APPLY }
```

`null` means no open request. Counters **append**: the current row is marked `SUPERSEDED`
and a new row inserted, so the full history survives and "this has bounced three times"
is a row count.

## The negotiation

Both sides get the same two openings:

|  | Staff opens | Customer opens |
|---|---|---|
| **Propose slots** | "Can you do Tue 9am, Wed 1pm, or Thu 4pm?" | "Can we do Tuesday 2pm?" |
| **Open ask** | "We need to move this — when suits you?" | "I need to reschedule this." |

Whoever holds the ball may: **pick a slot** · **counter with slots** · **decline** ·
(on an open ask) **answer with slots**.

State transitions:

```
customer opens ─────────────────────────► Job.rescheduleState = AWAITING_ADMIN
staff opens ────────────────────────────► Job.rescheduleState = AWAITING_CUSTOMER
customer picks one of staff's slots ────► Job.rescheduleState = READY_TO_APPLY
staff picks one of customer's slots ────► applies immediately
counter-proposal ───────────────────────► old row SUPERSEDED, new row, state flips sides
decline / cancel ───────────────────────► Job.rescheduleState = null
```

The asymmetry on the two "picks" lines is the *staff always confirm* rule: a staff member
picking a slot **is** the confirmation, so it applies in that one action. A customer
picking parks at `READY_TO_APPLY`, surfaced as a single **Apply** button in the staff
inbox so it does not become a bottleneck.

### Applying

One transaction, then fire-and-forget notifications:

1. `Job.scheduledStart` / `scheduledEnd` ← the picked slot
2. Clear `Job.assignedToId` / `assignedToName`; `Job.status` → `PENDING`
3. Cancel the scheduling-service assignment: `PATCH /dispatch/assignments/:id/status` → `CANCELLED`
4. Request → `APPLIED`; `Job.rescheduleState` → `null`

Step 2 requires adding **`SCHEDULED → PENDING`** to `STATUS_TRANSITIONS` in
`update-job-status.dto.ts`. It now carries a real meaning — "descheduled back to the
dispatch queue" — rather than being a hole in the state machine. `PENDING` is what the
dispatch queue is in this codebase: `BoardLive`'s "Unassigned now" column is
`status = PENDING`.

Step 3 is best-effort and logged on failure; a scheduling-service blip must not roll back
a calendar change the customer has already been promised.

### Who may open a request

| Job status | Staff | Customer |
|---|---|---|
| `PENDING`, `SCHEDULED`, `ON_HOLD` | yes | yes |
| `EN_ROUTE` | yes — requires `confirmEnRoute` | no |
| `ON_SITE`, `COMPLETED`, `INVOICED`, `PAID`, `CANCELLED` | no | no |

One open request per job. A second cannot be opened; the existing one is countered instead.

### `EN_ROUTE` handling

A technician already driving is the one case where opening and applying need different
treatment, because two different situations produce it:

- **Staff open it deliberately** — the customer rings to say they are not home while the
  technician is en route. This is real and must work.
- **The technician departs mid-negotiation** — a request opened while `SCHEDULED`, and the
  customer picks a slot hours later, unaware anyone is already driving.

Both are handled by the same rule: `apply` on an `EN_ROUTE` job is permitted **only** when
the caller passes `confirmEnRoute: true`, which the UI surfaces as an explicit warning
dialog naming the technician. Without it, `apply` returns `409` with a message telling
staff to confirm or handle it as a no-show. The one-click **Apply** button in the inbox
never sends the flag, so an unaware click can never cancel a technician mid-drive.

## API

A dedicated `RescheduleModule` in job-service rather than growing `JobsController`, which
is already large.

```
POST   /reschedule/jobs/:jobId    open a request              staff + customer
GET    /reschedule/jobs/:jobId    full history for a job      staff + customer
POST   /reschedule/:id/respond    pick / counter / decline    staff + customer
POST   /reschedule/:id/apply      commit to the calendar      staff only
POST   /reschedule/:id/cancel     withdraw your own request   staff + customer
GET    /reschedule/inbox          everything awaiting staff   staff only
GET    /reschedule/stats          counts by reason / actor    staff only
```

Reached from the frontends as `/jobs/reschedule/…` through the existing gateway prefix.

**Authorization** reuses the pattern in `jobs.controller.ts`: a `CUSTOMER` caller is
checked against `job.customerId !== user.customerId` on every route and can only act on
their own jobs. `apply` is restricted to `SUPER_ADMIN` / `COMPANY_ADMIN` /
`OFFICE_MANAGER` / `DISPATCHER` — dispatchers run the calendar, so excluding them would
defeat the purpose. As with the force-status override, the role check lives in the
service, not only in the guard.

`respond` validates the caller is the side holding the ball: a customer cannot accept
their own proposal, and a stale tab replying to a superseded round gets `409`.

`GET /reschedule/stats?from=&to=` returns counts grouped by `reasonCode`, by `openedBy`,
and applied-vs-declined totals. It is deliberately **not** wired into analytics-service —
the data is queryable there whenever wanted, and cross-schema reporting is a larger job
than this feature should carry.

## UI

Two shared pieces per app, then each surface is a small drop-in.

- **`<RescheduleBadge job={job} />`** — returns `null` when `job.rescheduleState` is null,
  so it is safe to place unconditionally. Zero fetch; reads a field the surface already has.
- **`<RescheduleModal jobId />`** — the whole negotiation: open a request, respond to one,
  read the history.

admin-dashboard and customer-portal are separate Vite apps with no shared UI package
(`packages/` holds types, auth-client, queue only). The **types** go in `packages/types`
and are shared; the components are deliberately duplicated rather than inventing a UI
package for two consumers.

Copy flips to each side's perspective off the same column:

| `rescheduleState` | Staff sees | Customer sees |
|---|---|---|
| `AWAITING_ADMIN` | **Reschedule · needs reply** (amber) | Reschedule requested (blue) |
| `AWAITING_CUSTOMER` | Reschedule · awaiting customer (blue) | **Pick a time** (amber) |
| `READY_TO_APPLY` | **Ready to apply** (green) | Confirming your time (blue) |

Amber always means "you are the holdup"; red means stale (see nudge). That single rule
makes the badge readable at a glance on any surface without reading the label.

### Placements

**Admin — new inbox:** a **Reschedules** sub-tab in `scheduling/Scheduling.tsx` alongside
Board / Active / Completed / Calendar, with a count. This is the primary workspace:
everything awaiting staff, each row one click from Apply, with the reason-code stats strip
across the top.

**Admin — badge + action:** `jobs/Jobs.tsx`, `jobs/JobDetailModal.tsx`,
`dispatch/JobDetailPanel.tsx`, `dispatch/DispatchCalendar.tsx`, `scheduling/BoardPlan.tsx`
(day planner), `customers/CustomerDetailsSidebar.tsx`, `projects/ProjectDetail.tsx`,
`projects/HousesTab.tsx`.

**Portal — banner:** `Dashboard.tsx` shows an unmissable banner when the ball is the
customer's ("We've proposed 3 times for your AC service — pick one"). This is the highest-
leverage surface: a reschedule the customer never notices becomes a no-show.

**Portal — badge + action:** `jobs/Jobs.tsx`, `jobs/JobDetailModal.tsx` (full
request/respond), `MyHouse.tsx`, `MyProjects.tsx`.

## Notifications

A dedicated `RescheduleNotificationService` in comms-service, mirroring
`EnRouteNotificationService` (its own endpoint `POST /notifications/reschedule`, its own
spec) rather than growing `automation.service.ts`.

job-service calls it **fire-and-forget**, the same pattern applied to invoice send: a slow
SMTP relay must never make "apply reschedule" fail after the calendar has already moved.

| Event | Customer | Staff |
|---|---|---|
| Staff opens request | in-app + email | — |
| Customer opens request | — | in-app |
| Customer picks / counters / declines | — | in-app |
| Staff responds | in-app + email | — |
| Applied | in-app + email | — |
| Cancelled / declined | in-app + email | in-app |
| Nudge (48h silence) | in-app + email *(if ball is theirs)* | in-app *(if ball is theirs)* |

Emails reuse the job-status family: solid accent header, uppercase eyebrow, 560px card,
**no gradients**. Accent colour follows the amber-means-you're-the-holdup rule.

Emails **deep-link into the portal** (`/jobs?reschedule=<jobId>`), which requires login.
A one-click magic-link accept was considered and rejected: a token in an email means
anyone with access to that inbox can move the appointment.

Notifying staff requires "who are the dispatchers at this company", which comms-service
cannot currently answer. This adds a small `StaffDirectoryClient` calling crm-service,
cached 5 minutes, copied from `CompanySettingsClient`'s shape. Recipients: dispatchers,
office managers, company admins.

## Staleness nudge

An hourly sweep in job-service following the `agreements.cron.ts` house pattern —
`setInterval` in `OnModuleInit` with an `isRunning` guard, no new dependency.

- **48h with no reply** → re-notify whoever holds the ball, stamp `nudgedAt`. Symmetric:
  if staff are sitting on it, staff get nudged.
- **5 days with no reply** → the inbox row and badge turn red. Derived from `createdAt`
  in the query; no extra column.

**Multi-instance safety.** Cloud Run runs several instances and each would fire this
interval, so the naive version sends duplicate nudges. The claim is conditional:

```sql
UPDATE reschedule_requests SET "nudgedAt" = now()
WHERE id = $1 AND "nudgedAt" IS NULL
```

Zero rows affected means another instance already claimed it — skip, send nothing.

## Error handling and edge cases

**Concurrent apply.** Two staff members applying at once would each read `SLOT_PICKED`,
write the calendar, and send a confirmation email — two different times, last write wins.
Prevented with a conditional update inside the transaction:

```sql
UPDATE reschedule_requests SET status = 'APPLIED'
WHERE id = $1 AND status = 'SLOT_PICKED'
```

Zero rows affected → `409`, no calendar write, no email. The same guard applies to
`respond` so a stale tab answering a superseded round fails cleanly.

**Stale slot.** A customer may sit on the email for days and then pick a slot that has
passed. Past slots render struck-through and unselectable; both `respond` and `apply`
re-validate server-side, so a slot can never be applied into the past.

**Job moves underneath the request.** A technician may complete the job while a reschedule
is open. `apply` re-reads job status and refuses if it has left the allowed set,
auto-cancelling the request. Without this, applying would resurrect a `COMPLETED` job to
`PENDING`.

**Technician goes en route mid-negotiation.** `apply` refuses with `409` unless the caller
passes `confirmEnRoute: true` — see *`EN_ROUTE` handling* above. Silently cancelling a
technician who is already driving is worse than forcing a human decision.

**Two open requests on one job.** Service-level check plus a partial unique index, added
as raw SQL in the migration since Prisma cannot express partial uniques:

```sql
CREATE UNIQUE INDEX "reschedule_one_open_per_job"
ON "jobs"."reschedule_requests" ("jobId")
WHERE status IN ('AWAITING_RESPONSE', 'SLOT_PICKED');
```

**Timezone.** Slots are stored in UTC and rendered in the company timezone via the same
`settings.timezone` that `formatWindow` already uses. On a scheduling feature, staff and
customer seeing different clock times would be the worst possible failure.

**Customer has no email.** In-app only; never fail the request.

**Job deleted.** `onDelete: Cascade` on both new tables. Cancelling a job auto-cancels any
open request.

## Testing

Backend unit tests against mocked Prisma, following `jobs.service.spec.ts`:

- **Transition matrix** — who may respond in each state; the wrong side is rejected.
- **Authorization** — a customer cannot `apply`, cannot act on another customer's job,
  cannot accept their own proposal.
- **Apply transaction** — all four writes occur; `409` when the conditional update matches
  zero rows; scheduling-service failure does not roll back the calendar change.
- **Refusals** — stale slot, job moved underneath, technician en route.
- **Nudge sweep** — claims exactly once under a simulated concurrent second instance;
  nudges the correct side.
- **`RescheduleNotificationService`** — spec mirroring `enroute.service.spec.ts`.

Frontends have no test runner (per `CLAUDE.md`), so `tsc -b` via `build` is the gate.

## Suggested phasing

This is one coherent subsystem, but it is large enough that the implementation plan should
stage it so each stage is independently shippable and testable:

1. **Backend core** — schema + migration, `RescheduleModule` (open / respond / apply /
   cancel / history), the `SCHEDULED → PENDING` transition, unit tests. Nothing user-visible
   yet, fully testable.
2. **Negotiation UI, both sides** — `RescheduleBadge` + `RescheduleModal` in each app,
   wired into `jobs/JobDetailModal.tsx` (admin) and `jobs/JobDetailModal.tsx` +
   `jobs/Jobs.tsx` (portal). This is the smallest set that makes the feature genuinely
   usable end to end.
3. **Staff inbox** — the Reschedules sub-tab, `GET /reschedule/inbox`, one-click Apply.
4. **Notifications** — `RescheduleNotificationService`, `StaffDirectoryClient`, the email
   templates, portal Dashboard banner.
5. **Remaining placements** — the other nine badge surfaces. Cheap and mechanical once the
   shared components exist.
6. **Reason-code stats + nudge sweep** — `GET /reschedule/stats`, the stats strip, the
   hourly sweep with its conditional claim.

Stages 1–2 are the minimum that delivers value. Everything after is additive.

## Follow-ups (not in this spec)

- **Fix the `scheduledStart` overloading** by adding a separate `requestedStart`, so "what
  the customer asked for" and "what we committed to" stop sharing one column.
- **Propose from real capacity** — pre-fill candidate slots from days with technician
  headroom using existing day-planner data, so staff stop offering slots they cannot staff.
- **SMS** — the Twilio pipeline exists; after en-route this is the highest-value SMS in the
  system.
- **"Rescheduled 3×" counter** on the job, making chronic churn visible.
- **`agreements.cron.ts` has the same multi-instance duplicate-send exposure** the nudge
  sweep guards against. Not touched here, but worth fixing.
