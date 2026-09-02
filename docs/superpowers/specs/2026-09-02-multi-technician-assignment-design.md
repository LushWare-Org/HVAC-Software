# Multi-technician assignment — design

**Status:** approved, ready for implementation planning
**Date:** 2026-09-02

## Problem

A job can only have one technician. In the field a crew often goes: an AC
installation needs a lead, an electrician and a helper. Today a dispatcher has
to pick one person and tell the rest by phone, so the system does not know who
is on site, the customer is told about one technician when three arrive, and
nobody but the named technician sees the job in the mobile app.

For KASE specifically, **crew members come and go on their own schedule** — the
lead arrives at 09:00, the electrician joins at 11:00 and leaves at 12:00 — and
each needs their own sign-off.

## What already exists

Discovery found this is not greenfield. Three things are already in place:

1. **`scheduling.dispatch_assignments` is already a join table.** One row per
   (job, technician), and critically **no unique constraint on `job_id`**
   (`apps/scheduling-service/migrations/001_scheduling_schema.sql:91`). Multiple
   technicians per job are storable today.
2. **`WorkOrder` is already a per-technician unit.** It carries `technicianId`,
   its own status (`PENDING → EN_ROUTE → ON_SITE → COMPLETED`), its own
   `scheduledStart`/`scheduledEnd`, `checkinAt`/`checkoutAt`, `signatureUrl`,
   task completions and line items. A job can already have many.
   `dispatch_assignments.work_order_id` exists to link them.
3. **`ProjectRosterDay.techUserIds String[]`** already models a multi-tech crew
   with per-day overrides, so an array of user ids on a record is an
   established pattern here.

The single-technician limit lives in application logic and UI, not the
database. The most damaging instance is
`apps/admin-dashboard/src/pages/scheduling/Scheduling.tsx:140`, where
`assignmentByJobId` reduces many assignment rows to one, keeping the most
recently updated. **Every board built on that map silently drops extra
technicians today.**

## Decisions

Recorded with rationale, because several were close calls.

### One data model, not two

Per-tenant "shared crew" versus "individual crew" was considered and rejected
as two models. A crew working as one unit is a strict subset of individually
tracked members — same window, one sign-off. Two models would force every
downstream consumer (portal, mobile app, invoicing, analytics, reschedule,
en-route notification, dispatch map) to branch forever, and would lock tenants
in: switching later would mean migrating live data.

Instead: **one model, and a `features.crewMode` flag reserved on `Company.features`
controlling UI and workflow strictness only.** Ship `individual` (what KASE
needs) first. Add `shared` when a second tenant actually asks. The simple mode
is easy to derive from the detailed one; the reverse is not.

### The lead drives job status

Job status stays a single value driven by one person, rather than a rollup
computed from crew members. `Job.status` keeps its existing state machine
(`PENDING → SCHEDULED → EN_ROUTE → ON_SITE → COMPLETED`) and its existing
meaning to the customer portal, dispatch map, en-route email and reschedule
flow. Non-lead members move their **own** `WorkOrder.status` and sign their own
work; they never move the job.

A rollup was considered. It was rejected because "the job is EN_ROUTE when the
first member sets off" means the customer gets "your technician is on the way"
about a helper rather than the person they expect, and because it would change
the meaning of a field that six subsystems already depend on.

### The dispatcher builds the crew every time

Smart assign keeps proposing the single best technician, exactly as today. The
dispatcher adds more from a ranked list. Template-defined crew requirements
were considered and rejected: KASE's jobs are not uniform enough for template
crews to be maintained, and an unmaintained template is worse than none.

`Job.requiredTechCount` is an **optional target** set by admin or dispatcher. It
changes how many candidates smart assign proposes and what the UI counts
against ("2 of 3"). It never blocks confirmation. Jobs without it behave
identically minus the target.

### Assignments and work orders, both

Assignments carry dispatch and scoring; work orders carry on-site execution.
`dispatch_assignments` alone cannot hold per-member check-in, signature or line
items. `WorkOrder` alone has no scoring, distance or dispatch semantics and
lives in the wrong service for the assignment algorithm. The
`work_order_id` column on `dispatch_assignments` was clearly designed for this
pairing.

## Data model

### `scheduling.dispatch_assignments`

```sql
ALTER TABLE scheduling.dispatch_assignments
  ADD COLUMN is_lead            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN base_distance_km   NUMERIC(8,3);

-- A technician cannot be added to the same job twice.
CREATE UNIQUE INDEX uq_assignment_job_tech
  ON scheduling.dispatch_assignments (job_id, technician_id)
  WHERE status <> 'CANCELLED';

-- Exactly one lead per job.
CREATE UNIQUE INDEX uq_assignment_job_lead
  ON scheduling.dispatch_assignments (job_id)
  WHERE is_lead AND status <> 'CANCELLED';
```

`base_distance_km` is distance from the member's base at assign time, stored
alongside the existing `distance_km` (distance from their live position) so the
two are never confused.

### `scheduling.technicians`

```sql
ALTER TABLE scheduling.technicians
  ADD COLUMN base_location geometry(Point, 4326);
CREATE INDEX idx_technicians_base ON scheduling.technicians USING GIST(base_location);
```

Synced from `crm.company_users.latitude/longitude` ("location submitted at
signup", `apps/crm-service/prisma/schema.prisma:103`), which the technician
onboarding flow already populates.

**Why base, not current position:** scheduling a job for next Tuesday, where a
van happens to be parked right now predicts nothing. Where a technician starts
their day does. Current position stays what live tracking uses.

**Sync ownership:** crm-service owns the value. On any change to a
`CompanyUser`'s latitude/longitude, crm-service calls
`PATCH /scheduling/technicians/:id/base-location`. A nightly reconciliation job
re-syncs all technicians to repair drift from missed calls. If
`base_location` is null, candidate scoring falls back to `current_location`,
and to a null distance if both are absent — a technician with no location is
still assignable, just unscored on distance.

### `jobs.Job`

```prisma
assignedToId      String?    // now: THE LEAD's CompanyUser id
assignedToName    String?    // now: THE LEAD's name
crewUserIds       String[]   @default([])   // all crew, lead included
requiredTechCount Int?                      // optional target
```

`assignedToId` is redefined rather than replaced, so the customer portal,
dispatch map, invoicing, reschedule and en-route email keep working untouched.
A solo job is a crew of one, with that person as lead.

`crewUserIds` is denormalised because the technician app's "my jobs" query hits
job-service (`?assignedToId=me`) while crew membership lives in the Go
scheduling service. Without it, the mobile app's hottest query becomes a
cross-service join. It is maintained by job-service whenever crew changes, in
the same transaction as the job update.

### `jobs.WorkOrder`

Unchanged schema. One row per crew member instead of one per job, created when
a crew is confirmed. `technicianId` identifies the member; `scheduledStart` and
`scheduledEnd` carry that member's own window, which is what makes "the
electrician joins at 11:00" representable.

## API

### New: crew candidates

```
GET /scheduling/dispatch/candidates
    ?jobId=<id>&start=<iso>&end=<iso>&limit=10
```

```jsonc
[{
  "technician": { "id", "userId", "name", "avatarUrl", "skills", "rating" },
  "score": 71,                       // existing 40/35/25 distance/workload/rating
  "baseDistanceKm": 8.0,
  "activeJobsThatDay": 3,
  "conflicts": [{
    "jobId", "jobNumber", "title",
    "start": "2026-09-09T09:00:00Z",
    "end":   "2026-09-09T10:30:00Z",
    "lat": 6.8412, "lng": 79.8631,
    "distanceFromSiteKm": 1.4
  }]
}]
```

The `conflicts` array powers the amber explanation panel and the clash pins on
the map. It is the difference between "Carlos is busy" and "Carlos finishes
1.4 km away at 10:30 and could reach you by about 10:50" — a dispatcher can
only sensibly overrule a warning that explains itself.

Conflicts are computed over the job's **scheduled date**, not today, because
overlaps on a future day are the normal case when planning ahead.

### Changed: assignment endpoints

```
POST   /scheduling/dispatch/assign          + requiredCount?: number
POST   /scheduling/dispatch/assign/manual   technicianIds: string[], leadTechnicianId: string
PATCH  /scheduling/dispatch/jobs/:jobId/crew   full crew replacement (add/remove/change lead)
```

`PATCH .../crew` is transactional: it rewrites the assignment set, sets exactly
one lead, and calls job-service to update `assignedToId`, `assignedToName` and
`crewUserIds`. A partial failure leaves neither side changed.

Existing single-technician request shapes stay accepted and are treated as a
crew of one, so nothing that calls these today breaks.

## Assignment flows

**Manual assign** and **job detail** open the crew control center for one job.

**Auto schedule day** keeps the existing preview table
(`BoardPlan.tsx:119` `previewEdits`, `applyPlan`), extended with a crew column.
Rows needing a decision are flagged in place and open the control center on
click. Confirm commits only the ready rows; flagged rows stay unassigned rather
than blocking the whole plan.

`buildDayPlan` in `apps/admin-dashboard/src/lib/dayPlan.ts` gains crew
awareness: `ProposedAssignment.tech` becomes `crew: Technician[]` with a
`leadId`, and the planner fills up to `requiredTechCount` where set.

## Status semantics

| Actor | Can change |
|---|---|
| Lead | `Job.status`, and their own `WorkOrder.status` |
| Non-lead member | Their own `WorkOrder.status` only |
| Dispatcher / admin | Both, from the dashboard |

Removing the lead without naming a replacement is rejected with a clear error.
The partial unique index makes a headless crew impossible at the database
level, and the API surfaces it as a validation message rather than a 500.

Job completion stays the lead's action. A job whose lead marks it complete
while another member's work order is still open surfaces a warning in the
dashboard; it is not blocked, because the office often knows the remaining
work was cancelled.

## Customer communications

The en-route email already fetches one technician's avatar with an initials
fallback (`apps/comms-service/src/enroute/enroute.service.ts:49`). Extend
`fetchTechAvatar` to `fetchCrewAvatars`, and the template to list the whole
crew, marking who leads:

> **David Chen** is leading, with **Rachel Kim** and **Carlos Rivera**.

Photos for everyone, initials for anyone without one. The customer portal job
view shows the same crew with the same treatment.

SMS stays lead-only plus a count ("David Chen and 2 others are on the way") —
crew lists do not fit a text message.

## Technician app

"My jobs" changes from `assignedToId = me` to `me ∈ crewUserIds`. Job cards show
the crew and mark the lead. Non-leads see the job, the crew, and their own work
order; the job-status controls are visible but disabled with an explanation
naming the lead, rather than hidden — a hidden control reads as a bug.

## Back-compat and migration

Every existing job becomes a crew of one:

```sql
-- Existing assignments become leads of their own job.
UPDATE scheduling.dispatch_assignments a SET is_lead = true
WHERE status <> 'CANCELLED'
  AND NOT EXISTS (
    SELECT 1 FROM scheduling.dispatch_assignments b
    WHERE b.job_id = a.job_id AND b.status <> 'CANCELLED' AND b.id < a.id
  );
```

Where a job somehow has several live assignments, the earliest becomes lead —
matching the "one technician" the dispatcher originally chose more closely than
the most-recent row the UI happens to show today.

`Job.crewUserIds` backfills from `assignedToId` where non-null. Jobs with no
assignment get an empty array.

`assignmentByJobId` in `Scheduling.tsx` is replaced by `assignmentsByJobId`
returning arrays. This is the change most likely to cause regressions: **28
usages across four components** (`Scheduling`, `BoardLive`, `DispatchCalendar`,
`DispatchMap`), each assuming a single object. `DispatchMap` is the subtlest —
its `routeLines` builds one line per assignment, so it becomes one line per
crew member and needs de-duplication by job to avoid three overlapping lines to
the same site.

## Error handling

- Adding a technician already on the job: rejected by unique index, surfaced as
  "David Chen is already on this crew".
- Removing the last member: allowed, leaves the job unassigned and clears
  `assignedToId`. This is how a dispatcher undoes a mistake.
- Removing the lead with others remaining: rejected, "Choose a new lead first".
- Confirming a crew smaller or larger than `requiredTechCount`: allowed. The
  button states what it will do ("Confirm crew of 2"), so it can never silently
  disagree with the target.
- Adding a technician with a conflict: allowed with a warning naming the
  clashing job and offering to reschedule it.
- Candidates endpoint unreachable: the panel still opens with the current crew
  and manual search; ranking and conflict detection degrade to unavailable
  rather than blocking assignment.

## Testing

- **Go, scheduling-service:** crew CRUD, exactly-one-lead invariant under
  concurrent writes, conflict detection across day boundaries and adjacent
  windows (a job ending exactly when another starts is not a conflict),
  candidate scoring with and without `base_location`.
- **Jest, job-service:** `crewUserIds` stays consistent with assignments,
  lead-only status transitions, work order creation per member.
- **Jest, comms-service:** crew email renders all members, marks the lead, falls
  back to initials, and does not break when the crew is one.
- **Migration:** run the backfill against a copy of production data and assert
  every previously assigned job has exactly one lead and a matching
  `crewUserIds`.

## Out of scope

- `crewMode: shared` — reserved in the flag, not built.
- Per-member billing rates and labour cost roll-up to the invoice. Line items
  aggregate to the job; `Invoice.workOrderId` stays a nominal single reference
  (nothing in finance-service reads it today).
- Crew templates on `JobTemplate`.
- Automatic crew suggestions based on skill requirements.

## Open risks

1. **Base-location sync across a schema boundary.** crm owns the value, the Go
   service needs it in SQL for distance scoring. The nightly reconciliation is
   the safety net; without it, drift is silent and shows up as bad rankings.
2. **`WorkOrder` semantics shift** from one-per-job to one-per-member. Nothing
   in finance reads it today, but admin screens that assume one will need
   revisiting.
3. **`assignmentByJobId` fan-out.** 28 usages across four components, each
   assuming a single object. Highest regression risk in the whole change, and
   the reason the migration should land behind a short verification pass on the
   dispatch boards rather than going straight out.
