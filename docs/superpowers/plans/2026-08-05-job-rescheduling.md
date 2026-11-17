# Job Rescheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let customers and staff negotiate a new appointment time for an existing job — either side proposing candidate slots or asking openly — with the agreed time written back to the calendar by staff, and the negotiation's status visible everywhere a job time is shown.

**Architecture:** A `RescheduleRequest` table in the `jobs` schema holds the full negotiation (counters append new rows, so history survives), plus a single denormalized `rescheduleState` column on `Job` written in the same transaction. That column is what makes status badges free on all ~14 surfaces — no join, no N+1. Notifications go out fire-and-forget from job-service to a dedicated comms-service endpoint modelled on the existing en-route notifier.

**Tech Stack:** NestJS 10 + Prisma (job-service, comms-service), PostgreSQL 16 multi-schema, React 19 + TanStack Query + Vite (admin-dashboard, customer-portal), Jest for backend tests.

**Spec:** `docs/superpowers/specs/2026-08-05-job-rescheduling-design.md`

## Global Constraints

- **Never run `git commit`.** The repo owner commits manually and does not want Claude recorded as a contributor. Each task ends with tests green and files staged via `git add` — never `git commit`.
- **`pnpm` only.** The `preinstall` hook rejects npm and yarn.
- **Every query is company-scoped.** Every table carries `companyId`; filter on it in every read and write.
- **Money and dates:** slot times are stored in UTC and rendered in the company timezone from `settings.timezone` (the same value `EnRouteNotificationService.formatWindow` uses).
- **Status enums are UPPER_SNAKE_CASE.**
- **Emails use solid colors only — no gradients.** Match the existing job-status email family: solid accent header, uppercase eyebrow, 560px card, footer `Sent by {companyName} · Powered by HVACtor.ai`.
- **Amber always means "you are the holdup"** in badge colors; red means stale (5+ days).
- **Cross-service calls are fire-and-forget** where they are not required for correctness — a slow comms-service must never fail a calendar write.
- **Role checks live in the service**, not only in the `@Roles` guard — matching the pattern used by the job status-override work.
- Prisma client output for job-service is `../src/prisma/generated`; import `Prisma` and enums from `'../prisma/generated'`.
- Frontends have no test runner. `pnpm --filter <app> build` (which runs `tsc -b`) is the gate.

## Window definitions (used throughout)

| key | label | start | end |
|---|---|---|---|
| `morning` | Morning | 08:00 | 12:00 |
| `afternoon` | Afternoon | 12:00 | 16:00 |
| `evening` | Evening | 16:00 | 19:00 |

These match `WINDOWS` in `apps/customer-portal/src/pages/jobs/BookServiceModal.tsx:42-46`.

## File Structure

**`packages/types`** — shared vocabulary both backends and both frontends import.
- Create `src/reschedule.ts` — enums, window table, per-actor reason lists, allowed-status lists.
- Modify `src/index.ts` — re-export.

**`apps/job-service`** — owns the negotiation and the calendar write.
- Modify `prisma/schema.prisma` — two models, four enums, one `Job` column.
- Create `prisma/migrations/20260805000000_add_reschedule/migration.sql`.
- Create `src/reschedule/reschedule.module.ts`
- Create `src/reschedule/reschedule.controller.ts` — HTTP + role gates.
- Create `src/reschedule/reschedule.service.ts` — open / respond / cancel / queries.
- Create `src/reschedule/reschedule-apply.service.ts` — the four-step apply transaction. Split from the main service because it is the only piece that mutates the calendar and calls another service; keeping it separate keeps both files small enough to hold in context.
- Create `src/reschedule/scheduling.client.ts` — cancels the dispatch assignment.
- Create `src/reschedule/reschedule-notify.client.ts` — fire-and-forget to comms-service.
- Create `src/reschedule/reschedule-nudge.cron.ts` — hourly staleness sweep.
- Create `src/reschedule/dto/reschedule.dto.ts`
- Create three spec files alongside the services.
- Modify `src/jobs/dto/update-job-status.dto.ts` — add `SCHEDULED → PENDING`.
- Modify `src/app.module.ts` — register `RescheduleModule`.

**`apps/comms-service`** — owns delivery.
- Create `src/reschedule/reschedule-email.ts` — pure HTML builders, testable without Nest.
- Create `src/reschedule/reschedule-notification.service.ts`
- Create `src/reschedule/reschedule.controller.ts`
- Create `src/reschedule/reschedule.module.ts`
- Create `src/reschedule/dto/reschedule-notification.dto.ts`
- Create `src/company-settings/staff-directory.client.ts` — "who are the dispatchers", cached.
- Modify `src/app.module.ts`

**`apps/admin-dashboard`**
- Create `src/hooks/useReschedule.ts`
- Create `src/components/reschedule/RescheduleBadge.tsx`
- Create `src/components/reschedule/SlotPicker.tsx`
- Create `src/components/reschedule/RescheduleModal.tsx`
- Create `src/pages/scheduling/ReschedulesInbox.tsx`
- Modify `src/types/api.ts`, then nine surfaces listed in Task 19.

**`apps/customer-portal`**
- Create `src/hooks/useMyReschedule.ts`
- Create `src/components/reschedule/RescheduleBadge.tsx`
- Create `src/components/reschedule/RescheduleModal.tsx`
- Create `src/components/reschedule/RescheduleBanner.tsx`
- Modify four surfaces listed in Tasks 23–25.

---

# Phase 1 — Foundation

### Task 1: Shared reschedule vocabulary in `packages/types`

Every later task imports from here. Building it first means no task has to invent its own copy of the window table or the allowed-status lists.

**Files:**
- Create: `packages/types/src/reschedule.ts`
- Modify: `packages/types/src/index.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `RescheduleActor`, `RescheduleMode`, `RescheduleStatus`, `RescheduleState`, `RescheduleReason` (string enums); `RESCHEDULE_WINDOWS`; `STAFF_REASONS`; `CUSTOMER_REASONS`; `STAFF_RESCHEDULABLE_STATUSES`; `CUSTOMER_RESCHEDULABLE_STATUSES`; `slotFromWindow(dateISO, windowKey, timeZone)` returning `{ startAt: Date; endAt: Date; window: string }`.

- [ ] **Step 1: Create the vocabulary file**

```ts
// packages/types/src/reschedule.ts

/** Which side of the negotiation acted. */
export enum RescheduleActor {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
}

/** How a request was opened: with candidate slots, or as an open question. */
export enum RescheduleMode {
  PROPOSE_SLOTS = 'PROPOSE_SLOTS',
  OPEN_ASK = 'OPEN_ASK',
}

/** Lifecycle of one round of the negotiation. */
export enum RescheduleStatus {
  AWAITING_RESPONSE = 'AWAITING_RESPONSE',
  SLOT_PICKED = 'SLOT_PICKED',
  DECLINED = 'DECLINED',
  SUPERSEDED = 'SUPERSEDED',
  APPLIED = 'APPLIED',
  CANCELLED = 'CANCELLED',
}

/** Denormalized onto Job — whose move it is. Null means no open request. */
export enum RescheduleState {
  AWAITING_CUSTOMER = 'AWAITING_CUSTOMER',
  AWAITING_ADMIN = 'AWAITING_ADMIN',
  READY_TO_APPLY = 'READY_TO_APPLY',
}

export enum RescheduleReason {
  PARTS_DELAY = 'PARTS_DELAY',
  TECH_UNAVAILABLE = 'TECH_UNAVAILABLE',
  WEATHER = 'WEATHER',
  EMERGENCY_BUMP = 'EMERGENCY_BUMP',
  CAPACITY = 'CAPACITY',
  CUSTOMER_UNAVAILABLE = 'CUSTOMER_UNAVAILABLE',
  ACCESS_ISSUE = 'ACCESS_ISSUE',
  OTHER = 'OTHER',
}

/** Each side only ever sees its own reasons, plus OTHER. */
export const STAFF_REASONS: RescheduleReason[] = [
  RescheduleReason.PARTS_DELAY,
  RescheduleReason.TECH_UNAVAILABLE,
  RescheduleReason.WEATHER,
  RescheduleReason.EMERGENCY_BUMP,
  RescheduleReason.CAPACITY,
  RescheduleReason.OTHER,
];

export const CUSTOMER_REASONS: RescheduleReason[] = [
  RescheduleReason.CUSTOMER_UNAVAILABLE,
  RescheduleReason.ACCESS_ISSUE,
  RescheduleReason.OTHER,
];

export const RESCHEDULE_REASON_LABELS: Record<RescheduleReason, string> = {
  [RescheduleReason.PARTS_DELAY]: 'Parts delay',
  [RescheduleReason.TECH_UNAVAILABLE]: 'Technician unavailable',
  [RescheduleReason.WEATHER]: 'Weather',
  [RescheduleReason.EMERGENCY_BUMP]: 'Bumped by an emergency job',
  [RescheduleReason.CAPACITY]: 'No capacity that day',
  [RescheduleReason.CUSTOMER_UNAVAILABLE]: "I'm not available",
  [RescheduleReason.ACCESS_ISSUE]: 'Access to the property',
  [RescheduleReason.OTHER]: 'Other',
};

/** Matches WINDOWS in customer-portal BookServiceModal.tsx. */
export const RESCHEDULE_WINDOWS = {
  morning:   { label: 'Morning',   range: '8:00 AM – 12:00 PM', startHour: 8,  endHour: 12 },
  afternoon: { label: 'Afternoon', range: '12:00 – 4:00 PM',    startHour: 12, endHour: 16 },
  evening:   { label: 'Evening',   range: '4:00 – 7:00 PM',     startHour: 16, endHour: 19 },
} as const;

export type RescheduleWindowKey = keyof typeof RESCHEDULE_WINDOWS;

/** Job statuses on which each side may open a request. */
export const STAFF_RESCHEDULABLE_STATUSES = ['PENDING', 'SCHEDULED', 'ON_HOLD', 'EN_ROUTE'] as const;
export const CUSTOMER_RESCHEDULABLE_STATUSES = ['PENDING', 'SCHEDULED', 'ON_HOLD'] as const;

/** Fallback appointment length when a job carries no estimatedDurationMins. */
export const DEFAULT_SLOT_DURATION_MINS = 120;

/**
 * Build a concrete UTC interval from a calendar date plus a named window.
 *
 * `dateISO` is a bare calendar date ("2026-08-12") as chosen in a date input —
 * it carries no timezone. The window's hours are interpreted in `timeZone`
 * (the company's timezone), so "Tuesday morning" means 8am where the customer
 * lives, not 8am UTC.
 */
export function slotFromWindow(
  dateISO: string,
  windowKey: RescheduleWindowKey,
  timeZone: string,
): { startAt: Date; endAt: Date; window: RescheduleWindowKey } {
  const win = RESCHEDULE_WINDOWS[windowKey];
  return {
    startAt: zonedHourToUtc(dateISO, win.startHour, timeZone),
    endAt: zonedHourToUtc(dateISO, win.endHour, timeZone),
    window: windowKey,
  };
}

/**
 * Resolve "this calendar date at this hour, in this timezone" to a UTC Date.
 *
 * Done without a date library: build a provisional UTC instant, ask Intl what
 * wall-clock time that instant shows in the target zone, and subtract the
 * difference. Correct across DST because the offset is measured at the instant
 * in question rather than assumed.
 */
export function zonedHourToUtc(dateISO: string, hour: number, timeZone: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number);
  const provisional = Date.UTC(y, m - 1, d, hour, 0, 0);
  const shown = new Date(provisional);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(shown).filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]),
  ) as Record<string, number>;
  const asShown = Date.UTC(
    parts.year, parts.month - 1, parts.day,
    parts.hour === 24 ? 0 : parts.hour, parts.minute, parts.second,
  );
  return new Date(provisional + (provisional - asShown));
}
```

- [ ] **Step 2: Re-export from the package index**

Append to `packages/types/src/index.ts`:

```ts
export * from './reschedule';
```

- [ ] **Step 3: Write the failing test for the timezone helper**

This is the only logic in the file worth testing, and it is the one place a
silent bug would put every appointment an hour out.

Create `packages/types/src/reschedule.spec.ts`:

```ts
import { slotFromWindow, zonedHourToUtc, RESCHEDULE_WINDOWS } from './reschedule';

describe('zonedHourToUtc', () => {
  it('resolves a winter (standard time) hour in a negative-offset zone', () => {
    // 2026-01-14 08:00 in Chicago (UTC-6 in January) === 14:00 UTC
    const utc = zonedHourToUtc('2026-01-14', 8, 'America/Chicago');
    expect(utc.toISOString()).toBe('2026-01-14T14:00:00.000Z');
  });

  it('resolves a summer (daylight time) hour in the same zone', () => {
    // 2026-07-14 08:00 in Chicago (UTC-5 in July) === 13:00 UTC
    const utc = zonedHourToUtc('2026-07-14', 8, 'America/Chicago');
    expect(utc.toISOString()).toBe('2026-07-14T13:00:00.000Z');
  });

  it('resolves a positive-offset zone', () => {
    // 2026-07-14 08:00 in Colombo (UTC+5:30) === 02:30 UTC
    const utc = zonedHourToUtc('2026-07-14', 8, 'Asia/Colombo');
    expect(utc.toISOString()).toBe('2026-07-14T02:30:00.000Z');
  });
});

describe('slotFromWindow', () => {
  it('spans the whole window, not a point in time', () => {
    const slot = slotFromWindow('2026-07-14', 'morning', 'America/Chicago');
    expect(slot.startAt.toISOString()).toBe('2026-07-14T13:00:00.000Z');
    expect(slot.endAt.toISOString()).toBe('2026-07-14T17:00:00.000Z');
    expect(slot.window).toBe('morning');
  });

  it('covers every declared window key', () => {
    for (const key of Object.keys(RESCHEDULE_WINDOWS) as (keyof typeof RESCHEDULE_WINDOWS)[]) {
      const slot = slotFromWindow('2026-07-14', key, 'America/Chicago');
      expect(slot.endAt.getTime()).toBeGreaterThan(slot.startAt.getTime());
    }
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

```bash
pnpm --filter @tscrm/types test -- reschedule
```

Expected: FAIL — `Cannot find module './reschedule'` if Step 1 was skipped, otherwise the suite passes once Steps 1–2 are done. If `@tscrm/types` has no `test` script, add `"test": "jest"` and a minimal `jest.config.js` mirroring `apps/job-service`'s (preset `ts-jest`, `rootDir: "src"`).

- [ ] **Step 5: Build the package so downstream services see the new exports**

```bash
pnpm --filter @tscrm/types build
pnpm --filter @tscrm/types test -- reschedule
```

Expected: build clean, tests PASS.

- [ ] **Step 6: Stage (do not commit)**

```bash
git add packages/types/src/reschedule.ts packages/types/src/reschedule.spec.ts packages/types/src/index.ts
```

---

### Task 2: Prisma schema, migration, and the `SCHEDULED → PENDING` transition

**Files:**
- Modify: `apps/job-service/prisma/schema.prisma`
- Create: `apps/job-service/prisma/migrations/20260805000000_add_reschedule/migration.sql`
- Modify: `apps/job-service/src/jobs/dto/update-job-status.dto.ts:19-29`
- Test: `apps/job-service/src/jobs/jobs.service.spec.ts` (existing file — add cases)

**Interfaces:**
- Consumes: Task 1's enum *values* (the Prisma enums must use identical member names).
- Produces: Prisma models `RescheduleRequest`, `RescheduleSlot`; `Job.rescheduleState`; the `SCHEDULED → PENDING` transition that Task 7's apply step depends on.

- [ ] **Step 1: Add the models to the Prisma schema**

Append to `apps/job-service/prisma/schema.prisma`:

```prisma
// ============================================================
// RESCHEDULING — two-way negotiation over a job's appointment
// ============================================================

model RescheduleRequest {
  id             String   @id @default(uuid())
  companyId      String
  jobId          String
  job            Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)

  openedBy       RescheduleActor
  openedByUserId String?
  openedByName   String?
  mode           RescheduleMode
  reasonCode     RescheduleReason
  reason         String?

  slots          RescheduleSlot[]

  status          RescheduleStatus @default(AWAITING_RESPONSE)
  pickedSlotId    String?
  responseNote    String?
  respondedAt     DateTime?
  respondedByName String?
  appliedAt       DateTime?
  nudgedAt        DateTime?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([companyId, jobId])
  @@index([companyId, status])
  @@map("reschedule_requests")
}

model RescheduleSlot {
  id        String            @id @default(uuid())
  requestId String
  request   RescheduleRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  startAt   DateTime
  endAt     DateTime
  window    String?

  @@index([requestId])
  @@map("reschedule_slots")
}

enum RescheduleActor {
  ADMIN
  CUSTOMER
}

enum RescheduleMode {
  PROPOSE_SLOTS
  OPEN_ASK
}

enum RescheduleStatus {
  AWAITING_RESPONSE
  SLOT_PICKED
  DECLINED
  SUPERSEDED
  APPLIED
  CANCELLED
}

enum RescheduleState {
  AWAITING_CUSTOMER
  AWAITING_ADMIN
  READY_TO_APPLY
}

enum RescheduleReason {
  PARTS_DELAY
  TECH_UNAVAILABLE
  WEATHER
  EMERGENCY_BUMP
  CAPACITY
  CUSTOMER_UNAVAILABLE
  ACCESS_ISSUE
  OTHER
}
```

- [ ] **Step 2: Add the denormalized column and relation to `Job`**

In the `Job` model in the same file, next to `hasPartShortage` / `partShortageNote`, add:

```prisma
  // Denormalized "whose move is it" for the open reschedule request, if any.
  // Written in the same transaction as the request so it cannot drift. Exists
  // so every job list can render a status badge without a join — see
  // docs/superpowers/specs/2026-08-05-job-rescheduling-design.md.
  rescheduleState  RescheduleState?
```

And in the same model's relation block, alongside `statusHistory` / `photos`:

```prisma
  rescheduleRequests RescheduleRequest[]
```

And add to the model's index list:

```prisma
  @@index([companyId, rescheduleState])
```

- [ ] **Step 3: Hand-write the migration**

`prisma migrate dev` refuses to run in a non-interactive shell in this repo, and
`JOBS_DATABASE_URL` points at a shared Supabase instance. Write the SQL by hand,
matching the style of `20260713000000_add_house_equipment_link/migration.sql`.

Create `apps/job-service/prisma/migrations/20260805000000_add_reschedule/migration.sql`:

```sql
-- Enums
DO $$ BEGIN
  CREATE TYPE "jobs"."RescheduleActor" AS ENUM ('ADMIN', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "jobs"."RescheduleMode" AS ENUM ('PROPOSE_SLOTS', 'OPEN_ASK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "jobs"."RescheduleStatus" AS ENUM
    ('AWAITING_RESPONSE', 'SLOT_PICKED', 'DECLINED', 'SUPERSEDED', 'APPLIED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "jobs"."RescheduleState" AS ENUM
    ('AWAITING_CUSTOMER', 'AWAITING_ADMIN', 'READY_TO_APPLY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "jobs"."RescheduleReason" AS ENUM
    ('PARTS_DELAY', 'TECH_UNAVAILABLE', 'WEATHER', 'EMERGENCY_BUMP', 'CAPACITY',
     'CUSTOMER_UNAVAILABLE', 'ACCESS_ISSUE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Job: denormalized pointer
ALTER TABLE "jobs"."jobs"
  ADD COLUMN IF NOT EXISTS "rescheduleState" "jobs"."RescheduleState";

CREATE INDEX IF NOT EXISTS "jobs_companyId_rescheduleState_idx"
  ON "jobs"."jobs"("companyId", "rescheduleState");

-- Requests
CREATE TABLE IF NOT EXISTS "jobs"."reschedule_requests" (
  "id"              TEXT NOT NULL,
  "companyId"       TEXT NOT NULL,
  "jobId"           TEXT NOT NULL,
  "openedBy"        "jobs"."RescheduleActor" NOT NULL,
  "openedByUserId"  TEXT,
  "openedByName"    TEXT,
  "mode"            "jobs"."RescheduleMode" NOT NULL,
  "reasonCode"      "jobs"."RescheduleReason" NOT NULL,
  "reason"          TEXT,
  "status"          "jobs"."RescheduleStatus" NOT NULL DEFAULT 'AWAITING_RESPONSE',
  "pickedSlotId"    TEXT,
  "responseNote"    TEXT,
  "respondedAt"     TIMESTAMP(3),
  "respondedByName" TEXT,
  "appliedAt"       TIMESTAMP(3),
  "nudgedAt"        TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reschedule_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "jobs"."reschedule_slots" (
  "id"        TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "startAt"   TIMESTAMP(3) NOT NULL,
  "endAt"     TIMESTAMP(3) NOT NULL,
  "window"    TEXT,
  CONSTRAINT "reschedule_slots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "reschedule_requests_companyId_jobId_idx"
  ON "jobs"."reschedule_requests"("companyId", "jobId");
CREATE INDEX IF NOT EXISTS "reschedule_requests_companyId_status_idx"
  ON "jobs"."reschedule_requests"("companyId", "status");
CREATE INDEX IF NOT EXISTS "reschedule_slots_requestId_idx"
  ON "jobs"."reschedule_slots"("requestId");

-- At most one live request per job. Prisma cannot express a partial unique
-- index, so it is declared here and enforced by the database.
CREATE UNIQUE INDEX IF NOT EXISTS "reschedule_one_open_per_job"
  ON "jobs"."reschedule_requests"("jobId")
  WHERE "status" IN ('AWAITING_RESPONSE', 'SLOT_PICKED');

DO $$ BEGIN
  ALTER TABLE "jobs"."reschedule_requests"
    ADD CONSTRAINT "reschedule_requests_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "jobs"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "jobs"."reschedule_slots"
    ADD CONSTRAINT "reschedule_slots_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "jobs"."reschedule_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
```

- [ ] **Step 4: Regenerate the Prisma client**

```bash
cd apps/job-service && npx prisma generate --schema=prisma/schema.prisma
```

Expected: "Generated Prisma Client". This only writes to `src/prisma/generated` — it does not touch the database.

**Do not run `prisma migrate deploy`.** `JOBS_DATABASE_URL` points at the shared Supabase instance. Applying the migration is the repo owner's call; flag it as ready and stop.

- [ ] **Step 5: Write the failing test for the new transition**

Add to the `STATUS_TRANSITIONS map` describe block in `apps/job-service/src/jobs/jobs.service.spec.ts`:

```ts
    it('SCHEDULED can return to PENDING (descheduled back to the dispatch queue)', () => {
      expect(STATUS_TRANSITIONS[JobStatusDto.SCHEDULED]).toContain(JobStatusDto.PENDING);
    });
```

And add `[JobStatusDto.SCHEDULED, JobStatusDto.PENDING]` to the `validCases` array in the `valid transitions` describe block.

- [ ] **Step 6: Run it to verify it fails**

```bash
pnpm --filter job-service test -- jobs.service
```

Expected: FAIL — `expect(received).toContain(expected)` on the new assertion.

- [ ] **Step 7: Add the transition**

In `apps/job-service/src/jobs/dto/update-job-status.dto.ts`, change the `SCHEDULED` row:

```ts
  // PENDING here means "descheduled back to the dispatch queue" — set when a
  // reschedule is applied, which clears the technician (see RescheduleApplyService).
  [JobStatusDto.SCHEDULED]:  [JobStatusDto.PENDING, JobStatusDto.EN_ROUTE, JobStatusDto.ON_SITE, JobStatusDto.ON_HOLD, JobStatusDto.CANCELLED],
```

- [ ] **Step 8: Run tests and type-check**

```bash
pnpm --filter job-service test -- jobs.service
pnpm --filter job-service type-check
```

Expected: all PASS (46+ tests), type-check clean.

- [ ] **Step 9: Stage (do not commit)**

```bash
git add apps/job-service/prisma/schema.prisma \
        apps/job-service/prisma/migrations/20260805000000_add_reschedule/ \
        apps/job-service/src/prisma/generated \
        apps/job-service/src/jobs/dto/update-job-status.dto.ts \
        apps/job-service/src/jobs/jobs.service.spec.ts
```

---

# Phase 2 — Backend negotiation core

### Task 3: DTOs and `RescheduleService.open()`

**Files:**
- Create: `apps/job-service/src/reschedule/dto/reschedule.dto.ts`
- Create: `apps/job-service/src/reschedule/reschedule.service.ts`
- Create: `apps/job-service/src/reschedule/reschedule.service.spec.ts`

**Interfaces:**
- Consumes: Task 1's `RescheduleActor`, `RescheduleMode`, `RescheduleReason`, `STAFF_RESCHEDULABLE_STATUSES`, `CUSTOMER_RESCHEDULABLE_STATUSES`; Task 2's Prisma models.
- Produces:
  - `class OpenRescheduleDto { mode; reasonCode; reason?; slots?: SlotInputDto[] }`
  - `class SlotInputDto { startAt: string; endAt: string; window?: string }`
  - `RescheduleService.open(user: AuthUser, jobId: string, dto: OpenRescheduleDto): Promise<RescheduleRequest>`
  - `RescheduleService.actorFor(user: AuthUser): RescheduleActor`
  - `RescheduleService.stateAfterOpen(actor: RescheduleActor): RescheduleState`

- [ ] **Step 1: Write the DTOs**

```ts
// apps/job-service/src/reschedule/dto/reschedule.dto.ts
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsISO8601,
  IsOptional, IsString, MaxLength, ValidateIf, ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RescheduleMode, RescheduleReason } from '@tscrm/types';

export class SlotInputDto {
  @ApiProperty() @IsISO8601() startAt!: string;
  @ApiProperty() @IsISO8601() endAt!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() window?: string;
}

export class OpenRescheduleDto {
  @ApiProperty({ enum: RescheduleMode }) @IsEnum(RescheduleMode) mode!: RescheduleMode;

  @ApiProperty({ enum: RescheduleReason }) @IsEnum(RescheduleReason) reasonCode!: RescheduleReason;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) reason?: string;

  // Nested DTOs need both decorators or `whitelist: true` strips them silently.
  @ApiPropertyOptional({ type: [SlotInputDto] })
  @ValidateIf((o: OpenRescheduleDto) => o.mode === RescheduleMode.PROPOSE_SLOTS)
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3)
  @ValidateNested({ each: true }) @Type(() => SlotInputDto)
  slots?: SlotInputDto[];
}

export enum RescheduleResponseAction {
  PICK = 'PICK',
  COUNTER = 'COUNTER',
  DECLINE = 'DECLINE',
}

export class RespondRescheduleDto {
  @ApiProperty({ enum: RescheduleResponseAction })
  @IsEnum(RescheduleResponseAction) action!: RescheduleResponseAction;

  @ApiPropertyOptional()
  @ValidateIf((o: RespondRescheduleDto) => o.action === RescheduleResponseAction.PICK)
  @IsString() pickedSlotId?: string;

  @ApiPropertyOptional({ enum: RescheduleReason })
  @ValidateIf((o: RespondRescheduleDto) => o.action === RescheduleResponseAction.COUNTER)
  @IsEnum(RescheduleReason) reasonCode?: RescheduleReason;

  @ApiPropertyOptional({ type: [SlotInputDto] })
  @ValidateIf((o: RespondRescheduleDto) => o.action === RescheduleResponseAction.COUNTER)
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3)
  @ValidateNested({ each: true }) @Type(() => SlotInputDto)
  slots?: SlotInputDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class ApplyRescheduleDto {
  // Guard against one-click Apply cancelling a technician who is already driving.
  // The inbox button never sends this; only the explicit warning dialog does.
  @ApiPropertyOptional() @IsOptional() @IsBoolean() confirmEnRoute?: boolean;
}
```

- [ ] **Step 2: Write the failing tests for `open()`**

```ts
// apps/job-service/src/reschedule/reschedule.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  Role, RescheduleActor, RescheduleMode, RescheduleReason, RescheduleState,
} from '@tscrm/types';
import { RescheduleService } from './reschedule.service';
import { RescheduleNotifyClient } from './reschedule-notify.client';
import { PrismaService } from '../prisma/prisma.service';

const COMPANY_ID = 'co-001';
const JOB_ID = 'job-001';

function makeAuthUser(role: Role = Role.COMPANY_ADMIN, customerId?: string) {
  return {
    sub: 'user-001', userId: 'user-001', companyId: COMPANY_ID,
    email: 'staff@test.com', name: 'Test Staff', role, customerId,
  } as any;
}

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: JOB_ID, companyId: COMPANY_ID, status: 'SCHEDULED',
    customerId: 'cust-001', customerName: 'Alice', customerEmail: 'alice@test.com',
    title: 'AC Maintenance', jobNumber: 'JOB-2026-0001',
    scheduledStart: new Date('2026-08-10T14:00:00Z'),
    scheduledEnd: new Date('2026-08-10T18:00:00Z'),
    assignedToId: 'tech-1', assignedToName: 'Miguel',
    estimatedDurationMins: 120, rescheduleState: null,
    ...overrides,
  };
}

const mockPrisma: any = {
  job: { findFirst: jest.fn(), update: jest.fn() },
  rescheduleRequest: {
    create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    update: jest.fn(), updateMany: jest.fn(), count: jest.fn(), groupBy: jest.fn(),
  },
  rescheduleSlot: { createMany: jest.fn(), findFirst: jest.fn() },
  $transaction: jest.fn(),
};

const mockNotify = { requestOpened: jest.fn(), responded: jest.fn(), applied: jest.fn(), closed: jest.fn() };

const futureSlot = () => {
  const start = new Date(Date.now() + 3 * 86_400_000);
  const end = new Date(start.getTime() + 4 * 3_600_000);
  return { startAt: start.toISOString(), endAt: end.toISOString(), window: 'morning' };
};

describe('RescheduleService.open', () => {
  let service: RescheduleService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.job.findFirst.mockResolvedValue(makeJob());
    mockPrisma.job.update.mockResolvedValue({});
    mockPrisma.rescheduleRequest.create.mockImplementation(({ data }: any) => ({ id: 'req-1', ...data }));
    mockPrisma.$transaction.mockImplementation((fn: any) =>
      typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RescheduleService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RescheduleNotifyClient, useValue: mockNotify },
      ],
    }).compile();
    service = module.get(RescheduleService);
  });

  it('staff opening a slot proposal puts the ball with the customer', async () => {
    await service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
      mode: RescheduleMode.PROPOSE_SLOTS,
      reasonCode: RescheduleReason.PARTS_DELAY,
      slots: [futureSlot()],
    });

    const created = mockPrisma.rescheduleRequest.create.mock.calls[0][0].data;
    expect(created.openedBy).toBe(RescheduleActor.ADMIN);
    expect(created.companyId).toBe(COMPANY_ID);
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: JOB_ID },
      data: { rescheduleState: RescheduleState.AWAITING_CUSTOMER },
    }));
  });

  it('a customer opening a request puts the ball with staff', async () => {
    await service.open(makeAuthUser(Role.CUSTOMER, 'cust-001'), JOB_ID, {
      mode: RescheduleMode.OPEN_ASK,
      reasonCode: RescheduleReason.CUSTOMER_UNAVAILABLE,
    });

    const created = mockPrisma.rescheduleRequest.create.mock.calls[0][0].data;
    expect(created.openedBy).toBe(RescheduleActor.CUSTOMER);
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { rescheduleState: RescheduleState.AWAITING_ADMIN },
    }));
  });

  it("rejects a customer opening a request on someone else's job", async () => {
    await expect(
      service.open(makeAuthUser(Role.CUSTOMER, 'cust-999'), JOB_ID, {
        mode: RescheduleMode.OPEN_ASK, reasonCode: RescheduleReason.CUSTOMER_UNAVAILABLE,
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(mockPrisma.rescheduleRequest.create).not.toHaveBeenCalled();
  });

  it('rejects a customer on an EN_ROUTE job but allows staff', async () => {
    mockPrisma.job.findFirst.mockResolvedValue(makeJob({ status: 'EN_ROUTE' }));

    await expect(
      service.open(makeAuthUser(Role.CUSTOMER, 'cust-001'), JOB_ID, {
        mode: RescheduleMode.OPEN_ASK, reasonCode: RescheduleReason.CUSTOMER_UNAVAILABLE,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
        mode: RescheduleMode.OPEN_ASK, reasonCode: RescheduleReason.TECH_UNAVAILABLE,
      }),
    ).resolves.toBeDefined();
  });

  it.each(['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED', 'ON_SITE'])(
    'refuses to open on a %s job for either side', async (status) => {
      mockPrisma.job.findFirst.mockResolvedValue(makeJob({ status }));
      await expect(
        service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
          mode: RescheduleMode.OPEN_ASK, reasonCode: RescheduleReason.OTHER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

  it('refuses a second open request on the same job', async () => {
    mockPrisma.job.findFirst.mockResolvedValue(makeJob({ rescheduleState: RescheduleState.AWAITING_CUSTOMER }));
    await expect(
      service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
        mode: RescheduleMode.OPEN_ASK, reasonCode: RescheduleReason.OTHER,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a proposed slot that is already in the past', async () => {
    const past = new Date(Date.now() - 86_400_000);
    await expect(
      service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
        mode: RescheduleMode.PROPOSE_SLOTS, reasonCode: RescheduleReason.PARTS_DELAY,
        slots: [{ startAt: past.toISOString(), endAt: new Date(past.getTime() + 3_600_000).toISOString() }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a slot whose end is not after its start', async () => {
    const start = new Date(Date.now() + 86_400_000);
    await expect(
      service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
        mode: RescheduleMode.PROPOSE_SLOTS, reasonCode: RescheduleReason.PARTS_DELAY,
        slots: [{ startAt: start.toISOString(), endAt: start.toISOString() }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFound for a job in another company', async () => {
    mockPrisma.job.findFirst.mockResolvedValue(null);
    await expect(
      service.open(makeAuthUser(), 'nope', { mode: RescheduleMode.OPEN_ASK, reasonCode: RescheduleReason.OTHER }),
    ).rejects.toThrow(NotFoundException);
  });

  it('notifies the other side without awaiting it', async () => {
    await service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
      mode: RescheduleMode.PROPOSE_SLOTS, reasonCode: RescheduleReason.WEATHER, slots: [futureSlot()],
    });
    expect(mockNotify.requestOpened).toHaveBeenCalled();
  });
});

- [ ] **Step 3: Run the tests to verify they fail**

```bash
pnpm --filter job-service test -- reschedule.service
```

Expected: FAIL — `Cannot find module './reschedule.service'`.

- [ ] **Step 4: Implement `RescheduleService.open()`**

```ts
// apps/job-service/src/reschedule/reschedule.service.ts
import {
  BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import {
  AuthUser, Role,
  RescheduleActor, RescheduleMode, RescheduleState, RescheduleStatus,
  STAFF_RESCHEDULABLE_STATUSES, CUSTOMER_RESCHEDULABLE_STATUSES,
} from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { RescheduleNotifyClient } from './reschedule-notify.client';
import { OpenRescheduleDto, SlotInputDto } from './dto/reschedule.dto';

@Injectable()
export class RescheduleService {
  private readonly logger = new Logger(RescheduleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: RescheduleNotifyClient,
  ) {}

  /** A customer JWT means the customer side; every staff role is the admin side. */
  actorFor(user: AuthUser): RescheduleActor {
    return user.role === Role.CUSTOMER ? RescheduleActor.CUSTOMER : RescheduleActor.ADMIN;
  }

  /** Opening a request always hands the ball to the other side. */
  stateAfterOpen(actor: RescheduleActor): RescheduleState {
    return actor === RescheduleActor.ADMIN
      ? RescheduleState.AWAITING_CUSTOMER
      : RescheduleState.AWAITING_ADMIN;
  }

  async open(user: AuthUser, jobId: string, dto: OpenRescheduleDto) {
    const actor = this.actorFor(user);
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId: user.companyId },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    // A customer may only ever touch their own job.
    if (actor === RescheduleActor.CUSTOMER && job.customerId !== user.customerId) {
      throw new ForbiddenException('You can only reschedule your own jobs');
    }

    const allowed = actor === RescheduleActor.ADMIN
      ? STAFF_RESCHEDULABLE_STATUSES
      : CUSTOMER_RESCHEDULABLE_STATUSES;
    if (!(allowed as readonly string[]).includes(job.status)) {
      throw new BadRequestException(
        `A ${job.status} job cannot be rescheduled${
          actor === RescheduleActor.CUSTOMER ? ' — please contact us directly' : ''}.`,
      );
    }

    // The DB has a partial unique index as the real guard; this is the friendly error.
    if (job.rescheduleState) {
      throw new BadRequestException(
        'This job already has an open reschedule request. Respond to it instead of opening another.',
      );
    }

    const slots = dto.mode === RescheduleMode.PROPOSE_SLOTS
      ? this.validateSlots(dto.slots ?? [])
      : [];

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.rescheduleRequest.create({
        data: {
          companyId: user.companyId,
          jobId,
          openedBy: actor,
          openedByUserId: user.userId,
          openedByName: user.name ?? user.email,
          mode: dto.mode,
          reasonCode: dto.reasonCode,
          reason: dto.reason,
          status: RescheduleStatus.AWAITING_RESPONSE,
          slots: slots.length ? { create: slots } : undefined,
        },
        include: { slots: true },
      });

      await tx.job.update({
        where: { id: jobId },
        data: { rescheduleState: this.stateAfterOpen(actor) },
      });

      return created;
    });

    // Best-effort: a slow comms-service must never fail the request itself.
    this.notify.requestOpened(user.companyId, { job, request }).catch((err: unknown) => {
      this.logger.warn(`Reschedule open notification failed for job ${jobId}: ${
        err instanceof Error ? err.message : String(err)}`);
    });

    return request;
  }

  /**
   * Slots must be in the future and well-formed. Checked here as well as in the
   * DTO because a slot ultimately overwrites a real appointment — a request that
   * sat in an inbox for three days must not be applicable into the past.
   */
  validateSlots(slots: SlotInputDto[]): { startAt: Date; endAt: Date; window?: string }[] {
    if (slots.length === 0) throw new BadRequestException('Propose at least one time slot');
    const now = Date.now();
    return slots.map((s) => {
      const startAt = new Date(s.startAt);
      const endAt = new Date(s.endAt);
      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        throw new BadRequestException('Slot times must be valid dates');
      }
      if (endAt.getTime() <= startAt.getTime()) {
        throw new BadRequestException('A slot must end after it starts');
      }
      if (startAt.getTime() <= now) {
        throw new BadRequestException('Proposed slots must be in the future');
      }
      return { startAt, endAt, window: s.window };
    });
  }
}
```

- [ ] **Step 5: Create a stub notify client so the module compiles**

Task 9 fills this in. It exists now only so `RescheduleService` has something to inject.

```ts
// apps/job-service/src/reschedule/reschedule-notify.client.ts
import { Injectable } from '@nestjs/common';

export interface RescheduleNotifyPayload {
  job: { id: string; customerId: string | null; customerName: string | null; customerEmail: string | null;
         title: string; jobNumber: string; scheduledStart: Date | null };
  request: unknown;
}

/**
 * Fire-and-forget bridge to comms-service. Every method resolves even on
 * failure — callers log and move on. Filled in by Task 9.
 */
@Injectable()
export class RescheduleNotifyClient {
  async requestOpened(_companyId: string, _p: RescheduleNotifyPayload): Promise<void> {}
  async responded(_companyId: string, _p: RescheduleNotifyPayload): Promise<void> {}
  async applied(_companyId: string, _p: RescheduleNotifyPayload): Promise<void> {}
  async closed(_companyId: string, _p: RescheduleNotifyPayload): Promise<void> {}
}
```

- [ ] **Step 6: Run tests and type-check**

```bash
pnpm --filter job-service test -- reschedule.service
pnpm --filter job-service type-check
```

Expected: 10 tests PASS, type-check clean.

- [ ] **Step 7: Stage (do not commit)**

```bash
git add apps/job-service/src/reschedule/
```

---

### Task 4: `RescheduleService.respond()` — pick, counter, decline

**Files:**
- Modify: `apps/job-service/src/reschedule/reschedule.service.ts`
- Modify: `apps/job-service/src/reschedule/reschedule.service.spec.ts`

**Interfaces:**
- Consumes: Task 3's `RescheduleService`, `actorFor`, `validateSlots`; `RespondRescheduleDto`.
- Produces: `RescheduleService.respond(user: AuthUser, requestId: string, dto: RespondRescheduleDto): Promise<{ request: RescheduleRequest; shouldApply: boolean }>`. `shouldApply` is `true` when a staff member picked a slot — Task 8's controller then delegates to `RescheduleApplyService`.

- [ ] **Step 1: Write the failing tests**

Append to `reschedule.service.spec.ts`:

```ts
import { RescheduleStatus } from '@tscrm/types';
import { RescheduleResponseAction } from './dto/reschedule.dto';

describe('RescheduleService.respond', () => {
  let service: RescheduleService;

  const makeRequest = (overrides: Record<string, unknown> = {}) => ({
    id: 'req-1', companyId: COMPANY_ID, jobId: JOB_ID,
    openedBy: RescheduleActor.ADMIN,
    mode: RescheduleMode.PROPOSE_SLOTS,
    status: RescheduleStatus.AWAITING_RESPONSE,
    slots: [{ id: 'slot-1', startAt: new Date(Date.now() + 3 * 86_400_000),
              endAt: new Date(Date.now() + 3 * 86_400_000 + 4 * 3_600_000), window: 'morning' }],
    job: makeJob(),
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.job.update.mockResolvedValue({});
    mockPrisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.rescheduleRequest.update.mockImplementation(({ data }: any) => ({ id: 'req-1', ...data }));
    mockPrisma.rescheduleRequest.create.mockImplementation(({ data }: any) => ({ id: 'req-2', ...data }));
    mockPrisma.$transaction.mockImplementation((fn: any) =>
      typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RescheduleService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RescheduleNotifyClient, useValue: mockNotify },
      ],
    }).compile();
    service = module.get(RescheduleService);
  });

  it('customer picking a staff slot parks at READY_TO_APPLY, not applied', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());

    const res = await service.respond(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1', {
      action: RescheduleResponseAction.PICK, pickedSlotId: 'slot-1',
    });

    expect(res.shouldApply).toBe(false);
    expect(mockPrisma.rescheduleRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'req-1', status: RescheduleStatus.AWAITING_RESPONSE },
      data: expect.objectContaining({ status: RescheduleStatus.SLOT_PICKED, pickedSlotId: 'slot-1' }),
    }));
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { rescheduleState: RescheduleState.READY_TO_APPLY },
    }));
  });

  it('staff picking a customer slot signals immediate apply', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(
      makeRequest({ openedBy: RescheduleActor.CUSTOMER }));

    const res = await service.respond(makeAuthUser(Role.DISPATCHER), 'req-1', {
      action: RescheduleResponseAction.PICK, pickedSlotId: 'slot-1',
    });

    expect(res.shouldApply).toBe(true);
  });

  it('rejects the side that does not hold the ball', async () => {
    // Staff opened it, so staff cannot also answer it.
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());
    await expect(
      service.respond(makeAuthUser(Role.COMPANY_ADMIN), 'req-1', {
        action: RescheduleResponseAction.PICK, pickedSlotId: 'slot-1',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns 409-style conflict when the round was already superseded', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());
    mockPrisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.respond(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1', {
        action: RescheduleResponseAction.PICK, pickedSlotId: 'slot-1',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects picking a slot that belongs to a different request', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());
    await expect(
      service.respond(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1', {
        action: RescheduleResponseAction.PICK, pickedSlotId: 'slot-from-elsewhere',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects picking a slot that has since passed', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest({
      slots: [{ id: 'slot-old', startAt: new Date(Date.now() - 86_400_000),
                endAt: new Date(Date.now() - 82_800_000), window: 'morning' }],
    }));
    await expect(
      service.respond(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1', {
        action: RescheduleResponseAction.PICK, pickedSlotId: 'slot-old',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('a counter supersedes the old round and flips the ball back', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());

    const res = await service.respond(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1', {
      action: RescheduleResponseAction.COUNTER,
      reasonCode: RescheduleReason.CUSTOMER_UNAVAILABLE,
      slots: [futureSlot()],
      note: 'none of those work',
    });

    expect(mockPrisma.rescheduleRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: RescheduleStatus.SUPERSEDED }),
    }));
    const created = mockPrisma.rescheduleRequest.create.mock.calls[0][0].data;
    expect(created.openedBy).toBe(RescheduleActor.CUSTOMER);
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { rescheduleState: RescheduleState.AWAITING_ADMIN },
    }));
    expect(res.shouldApply).toBe(false);
  });

  it('an OPEN_ASK is answered with slots via COUNTER', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(
      makeRequest({ openedBy: RescheduleActor.CUSTOMER, mode: RescheduleMode.OPEN_ASK, slots: [] }));

    await service.respond(makeAuthUser(Role.COMPANY_ADMIN), 'req-1', {
      action: RescheduleResponseAction.COUNTER,
      reasonCode: RescheduleReason.TECH_UNAVAILABLE,
      slots: [futureSlot(), futureSlot()],
    });

    const created = mockPrisma.rescheduleRequest.create.mock.calls[0][0].data;
    expect(created.openedBy).toBe(RescheduleActor.ADMIN);
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { rescheduleState: RescheduleState.AWAITING_CUSTOMER },
    }));
  });

  it('declining closes the negotiation and clears the job flag', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());

    await service.respond(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1', {
      action: RescheduleResponseAction.DECLINE, note: 'never mind',
    });

    expect(mockPrisma.rescheduleRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: RescheduleStatus.DECLINED }),
    }));
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { rescheduleState: null },
    }));
  });

  it("rejects a customer responding to another customer's request", async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());
    await expect(
      service.respond(makeAuthUser(Role.CUSTOMER, 'cust-999'), 'req-1', {
        action: RescheduleResponseAction.DECLINE,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
```

Add `ConflictException` to the `@nestjs/common` import at the top of the spec file.

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --filter job-service test -- reschedule.service
```

Expected: FAIL — `service.respond is not a function`.

- [ ] **Step 3: Implement `respond()`**

Add to `RescheduleService` (and add `ConflictException` to its `@nestjs/common` import):

```ts
  /** Who is allowed to answer: the side that did NOT open this round. */
  private ballHolder(request: { openedBy: RescheduleActor }): RescheduleActor {
    return request.openedBy === RescheduleActor.ADMIN
      ? RescheduleActor.CUSTOMER
      : RescheduleActor.ADMIN;
  }

  async respond(user: AuthUser, requestId: string, dto: RespondRescheduleDto) {
    const actor = this.actorFor(user);
    const request = await this.prisma.rescheduleRequest.findFirst({
      where: { id: requestId, companyId: user.companyId },
      include: { slots: true, job: true },
    });
    if (!request) throw new NotFoundException(`Reschedule request ${requestId} not found`);

    if (actor === RescheduleActor.CUSTOMER && request.job.customerId !== user.customerId) {
      throw new ForbiddenException('You can only respond to reschedule requests on your own jobs');
    }
    if (actor !== this.ballHolder(request)) {
      throw new ForbiddenException('This request is waiting on the other party, not you');
    }
    if (request.status !== RescheduleStatus.AWAITING_RESPONSE) {
      throw new ConflictException('This request has already been answered');
    }

    const responder = user.name ?? user.email;
    const now = new Date();

    if (dto.action === RescheduleResponseAction.PICK) {
      const slot = request.slots.find((s) => s.id === dto.pickedSlotId);
      if (!slot) throw new BadRequestException('That time slot is not part of this request');
      if (slot.startAt.getTime() <= Date.now()) {
        throw new BadRequestException('That time slot has already passed — please propose a new time');
      }

      // Staff picking IS the confirmation, so it applies immediately. A customer
      // picking parks at READY_TO_APPLY for a staff member to confirm.
      const staffPicked = actor === RescheduleActor.ADMIN;

      await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.rescheduleRequest.updateMany({
          where: { id: requestId, status: RescheduleStatus.AWAITING_RESPONSE },
          data: {
            status: RescheduleStatus.SLOT_PICKED,
            pickedSlotId: slot.id,
            responseNote: dto.note,
            respondedAt: now,
            respondedByName: responder,
          },
        });
        if (claimed.count === 0) {
          throw new ConflictException('This request was just updated by someone else — reload and try again');
        }
        if (!staffPicked) {
          await tx.job.update({
            where: { id: request.jobId },
            data: { rescheduleState: RescheduleState.READY_TO_APPLY },
          });
        }
      });

      const updated = await this.findRequest(user.companyId, requestId);
      if (!staffPicked) {
        this.notify.responded(user.companyId, { job: request.job as any, request: updated })
          .catch((err: unknown) => this.logger.warn(`Reschedule response notification failed: ${
            err instanceof Error ? err.message : String(err)}`));
      }
      return { request: updated, shouldApply: staffPicked };
    }

    if (dto.action === RescheduleResponseAction.COUNTER) {
      const slots = this.validateSlots(dto.slots ?? []);
      const created = await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.rescheduleRequest.updateMany({
          where: { id: requestId, status: RescheduleStatus.AWAITING_RESPONSE },
          data: {
            status: RescheduleStatus.SUPERSEDED,
            responseNote: dto.note,
            respondedAt: now,
            respondedByName: responder,
          },
        });
        if (claimed.count === 0) {
          throw new ConflictException('This request was just updated by someone else — reload and try again');
        }

        const next = await tx.rescheduleRequest.create({
          data: {
            companyId: user.companyId,
            jobId: request.jobId,
            openedBy: actor,
            openedByUserId: user.userId,
            openedByName: responder,
            mode: RescheduleMode.PROPOSE_SLOTS,
            reasonCode: dto.reasonCode!,
            reason: dto.note,
            status: RescheduleStatus.AWAITING_RESPONSE,
            slots: { create: slots },
          },
          include: { slots: true },
        });

        await tx.job.update({
          where: { id: request.jobId },
          data: { rescheduleState: this.stateAfterOpen(actor) },
        });

        return next;
      });

      this.notify.responded(user.companyId, { job: request.job as any, request: created })
        .catch((err: unknown) => this.logger.warn(`Reschedule counter notification failed: ${
          err instanceof Error ? err.message : String(err)}`));

      return { request: created, shouldApply: false };
    }

    // DECLINE — the negotiation ends and the appointment stands.
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.rescheduleRequest.updateMany({
        where: { id: requestId, status: RescheduleStatus.AWAITING_RESPONSE },
        data: {
          status: RescheduleStatus.DECLINED,
          responseNote: dto.note,
          respondedAt: now,
          respondedByName: responder,
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException('This request was just updated by someone else — reload and try again');
      }
      await tx.job.update({ where: { id: request.jobId }, data: { rescheduleState: null } });
    });

    const declined = await this.findRequest(user.companyId, requestId);
    this.notify.closed(user.companyId, { job: request.job as any, request: declined })
      .catch((err: unknown) => this.logger.warn(`Reschedule decline notification failed: ${
        err instanceof Error ? err.message : String(err)}`));

    return { request: declined, shouldApply: false };
  }

  async findRequest(companyId: string, requestId: string) {
    const found = await this.prisma.rescheduleRequest.findFirst({
      where: { id: requestId, companyId },
      include: { slots: { orderBy: { startAt: 'asc' } } },
    });
    if (!found) throw new NotFoundException(`Reschedule request ${requestId} not found`);
    return found;
  }
```

Add to the file's imports: `RespondRescheduleDto`, `RescheduleResponseAction` from `./dto/reschedule.dto`.

- [ ] **Step 4: Run tests and type-check**

```bash
pnpm --filter job-service test -- reschedule.service
pnpm --filter job-service type-check
```

Expected: 20 tests PASS, type-check clean.

- [ ] **Step 5: Stage (do not commit)**

```bash
git add apps/job-service/src/reschedule/
```

---

### Task 5: Cancel, history, inbox, and stats queries

**Files:**
- Modify: `apps/job-service/src/reschedule/reschedule.service.ts`
- Modify: `apps/job-service/src/reschedule/reschedule.service.spec.ts`

**Interfaces:**
- Consumes: Task 3–4's `RescheduleService`.
- Produces:
  - `cancel(user, requestId): Promise<RescheduleRequest>`
  - `history(user, jobId): Promise<RescheduleRequest[]>` — newest first, slots included
  - `inbox(companyId, page?, limit?): Promise<PaginatedResponse<InboxRow>>` where `InboxRow = { request, job: { id, jobNumber, title, customerName, scheduledStart, status }, isStale: boolean }`
  - `stats(companyId, from?, to?): Promise<{ byReason: Record<string, number>; byActor: Record<string, number>; applied: number; declined: number; total: number }>`

- [ ] **Step 1: Write the failing tests**

Append to `reschedule.service.spec.ts`:

```ts
describe('RescheduleService queries', () => {
  let service: RescheduleService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: any) =>
      typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RescheduleService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RescheduleNotifyClient, useValue: mockNotify },
      ],
    }).compile();
    service = module.get(RescheduleService);
  });

  it('cancel closes the request and clears the job flag', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue({
      id: 'req-1', companyId: COMPANY_ID, jobId: JOB_ID,
      openedBy: RescheduleActor.ADMIN, openedByUserId: 'user-001',
      status: RescheduleStatus.AWAITING_RESPONSE, slots: [], job: makeJob(),
    });
    mockPrisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.job.update.mockResolvedValue({});

    await service.cancel(makeAuthUser(Role.COMPANY_ADMIN), 'req-1');

    expect(mockPrisma.rescheduleRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: RescheduleStatus.CANCELLED }),
    }));
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { rescheduleState: null },
    }));
  });

  it('cancel refuses when the caller did not open the request', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue({
      id: 'req-1', companyId: COMPANY_ID, jobId: JOB_ID,
      openedBy: RescheduleActor.CUSTOMER, openedByUserId: 'someone-else',
      status: RescheduleStatus.AWAITING_RESPONSE, slots: [], job: makeJob(),
    });

    await expect(
      service.cancel(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('history returns every round newest-first, scoped to the company', async () => {
    mockPrisma.rescheduleRequest.findMany.mockResolvedValue([]);
    mockPrisma.job.findFirst.mockResolvedValue(makeJob());

    await service.history(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID);

    expect(mockPrisma.rescheduleRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { companyId: COMPANY_ID, jobId: JOB_ID },
      orderBy: { createdAt: 'desc' },
    }));
  });

  it('inbox returns only rounds awaiting staff and marks 5-day-old ones stale', async () => {
    const fresh = new Date();
    const old = new Date(Date.now() - 6 * 86_400_000);
    mockPrisma.rescheduleRequest.findMany.mockResolvedValue([
      { id: 'r1', createdAt: fresh, status: RescheduleStatus.AWAITING_RESPONSE,
        openedBy: RescheduleActor.CUSTOMER, slots: [], job: makeJob() },
      { id: 'r2', createdAt: old, status: RescheduleStatus.SLOT_PICKED,
        openedBy: RescheduleActor.ADMIN, slots: [], job: makeJob() },
    ]);
    mockPrisma.rescheduleRequest.count.mockResolvedValue(2);

    const res = await service.inbox(COMPANY_ID);

    const where = mockPrisma.rescheduleRequest.findMany.mock.calls[0][0].where;
    expect(where.companyId).toBe(COMPANY_ID);
    expect(where.status.in).toEqual(
      expect.arrayContaining([RescheduleStatus.AWAITING_RESPONSE, RescheduleStatus.SLOT_PICKED]));
    expect(res.data[0].isStale).toBe(false);
    expect(res.data[1].isStale).toBe(true);
  });

  it('stats groups by reason and by who opened it', async () => {
    mockPrisma.rescheduleRequest.groupBy
      .mockResolvedValueOnce([{ reasonCode: RescheduleReason.PARTS_DELAY, _count: { _all: 4 } }])
      .mockResolvedValueOnce([{ openedBy: RescheduleActor.CUSTOMER, _count: { _all: 3 } }]);
    mockPrisma.rescheduleRequest.count
      .mockResolvedValueOnce(9)   // total
      .mockResolvedValueOnce(5)   // applied
      .mockResolvedValueOnce(1);  // declined

    const res = await service.stats(COMPANY_ID);

    expect(res.byReason[RescheduleReason.PARTS_DELAY]).toBe(4);
    expect(res.byActor[RescheduleActor.CUSTOMER]).toBe(3);
    expect(res.total).toBe(9);
    expect(res.applied).toBe(5);
    expect(res.declined).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --filter job-service test -- reschedule.service
```

Expected: FAIL — `service.cancel is not a function`.

- [ ] **Step 3: Implement the queries**

Add to `RescheduleService`:

```ts
  /** Requests older than this with no answer are flagged red in the inbox. */
  private static readonly STALE_AFTER_MS = 5 * 24 * 60 * 60 * 1000;

  async cancel(user: AuthUser, requestId: string) {
    const actor = this.actorFor(user);
    const request = await this.prisma.rescheduleRequest.findFirst({
      where: { id: requestId, companyId: user.companyId },
      include: { slots: true, job: true },
    });
    if (!request) throw new NotFoundException(`Reschedule request ${requestId} not found`);

    // You may only withdraw your own ask. Staff withdrawing a customer's request
    // would silently erase what the customer asked for.
    if (request.openedBy !== actor) {
      throw new ForbiddenException('Only the party who opened a request can withdraw it');
    }
    if (actor === RescheduleActor.CUSTOMER && request.job.customerId !== user.customerId) {
      throw new ForbiddenException('You can only withdraw requests on your own jobs');
    }
    if (![RescheduleStatus.AWAITING_RESPONSE, RescheduleStatus.SLOT_PICKED].includes(request.status as RescheduleStatus)) {
      throw new ConflictException('This request is already closed');
    }

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.rescheduleRequest.updateMany({
        where: { id: requestId, status: { in: [RescheduleStatus.AWAITING_RESPONSE, RescheduleStatus.SLOT_PICKED] } },
        data: { status: RescheduleStatus.CANCELLED, respondedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new ConflictException('This request was just updated by someone else — reload and try again');
      }
      await tx.job.update({ where: { id: request.jobId }, data: { rescheduleState: null } });
    });

    const cancelled = await this.findRequest(user.companyId, requestId);
    this.notify.closed(user.companyId, { job: request.job as any, request: cancelled })
      .catch((err: unknown) => this.logger.warn(`Reschedule cancel notification failed: ${
        err instanceof Error ? err.message : String(err)}`));

    return cancelled;
  }

  async history(user: AuthUser, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId: user.companyId },
      select: { id: true, customerId: true },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    if (this.actorFor(user) === RescheduleActor.CUSTOMER && job.customerId !== user.customerId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.rescheduleRequest.findMany({
      where: { companyId: user.companyId, jobId },
      orderBy: { createdAt: 'desc' },
      include: { slots: { orderBy: { startAt: 'asc' } } },
    });
  }

  /** Everything waiting on a staff member: customer asks, and slots they picked. */
  async inbox(companyId: string, page: number | string = 1, limit: number | string = 20) {
    const { page: p, limit: l, skip } = clampPagination({ page, limit });
    const where = {
      companyId,
      status: { in: [RescheduleStatus.AWAITING_RESPONSE, RescheduleStatus.SLOT_PICKED] },
    };

    const [rows, total] = await Promise.all([
      this.prisma.rescheduleRequest.findMany({
        where,
        orderBy: { createdAt: 'asc' },   // oldest first — the ones at risk float up
        skip,
        take: l,
        include: {
          slots: { orderBy: { startAt: 'asc' } },
          job: {
            select: {
              id: true, jobNumber: true, title: true, customerName: true,
              customerEmail: true, scheduledStart: true, status: true, assignedToName: true,
            },
          },
        },
      }),
      this.prisma.rescheduleRequest.count({ where }),
    ]);

    // A customer round awaiting the customer is not staff work; filter to rounds
    // where the ball is genuinely ours.
    const staffFacing = rows.filter((r) =>
      r.status === RescheduleStatus.SLOT_PICKED || r.openedBy === RescheduleActor.CUSTOMER);

    const now = Date.now();
    return {
      data: staffFacing.map((r) => ({
        request: r,
        job: r.job,
        isStale: now - r.createdAt.getTime() > RescheduleService.STALE_AFTER_MS,
      })),
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    };
  }

  async stats(companyId: string, from?: string, to?: string) {
    const createdAt = from || to
      ? { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) }
      : undefined;
    const where = { companyId, ...(createdAt ? { createdAt } : {}) };

    const [byReasonRows, byActorRows, total, applied, declined] = await Promise.all([
      this.prisma.rescheduleRequest.groupBy({ by: ['reasonCode'], where, _count: { _all: true } }),
      this.prisma.rescheduleRequest.groupBy({ by: ['openedBy'], where, _count: { _all: true } }),
      this.prisma.rescheduleRequest.count({ where }),
      this.prisma.rescheduleRequest.count({ where: { ...where, status: RescheduleStatus.APPLIED } }),
      this.prisma.rescheduleRequest.count({ where: { ...where, status: RescheduleStatus.DECLINED } }),
    ]);

    return {
      byReason: Object.fromEntries(byReasonRows.map((r: any) => [r.reasonCode, r._count._all])),
      byActor: Object.fromEntries(byActorRows.map((r: any) => [r.openedBy, r._count._all])),
      total, applied, declined,
    };
  }
```

Add `clampPagination` to the `@tscrm/types` import — it is the repo-wide pagination guard; do not hand-roll `Math.min`.

- [ ] **Step 4: Run tests and type-check**

```bash
pnpm --filter job-service test -- reschedule.service
pnpm --filter job-service type-check
```

Expected: 25 tests PASS, type-check clean.

- [ ] **Step 5: Stage (do not commit)**

```bash
git add apps/job-service/src/reschedule/
```

---

### Task 6: `SchedulingClient` — cancel the dispatch assignment

**Files:**
- Create: `apps/job-service/src/reschedule/scheduling.client.ts`
- Create: `apps/job-service/src/reschedule/scheduling.client.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `SchedulingClient.cancelAssignmentForJob(companyId: string, jobId: string): Promise<boolean>` — resolves `true` when an assignment was cancelled, `false` when there was nothing to cancel or the call failed. Never throws.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/job-service/src/reschedule/scheduling.client.spec.ts
import axios from 'axios';
import { SchedulingClient } from './scheduling.client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SchedulingClient', () => {
  let client: SchedulingClient;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BYPASS_AUTH = 'true';
    client = new SchedulingClient();
  });

  it('cancels the active assignment for a job', async () => {
    mockedAxios.get.mockResolvedValue({ data: [{ id: 'assign-1', status: 'ASSIGNED' }] });
    mockedAxios.patch.mockResolvedValue({ data: {} });

    await expect(client.cancelAssignmentForJob('co-1', 'job-1')).resolves.toBe(true);
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/dispatch/assignments/assign-1/status'),
      { status: 'CANCELLED' },
      expect.anything(),
    );
  });

  it('returns false and does not PATCH when the job has no active assignment', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    await expect(client.cancelAssignmentForJob('co-1', 'job-1')).resolves.toBe(false);
    expect(mockedAxios.patch).not.toHaveBeenCalled();
  });

  it('swallows a scheduling-service outage rather than failing the caller', async () => {
    mockedAxios.get.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(client.cancelAssignmentForJob('co-1', 'job-1')).resolves.toBe(false);
  });

  it('ignores already-terminal assignments', async () => {
    mockedAxios.get.mockResolvedValue({ data: [{ id: 'a1', status: 'COMPLETED' }] });
    await expect(client.cancelAssignmentForJob('co-1', 'job-1')).resolves.toBe(false);
    expect(mockedAxios.patch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --filter job-service test -- scheduling.client
```

Expected: FAIL — `Cannot find module './scheduling.client'`.

- [ ] **Step 3: Implement the client**

```ts
// apps/job-service/src/reschedule/scheduling.client.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const SCHEDULING_URL = process.env.SCHEDULING_SERVICE_URL ?? 'http://localhost:3003';

/** Assignment states that still hold a technician to the job. */
const LIVE_ASSIGNMENT_STATUSES = ['ASSIGNED', 'EN_ROUTE', 'ON_SITE'];

/**
 * Releases a technician when a job's appointment moves. Deliberately never
 * throws: the calendar change has already been promised to the customer by the
 * time this runs, so a scheduling-service blip must not roll it back. A failure
 * leaves a stale assignment, which the dispatch board shows and a human can fix
 * — strictly better than a half-applied reschedule.
 */
@Injectable()
export class SchedulingClient {
  private readonly logger = new Logger(SchedulingClient.name);

  async cancelAssignmentForJob(companyId: string, jobId: string): Promise<boolean> {
    try {
      const res = await axios.get(`${SCHEDULING_URL}/dispatch/assignments`, {
        params: { jobId },
        timeout: 8_000,
        headers: this.serviceHeaders(companyId),
      });

      const assignments: Array<{ id: string; status: string }> = Array.isArray(res.data)
        ? res.data
        : res.data?.data ?? [];
      const live = assignments.find((a) => LIVE_ASSIGNMENT_STATUSES.includes(a.status));
      if (!live) return false;

      await axios.patch(
        `${SCHEDULING_URL}/dispatch/assignments/${live.id}/status`,
        { status: 'CANCELLED' },
        { timeout: 8_000, headers: this.serviceHeaders(companyId) },
      );
      return true;
    } catch (err: any) {
      this.logger.warn(
        `Could not cancel dispatch assignment for job ${jobId}: ${err?.response?.status ?? ''} ${err.message}`,
      );
      return false;
    }
  }

  private serviceHeaders(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'job-service-reschedule',
        'x-test-user-email': 'jobs-reschedule@tscrm.internal',
        'x-test-user-name': 'Job Service (reschedule)',
      };
    }
    return { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
  }
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter job-service test -- scheduling.client
pnpm --filter job-service type-check
```

Expected: 4 tests PASS, type-check clean.

- [ ] **Step 5: Verify the scheduling-service list endpoint accepts a `jobId` filter**

```bash
grep -rn "assignments" apps/scheduling-service/internal/handler/dispatch_handler.go | head -20
```

If there is no `GET /dispatch/assignments?jobId=` route, add one in
`dispatch_handler.go` + `assignment_repo.go` following the existing handler
style (company-scoped `WHERE "companyId" = $1 AND "jobId" = $2`), then re-run
`go build ./...` in `apps/scheduling-service`. Record which path was taken in
the task notes so Task 7's implementer knows.

- [ ] **Step 6: Stage (do not commit)**

```bash
git add apps/job-service/src/reschedule/ apps/scheduling-service/
```

---

### Task 7: `RescheduleApplyService` — the calendar write

The only code in the feature that mutates the calendar. Kept in its own file for
that reason.

**Files:**
- Create: `apps/job-service/src/reschedule/reschedule-apply.service.ts`
- Create: `apps/job-service/src/reschedule/reschedule-apply.service.spec.ts`

**Interfaces:**
- Consumes: Task 5's `RescheduleService.findRequest`; Task 6's `SchedulingClient.cancelAssignmentForJob`; Task 3's `RescheduleNotifyClient`.
- Produces: `RescheduleApplyService.apply(user: AuthUser, requestId: string, dto: ApplyRescheduleDto): Promise<RescheduleRequest>`.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/job-service/src/reschedule/reschedule-apply.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Role, RescheduleActor, RescheduleStatus, RescheduleState } from '@tscrm/types';
import { RescheduleApplyService } from './reschedule-apply.service';
import { RescheduleService } from './reschedule.service';
import { SchedulingClient } from './scheduling.client';
import { RescheduleNotifyClient } from './reschedule-notify.client';
import { PrismaService } from '../prisma/prisma.service';

const COMPANY_ID = 'co-001';
const JOB_ID = 'job-001';
const REQ_ID = 'req-001';

function makeAuthUser(role: Role = Role.COMPANY_ADMIN, customerId?: string) {
  return { sub: 'u1', userId: 'u1', companyId: COMPANY_ID, email: 'a@b.c',
           name: 'Staff', role, customerId } as any;
}

const slotStart = new Date(Date.now() + 3 * 86_400_000);
const slotEnd = new Date(slotStart.getTime() + 4 * 3_600_000);

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: REQ_ID, companyId: COMPANY_ID, jobId: JOB_ID,
    status: RescheduleStatus.SLOT_PICKED, pickedSlotId: 'slot-1',
    openedBy: RescheduleActor.ADMIN,
    slots: [{ id: 'slot-1', startAt: slotStart, endAt: slotEnd, window: 'morning' }],
    job: {
      id: JOB_ID, companyId: COMPANY_ID, status: 'SCHEDULED', customerId: 'cust-1',
      customerName: 'Alice', customerEmail: 'alice@test.com', title: 'AC', jobNumber: 'JOB-1',
      assignedToId: 'tech-1', assignedToName: 'Miguel', scheduledStart: new Date(),
    },
    ...overrides,
  };
}

const mockPrisma: any = {
  rescheduleRequest: { findFirst: jest.fn(), updateMany: jest.fn() },
  job: { update: jest.fn() },
  jobStatusHistory: { create: jest.fn() },
  $transaction: jest.fn(),
};
const mockScheduling = { cancelAssignmentForJob: jest.fn().mockResolvedValue(true) };
const mockNotify = { applied: jest.fn().mockResolvedValue(undefined) };
const mockCore = { findRequest: jest.fn() };

describe('RescheduleApplyService', () => {
  let service: RescheduleApplyService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());
    mockPrisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.job.update.mockResolvedValue({});
    mockPrisma.jobStatusHistory.create.mockResolvedValue({});
    mockPrisma.$transaction.mockImplementation((fn: any) =>
      typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn));
    mockCore.findRequest.mockResolvedValue(makeRequest({ status: RescheduleStatus.APPLIED }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RescheduleApplyService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RescheduleService, useValue: mockCore },
        { provide: SchedulingClient, useValue: mockScheduling },
        { provide: RescheduleNotifyClient, useValue: mockNotify },
      ],
    }).compile();
    service = module.get(RescheduleApplyService);
  });

  it('writes the slot to the calendar, unassigns the tech, and queues to dispatch', async () => {
    await service.apply(makeAuthUser(Role.COMPANY_ADMIN), REQ_ID, {});

    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: JOB_ID },
      data: expect.objectContaining({
        scheduledStart: slotStart,
        scheduledEnd: slotEnd,
        assignedToId: null,
        assignedToName: null,
        status: 'PENDING',
        rescheduleState: null,
      }),
    }));
  });

  it('cancels the dispatch assignment', async () => {
    await service.apply(makeAuthUser(), REQ_ID, {});
    expect(mockScheduling.cancelAssignmentForJob).toHaveBeenCalledWith(COMPANY_ID, JOB_ID);
  });

  it('records the move in job status history', async () => {
    await service.apply(makeAuthUser(), REQ_ID, {});
    const note = mockPrisma.jobStatusHistory.create.mock.calls[0][0].data;
    expect(note.jobId).toBe(JOB_ID);
    expect(note.toStatus).toBe('PENDING');
    expect(note.note).toContain('Rescheduled');
  });

  it('marks the request APPLIED and notifies the customer', async () => {
    await service.apply(makeAuthUser(), REQ_ID, {});
    expect(mockPrisma.rescheduleRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: REQ_ID, status: RescheduleStatus.SLOT_PICKED },
      data: expect.objectContaining({ status: RescheduleStatus.APPLIED }),
    }));
    expect(mockNotify.applied).toHaveBeenCalled();
  });

  it('409s when another staff member applied first, without touching the calendar', async () => {
    mockPrisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.apply(makeAuthUser(), REQ_ID, {})).rejects.toThrow(ConflictException);
    expect(mockPrisma.job.update).not.toHaveBeenCalled();
    expect(mockNotify.applied).not.toHaveBeenCalled();
  });

  it('refuses a customer caller', async () => {
    await expect(
      service.apply(makeAuthUser(Role.CUSTOMER, 'cust-1'), REQ_ID, {}),
    ).rejects.toThrow(ForbiddenException);
  });

  it('refuses a technician caller', async () => {
    await expect(
      service.apply(makeAuthUser(Role.TECHNICIAN), REQ_ID, {}),
    ).rejects.toThrow(ForbiddenException);
  });

  it('refuses when no slot has been picked yet', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(
      makeRequest({ status: RescheduleStatus.AWAITING_RESPONSE, pickedSlotId: null }));
    await expect(service.apply(makeAuthUser(), REQ_ID, {})).rejects.toThrow(BadRequestException);
  });

  it('refuses when the picked slot has since passed', async () => {
    const past = new Date(Date.now() - 86_400_000);
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest({
      slots: [{ id: 'slot-1', startAt: past, endAt: new Date(past.getTime() + 3_600_000), window: null }],
    }));
    await expect(service.apply(makeAuthUser(), REQ_ID, {})).rejects.toThrow(BadRequestException);
  });

  it.each(['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'])(
    'refuses to resurrect a %s job', async (status) => {
      mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(
        makeRequest({ job: { ...makeRequest().job, status } }));
      await expect(service.apply(makeAuthUser(), REQ_ID, {})).rejects.toThrow(BadRequestException);
      expect(mockPrisma.job.update).not.toHaveBeenCalled();
    });

  it('refuses an EN_ROUTE job unless confirmEnRoute is passed', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(
      makeRequest({ job: { ...makeRequest().job, status: 'EN_ROUTE' } }));

    await expect(service.apply(makeAuthUser(), REQ_ID, {})).rejects.toThrow(ConflictException);
    expect(mockPrisma.job.update).not.toHaveBeenCalled();

    await expect(
      service.apply(makeAuthUser(), REQ_ID, { confirmEnRoute: true }),
    ).resolves.toBeDefined();
  });

  it('still applies when scheduling-service cannot be reached', async () => {
    mockScheduling.cancelAssignmentForJob.mockResolvedValue(false);
    await expect(service.apply(makeAuthUser(), REQ_ID, {})).resolves.toBeDefined();
    expect(mockPrisma.job.update).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --filter job-service test -- reschedule-apply
```

Expected: FAIL — `Cannot find module './reschedule-apply.service'`.

- [ ] **Step 3: Implement the apply service**

```ts
// apps/job-service/src/reschedule/reschedule-apply.service.ts
import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { AuthUser, Role, RescheduleStatus } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { RescheduleService } from './reschedule.service';
import { SchedulingClient } from './scheduling.client';
import { RescheduleNotifyClient } from './reschedule-notify.client';
import { ApplyRescheduleDto } from './dto/reschedule.dto';

/** Roles that may move a job on the calendar. Dispatchers run the schedule. */
const APPLY_ROLES: Role[] = [
  Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER,
];

/** Applying to any of these would resurrect a finished or dead job. */
const TERMINAL_STATUSES = ['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED', 'ON_SITE'];

@Injectable()
export class RescheduleApplyService {
  private readonly logger = new Logger(RescheduleApplyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly core: RescheduleService,
    private readonly scheduling: SchedulingClient,
    private readonly notify: RescheduleNotifyClient,
  ) {}

  async apply(user: AuthUser, requestId: string, dto: ApplyRescheduleDto) {
    // Re-checked here, not just in the @Roles guard — the calendar is the one
    // thing in this feature a customer must never be able to move.
    if (!APPLY_ROLES.includes(user.role as Role)) {
      throw new ForbiddenException('Only staff can apply a reschedule to the calendar');
    }

    const request = await this.prisma.rescheduleRequest.findFirst({
      where: { id: requestId, companyId: user.companyId },
      include: { slots: true, job: true },
    });
    if (!request) throw new NotFoundException(`Reschedule request ${requestId} not found`);

    if (request.status !== RescheduleStatus.SLOT_PICKED || !request.pickedSlotId) {
      throw new BadRequestException('No time has been agreed on this request yet');
    }

    const slot = request.slots.find((s) => s.id === request.pickedSlotId);
    if (!slot) throw new BadRequestException('The agreed slot no longer exists on this request');
    if (slot.startAt.getTime() <= Date.now()) {
      throw new BadRequestException('The agreed time has already passed — propose a new time instead');
    }

    const job = request.job;
    if (TERMINAL_STATUSES.includes(job.status)) {
      // Auto-close so it stops sitting in the inbox forever.
      await this.prisma.$transaction(async (tx) => {
        await tx.rescheduleRequest.updateMany({
          where: { id: requestId, status: RescheduleStatus.SLOT_PICKED },
          data: { status: RescheduleStatus.CANCELLED },
        });
        await tx.job.update({ where: { id: job.id }, data: { rescheduleState: null } });
      });
      throw new BadRequestException(
        `This job is already ${job.status} and can no longer be rescheduled. The request has been closed.`,
      );
    }

    // A technician may have set off after the customer picked a slot. Cancelling
    // them mid-drive is a decision a human has to make explicitly — the inbox's
    // one-click Apply never sends confirmEnRoute.
    if (job.status === 'EN_ROUTE' && !dto.confirmEnRoute) {
      throw new ConflictException(
        `${job.assignedToName ?? 'A technician'} is already on the way to this job. ` +
        'Confirm the reschedule to cancel that visit, or handle it as a no-show.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Conditional claim: two staff applying at once must not both write the
      // calendar and both email the customer a different time.
      const claimed = await tx.rescheduleRequest.updateMany({
        where: { id: requestId, status: RescheduleStatus.SLOT_PICKED },
        data: { status: RescheduleStatus.APPLIED, appliedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new ConflictException('This reschedule was just applied by someone else');
      }

      await tx.job.update({
        where: { id: job.id },
        data: {
          scheduledStart: slot.startAt,
          scheduledEnd: slot.endAt,
          // Auto-unassign: the agreed time may not suit whoever was booked, so
          // the job goes back to the dispatch queue to be re-assigned.
          assignedToId: null,
          assignedToName: null,
          status: 'PENDING' as any,
          rescheduleState: null,
        },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId: job.id,
          fromStatus: job.status as any,
          toStatus: 'PENDING' as any,
          changedById: user.userId,
          changedByName: user.name ?? user.email,
          note: `Rescheduled to ${slot.startAt.toISOString()} — returned to the dispatch queue`,
        },
      });
    });

    // Best-effort, after the transaction. A stale assignment is visible on the
    // dispatch board and fixable; a rolled-back calendar change is not.
    await this.scheduling.cancelAssignmentForJob(user.companyId, job.id);

    const applied = await this.core.findRequest(user.companyId, requestId);

    this.notify.applied(user.companyId, { job: job as any, request: applied })
      .catch((err: unknown) => this.logger.warn(`Reschedule applied notification failed: ${
        err instanceof Error ? err.message : String(err)}`));

    return applied;
  }
}
```

- [ ] **Step 4: Run tests and type-check**

```bash
pnpm --filter job-service test -- reschedule-apply
pnpm --filter job-service type-check
```

Expected: 15 tests PASS, type-check clean.

- [ ] **Step 5: Stage (do not commit)**

```bash
git add apps/job-service/src/reschedule/
```

---

### Task 8: Controller, module wiring, and route-level role gates

**Files:**
- Create: `apps/job-service/src/reschedule/reschedule.controller.ts`
- Create: `apps/job-service/src/reschedule/reschedule.module.ts`
- Modify: `apps/job-service/src/app.module.ts`

**Interfaces:**
- Consumes: Tasks 3–7's services and DTOs.
- Produces: the seven HTTP routes listed in the spec, mounted at `/reschedule/*` and reached from the frontends as `/jobs/reschedule/*`.

- [ ] **Step 1: Write the controller**

```ts
// apps/job-service/src/reschedule/reschedule.controller.ts
import {
  Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { RescheduleService } from './reschedule.service';
import { RescheduleApplyService } from './reschedule-apply.service';
import { OpenRescheduleDto, RespondRescheduleDto, ApplyRescheduleDto } from './dto/reschedule.dto';

const STAFF_ROLES = [
  Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER,
] as const;

@ApiTags('Rescheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reschedule')
export class RescheduleController {
  constructor(
    private readonly reschedule: RescheduleService,
    private readonly applyService: RescheduleApplyService,
  ) {}

  @Post('jobs/:jobId')
  @Roles(...STAFF_ROLES, Role.CUSTOMER)
  @ApiOperation({ summary: 'Open a reschedule request (propose slots, or ask openly)' })
  open(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Body() dto: OpenRescheduleDto) {
    return this.reschedule.open(user, jobId, dto);
  }

  @Get('jobs/:jobId')
  @Roles(...STAFF_ROLES, Role.CUSTOMER)
  @ApiOperation({ summary: 'Full reschedule history for a job, newest round first' })
  history(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    return this.reschedule.history(user, jobId);
  }

  @Get('inbox')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: 'Every reschedule round currently waiting on staff' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  inbox(@CurrentUser() user: AuthUser, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.reschedule.inbox(user.companyId, page ?? 1, limit ?? 20);
  }

  @Get('stats')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: 'Reschedule counts by reason and by who opened them' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  stats(@CurrentUser() user: AuthUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reschedule.stats(user.companyId, from, to);
  }

  @Post(':id/respond')
  @Roles(...STAFF_ROLES, Role.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pick a slot, counter with your own, or decline' })
  async respond(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RespondRescheduleDto,
  ) {
    const { request, shouldApply } = await this.reschedule.respond(user, id, dto);
    // A staff member picking a slot IS the confirmation, so it lands on the
    // calendar in the same request rather than parking in their own inbox.
    if (shouldApply) return this.applyService.apply(user, id, {});
    return request;
  }

  @Post(':id/apply')
  @Roles(...STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Commit the agreed time to the calendar (staff only)' })
  apply(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ApplyRescheduleDto) {
    return this.applyService.apply(user, id, dto);
  }

  @Post(':id/cancel')
  @Roles(...STAFF_ROLES, Role.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw a request you opened' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reschedule.cancel(user, id);
  }
}
```

Note the route order: `inbox` and `stats` are declared **before** `:id/...`
routes so Nest does not match the literal `inbox` as an `:id` param.

- [ ] **Step 2: Write the module**

```ts
// apps/job-service/src/reschedule/reschedule.module.ts
import { Module } from '@nestjs/common';
import { RescheduleController } from './reschedule.controller';
import { RescheduleService } from './reschedule.service';
import { RescheduleApplyService } from './reschedule-apply.service';
import { SchedulingClient } from './scheduling.client';
import { RescheduleNotifyClient } from './reschedule-notify.client';

@Module({
  controllers: [RescheduleController],
  providers: [RescheduleService, RescheduleApplyService, SchedulingClient, RescheduleNotifyClient],
  exports: [RescheduleService],
})
export class RescheduleModule {}
```

- [ ] **Step 3: Register it in the app module**

In `apps/job-service/src/app.module.ts`, add the import and append
`RescheduleModule` to the `imports` array after `WorkOrdersModule`.

- [ ] **Step 4: Verify the service boots**

```bash
pnpm --filter job-service build
pnpm --filter job-service type-check
pnpm --filter job-service test
```

Expected: build clean, type-check clean, all tests PASS (job-service total ~101).

- [ ] **Step 5: Smoke-test the routes against a running instance**

```bash
# In one shell:
pnpm --filter job-service dev
# In another — dev bypass headers, no JWT needed:
curl -s localhost:3002/reschedule/inbox \
  -H 'x-test-company-id: co-demo-001' \
  -H 'x-test-user-id: u1' -H 'x-test-user-role: company_admin' | head -c 200
```

Expected: `{"data":[],"meta":{...}}`. A 404 means the module was not registered;
a 403 means the role header is wrong.

- [ ] **Step 6: Stage (do not commit)**

```bash
git add apps/job-service/src/reschedule/ apps/job-service/src/app.module.ts
```

---

# Phase 3 — Notifications

### Task 9: `RescheduleNotifyClient` — the real fire-and-forget bridge

**Files:**
- Modify: `apps/job-service/src/reschedule/reschedule-notify.client.ts` (replacing Task 3's stub)
- Create: `apps/job-service/src/reschedule/reschedule-notify.client.spec.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `RescheduleNotifyClient` with `requestOpened` / `responded` / `applied` / `closed`, each `(companyId: string, payload: RescheduleNotifyPayload) => Promise<void>` and each POSTing `{ event, job, request }` to comms-service `POST /notifications/reschedule`. Never rejects.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/job-service/src/reschedule/reschedule-notify.client.spec.ts
import axios from 'axios';
import { RescheduleNotifyClient } from './reschedule-notify.client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const payload = {
  job: { id: 'job-1', customerId: 'cust-1', customerName: 'Alice',
         customerEmail: 'alice@test.com', title: 'AC', jobNumber: 'JOB-1',
         scheduledStart: new Date(), assignedToName: 'Miguel' },
  request: { id: 'req-1', openedBy: 'ADMIN', mode: 'PROPOSE_SLOTS', slots: [] },
} as any;

describe('RescheduleNotifyClient', () => {
  let client: RescheduleNotifyClient;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BYPASS_AUTH = 'true';
    client = new RescheduleNotifyClient();
  });

  it('posts the event name comms-service switches on', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });
    await client.requestOpened('co-1', payload);

    const [url, body] = mockedAxios.post.mock.calls[0];
    expect(url).toContain('/notifications/reschedule');
    expect(body).toEqual(expect.objectContaining({ event: 'OPENED' }));
  });

  it.each([
    ['responded', 'RESPONDED'],
    ['applied', 'APPLIED'],
    ['closed', 'CLOSED'],
  ])('%s sends event %s', async (method, event) => {
    mockedAxios.post.mockResolvedValue({ data: {} });
    await (client as any)[method]('co-1', payload);
    expect(mockedAxios.post.mock.calls[0][1]).toEqual(expect.objectContaining({ event }));
  });

  it('resolves rather than throwing when comms-service is down', async () => {
    mockedAxios.post.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(client.applied('co-1', payload)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --filter job-service test -- reschedule-notify
```

Expected: FAIL — the stub sends nothing, so `mockedAxios.post.mock.calls[0]` is undefined.

- [ ] **Step 3: Implement the client**

```ts
// apps/job-service/src/reschedule/reschedule-notify.client.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const COMMS_URL = process.env.COMMS_SERVICE_URL ?? 'http://localhost:3005';

export type RescheduleEvent = 'OPENED' | 'RESPONDED' | 'APPLIED' | 'CLOSED';

export interface RescheduleNotifyPayload {
  job: Record<string, unknown>;
  request: Record<string, unknown>;
}

/**
 * Bridge to comms-service. Every method resolves even on failure: a reschedule
 * that reached the database is done, and a notification outage must never make
 * it look otherwise to the caller. Failures surface in comms-service's own logs.
 */
@Injectable()
export class RescheduleNotifyClient {
  private readonly logger = new Logger(RescheduleNotifyClient.name);

  requestOpened(companyId: string, p: RescheduleNotifyPayload) { return this.send(companyId, 'OPENED', p); }
  responded(companyId: string, p: RescheduleNotifyPayload)     { return this.send(companyId, 'RESPONDED', p); }
  applied(companyId: string, p: RescheduleNotifyPayload)       { return this.send(companyId, 'APPLIED', p); }
  closed(companyId: string, p: RescheduleNotifyPayload)        { return this.send(companyId, 'CLOSED', p); }

  private async send(companyId: string, event: RescheduleEvent, p: RescheduleNotifyPayload): Promise<void> {
    try {
      await axios.post(
        `${COMMS_URL}/notifications/reschedule`,
        { event, job: p.job, request: p.request },
        { timeout: 8_000, headers: this.serviceHeaders(companyId) },
      );
    } catch (err: any) {
      this.logger.warn(`Reschedule ${event} notification failed: ${err?.response?.status ?? ''} ${err.message}`);
    }
  }

  private serviceHeaders(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'job-service-reschedule-notify',
        'x-test-user-email': 'jobs-reschedule@tscrm.internal',
        'x-test-user-name': 'Job Service (reschedule)',
      };
    }
    return { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
  }
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter job-service test -- reschedule
pnpm --filter job-service type-check
```

Expected: all reschedule suites PASS, type-check clean.

- [ ] **Step 5: Stage (do not commit)**

```bash
git add apps/job-service/src/reschedule/
```

---

### Task 10: `StaffDirectoryClient` in comms-service

comms-service cannot currently answer "who are the dispatchers at this company".
This is the smallest thing that lets it notify staff.

**Files:**
- Create: `apps/comms-service/src/company-settings/staff-directory.client.ts`
- Create: `apps/comms-service/src/company-settings/staff-directory.client.spec.ts`
- Modify: `apps/comms-service/src/company-settings/company-settings.module.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `StaffDirectoryClient.getSchedulingStaff(companyId: string): Promise<Array<{ id: string; name: string; email: string; role: string }>>` — company admins, office managers and dispatchers; `[]` on failure; 5-minute in-memory cache.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/comms-service/src/company-settings/staff-directory.client.spec.ts
import { StaffDirectoryClient } from './staff-directory.client';

describe('StaffDirectoryClient', () => {
  let client: StaffDirectoryClient;

  beforeEach(() => {
    process.env.BYPASS_AUTH = 'true';
    client = new StaffDirectoryClient();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 'u1', name: 'Dee', email: 'dee@co.com', role: 'dispatcher' },
          { id: 'u2', name: 'Ola', email: 'ola@co.com', role: 'office_manager' },
          { id: 'u3', name: 'Tex', email: 'tex@co.com', role: 'technician' },
        ],
      }),
    }) as any;
  });

  it('returns only scheduling-facing staff, never technicians or customers', async () => {
    const staff = await client.getSchedulingStaff('co-1');
    expect(staff.map((s) => s.id).sort()).toEqual(['u1', 'u2']);
  });

  it('caches within the TTL so a burst of events makes one call', async () => {
    await client.getSchedulingStaff('co-1');
    await client.getSchedulingStaff('co-1');
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it('fails open with an empty list when crm-service is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('boom')) as any;
    await expect(client.getSchedulingStaff('co-2')).resolves.toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --filter comms-service test -- staff-directory
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the client**

Mirrors `CompanySettingsClient` in the same folder, including its auth pattern.

```ts
// apps/comms-service/src/company-settings/staff-directory.client.ts
import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Roles that should hear about reschedule activity. Technicians do not dispatch. */
const SCHEDULING_ROLES = ['company_admin', 'office_manager', 'dispatcher', 'super_admin'];

export interface StaffMember { id: string; name: string; email: string; role: string }

interface CacheEntry { value: StaffMember[]; expiresAt: number }

/**
 * Answers "who should be told about a reschedule" by reading crm-service's user
 * list. Fails open with an empty list: a missing staff notification is a far
 * smaller problem than a crm blip breaking the reschedule flow itself.
 */
@Injectable()
export class StaffDirectoryClient {
  private readonly logger = new Logger(StaffDirectoryClient.name);
  private readonly cache = new Map<string, CacheEntry>();

  async getSchedulingStaff(companyId: string): Promise<StaffMember[]> {
    const hit = this.cache.get(companyId);
    if (hit && hit.expiresAt > Date.now()) return hit.value;

    try {
      const res = await fetch(`${CRM_SERVICE_URL}/users?limit=100&isActive=true`, {
        headers: this.authHeaders(companyId),
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) throw new Error(`crm responded ${res.status}`);
      const body = (await res.json()) as { data?: StaffMember[] } | StaffMember[];
      const users = Array.isArray(body) ? body : body.data ?? [];
      const value = users.filter((u) => SCHEDULING_ROLES.includes(u.role));
      this.cache.set(companyId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    } catch (err) {
      this.logger.warn(`staff lookup failed for ${companyId}: ${(err as Error).message}`);
      return [];
    }
  }

  private authHeaders(companyId: string): Record<string, string> {
    const secret = process.env.JWT_SECRET;
    if (process.env.BYPASS_AUTH === 'true' || !secret) {
      return {
        'x-test-user-role': 'company_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'staff-directory-client',
        'x-test-user-email': 'service@tscrm.internal',
      };
    }
    const token = jwt.sign(
      { sub: 'staff-directory-client', email: 'service@tscrm.internal',
        company_id: companyId, role: 'company_admin' },
      secret,
      { expiresIn: '5m' },
    );
    return { Authorization: `Bearer ${token}` };
  }
}
```

- [ ] **Step 4: Export it from the module**

In `apps/comms-service/src/company-settings/company-settings.module.ts`, add
`StaffDirectoryClient` to both `providers` and `exports`.

- [ ] **Step 5: Run tests**

```bash
pnpm --filter comms-service test -- staff-directory
pnpm --filter comms-service type-check
```

Expected: 3 tests PASS, type-check clean.

- [ ] **Step 6: Stage (do not commit)**

```bash
git add apps/comms-service/src/company-settings/
```

---

### Task 11: Reschedule email builders

Pure functions, no Nest, so the HTML is testable directly.

**Files:**
- Create: `apps/comms-service/src/reschedule/reschedule-email.ts`
- Create: `apps/comms-service/src/reschedule/reschedule-email.spec.ts`

**Interfaces:**
- Consumes: `RESCHEDULE_WINDOWS`, `RescheduleActor`, `RescheduleMode` from `@tscrm/types`.
- Produces: `buildRescheduleEmail(input: RescheduleEmailInput): { subject: string; html: string }` where
  `RescheduleEmailInput = { event: 'OPENED' | 'RESPONDED' | 'APPLIED' | 'CLOSED' | 'NUDGE'; audience: 'CUSTOMER' | 'STAFF'; companyName: string; customerName: string; jobTitle: string; jobNumber?: string; reasonText?: string; slots: Array<{ id: string; startAt: string; endAt: string; window?: string | null }>; appliedSlot?: { startAt: string; endAt: string; window?: string | null }; portalUrl: string; timeZone: string; status: string }`.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/comms-service/src/reschedule/reschedule-email.spec.ts
import { buildRescheduleEmail } from './reschedule-email';

const base = {
  companyName: 'Acme HVAC',
  customerName: 'Alice',
  jobTitle: 'AC Maintenance',
  jobNumber: 'JOB-2026-0001',
  portalUrl: 'https://portal.test/jobs?reschedule=job-1',
  timeZone: 'America/Chicago',
  status: 'AWAITING_RESPONSE',
  slots: [
    { id: 's1', startAt: '2026-08-12T13:00:00.000Z', endAt: '2026-08-12T17:00:00.000Z', window: 'morning' },
    { id: 's2', startAt: '2026-08-13T17:00:00.000Z', endAt: '2026-08-13T21:00:00.000Z', window: 'afternoon' },
  ],
} as const;

describe('buildRescheduleEmail', () => {
  it('lists every proposed slot in the company timezone', () => {
    const { html } = buildRescheduleEmail({ ...base, event: 'OPENED', audience: 'CUSTOMER' });
    expect(html).toContain('Morning');
    expect(html).toContain('Afternoon');
    // 13:00Z in Chicago (CDT, UTC-5) is 8:00 AM
    expect(html).toContain('8:00');
  });

  it('uses no gradients anywhere', () => {
    const { html } = buildRescheduleEmail({ ...base, event: 'OPENED', audience: 'CUSTOMER' });
    expect(html).not.toContain('gradient');
  });

  it('carries the company name and the HVACtor.ai footer', () => {
    const { html } = buildRescheduleEmail({ ...base, event: 'OPENED', audience: 'CUSTOMER' });
    expect(html).toContain('Acme HVAC');
    expect(html).toContain('Powered by HVACtor.ai');
  });

  it('links to the portal so the customer can act', () => {
    const { html } = buildRescheduleEmail({ ...base, event: 'OPENED', audience: 'CUSTOMER' });
    expect(html).toContain('https://portal.test/jobs?reschedule=job-1');
  });

  it('an open ask with no slots asks for availability instead of listing times', () => {
    const { subject, html } = buildRescheduleEmail({
      ...base, event: 'OPENED', audience: 'CUSTOMER', slots: [],
    });
    expect(subject.toLowerCase()).toContain('reschedule');
    expect(html.toLowerCase()).toContain('what times work');
  });

  it('the applied email leads with the confirmed time', () => {
    const { subject, html } = buildRescheduleEmail({
      ...base, event: 'APPLIED', audience: 'CUSTOMER', slots: [],
      appliedSlot: { startAt: '2026-08-12T13:00:00.000Z', endAt: '2026-08-12T17:00:00.000Z', window: 'morning' },
      status: 'APPLIED',
    });
    expect(subject.toLowerCase()).toContain('confirmed');
    expect(html).toContain('8:00');
  });

  it('shows the reason when one was given', () => {
    const { html } = buildRescheduleEmail({
      ...base, event: 'OPENED', audience: 'CUSTOMER', reasonText: 'Parts delay',
    });
    expect(html).toContain('Parts delay');
  });

  it('escapes HTML in user-supplied text', () => {
    const { html } = buildRescheduleEmail({
      ...base, event: 'OPENED', audience: 'CUSTOMER',
      customerName: '<script>alert(1)</script>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('the nudge email says it is a reminder', () => {
    const { subject } = buildRescheduleEmail({ ...base, event: 'NUDGE', audience: 'CUSTOMER' });
    expect(subject.toLowerCase()).toContain('reminder');
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --filter comms-service test -- reschedule-email
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the builders**

```ts
// apps/comms-service/src/reschedule/reschedule-email.ts
import { RESCHEDULE_WINDOWS } from '@tscrm/types';

export type RescheduleEmailEvent = 'OPENED' | 'RESPONDED' | 'APPLIED' | 'CLOSED' | 'NUDGE';

export interface RescheduleEmailSlot {
  id?: string;
  startAt: string;
  endAt: string;
  window?: string | null;
}

export interface RescheduleEmailInput {
  event: RescheduleEmailEvent;
  audience: 'CUSTOMER' | 'STAFF';
  companyName: string;
  customerName: string;
  jobTitle: string;
  jobNumber?: string;
  reasonText?: string;
  slots: RescheduleEmailSlot[];
  appliedSlot?: RescheduleEmailSlot;
  portalUrl: string;
  timeZone: string;
  status: string;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** "Tue, Aug 12 · Morning (8:00 AM – 12:00 PM)" or an exact range when unwindowed. */
function formatSlot(slot: RescheduleEmailSlot, timeZone: string): string {
  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);
  const day = start.toLocaleDateString('en-US', {
    timeZone, weekday: 'short', month: 'short', day: 'numeric',
  });
  const t = (d: Date) => d.toLocaleTimeString('en-US', {
    timeZone, hour: 'numeric', minute: '2-digit',
  });
  const win = slot.window && slot.window in RESCHEDULE_WINDOWS
    ? RESCHEDULE_WINDOWS[slot.window as keyof typeof RESCHEDULE_WINDOWS]
    : null;
  return win
    ? `${day} · ${win.label} (${t(start)} – ${t(end)})`
    : `${day} · ${t(start)} – ${t(end)}`;
}

// Solid colours only — matches the job-status email family. Amber is the
// "you are the holdup" accent, green is settled, grey is closed.
const ACCENT: Record<RescheduleEmailEvent, string> = {
  OPENED: '#D97706',
  RESPONDED: '#2563EB',
  APPLIED: '#059669',
  CLOSED: '#6B7280',
  NUDGE: '#D97706',
};

const EYEBROW: Record<RescheduleEmailEvent, string> = {
  OPENED: 'Reschedule requested',
  RESPONDED: 'Reschedule update',
  APPLIED: 'New time confirmed',
  CLOSED: 'Reschedule closed',
  NUDGE: 'Reminder — still waiting on you',
};

export function buildRescheduleEmail(input: RescheduleEmailInput): { subject: string; html: string } {
  const job = esc(input.jobTitle);
  const company = esc(input.companyName);
  const who = esc(input.customerName || 'there');

  let subject: string;
  let heading: string;
  let lead: string;

  switch (input.event) {
    case 'APPLIED':
      subject = `New time confirmed — ${job}`;
      heading = 'Your new appointment time is confirmed';
      lead = `<strong>${job}</strong> has been moved. Here is the new time:`;
      break;
    case 'CLOSED':
      subject = `Reschedule closed — ${job}`;
      heading = 'That reschedule request is closed';
      lead = `The reschedule request for <strong>${job}</strong> has been closed. Your existing appointment stands.`;
      break;
    case 'NUDGE':
      subject = `Reminder: we're still waiting on you — ${job}`;
      heading = 'A quick reminder';
      lead = `We're still waiting to hear back about rescheduling <strong>${job}</strong>.`;
      break;
    case 'RESPONDED':
      subject = `Reschedule update — ${job}`;
      heading = 'There is an update on your reschedule';
      lead = `There is a new proposal for <strong>${job}</strong>.`;
      break;
    default:
      subject = input.slots.length
        ? `Can we move your visit? — ${job}`
        : `We need to reschedule — ${job}`;
      heading = input.slots.length ? 'Can we move your visit?' : 'We need to reschedule your visit';
      lead = input.slots.length
        ? `We'd like to move <strong>${job}</strong>. Any of these work?`
        : `We need to move <strong>${job}</strong>.`;
  }

  const accent = ACCENT[input.event];

  const slotList = input.slots.length
    ? `<div style="border:1px solid ${accent}33;background:${accent}0d;border-radius:12px;padding:16px 18px;margin-top:4px;">
         <p style="margin:0 0 10px;font-size:11.5px;font-weight:700;text-transform:uppercase;color:${accent};letter-spacing:0.06em;">Proposed times</p>
         ${input.slots.map((s) => `<p style="margin:0 0 8px;font-size:14.5px;font-weight:600;color:#111827;">${esc(formatSlot(s, input.timeZone))}</p>`).join('')}
       </div>`
    : '';

  const appliedBlock = input.appliedSlot
    ? `<div style="border:1px solid ${accent}33;background:${accent}0d;border-radius:12px;padding:18px 20px;">
         <p style="margin:0 0 6px;font-size:11.5px;font-weight:700;text-transform:uppercase;color:${accent};letter-spacing:0.06em;">Confirmed for</p>
         <p style="margin:0;font-size:17px;font-weight:700;color:#111827;">${esc(formatSlot(input.appliedSlot, input.timeZone))}</p>
       </div>`
    : '';

  const askBlock = input.event !== 'APPLIED' && input.event !== 'CLOSED' && !input.slots.length
    ? `<div style="border:1px solid ${accent}33;background:${accent}0d;border-radius:12px;padding:16px 18px;">
         <p style="margin:0;font-size:14px;color:#111827;">Please let us know what times work for you and we'll book it in.</p>
       </div>`
    : '';

  const reasonBlock = input.reasonText
    ? `<div style="margin-top:16px;padding:14px 16px;background:#F9FAFB;border-radius:10px;">
         <p style="margin:0 0 4px;font-size:11.5px;font-weight:700;text-transform:uppercase;color:#6B7280;letter-spacing:0.06em;">Reason</p>
         <p style="margin:0;font-size:13.5px;color:#374151;">${esc(input.reasonText)}</p>
       </div>`
    : '';

  const cta = input.event === 'CLOSED'
    ? ''
    : `<div style="margin-top:24px;">
         <a href="${esc(input.portalUrl)}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:10px;">
           ${input.event === 'APPLIED' ? 'View your booking' : 'Choose a time'}
         </a>
       </div>`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#F3F4F6;padding:32px 18px;font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#111827;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E5E7EB;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.06);">
    <div style="padding:28px 32px;background:${accent};">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.78);margin-bottom:8px;">${EYEBROW[input.event]}</div>
      <h1 style="margin:0;font-size:21px;color:#ffffff;">${heading}</h1>
    </div>
    <div style="padding:30px 32px;">
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi ${who},</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4B5563;">${lead}</p>
      ${appliedBlock}${slotList}${askBlock}${reasonBlock}${cta}
      <p style="margin:26px 0 0;font-size:12.5px;line-height:1.7;color:#6B7280;border-top:1px solid #E5E7EB;padding-top:16px;">
        ${input.jobNumber ? `Job ${esc(input.jobNumber)} · ` : ''}Sent by ${company} · Powered by HVACtor.ai
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter comms-service test -- reschedule-email
pnpm --filter comms-service type-check
```

Expected: 9 tests PASS, type-check clean.

- [ ] **Step 5: Stage (do not commit)**

```bash
git add apps/comms-service/src/reschedule/
```

---

### Task 12: `RescheduleNotificationService`, controller, and module

**Files:**
- Create: `apps/comms-service/src/reschedule/dto/reschedule-notification.dto.ts`
- Create: `apps/comms-service/src/reschedule/reschedule-notification.service.ts`
- Create: `apps/comms-service/src/reschedule/reschedule-notification.service.spec.ts`
- Create: `apps/comms-service/src/reschedule/reschedule.controller.ts`
- Create: `apps/comms-service/src/reschedule/reschedule.module.ts`
- Modify: `apps/comms-service/src/app.module.ts`

**Interfaces:**
- Consumes: Task 10's `StaffDirectoryClient.getSchedulingStaff`; Task 11's `buildRescheduleEmail`; the existing `NotificationsService.sendEmail` and `CompanySettingsClient.getSettings`.
- Produces: `POST /notifications/reschedule` accepting `{ event, job, request }`, and `RescheduleNotificationService.notify(companyId, dto): Promise<{ email: boolean; inApp: number }>`.

- [ ] **Step 1: Write the DTO**

```ts
// apps/comms-service/src/reschedule/dto/reschedule-notification.dto.ts
import { IsIn, IsObject, IsNotEmpty } from 'class-validator';

export const RESCHEDULE_EVENTS = ['OPENED', 'RESPONDED', 'APPLIED', 'CLOSED', 'NUDGE'] as const;
export type RescheduleEventName = (typeof RESCHEDULE_EVENTS)[number];

export class RescheduleNotificationDto {
  @IsIn(RESCHEDULE_EVENTS as unknown as string[])
  event!: RescheduleEventName;

  // Loose shapes on purpose: job-service owns these records, and pinning every
  // field here would mean a DTO change every time that schema grows.
  @IsObject() @IsNotEmpty() job!: Record<string, any>;
  @IsObject() @IsNotEmpty() request!: Record<string, any>;
}
```

- [ ] **Step 2: Write the failing tests**

```ts
// apps/comms-service/src/reschedule/reschedule-notification.service.spec.ts
import { Test } from '@nestjs/testing';
import { RescheduleNotificationService } from './reschedule-notification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { StaffDirectoryClient } from '../company-settings/staff-directory.client';
import { PrismaService } from '../prisma/prisma.service';

describe('RescheduleNotificationService', () => {
  let service: RescheduleNotificationService;

  const notifications = { sendEmail: jest.fn().mockResolvedValue({ id: 'n1' }) };
  const settings = {
    getSettings: jest.fn().mockResolvedValue({
      id: 'co-1', name: 'Acme HVAC', currency: 'USD', timezone: 'America/Chicago', features: {},
    }),
  };
  const staff = {
    getSchedulingStaff: jest.fn().mockResolvedValue([
      { id: 'u1', name: 'Dee', email: 'dee@co.com', role: 'dispatcher' },
    ]),
  };
  const prisma = { notification: { create: jest.fn().mockResolvedValue({ id: 'in-app-1' }) } };

  const job = {
    id: 'job-1', customerId: 'cust-1', customerName: 'Alice',
    customerEmail: 'alice@test.com', title: 'AC Maintenance', jobNumber: 'JOB-1',
  };
  const request = {
    id: 'req-1', openedBy: 'ADMIN', mode: 'PROPOSE_SLOTS', status: 'AWAITING_RESPONSE',
    reasonCode: 'PARTS_DELAY', reason: 'awaiting a compressor',
    slots: [{ id: 's1', startAt: '2026-08-12T13:00:00.000Z', endAt: '2026-08-12T17:00:00.000Z', window: 'morning' }],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RescheduleNotificationService,
        { provide: NotificationsService, useValue: notifications },
        { provide: CompanySettingsClient, useValue: settings },
        { provide: StaffDirectoryClient, useValue: staff },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(RescheduleNotificationService);
  });

  it('a staff-opened request emails the customer and does not email staff', async () => {
    const res = await service.notify('co-1', { event: 'OPENED', job, request } as any);
    expect(res.email).toBe(true);
    expect(notifications.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      recipientEmail: 'alice@test.com',
    }));
    expect(staff.getSchedulingStaff).not.toHaveBeenCalled();
  });

  it('a customer-opened request notifies staff in-app and does not email the customer', async () => {
    const res = await service.notify('co-1', {
      event: 'OPENED', job, request: { ...request, openedBy: 'CUSTOMER' },
    } as any);
    expect(notifications.sendEmail).not.toHaveBeenCalled();
    expect(prisma.notification.create).toHaveBeenCalled();
    expect(res.inApp).toBe(1);
  });

  it('always writes an in-app notification for the customer alongside their email', async () => {
    await service.notify('co-1', { event: 'APPLIED', job, request } as any);
    const created = prisma.notification.create.mock.calls[0][0].data;
    expect(created.recipientId).toBe('cust-1');
    expect(created.channel).toBe('IN_APP');
    expect(created.jobId).toBe('job-1');
  });

  it('skips email but still records in-app when the customer has no email address', async () => {
    const res = await service.notify('co-1', {
      event: 'OPENED', job: { ...job, customerEmail: null }, request,
    } as any);
    expect(res.email).toBe(false);
    expect(notifications.sendEmail).not.toHaveBeenCalled();
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('renders times in the tenant timezone from settings', async () => {
    await service.notify('co-1', { event: 'OPENED', job, request } as any);
    const html = notifications.sendEmail.mock.calls[0][0].htmlBody;
    expect(html).toContain('8:00'); // 13:00Z is 8:00 AM in Chicago (CDT)
  });

  it('does not throw when email delivery fails', async () => {
    notifications.sendEmail.mockRejectedValueOnce(new Error('smtp down'));
    await expect(
      service.notify('co-1', { event: 'OPENED', job, request } as any),
    ).resolves.toEqual(expect.objectContaining({ email: false }));
  });
});
```

- [ ] **Step 3: Run to verify failure**

```bash
pnpm --filter comms-service test -- reschedule-notification
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement the service**

```ts
// apps/comms-service/src/reschedule/reschedule-notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { StaffDirectoryClient } from '../company-settings/staff-directory.client';
import { Channel, DeliveryStatus } from '../prisma/generated';
import { buildRescheduleEmail } from './reschedule-email';
import { RescheduleNotificationDto } from './dto/reschedule-notification.dto';

const PORTAL_URL = process.env.CUSTOMER_PORTAL_URL ?? 'https://tscrm-demo-customer.web.app';

/**
 * Delivers reschedule notifications. Mirrors EnRouteNotificationService: every
 * failure is logged and swallowed, because by the time this runs the reschedule
 * itself has already been recorded and must not appear to have failed.
 */
@Injectable()
export class RescheduleNotificationService {
  private readonly logger = new Logger(RescheduleNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly companySettings: CompanySettingsClient,
    private readonly staff: StaffDirectoryClient,
  ) {}

  async notify(companyId: string, dto: RescheduleNotificationDto): Promise<{ email: boolean; inApp: number }> {
    const { event, job, request } = dto;
    const settings = await this.companySettings.getSettings(companyId);
    const companyName = settings.name || 'HVACtor.ai';
    const timeZone = settings.timezone || 'America/Chicago';

    // Who needs to hear about this: the side that now holds the ball.
    const customerFacing = this.isCustomerFacing(event, request);

    let email = false;
    let inApp = 0;

    if (customerFacing) {
      const { subject, html } = buildRescheduleEmail({
        event: event === 'NUDGE' ? 'NUDGE' : (event as any),
        audience: 'CUSTOMER',
        companyName,
        customerName: job.customerName ?? 'there',
        jobTitle: job.title ?? 'your service',
        jobNumber: job.jobNumber,
        reasonText: request.reason ?? undefined,
        slots: request.slots ?? [],
        appliedSlot: this.appliedSlot(request),
        portalUrl: `${PORTAL_URL}/jobs?reschedule=${encodeURIComponent(job.id)}`,
        timeZone,
        status: request.status,
      });

      if (job.customerEmail) {
        try {
          await this.notifications.sendEmail({
            companyId,
            customerId: job.customerId ?? undefined,
            jobId: job.id,
            recipientId: job.customerId ?? job.id,
            recipientName: job.customerName ?? undefined,
            recipientEmail: job.customerEmail,
            subject,
            htmlBody: html,
          });
          email = true;
        } catch (err) {
          this.logger.warn(`Reschedule email failed for job ${job.id}: ${(err as Error).message}`);
        }
      }

      inApp += await this.writeInApp({
        companyId,
        recipientId: job.customerId ?? job.id,
        recipientName: job.customerName ?? undefined,
        customerId: job.customerId ?? undefined,
        jobId: job.id,
        title: subject,
        body: this.inAppBody(event, job),
      });
    } else {
      // Staff side is in-app only — the inbox is where the work actually happens.
      const recipients = await this.staff.getSchedulingStaff(companyId);
      const title = this.staffTitle(event, job);
      const body = this.inAppBody(event, job);
      for (const member of recipients) {
        inApp += await this.writeInApp({
          companyId,
          recipientId: member.id,
          recipientName: member.name,
          jobId: job.id,
          title,
          body,
        });
      }
    }

    this.logger.log(`Reschedule ${event} for job ${job.id}: email=${email} inApp=${inApp}`);
    return { email, inApp };
  }

  /**
   * APPLIED and CLOSED always go to the customer — they are outcomes the
   * customer needs to know. For everything else, whoever did NOT act is the one
   * who needs telling, and `openedBy` on the newest round identifies who acted.
   */
  private isCustomerFacing(event: string, request: Record<string, any>): boolean {
    if (event === 'APPLIED' || event === 'CLOSED') return true;
    if (event === 'NUDGE') return request.openedBy === 'ADMIN';
    return request.openedBy === 'ADMIN';
  }

  private appliedSlot(request: Record<string, any>) {
    if (!request.pickedSlotId || !Array.isArray(request.slots)) return undefined;
    return request.slots.find((s: any) => s.id === request.pickedSlotId);
  }

  private staffTitle(event: string, job: Record<string, any>): string {
    const label = job.jobNumber ?? job.title ?? 'a job';
    switch (event) {
      case 'OPENED':    return `${job.customerName ?? 'A customer'} asked to reschedule ${label}`;
      case 'RESPONDED': return `${job.customerName ?? 'A customer'} responded on ${label}`;
      case 'NUDGE':     return `Still waiting: reschedule on ${label}`;
      case 'CLOSED':    return `Reschedule closed on ${label}`;
      default:          return `Reschedule update on ${label}`;
    }
  }

  private inAppBody(event: string, job: Record<string, any>): string {
    const title = job.title ?? 'your service';
    switch (event) {
      case 'APPLIED':   return `${title} has been moved to a new time.`;
      case 'CLOSED':    return `The reschedule request for ${title} was closed.`;
      case 'NUDGE':     return `A reschedule request for ${title} is still waiting for a reply.`;
      case 'RESPONDED': return `There is an update on the reschedule for ${title}.`;
      default:          return `A reschedule has been requested for ${title}.`;
    }
  }

  /**
   * Writes the row directly rather than going through NotificationsService.sendInApp,
   * which is built for a human broadcasting to a list and also creates a
   * "sender copy" — wrong for system-generated notifications.
   */
  private async writeInApp(data: {
    companyId: string; recipientId: string; recipientName?: string;
    customerId?: string; jobId: string; title: string; body: string;
  }): Promise<number> {
    try {
      await this.prisma.notification.create({
        data: {
          companyId: data.companyId,
          customerId: data.customerId,
          jobId: data.jobId,
          recipientId: data.recipientId,
          recipientName: data.recipientName,
          channel: Channel.IN_APP,
          title: data.title,
          body: data.body,
          status: DeliveryStatus.SENT,
          isRead: false,
          type: 'reschedule',
        },
      });
      return 1;
    } catch (err) {
      this.logger.warn(`In-app reschedule notification failed: ${(err as Error).message}`);
      return 0;
    }
  }
}
```

- [ ] **Step 5: Write the controller and module**

```ts
// apps/comms-service/src/reschedule/reschedule.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { RescheduleNotificationService } from './reschedule-notification.service';
import { RescheduleNotificationDto } from './dto/reschedule-notification.dto';

/** Internal endpoint — called by job-service. Same auth contract as /notifications/en-route. */
@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class RescheduleNotificationController {
  constructor(private readonly reschedule: RescheduleNotificationService) {}

  @Post('reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deliver a reschedule notification (email + in-app)' })
  notify(@CurrentUser() user: AuthUser, @Body() dto: RescheduleNotificationDto) {
    return this.reschedule.notify(user.companyId, dto);
  }
}
```

```ts
// apps/comms-service/src/reschedule/reschedule.module.ts
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { RescheduleNotificationController } from './reschedule.controller';
import { RescheduleNotificationService } from './reschedule-notification.service';

@Module({
  imports: [NotificationsModule, CompanySettingsModule],
  controllers: [RescheduleNotificationController],
  providers: [RescheduleNotificationService],
})
export class RescheduleNotificationModule {}
```

- [ ] **Step 6: Register in `app.module.ts`**

Add `RescheduleNotificationModule` to the `imports` array in
`apps/comms-service/src/app.module.ts`, next to `EnRouteModule`.

- [ ] **Step 7: Run tests, type-check, build**

```bash
pnpm --filter comms-service test -- reschedule
pnpm --filter comms-service type-check
pnpm --filter comms-service build
```

Expected: all reschedule suites PASS (15 tests across the two files), clean.

- [ ] **Step 8: Stage (do not commit)**

```bash
git add apps/comms-service/src/reschedule/ apps/comms-service/src/app.module.ts
```

---

### Task 13: Staleness nudge sweep

**Files:**
- Create: `apps/job-service/src/reschedule/reschedule-nudge.cron.ts`
- Create: `apps/job-service/src/reschedule/reschedule-nudge.cron.spec.ts`
- Modify: `apps/job-service/src/reschedule/reschedule.module.ts`

**Interfaces:**
- Consumes: Task 9's `RescheduleNotifyClient`; Prisma.
- Produces: `RescheduleNudgeCron` implementing `OnModuleInit` / `OnModuleDestroy`, with a public `sweep(): Promise<number>` returning how many nudges it actually claimed and sent.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/job-service/src/reschedule/reschedule-nudge.cron.spec.ts
import { Test } from '@nestjs/testing';
import { RescheduleStatus } from '@tscrm/types';
import { RescheduleNudgeCron } from './reschedule-nudge.cron';
import { RescheduleNotifyClient } from './reschedule-notify.client';
import { PrismaService } from '../prisma/prisma.service';

describe('RescheduleNudgeCron', () => {
  let cron: RescheduleNudgeCron;

  const stale = {
    id: 'req-1', companyId: 'co-1', jobId: 'job-1',
    status: RescheduleStatus.AWAITING_RESPONSE, openedBy: 'ADMIN',
    createdAt: new Date(Date.now() - 3 * 86_400_000), nudgedAt: null,
    slots: [], job: { id: 'job-1', title: 'AC', customerEmail: 'a@b.c' },
  };

  const prisma: any = {
    rescheduleRequest: { findMany: jest.fn(), updateMany: jest.fn() },
  };
  const notify = { requestOpened: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.rescheduleRequest.findMany.mockResolvedValue([stale]);
    prisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 1 });

    const module = await Test.createTestingModule({
      providers: [
        RescheduleNudgeCron,
        { provide: PrismaService, useValue: prisma },
        { provide: RescheduleNotifyClient, useValue: notify },
      ],
    }).compile();
    cron = module.get(RescheduleNudgeCron);
  });

  it('only looks at unanswered requests older than 48h that were never nudged', async () => {
    await cron.sweep();
    const where = prisma.rescheduleRequest.findMany.mock.calls[0][0].where;
    expect(where.status).toBe(RescheduleStatus.AWAITING_RESPONSE);
    expect(where.nudgedAt).toBeNull();
    expect(where.createdAt.lt).toBeInstanceOf(Date);
    expect(Date.now() - where.createdAt.lt.getTime()).toBeGreaterThanOrEqual(48 * 3_600_000 - 5_000);
  });

  it('claims each request before notifying, so a second instance sends nothing', async () => {
    prisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 0 });
    const sent = await cron.sweep();
    expect(sent).toBe(0);
    expect(notify.requestOpened).not.toHaveBeenCalled();
  });

  it('sends one nudge per claimed request', async () => {
    const sent = await cron.sweep();
    expect(sent).toBe(1);
    expect(notify.requestOpened).toHaveBeenCalledTimes(1);
  });

  it('keeps going when a single notification throws', async () => {
    prisma.rescheduleRequest.findMany.mockResolvedValue([stale, { ...stale, id: 'req-2' }]);
    notify.requestOpened.mockRejectedValueOnce(new Error('boom'));
    const sent = await cron.sweep();
    expect(sent).toBe(1);
    expect(notify.requestOpened).toHaveBeenCalledTimes(2);
  });

  it('does nothing when nothing is stale', async () => {
    prisma.rescheduleRequest.findMany.mockResolvedValue([]);
    expect(await cron.sweep()).toBe(0);
    expect(prisma.rescheduleRequest.updateMany).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --filter job-service test -- reschedule-nudge
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the sweep**

```ts
// apps/job-service/src/reschedule/reschedule-nudge.cron.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RescheduleStatus } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { RescheduleNotifyClient } from './reschedule-notify.client';

const SWEEP_INTERVAL_MS = 60 * 60 * 1000;   // hourly
const NUDGE_AFTER_MS = 48 * 60 * 60 * 1000; // 48h of silence

/**
 * Re-notifies whoever is sitting on an unanswered reschedule. An ignored
 * request is a no-show waiting to happen, and nothing else in the system would
 * surface it.
 *
 * Uses setInterval + an isRunning guard rather than @nestjs/schedule, matching
 * crm-service's agreements.cron.ts — ScheduleModule is not registered anywhere
 * in this repo.
 */
@Injectable()
export class RescheduleNudgeCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RescheduleNudgeCron.name);
  private intervalHandle?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: RescheduleNotifyClient,
  ) {}

  onModuleInit() {
    this.intervalHandle = setInterval(() => {
      void this.runGuarded();
    }, SWEEP_INTERVAL_MS);
    this.logger.log('Reschedule nudge sweep scheduled (hourly)');
  }

  onModuleDestroy() {
    if (this.intervalHandle) clearInterval(this.intervalHandle);
  }

  private async runGuarded() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const sent = await this.sweep();
      if (sent > 0) this.logger.log(`Reschedule nudges sent: ${sent}`);
    } catch (err) {
      this.logger.warn(`Reschedule nudge sweep failed: ${(err as Error).message}`);
    } finally {
      this.isRunning = false;
    }
  }

  async sweep(): Promise<number> {
    const cutoff = new Date(Date.now() - NUDGE_AFTER_MS);

    const candidates = await this.prisma.rescheduleRequest.findMany({
      where: {
        status: RescheduleStatus.AWAITING_RESPONSE,
        nudgedAt: null,
        createdAt: { lt: cutoff },
      },
      include: { slots: { orderBy: { startAt: 'asc' } }, job: true },
      take: 200,
    });

    let sent = 0;
    for (const request of candidates) {
      // Cloud Run runs several instances and each fires this interval. The
      // conditional claim means exactly one of them sends each nudge.
      const claimed = await this.prisma.rescheduleRequest.updateMany({
        where: { id: request.id, nudgedAt: null },
        data: { nudgedAt: new Date() },
      });
      if (claimed.count === 0) continue;

      try {
        // Reuses the OPENED payload shape; comms maps event NUDGE onto the
        // reminder copy and routes it to whoever holds the ball.
        await this.notify.requestOpened(request.companyId, {
          job: request.job as any,
          request: { ...request, __event: 'NUDGE' } as any,
        });
        sent += 1;
      } catch (err) {
        this.logger.warn(`Nudge for request ${request.id} failed: ${(err as Error).message}`);
      }
    }

    return sent;
  }
}
```

- [ ] **Step 4: Send the real NUDGE event rather than reusing OPENED**

Add a dedicated method to `RescheduleNotifyClient` (Task 9) so the reminder copy
is actually selected:

```ts
  nudge(companyId: string, p: RescheduleNotifyPayload) { return this.send(companyId, 'NUDGE', p); }
```

Add `'NUDGE'` to the `RescheduleEvent` union in the same file, then change the
cron's call from `this.notify.requestOpened(...)` to `this.notify.nudge(...)`
and drop the `__event` marker. Update the cron spec's mock and assertions to use
`notify.nudge` instead of `notify.requestOpened`.

- [ ] **Step 5: Register the cron**

Add `RescheduleNudgeCron` to `providers` in
`apps/job-service/src/reschedule/reschedule.module.ts`.

- [ ] **Step 6: Run tests, type-check, build**

```bash
pnpm --filter job-service test
pnpm --filter job-service type-check
pnpm --filter job-service build
```

Expected: all PASS, clean.

- [ ] **Step 7: Stage (do not commit)**

```bash
git add apps/job-service/src/reschedule/
```

---

# Phase 4 — Admin dashboard

No test runner exists in the frontends (see `CLAUDE.md`), so `pnpm --filter admin-dashboard build` — which runs `tsc -b` — is the gate for every task in this phase.

### Task 14: Admin types and query hooks

**Files:**
- Modify: `apps/admin-dashboard/src/types/api.ts`
- Create: `apps/admin-dashboard/src/hooks/useReschedule.ts`

**Interfaces:**
- Consumes: the Phase 2 API routes.
- Produces: types `RescheduleSlot`, `RescheduleRequest`, `RescheduleInboxRow`, `RescheduleStats`; `Job.rescheduleState`; hooks `useRescheduleHistory(jobId)`, `useRescheduleInbox()`, `useRescheduleStats(from?, to?)`, `useOpenReschedule()`, `useRespondReschedule()`, `useApplyReschedule()`, `useCancelReschedule()`.

- [ ] **Step 1: Add the types**

Append to `apps/admin-dashboard/src/types/api.ts`:

```ts
export type RescheduleStateValue = 'AWAITING_CUSTOMER' | 'AWAITING_ADMIN' | 'READY_TO_APPLY'

export interface RescheduleSlot {
  id: string
  startAt: string
  endAt: string
  window?: string | null
}

export interface RescheduleRequest {
  id: string
  companyId: string
  jobId: string
  openedBy: 'ADMIN' | 'CUSTOMER'
  openedByName?: string | null
  mode: 'PROPOSE_SLOTS' | 'OPEN_ASK'
  reasonCode: string
  reason?: string | null
  slots: RescheduleSlot[]
  status: 'AWAITING_RESPONSE' | 'SLOT_PICKED' | 'DECLINED' | 'SUPERSEDED' | 'APPLIED' | 'CANCELLED'
  pickedSlotId?: string | null
  responseNote?: string | null
  respondedAt?: string | null
  respondedByName?: string | null
  appliedAt?: string | null
  createdAt: string
}

export interface RescheduleInboxRow {
  request: RescheduleRequest
  job: {
    id: string
    jobNumber: string
    title: string
    customerName?: string | null
    customerEmail?: string | null
    scheduledStart?: string | null
    status: string
    assignedToName?: string | null
  }
  isStale: boolean
}

export interface RescheduleStats {
  byReason: Record<string, number>
  byActor: Record<string, number>
  applied: number
  declined: number
  total: number
}
```

And add to the existing `Job` interface, next to `statusHistory`:

```ts
  /** Non-null when a reschedule negotiation is open on this job. */
  rescheduleState?: RescheduleStateValue | null
```

- [ ] **Step 2: Write the hooks**

```ts
// apps/admin-dashboard/src/hooks/useReschedule.ts
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { RescheduleRequest, RescheduleInboxRow, RescheduleStats } from '../types/api'

/**
 * Applying a reschedule changes a job's time, status and technician at once, so
 * every job-shaped view is invalidated — the same set useJobs.ts invalidates,
 * plus the reschedule caches themselves.
 */
function invalidateRescheduleViews() {
  queryClient.invalidateQueries({ queryKey: ['jobs'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  queryClient.invalidateQueries({ queryKey: ['reschedule'] })
}

export function useRescheduleHistory(jobId?: string) {
  return useQuery({
    queryKey: ['reschedule', 'job', jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const res = await api.get<RescheduleRequest[]>(`/jobs/reschedule/jobs/${jobId}`)
      return res.data
    },
  })
}

export function useRescheduleInbox(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['reschedule', 'inbox', page, limit],
    queryFn: async () => {
      const res = await api.get<{ data: RescheduleInboxRow[]; meta: { total: number; totalPages: number } }>(
        '/jobs/reschedule/inbox', { params: { page, limit } })
      return res.data
    },
    // The inbox is shared work — a dispatcher should not be looking at a queue
    // another dispatcher cleared five minutes ago.
    refetchInterval: 60_000,
  })
}

export function useRescheduleStats(from?: string, to?: string) {
  return useQuery({
    queryKey: ['reschedule', 'stats', from, to],
    queryFn: async () => {
      const res = await api.get<RescheduleStats>('/jobs/reschedule/stats', { params: { from, to } })
      return res.data
    },
  })
}

export interface SlotInput { startAt: string; endAt: string; window?: string }

export function useOpenReschedule() {
  return useMutation({
    mutationFn: async (vars: {
      jobId: string
      mode: 'PROPOSE_SLOTS' | 'OPEN_ASK'
      reasonCode: string
      reason?: string
      slots?: SlotInput[]
    }) => {
      const { jobId, ...body } = vars
      const res = await api.post(`/jobs/reschedule/jobs/${jobId}`, body)
      return res.data as RescheduleRequest
    },
    onSuccess: invalidateRescheduleViews,
  })
}

export function useRespondReschedule() {
  return useMutation({
    mutationFn: async (vars: {
      requestId: string
      action: 'PICK' | 'COUNTER' | 'DECLINE'
      pickedSlotId?: string
      reasonCode?: string
      slots?: SlotInput[]
      note?: string
    }) => {
      const { requestId, ...body } = vars
      const res = await api.post(`/jobs/reschedule/${requestId}/respond`, body)
      return res.data as RescheduleRequest
    },
    onSuccess: invalidateRescheduleViews,
  })
}

export function useApplyReschedule() {
  return useMutation({
    mutationFn: async (vars: { requestId: string; confirmEnRoute?: boolean }) => {
      const res = await api.post(`/jobs/reschedule/${vars.requestId}/apply`, {
        confirmEnRoute: vars.confirmEnRoute,
      })
      return res.data as RescheduleRequest
    },
    onSuccess: invalidateRescheduleViews,
  })
}

export function useCancelReschedule() {
  return useMutation({
    mutationFn: async (requestId: string) => {
      const res = await api.post(`/jobs/reschedule/${requestId}/cancel`, {})
      return res.data as RescheduleRequest
    },
    onSuccess: invalidateRescheduleViews,
  })
}
```

- [ ] **Step 3: Build to verify types**

```bash
pnpm --filter admin-dashboard build
```

Expected: clean build.

- [ ] **Step 4: Stage (do not commit)**

```bash
git add apps/admin-dashboard/src/hooks/useReschedule.ts apps/admin-dashboard/src/types/api.ts
```

---

### Task 15: `RescheduleBadge` and `SlotPicker`

**Files:**
- Create: `apps/admin-dashboard/src/components/reschedule/RescheduleBadge.tsx`
- Create: `apps/admin-dashboard/src/components/reschedule/SlotPicker.tsx`

**Interfaces:**
- Consumes: `RescheduleStateValue` from `../../types/api`; `RESCHEDULE_WINDOWS`, `slotFromWindow` from `@tscrm/types`.
- Produces:
  - `<RescheduleBadge state={RescheduleStateValue | null | undefined} isStale?: boolean size?: 'sm' | 'md' />` — renders `null` when `state` is falsy.
  - `<SlotPicker value={SlotDraft[]} onChange={(next: SlotDraft[]) => void} max?: number />` where `SlotDraft = { id: string; date: string; window: 'morning' | 'afternoon' | 'evening' }`, and `slotDraftsToInput(drafts: SlotDraft[], timeZone: string): SlotInput[]`.

- [ ] **Step 1: Write the badge**

```tsx
// apps/admin-dashboard/src/components/reschedule/RescheduleBadge.tsx
import { CalendarClock, AlertTriangle } from 'lucide-react'
import type { RescheduleStateValue } from '../../types/api'

/**
 * Status pill for an open reschedule. Reads only Job.rescheduleState — a field
 * every job-shaped query already returns — so this is safe to drop onto any
 * surface without adding a fetch.
 *
 * Amber always means "you are the holdup", so a dispatcher can scan a list and
 * see their own work without reading labels. Red means nobody has replied in
 * five days.
 */
const META: Record<RescheduleStateValue, { label: string; color: string; bg: string }> = {
  AWAITING_ADMIN:    { label: 'Reschedule · needs reply', color: '#B45309', bg: 'rgba(217,119,6,0.12)' },
  AWAITING_CUSTOMER: { label: 'Reschedule · awaiting customer', color: '#1D4ED8', bg: 'rgba(37,99,235,0.12)' },
  READY_TO_APPLY:    { label: 'Ready to apply', color: '#047857', bg: 'rgba(5,150,105,0.12)' },
}

export default function RescheduleBadge({
  state, isStale = false, size = 'md',
}: {
  state?: RescheduleStateValue | null
  isStale?: boolean
  size?: 'sm' | 'md'
}) {
  if (!state) return null
  const meta = META[state]
  if (!meta) return null

  const color = isStale ? '#B91C1C' : meta.color
  const bg = isStale ? 'rgba(220,38,38,0.12)' : meta.bg
  const Icon = isStale ? AlertTriangle : CalendarClock

  return (
    <span
      title={isStale ? `${meta.label} — no reply in over 5 days` : meta.label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: size === 'sm' ? 9.5 : 10.5, fontWeight: 700,
        color, background: bg, padding: size === 'sm' ? '1px 6px' : '2px 8px',
        borderRadius: 999, whiteSpace: 'nowrap',
      }}
    >
      <Icon size={size === 'sm' ? 9 : 10} />
      {size === 'sm' ? 'Reschedule' : meta.label}
    </span>
  )
}
```

- [ ] **Step 2: Write the slot picker**

```tsx
// apps/admin-dashboard/src/components/reschedule/SlotPicker.tsx
import { Plus, X } from 'lucide-react'
import { RESCHEDULE_WINDOWS, slotFromWindow, type RescheduleWindowKey } from '@tscrm/types'

export interface SlotDraft {
  id: string
  date: string                 // yyyy-mm-dd from a native date input
  window: RescheduleWindowKey
}

export function emptySlotDraft(): SlotDraft {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return {
    id: Math.random().toString(36).slice(2),
    date: tomorrow.toISOString().slice(0, 10),
    window: 'morning',
  }
}

/**
 * Converts what the user picked into the UTC intervals the API stores. A window
 * slot deliberately spans the whole window — a customer who agreed to "Tuesday
 * morning" agreed to 8–12, not to 9:00 sharp.
 */
export function slotDraftsToInput(drafts: SlotDraft[], timeZone: string) {
  return drafts.map((d) => {
    const { startAt, endAt, window } = slotFromWindow(d.date, d.window, timeZone)
    return { startAt: startAt.toISOString(), endAt: endAt.toISOString(), window }
  })
}

const WINDOW_KEYS = Object.keys(RESCHEDULE_WINDOWS) as RescheduleWindowKey[]

export default function SlotPicker({
  value, onChange, max = 3,
}: {
  value: SlotDraft[]
  onChange: (next: SlotDraft[]) => void
  max?: number
}) {
  const today = new Date().toISOString().slice(0, 10)

  const update = (id: string, patch: Partial<SlotDraft>) =>
    onChange(value.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {value.map((slot, i) => (
        <div key={slot.id} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid var(--bd)', borderRadius: 10, padding: '10px 12px',
          background: 'var(--bg-card-2)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', width: 18 }}>{i + 1}</span>
          <input
            type="date"
            value={slot.date}
            min={today}
            onChange={(e) => update(slot.id, { date: e.target.value })}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 8, fontSize: 12.5,
              border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
            }}
          />
          <select
            value={slot.window}
            onChange={(e) => update(slot.id, { window: e.target.value as RescheduleWindowKey })}
            style={{
              padding: '7px 10px', borderRadius: 8, fontSize: 12.5,
              border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
            }}
          >
            {WINDOW_KEYS.map((k) => (
              <option key={k} value={k}>
                {RESCHEDULE_WINDOWS[k].label} · {RESCHEDULE_WINDOWS[k].range}
              </option>
            ))}
          </select>
          {value.length > 1 && (
            <button
              type="button"
              aria-label={`Remove option ${i + 1}`}
              onClick={() => onChange(value.filter((s) => s.id !== slot.id))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t4)', padding: 4 }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}

      {value.length < max && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onChange([...value, emptySlotDraft()])}
          style={{ alignSelf: 'flex-start' }}
        >
          <Plus size={12} /> Add another option
        </button>
      )}
      <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>
        Offering two or three options usually settles it in one message instead of several.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Build**

```bash
pnpm --filter admin-dashboard build
```

Expected: clean. If `@tscrm/types` exports are not found, run
`pnpm --filter @tscrm/types build` first — Turbo's `^build` should handle it,
but a stale `dist` will surface here.

- [ ] **Step 4: Stage (do not commit)**

```bash
git add apps/admin-dashboard/src/components/reschedule/
```

---

### Task 16: Admin `RescheduleModal`

**Files:**
- Create: `apps/admin-dashboard/src/components/reschedule/RescheduleModal.tsx`

**Interfaces:**
- Consumes: Task 14's hooks; Task 15's `SlotPicker`, `slotDraftsToInput`, `emptySlotDraft`, `SlotDraft`, `RescheduleBadge`; `STAFF_REASONS`, `RESCHEDULE_REASON_LABELS` from `@tscrm/types`.
- Produces: `<RescheduleModal job={{ id, title, jobNumber, customerName, scheduledStart, status, rescheduleState, assignedToName }} isOpen onClose />`.

- [ ] **Step 1: Write the modal**

```tsx
// apps/admin-dashboard/src/components/reschedule/RescheduleModal.tsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CalendarClock, Loader2, Check, MessageSquareWarning } from 'lucide-react'
import {
  STAFF_REASONS, RESCHEDULE_REASON_LABELS, RESCHEDULE_WINDOWS, type RescheduleWindowKey,
} from '@tscrm/types'
import { useToast } from '../../contexts/ToastContext'
import {
  useRescheduleHistory, useOpenReschedule, useRespondReschedule,
  useApplyReschedule, useCancelReschedule,
} from '../../hooks/useReschedule'
import type { RescheduleRequest, RescheduleStateValue } from '../../types/api'
import SlotPicker, { emptySlotDraft, slotDraftsToInput, type SlotDraft } from './SlotPicker'
import RescheduleBadge from './RescheduleBadge'

interface JobLike {
  id: string
  title: string
  jobNumber?: string
  customerName?: string | null
  scheduledStart?: string | null
  status: string
  rescheduleState?: RescheduleStateValue | null
  assignedToName?: string | null
}

const COMPANY_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone

function fmtSlot(startAt: string, endAt: string, window?: string | null) {
  const s = new Date(startAt)
  const e = new Date(endAt)
  const day = s.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const t = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const win = window && window in RESCHEDULE_WINDOWS
    ? RESCHEDULE_WINDOWS[window as RescheduleWindowKey].label
    : null
  return win ? `${day} · ${win} (${t(s)} – ${t(e)})` : `${day} · ${t(s)} – ${t(e)}`
}

export default function RescheduleModal({ job, isOpen, onClose }: {
  job: JobLike; isOpen: boolean; onClose: () => void
}) {
  const { showSuccess, showError } = useToast()
  const historyQ = useRescheduleHistory(isOpen ? job.id : undefined)
  const openMut = useOpenReschedule()
  const respondMut = useRespondReschedule()
  const applyMut = useApplyReschedule()
  const cancelMut = useCancelReschedule()

  const [mode, setMode] = useState<'PROPOSE_SLOTS' | 'OPEN_ASK'>('PROPOSE_SLOTS')
  const [reasonCode, setReasonCode] = useState<string>(STAFF_REASONS[0])
  const [reason, setReason] = useState('')
  const [slots, setSlots] = useState<SlotDraft[]>([emptySlotDraft()])

  if (!isOpen) return null

  const history = historyQ.data ?? []
  const live = history.find((r) => r.status === 'AWAITING_RESPONSE' || r.status === 'SLOT_PICKED')
  const busy = openMut.isPending || respondMut.isPending || applyMut.isPending || cancelMut.isPending

  const err = (e: any, fallback: string) =>
    showError(e?.response?.data?.message ?? fallback, 'Reschedule failed')

  const submitOpen = () => {
    openMut.mutate({
      jobId: job.id, mode, reasonCode, reason: reason.trim() || undefined,
      slots: mode === 'PROPOSE_SLOTS' ? slotDraftsToInput(slots, COMPANY_TZ) : undefined,
    }, {
      onSuccess: () => {
        showSuccess(mode === 'PROPOSE_SLOTS'
          ? 'Times sent to the customer.'
          : 'We asked the customer for their availability.')
        setReason(''); setSlots([emptySlotDraft()])
      },
      onError: (e) => err(e, 'Could not open the reschedule request.'),
    })
  }

  // Staff picking a customer's slot applies it in the same request — the
  // backend treats a staff pick as the confirmation.
  const pickSlot = (requestId: string, slotId: string) =>
    respondMut.mutate({ requestId, action: 'PICK', pickedSlotId: slotId }, {
      onSuccess: () => showSuccess('Time confirmed — the job is back in the dispatch queue.'),
      onError: (e) => err(e, 'Could not confirm that time.'),
    })

  const applyPicked = (requestId: string) => {
    const enRoute = job.status === 'EN_ROUTE'
    if (enRoute && !window.confirm(
      `${job.assignedToName ?? 'A technician'} is already on the way to this job.\n\n` +
      'Applying this reschedule will cancel that visit. Continue?',
    )) return
    applyMut.mutate({ requestId, confirmEnRoute: enRoute }, {
      onSuccess: () => showSuccess('New time applied. The job is back in the dispatch queue.'),
      onError: (e) => err(e, 'Could not apply the new time.'),
    })
  }

  const declineRequest = (requestId: string) =>
    respondMut.mutate({ requestId, action: 'DECLINE' }, {
      onSuccess: () => showSuccess('Request declined — the existing appointment stands.'),
      onError: (e) => err(e, 'Could not decline the request.'),
    })

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-card)] rounded-xl w-full max-w-2xl flex flex-col shadow-2xl"
        style={{ maxHeight: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--bd)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <CalendarClock size={16} style={{ color: 'var(--blue)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Reschedule</span>
              <RescheduleBadge state={job.rescheduleState} />
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--t3)' }}>
              {job.title}{job.customerName ? ` · ${job.customerName}` : ''}
              {job.scheduledStart
                ? ` · currently ${new Date(job.scheduledStart).toLocaleString(undefined,
                    { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                : ' · not yet scheduled'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {historyQ.isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--t3)' }} />
            </div>
          ) : live ? (
            <LiveRound
              request={live}
              busy={busy}
              onPick={pickSlot}
              onApply={applyPicked}
              onDecline={declineRequest}
              onCancel={(id) => cancelMut.mutate(id, {
                onSuccess: () => showSuccess('Request withdrawn.'),
                onError: (e) => err(e, 'Could not withdraw the request.'),
              })}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['PROPOSE_SLOTS', 'OPEN_ASK'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className="btn btn-sm"
                    style={mode === m
                      ? { background: 'var(--blue)', color: '#fff', border: '1px solid var(--blue)' }
                      : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)' }}
                  >
                    {m === 'PROPOSE_SLOTS' ? 'Offer times' : 'Ask what suits them'}
                  </button>
                ))}
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Why is this moving?
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  style={{
                    width: '100%', marginTop: 6, padding: '9px 12px', borderRadius: 10, fontSize: 13,
                    border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
                  }}
                >
                  {STAFF_REASONS.map((r) => (
                    <option key={r} value={r}>{RESCHEDULE_REASON_LABELS[r]}</option>
                  ))}
                </select>
                <p style={{ fontSize: 11, color: 'var(--t4)', margin: '6px 0 0' }}>
                  Used for reporting on why jobs move — not shown as a category to the customer.
                </p>
              </div>

              {mode === 'PROPOSE_SLOTS' && <SlotPicker value={slots} onChange={setSlots} />}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Message to the customer (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Shown to the customer exactly as written."
                  style={{
                    width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 10, fontSize: 13,
                    border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
                    fontFamily: 'inherit', resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}

          {history.filter((r) => r !== live).length > 0 && (
            <PastRounds rounds={history.filter((r) => r !== live)} />
          )}
        </div>

        <div style={{
          padding: '13px 22px', borderTop: '1px solid var(--bd)',
          display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--bg-card-2)',
        }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          {!live && (
            <button className="btn btn-primary btn-sm" onClick={submitOpen} disabled={busy}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <CalendarClock size={13} />}
              {mode === 'PROPOSE_SLOTS' ? 'Send times' : 'Ask the customer'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function LiveRound({ request, busy, onPick, onApply, onDecline, onCancel }: {
  request: RescheduleRequest
  busy: boolean
  onPick: (requestId: string, slotId: string) => void
  onApply: (requestId: string) => void
  onDecline: (requestId: string) => void
  onCancel: (requestId: string) => void
}) {
  const weOpened = request.openedBy === 'ADMIN'
  const picked = request.slots.find((s) => s.id === request.pickedSlotId)

  return (
    <div style={{
      border: '1px solid var(--bd)', borderRadius: 12, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontSize: 12.5, color: 'var(--t2)' }}>
        <strong>{weOpened ? 'You' : (request.openedByName ?? 'The customer')}</strong>
        {' '}{request.mode === 'OPEN_ASK' ? 'asked to reschedule' : 'proposed these times'}
        {' · '}{new Date(request.createdAt).toLocaleDateString()}
      </div>

      {request.reason && (
        <div style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: 'var(--t2)' }}>
          {request.reason}
        </div>
      )}

      {request.status === 'SLOT_PICKED' && picked ? (
        <>
          <div style={{
            border: '1px solid rgba(5,150,105,0.3)', background: 'rgba(5,150,105,0.08)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#047857', letterSpacing: '0.06em' }}>
              Customer chose
            </p>
            <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--t1)' }}>
              {fmtSlot(picked.startAt, picked.endAt, picked.window)}
            </p>
          </div>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onApply(request.id)}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Apply this time
          </button>
          <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>
            Applying moves the job and returns it to the dispatch queue for reassignment.
          </p>
        </>
      ) : weOpened ? (
        <>
          {request.slots.map((s) => (
            <div key={s.id} style={{
              border: '1px solid var(--bd)', borderRadius: 10, padding: '10px 12px',
              fontSize: 13, color: 'var(--t1)',
            }}>
              {fmtSlot(s.startAt, s.endAt, s.window)}
            </div>
          ))}
          <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader2 size={12} className="animate-spin" /> Waiting for the customer to choose.
          </p>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onCancel(request.id)}
            style={{ alignSelf: 'flex-start', color: 'var(--red)' }}>
            Withdraw request
          </button>
        </>
      ) : (
        <>
          {request.slots.length > 0 ? (
            <>
              <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t4)', margin: 0, letterSpacing: '0.06em' }}>
                Pick one to confirm it immediately
              </p>
              {request.slots.map((s) => (
                <button
                  key={s.id}
                  disabled={busy}
                  onClick={() => onPick(request.id, s.id)}
                  style={{
                    textAlign: 'left', border: '1px solid var(--bd)', borderRadius: 10,
                    padding: '11px 13px', fontSize: 13, fontWeight: 600, color: 'var(--t1)',
                    background: 'var(--bg-card)', cursor: busy ? 'not-allowed' : 'pointer',
                  }}
                >
                  {fmtSlot(s.startAt, s.endAt, s.window)}
                </button>
              ))}
            </>
          ) : (
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)',
              borderRadius: 10, padding: '11px 13px',
            }}>
              <MessageSquareWarning size={14} style={{ color: '#B45309', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--t2)' }}>
                They asked to reschedule without naming a time. Close this and open a new
                request offering them some options.
              </p>
            </div>
          )}
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onDecline(request.id)}
            style={{ alignSelf: 'flex-start', color: 'var(--red)' }}>
            Decline — keep the current time
          </button>
        </>
      )}
    </div>
  )
}

function PastRounds({ rounds }: { rounds: RescheduleRequest[] }) {
  return (
    <div style={{ marginTop: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
        Earlier rounds ({rounds.length})
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rounds.map((r) => (
          <div key={r.id} style={{
            display: 'flex', justifyContent: 'space-between', gap: 10,
            fontSize: 11.5, color: 'var(--t3)', padding: '7px 10px',
            background: 'var(--bg-hover)', borderRadius: 8,
          }}>
            <span>
              {r.openedBy === 'ADMIN' ? 'You' : 'Customer'}
              {' · '}{r.mode === 'OPEN_ASK' ? 'asked' : `offered ${r.slots.length}`}
            </span>
            <span style={{ fontWeight: 700 }}>{r.status.replace(/_/g, ' ').toLowerCase()}</span>
            <span>{new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build**

```bash
pnpm --filter admin-dashboard build
```

Expected: clean.

- [ ] **Step 3: Stage (do not commit)**

```bash
git add apps/admin-dashboard/src/components/reschedule/
```

---

### Task 17: Wire the modal into `JobDetailModal`

The smallest change that makes the feature usable from the admin side.

**Files:**
- Modify: `apps/admin-dashboard/src/pages/jobs/JobDetailModal.tsx`

**Interfaces:**
- Consumes: Task 15's `RescheduleBadge`, Task 16's `RescheduleModal`.
- Produces: nothing consumed downstream.

- [ ] **Step 1: Add the imports**

Alongside the existing `JobStatusOverrideMenu` import:

```tsx
import RescheduleBadge from "../../components/reschedule/RescheduleBadge";
import RescheduleModal from "../../components/reschedule/RescheduleModal";
```

- [ ] **Step 2: Add local state**

Next to the other `useState` declarations near the top of the component:

```tsx
  const [showReschedule, setShowReschedule] = useState(false);
```

- [ ] **Step 3: Show the badge in the header**

In the header's badge row — the `flex items-center gap-2 mb-0.5 flex-wrap` div
that already renders the status and priority badges — append after the
`hasShortage` block:

```tsx
              <RescheduleBadge state={job.rescheduleState} />
```

- [ ] **Step 4: Add the footer button**

In the footer's left-hand `flex gap-2 flex-wrap` div, immediately before
`<JobStatusOverrideMenu …/>`:

```tsx
            {["PENDING","SCHEDULED","ON_HOLD","EN_ROUTE"].includes(job.status) && (
              <button
                onClick={() => setShowReschedule(true)}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-60"
              >
                <CalendarClock size={14} /> Reschedule
              </button>
            )}
```

Add `CalendarClock` to the existing `lucide-react` import.

- [ ] **Step 5: Render the modal**

Immediately before the closing `</div>` of the modal box (next to where the
cancellation modal is rendered):

```tsx
        {showReschedule && (
          <RescheduleModal
            job={{
              id: job.id, title: job.title, jobNumber: job.jobNumber,
              customerName: job.customerName, scheduledStart: job.scheduledStart,
              status: job.status, rescheduleState: job.rescheduleState,
              assignedToName: job.assignedToName,
            }}
            isOpen={showReschedule}
            onClose={() => setShowReschedule(false)}
          />
        )}
```

- [ ] **Step 6: Build and verify by hand**

```bash
pnpm --filter admin-dashboard build
```

Then with the stack running (`pnpm dev` + `pnpm dev:admin`), open a `SCHEDULED`
job, click **Reschedule**, offer two slots, and confirm:
- the badge appears in the header as "Reschedule · awaiting customer"
- reopening the modal shows the live round rather than the open form
- **Withdraw request** clears the badge

- [ ] **Step 7: Stage (do not commit)**

```bash
git add apps/admin-dashboard/src/pages/jobs/JobDetailModal.tsx
```

---

### Task 18: Reschedules inbox tab

**Files:**
- Create: `apps/admin-dashboard/src/pages/scheduling/ReschedulesInbox.tsx`
- Modify: `apps/admin-dashboard/src/pages/scheduling/Scheduling.tsx`

**Interfaces:**
- Consumes: Task 14's `useRescheduleInbox`, `useApplyReschedule`, `useRespondReschedule`, `useRescheduleStats`; Task 15's `RescheduleBadge`.
- Produces: `<ReschedulesInbox onOpenJob={(jobId: string) => void} />`; a new `'reschedules'` value in `Scheduling.tsx`'s `SubTab` union.

- [ ] **Step 1: Write the inbox**

```tsx
// apps/admin-dashboard/src/pages/scheduling/ReschedulesInbox.tsx
import { Loader2, Check, CalendarClock, AlertTriangle, Inbox } from 'lucide-react'
import { RESCHEDULE_REASON_LABELS, RESCHEDULE_WINDOWS, type RescheduleWindowKey } from '@tscrm/types'
import { useToast } from '../../contexts/ToastContext'
import {
  useRescheduleInbox, useApplyReschedule, useRespondReschedule, useRescheduleStats,
} from '../../hooks/useReschedule'
import type { RescheduleInboxRow } from '../../types/api'

function fmtSlot(startAt: string, endAt: string, window?: string | null) {
  const s = new Date(startAt), e = new Date(endAt)
  const day = s.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const t = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const win = window && window in RESCHEDULE_WINDOWS
    ? RESCHEDULE_WINDOWS[window as RescheduleWindowKey].label : null
  return win ? `${day} · ${win}` : `${day} · ${t(s)}–${t(e)}`
}

function daysOld(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export default function ReschedulesInbox({ onOpenJob }: { onOpenJob: (jobId: string) => void }) {
  const inboxQ = useRescheduleInbox()
  const statsQ = useRescheduleStats()
  const applyMut = useApplyReschedule()
  const respondMut = useRespondReschedule()
  const { showSuccess, showError } = useToast()

  const rows = inboxQ.data?.data ?? []
  const stats = statsQ.data

  const apply = (row: RescheduleInboxRow) => {
    const enRoute = row.job.status === 'EN_ROUTE'
    if (enRoute && !window.confirm(
      `${row.job.assignedToName ?? 'A technician'} is already on the way to this job.\n\n` +
      'Applying this reschedule will cancel that visit. Continue?',
    )) return
    applyMut.mutate({ requestId: row.request.id, confirmEnRoute: enRoute }, {
      onSuccess: () => showSuccess(`${row.job.jobNumber} moved — back in the dispatch queue.`),
      onError: (e: any) => showError(e?.response?.data?.message ?? 'Could not apply the new time.', 'Failed'),
    })
  }

  const decline = (row: RescheduleInboxRow) =>
    respondMut.mutate({ requestId: row.request.id, action: 'DECLINE' }, {
      onSuccess: () => showSuccess('Declined — the existing appointment stands.'),
      onError: (e: any) => showError(e?.response?.data?.message ?? 'Could not decline.', 'Failed'),
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {stats && stats.total > 0 && (
        <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: 'var(--t2)' }}>
            <b style={{ color: 'var(--t1)' }}>{stats.total}</b> reschedules
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--t2)' }}>
            <b style={{ color: 'var(--green)' }}>{stats.applied}</b> applied
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--t2)' }}>
            <b style={{ color: 'var(--red)' }}>{stats.declined}</b> declined
          </span>
          <span style={{ width: 1, height: 18, background: 'var(--bd)' }} />
          {Object.entries(stats.byReason)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([code, count]) => (
              <span key={code} style={{ fontSize: 11.5, color: 'var(--t3)' }}>
                <b style={{ color: 'var(--t2)' }}>{count}</b>{' '}
                {RESCHEDULE_REASON_LABELS[code as keyof typeof RESCHEDULE_REASON_LABELS] ?? code}
              </span>
            ))}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {inboxQ.isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--t3)' }} />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Inbox size={28} style={{ color: 'var(--t4)', opacity: 0.6, margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>
              Nothing waiting on you. Reschedule requests from customers land here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {rows.map((row) => {
              const picked = row.request.slots.find((s) => s.id === row.request.pickedSlotId)
              const readyToApply = row.request.status === 'SLOT_PICKED' && !!picked
              const busy = applyMut.isPending || respondMut.isPending

              return (
                <div
                  key={row.request.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    borderBottom: '1px solid var(--bd)',
                    borderLeft: `3px solid ${row.isStale ? 'var(--red)' : readyToApply ? 'var(--green)' : 'var(--amber)'}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => onOpenJob(row.job.id)}
                        style={{
                          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                          fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', fontFamily: 'inherit',
                        }}
                      >
                        {row.job.title}
                      </button>
                      <span style={{ fontSize: 11, color: 'var(--t4)' }}>{row.job.jobNumber}</span>
                      {row.isStale && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10,
                          fontWeight: 700, color: '#B91C1C', background: 'rgba(220,38,38,0.12)',
                          padding: '2px 7px', borderRadius: 999,
                        }}>
                          <AlertTriangle size={9} /> {daysOld(row.request.createdAt)}d no reply
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 3 }}>
                      {row.job.customerName ?? '—'}
                      {' · '}
                      {readyToApply
                        ? `chose ${fmtSlot(picked!.startAt, picked!.endAt, picked!.window)}`
                        : row.request.mode === 'OPEN_ASK'
                          ? 'asked to reschedule — no time given'
                          : `proposed ${row.request.slots.length} time${row.request.slots.length === 1 ? '' : 's'}`}
                      {' · '}
                      {RESCHEDULE_REASON_LABELS[row.request.reasonCode as keyof typeof RESCHEDULE_REASON_LABELS] ?? row.request.reasonCode}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                    {readyToApply ? (
                      <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => apply(row)}>
                        {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Apply
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => onOpenJob(row.job.id)}>
                        <CalendarClock size={12} /> Respond
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => decline(row)}
                      style={{ color: 'var(--red)' }}>
                      Decline
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add the tab to `Scheduling.tsx`**

Change the `SubTab` union:

```ts
type SubTab = 'board' | 'active' | 'completed' | 'calendar' | 'reschedules'
```

Import the inbox and the hook for the count:

```tsx
import ReschedulesInbox from './ReschedulesInbox'
import { useRescheduleInbox } from '../../hooks/useReschedule'
```

Inside the component, next to the other queries:

```tsx
  const rescheduleInboxQ = useRescheduleInbox()
  const rescheduleCount = rescheduleInboxQ.data?.data.length ?? 0
```

Add the tab button after the Calendar button in the `page-tabs` row:

```tsx
          <button className={`tab-btn ${subTab === 'reschedules' ? 'active' : ''}`} onClick={() => setSubTab('reschedules')}>
            <CalendarClock size={14} /> Reschedules
            {rescheduleCount > 0 && <span className="tab-count">{rescheduleCount}</span>}
          </button>
```

Add `CalendarClock` to the `lucide-react` import at the top of the file.

Render the view alongside the other sub-tabs:

```tsx
      {subTab === 'reschedules' && (
        <ReschedulesInbox
          onOpenJob={(jobId) => {
            const job = allJobs.find((j) => j.id === jobId)
            if (job) handleOpenJob(job, assignmentByJobId[job.id])
          }}
        />
      )}
```

- [ ] **Step 3: Build and verify by hand**

```bash
pnpm --filter admin-dashboard build
```

With the stack running, open `/scheduling`, confirm the **Reschedules** tab
appears with a count, and that a customer-opened request shows there with a
**Respond** button.

- [ ] **Step 4: Stage (do not commit)**

```bash
git add apps/admin-dashboard/src/pages/scheduling/
```

---

### Task 19: The remaining admin badge surfaces

Mechanical once `RescheduleBadge` exists. Each surface already has the `Job`
object in scope, so no new fetches.

**Files (all Modify):**
- `apps/admin-dashboard/src/pages/jobs/Jobs.tsx`
- `apps/admin-dashboard/src/pages/dispatch/JobDetailPanel.tsx`
- `apps/admin-dashboard/src/pages/dispatch/DispatchCalendar.tsx`
- `apps/admin-dashboard/src/pages/scheduling/BoardPlan.tsx`
- `apps/admin-dashboard/src/pages/scheduling/BoardLive.tsx`
- `apps/admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx`
- `apps/admin-dashboard/src/pages/projects/ProjectDetail.tsx`
- `apps/admin-dashboard/src/pages/projects/HousesTab.tsx`

**Interfaces:**
- Consumes: Task 15's `RescheduleBadge`.
- Produces: nothing.

- [ ] **Step 1: Add the badge to each surface**

In every file, add the import:

```tsx
import RescheduleBadge from '../../components/reschedule/RescheduleBadge'
```

(adjust the relative depth per file — `../../components/...` from `pages/x/`).

Then place `<RescheduleBadge state={job.rescheduleState} size="sm" />` next to
wherever that surface already renders the job's status badge or scheduled time:

| File | Where |
|---|---|
| `jobs/Jobs.tsx` | in the status cell of each table row, after the status badge |
| `dispatch/JobDetailPanel.tsx` | in the header badge row, next to the `STATUS_META` pill |
| `dispatch/DispatchCalendar.tsx` | on each event chip, after the job title |
| `scheduling/BoardPlan.tsx` | on each planned job card, next to the time |
| `scheduling/BoardLive.tsx` | on each "Unassigned now" card, in the badge row that holds `PRIORITY`/`GPS` |
| `customers/CustomerDetailsSidebar.tsx` | on each job row in the Jobs tab |
| `projects/ProjectDetail.tsx` | on each job row in the Jobs tab |
| `projects/HousesTab.tsx` | on each service-log row |

Use `size="sm"` everywhere except `JobDetailPanel.tsx`, which has room for the
full label.

- [ ] **Step 2: Add a "Reschedule" action to `JobDetailPanel`**

`JobDetailPanel.tsx` is the scheduling board's job drawer and needs the action,
not just the badge. Add the same import, state and modal render as Task 17, and
put the button in the footer next to `JobStatusOverrideMenu`:

```tsx
              {["PENDING","SCHEDULED","ON_HOLD","EN_ROUTE"].includes(job.status) && (
                <FooterBtn
                  color="#2563eb" bg="rgba(37,99,235,0.08)" border="rgba(37,99,235,0.25)"
                  onClick={() => setShowReschedule(true)}
                >
                  <CalendarClock size={13} /> Reschedule
                </FooterBtn>
              )}
```

- [ ] **Step 3: Build**

```bash
pnpm --filter admin-dashboard build
```

Expected: clean. A `Property 'rescheduleState' does not exist` error means that
surface types its job rows locally instead of using `Job` from `types/api.ts` —
widen that local type rather than casting to `any`.

- [ ] **Step 4: Verify each surface by hand**

With a job in `AWAITING_CUSTOMER`, walk `/jobs`, `/scheduling` (Board · both
scopes, Calendar), a customer's detail sidebar, and a project's Jobs tab. The
badge should appear on every one.

- [ ] **Step 5: Stage (do not commit)**

```bash
git add apps/admin-dashboard/src/pages/
```

---

# Phase 5 — Customer portal

The stats strip is already built as part of Task 18. This phase is the customer half.

### Task 20: Portal types and hooks

**Files:**
- Modify: `apps/customer-portal/src/types/api.ts` (or wherever the portal's `Job` type lives — check `src/types/` first)
- Create: `apps/customer-portal/src/hooks/useMyReschedule.ts`

**Interfaces:**
- Consumes: the Phase 2 API routes; the portal's `api` instance from `../lib/api` and `keys` from `./keys`.
- Produces: hooks `useMyRescheduleHistory(jobId)`, `useRequestReschedule()`, `useRespondToReschedule()`, `useCancelMyReschedule()`; type `RescheduleStateValue` on the portal's `Job`.

- [ ] **Step 1: Add the types**

Add the same `RescheduleStateValue`, `RescheduleSlot` and `RescheduleRequest`
interfaces as Task 14 to the portal's types file, and add
`rescheduleState?: RescheduleStateValue | null` to its `Job` interface.

Deliberately duplicated rather than shared: the two apps have no common UI
package, and adding one for two consumers is not worth the indirection. The
*enums* still come from `@tscrm/types`.

- [ ] **Step 2: Write the hooks**

```ts
// apps/customer-portal/src/hooks/useMyReschedule.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { RescheduleRequest } from '../types/api'

export interface SlotInput { startAt: string; endAt: string; window?: string }

function useInvalidate() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['my-jobs'] })
    qc.invalidateQueries({ queryKey: ['reschedule'] })
    qc.invalidateQueries({ queryKey: ['customer-dashboard'] })
  }
}

export function useMyRescheduleHistory(jobId?: string) {
  return useQuery({
    queryKey: ['reschedule', 'job', jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const res = await api.get<RescheduleRequest[]>(`/jobs/reschedule/jobs/${jobId}`)
      return res.data
    },
  })
}

export function useRequestReschedule() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (vars: {
      jobId: string
      mode: 'PROPOSE_SLOTS' | 'OPEN_ASK'
      reasonCode: string
      reason?: string
      slots?: SlotInput[]
    }) => {
      const { jobId, ...body } = vars
      const res = await api.post(`/jobs/reschedule/jobs/${jobId}`, body)
      return res.data as RescheduleRequest
    },
    onSuccess: invalidate,
  })
}

export function useRespondToReschedule() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (vars: {
      requestId: string
      action: 'PICK' | 'COUNTER' | 'DECLINE'
      pickedSlotId?: string
      reasonCode?: string
      slots?: SlotInput[]
      note?: string
    }) => {
      const { requestId, ...body } = vars
      const res = await api.post(`/jobs/reschedule/${requestId}/respond`, body)
      return res.data as RescheduleRequest
    },
    onSuccess: invalidate,
  })
}

export function useCancelMyReschedule() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (requestId: string) => {
      const res = await api.post(`/jobs/reschedule/${requestId}/cancel`, {})
      return res.data as RescheduleRequest
    },
    onSuccess: invalidate,
  })
}
```

Check the portal's existing query keys in `src/hooks/keys.ts` before assuming
`['my-jobs']` — use whatever `useMyJobs` actually registers, or the invalidation
will silently do nothing.

- [ ] **Step 3: Build**

```bash
pnpm --filter customer-portal build
```

Expected: clean.

- [ ] **Step 4: Stage (do not commit)**

```bash
git add apps/customer-portal/src/hooks/useMyReschedule.ts apps/customer-portal/src/types/
```

---

### Task 21: Portal badge and modal

**Files:**
- Create: `apps/customer-portal/src/components/reschedule/RescheduleBadge.tsx`
- Create: `apps/customer-portal/src/components/reschedule/RescheduleModal.tsx`

**Interfaces:**
- Consumes: Task 20's hooks; `CUSTOMER_REASONS`, `RESCHEDULE_REASON_LABELS`, `RESCHEDULE_WINDOWS`, `slotFromWindow` from `@tscrm/types`.
- Produces: `<RescheduleBadge state size? />` and `<RescheduleModal job={{ id, title, scheduledStart, status, rescheduleState }} isOpen onClose />`.

- [ ] **Step 1: Write the badge with customer-facing copy**

Same component shape as Task 15, but the labels flip perspective — amber still
means "you are the holdup", which on this side is `AWAITING_CUSTOMER`:

```tsx
// apps/customer-portal/src/components/reschedule/RescheduleBadge.tsx
import { CalendarClock } from 'lucide-react'
import type { RescheduleStateValue } from '../../types/api'

/**
 * Same Job.rescheduleState column as the admin badge, worded from the
 * customer's side. Amber = we are waiting on you.
 */
const META: Record<RescheduleStateValue, { label: string; color: string; bg: string }> = {
  AWAITING_CUSTOMER: { label: 'Pick a time', color: '#B45309', bg: 'rgba(217,119,6,0.12)' },
  AWAITING_ADMIN:    { label: 'Reschedule requested', color: '#1D4ED8', bg: 'rgba(37,99,235,0.12)' },
  READY_TO_APPLY:    { label: 'Confirming your time', color: '#1D4ED8', bg: 'rgba(37,99,235,0.12)' },
}

export default function RescheduleBadge({ state, size = 'md' }: {
  state?: RescheduleStateValue | null
  size?: 'sm' | 'md'
}) {
  if (!state) return null
  const meta = META[state]
  if (!meta) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: size === 'sm' ? 9.5 : 10.5, fontWeight: 700,
      color: meta.color, background: meta.bg,
      padding: size === 'sm' ? '1px 6px' : '2px 8px',
      borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      <CalendarClock size={size === 'sm' ? 9 : 10} />
      {meta.label}
    </span>
  )
}
```

- [ ] **Step 2: Write the modal**

Mirrors Task 16 with three differences: the reason list is `CUSTOMER_REASONS`,
a customer picking a slot never applies immediately (it parks at
`READY_TO_APPLY`), and the copy is written for someone who does not know what a
dispatch queue is.

```tsx
// apps/customer-portal/src/components/reschedule/RescheduleModal.tsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CalendarClock, Loader2, Check } from 'lucide-react'
import {
  CUSTOMER_REASONS, RESCHEDULE_REASON_LABELS, RESCHEDULE_WINDOWS,
  slotFromWindow, type RescheduleWindowKey,
} from '@tscrm/types'
import {
  useMyRescheduleHistory, useRequestReschedule,
  useRespondToReschedule, useCancelMyReschedule,
} from '../../hooks/useMyReschedule'
import type { RescheduleRequest, RescheduleStateValue } from '../../types/api'
import RescheduleBadge from './RescheduleBadge'

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone
const WINDOW_KEYS = Object.keys(RESCHEDULE_WINDOWS) as RescheduleWindowKey[]

function fmtSlot(startAt: string, endAt: string, window?: string | null) {
  const s = new Date(startAt), e = new Date(endAt)
  const day = s.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
  const t = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const win = window && window in RESCHEDULE_WINDOWS
    ? RESCHEDULE_WINDOWS[window as RescheduleWindowKey] : null
  return win ? `${day} · ${win.label} (${t(s)} – ${t(e)})` : `${day} · ${t(s)} – ${t(e)}`
}

export default function RescheduleModal({ job, isOpen, onClose }: {
  job: { id: string; title: string; scheduledStart?: string | null; status: string; rescheduleState?: RescheduleStateValue | null }
  isOpen: boolean
  onClose: () => void
}) {
  const historyQ = useMyRescheduleHistory(isOpen ? job.id : undefined)
  const requestMut = useRequestReschedule()
  const respondMut = useRespondToReschedule()
  const cancelMut = useCancelMyReschedule()

  const [wantSpecificTime, setWantSpecificTime] = useState(false)
  const [reasonCode, setReasonCode] = useState<string>(CUSTOMER_REASONS[0])
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 2)
    return d.toISOString().slice(0, 10)
  })
  const [windowKey, setWindowKey] = useState<RescheduleWindowKey>('morning')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  if (!isOpen) return null

  const history = historyQ.data ?? []
  const live = history.find((r) => r.status === 'AWAITING_RESPONSE' || r.status === 'SLOT_PICKED')
  const busy = requestMut.isPending || respondMut.isPending || cancelMut.isPending
  const fail = (e: any, fallback: string) => setError(e?.response?.data?.message ?? fallback)

  const submit = () => {
    setError('')
    const slot = slotFromWindow(date, windowKey, TZ)
    requestMut.mutate({
      jobId: job.id,
      mode: wantSpecificTime ? 'PROPOSE_SLOTS' : 'OPEN_ASK',
      reasonCode,
      reason: note.trim() || undefined,
      slots: wantSpecificTime
        ? [{ startAt: slot.startAt.toISOString(), endAt: slot.endAt.toISOString(), window: slot.window }]
        : undefined,
    }, {
      onSuccess: () => setDone(wantSpecificTime
        ? "Sent. We'll confirm that time or suggest an alternative."
        : "Sent. We'll come back to you with some times."),
      onError: (e) => fail(e, 'We could not send that request. Please try again.'),
    })
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 520,
          maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid var(--bd)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarClock size={16} style={{ color: 'var(--blue)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Reschedule</span>
              <RescheduleBadge state={job.rescheduleState} />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--t3)' }}>
              {job.title}
              {job.scheduledStart
                ? ` · currently ${new Date(job.scheduledStart).toLocaleString(undefined,
                    { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: '#dc2626', marginBottom: 14,
            }}>{error}</div>
          )}
          {done && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: '#059669', marginBottom: 14,
            }}>{done}</div>
          )}

          {historyQ.isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--t3)' }} />
            </div>
          ) : live ? (
            <CustomerLiveRound
              request={live}
              busy={busy}
              onPick={(slotId) => {
                setError('')
                respondMut.mutate({ requestId: live.id, action: 'PICK', pickedSlotId: slotId }, {
                  onSuccess: () => setDone("Thanks — we're confirming that time and will be in touch shortly."),
                  onError: (e) => fail(e, 'We could not save that choice. Please try again.'),
                })
              }}
              onNoneWork={() => {
                setError('')
                respondMut.mutate({
                  requestId: live.id, action: 'COUNTER',
                  reasonCode: 'CUSTOMER_UNAVAILABLE',
                  slots: [(() => {
                    const s = slotFromWindow(date, windowKey, TZ)
                    return { startAt: s.startAt.toISOString(), endAt: s.endAt.toISOString(), window: s.window }
                  })()],
                  note: note.trim() || undefined,
                }, {
                  onSuccess: () => setDone("Sent — we'll check that time and confirm."),
                  onError: (e) => fail(e, 'We could not send that. Please try again.'),
                })
              }}
              onWithdraw={() => cancelMut.mutate(live.id, {
                onSuccess: () => setDone('Request withdrawn — your original appointment stands.'),
                onError: (e) => fail(e, 'We could not withdraw that request.'),
              })}
              date={date} setDate={setDate}
              windowKey={windowKey} setWindowKey={setWindowKey}
              note={note} setNote={setNote}
            />
          ) : done ? null : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Why do you need to move it?
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  style={{
                    width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 10, fontSize: 13,
                    border: '1.5px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
                  }}
                >
                  {CUSTOMER_REASONS.map((r) => (
                    <option key={r} value={r}>{RESCHEDULE_REASON_LABELS[r]}</option>
                  ))}
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={wantSpecificTime}
                  onChange={(e) => setWantSpecificTime(e.target.checked)}
                />
                I have a specific time in mind
              </label>

              {wantSpecificTime && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 13,
                      border: '1.5px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
                    }}
                  />
                  <select
                    value={windowKey}
                    onChange={(e) => setWindowKey(e.target.value as RescheduleWindowKey)}
                    style={{
                      padding: '10px 12px', borderRadius: 10, fontSize: 13,
                      border: '1.5px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
                    }}
                  >
                    {WINDOW_KEYS.map((k) => (
                      <option key={k} value={k}>{RESCHEDULE_WINDOWS[k].label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Anything else we should know? (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 10, fontSize: 13,
                    border: '1.5px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
                    fontFamily: 'inherit', resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '13px 20px', borderTop: '1px solid var(--bd)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {!live && !done && (
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Send request
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function CustomerLiveRound(props: {
  request: RescheduleRequest
  busy: boolean
  onPick: (slotId: string) => void
  onNoneWork: () => void
  onWithdraw: () => void
  date: string; setDate: (v: string) => void
  windowKey: RescheduleWindowKey; setWindowKey: (v: RescheduleWindowKey) => void
  note: string; setNote: (v: string) => void
}) {
  const { request, busy } = props
  const theyOffered = request.openedBy === 'ADMIN' && request.slots.length > 0
  const [showCounter, setShowCounter] = useState(false)

  if (request.status === 'SLOT_PICKED') {
    return (
      <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0 }}>
        Thanks — we're confirming your chosen time and will be in touch shortly.
      </p>
    )
  }

  if (!theyOffered) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0 }}>
          You've asked to reschedule this visit. We'll come back to you with some times shortly.
        </p>
        <button className="btn btn-secondary" disabled={busy} onClick={props.onWithdraw} style={{ alignSelf: 'flex-start' }}>
          Never mind — keep my original time
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13.5, color: 'var(--t1)', margin: 0, fontWeight: 600 }}>
        We'd like to move your visit. Does one of these work?
      </p>
      {request.reason && (
        <div style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: 'var(--t2)' }}>
          {request.reason}
        </div>
      )}
      {request.slots.map((s) => (
        <button
          key={s.id}
          disabled={busy}
          onClick={() => props.onPick(s.id)}
          style={{
            textAlign: 'left', border: '1.5px solid var(--bd)', borderRadius: 12,
            padding: '13px 15px', fontSize: 13.5, fontWeight: 600, color: 'var(--t1)',
            background: 'var(--bg-card)', cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {fmtSlot(s.startAt, s.endAt, s.window)}
        </button>
      ))}

      {!showCounter ? (
        <button className="btn btn-secondary" onClick={() => setShowCounter(true)} style={{ alignSelf: 'flex-start' }}>
          None of these work
        </button>
      ) : (
        <div style={{
          border: '1px solid var(--bd)', borderRadius: 12, padding: 14,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--t2)' }}>When would suit you?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="date" value={props.date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => props.setDate(e.target.value)}
              style={{
                flex: 1, padding: '9px 11px', borderRadius: 9, fontSize: 12.5,
                border: '1.5px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
              }}
            />
            <select
              value={props.windowKey}
              onChange={(e) => props.setWindowKey(e.target.value as RescheduleWindowKey)}
              style={{
                padding: '9px 11px', borderRadius: 9, fontSize: 12.5,
                border: '1.5px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
              }}
            >
              {WINDOW_KEYS.map((k) => (
                <option key={k} value={k}>{RESCHEDULE_WINDOWS[k].label}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" disabled={busy} onClick={props.onNoneWork}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : null} Suggest this instead
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Build**

```bash
pnpm --filter customer-portal build
```

Expected: clean.

- [ ] **Step 4: Stage (do not commit)**

```bash
git add apps/customer-portal/src/components/reschedule/
```

---

### Task 22: Wire reschedule into the portal Jobs page and job detail

**Files:**
- Modify: `apps/customer-portal/src/pages/jobs/Jobs.tsx`
- Modify: `apps/customer-portal/src/pages/jobs/JobDetailModal.tsx`

**Interfaces:**
- Consumes: Task 21's `RescheduleBadge`, `RescheduleModal`.
- Produces: nothing.

- [ ] **Step 1: Add the badge and action to `Jobs.tsx`**

Import both components:

```tsx
import RescheduleBadge from '../../components/reschedule/RescheduleBadge'
import RescheduleModal from '../../components/reschedule/RescheduleModal'
```

Add state next to the existing `showBook`:

```tsx
  const [rescheduleJob, setRescheduleJob] = useState<Job | null>(null)
```

On each upcoming-job card, next to the date line (around the existing
`<Calendar size={11} /> {fmtDate(job.scheduledStart)}` render), add:

```tsx
                        <RescheduleBadge state={job.rescheduleState} size="sm" />
```

And a small action on cards for reschedulable statuses:

```tsx
                {['PENDING', 'SCHEDULED', 'ON_HOLD'].includes(job.status) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setRescheduleJob(job) }}
                    className="btn btn-secondary btn-sm"
                  >
                    <CalendarClock size={12} /> Reschedule
                  </button>
                )}
```

Add `CalendarClock` to the `lucide-react` import. Render the modal next to the
existing `BookServiceModal`:

```tsx
      {rescheduleJob && (
        <RescheduleModal
          job={{
            id: rescheduleJob.id, title: rescheduleJob.title,
            scheduledStart: rescheduleJob.scheduledStart, status: rescheduleJob.status,
            rescheduleState: rescheduleJob.rescheduleState,
          }}
          isOpen
          onClose={() => { setRescheduleJob(null); refetch() }}
        />
      )}
```

- [ ] **Step 2: Deep-link from the email**

The reschedule emails link to `/jobs?reschedule=<jobId>`. Open that job's modal
automatically on mount so the link lands somewhere useful instead of a generic
list. Add to `Jobs.tsx`:

```tsx
  const [searchParams, setSearchParams] = useSearchParams()

  // Emails link to /jobs?reschedule=<jobId>. Open that job's reschedule modal
  // directly — a customer who clicked "Choose a time" should not have to hunt
  // for the right card.
  useEffect(() => {
    const target = searchParams.get('reschedule')
    if (!target || rescheduleJob) return
    const match = jobs.find((j) => j.id === target)
    if (match) {
      setRescheduleJob(match)
      searchParams.delete('reschedule')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, jobs, rescheduleJob, setSearchParams])
```

Add `useSearchParams` to the `react-router-dom` import and `useEffect` to the
`react` import. `jobs` is whatever the page's existing full job array is called
— check before wiring.

- [ ] **Step 3: Add the badge and action to the portal `JobDetailModal.tsx`**

Add the badge next to the status pill in the header, and a **Reschedule** button
in the footer for `PENDING`/`SCHEDULED`/`ON_HOLD`, rendering `RescheduleModal`
the same way as Step 1.

- [ ] **Step 4: Build and verify by hand**

```bash
pnpm --filter customer-portal build
```

With the stack running, log into the portal as a demo customer and:
- request a reschedule with no specific time → badge reads "Reschedule requested"
- from the admin side, offer two slots → portal badge flips to amber "Pick a time"
- pick one → badge reads "Confirming your time"
- apply from the admin inbox → badge clears, job time updates on both sides

- [ ] **Step 5: Stage (do not commit)**

```bash
git add apps/customer-portal/src/pages/jobs/
```

---

### Task 23: Portal dashboard banner and remaining surfaces

A reschedule the customer never notices becomes a no-show, so the dashboard gets
a banner rather than a badge.

**Files:**
- Modify: `apps/customer-portal/src/pages/Dashboard.tsx`
- Modify: `apps/customer-portal/src/pages/MyHouse.tsx`
- Modify: `apps/customer-portal/src/pages/MyProjects.tsx`
- Create: `apps/customer-portal/src/components/reschedule/RescheduleBanner.tsx`

**Interfaces:**
- Consumes: Task 21's `RescheduleModal`; the portal's existing job queries.
- Produces: `<RescheduleBanner jobs={Job[]} />`.

- [ ] **Step 1: Write the banner**

```tsx
// apps/customer-portal/src/components/reschedule/RescheduleBanner.tsx
import { useState } from 'react'
import { CalendarClock, ChevronRight } from 'lucide-react'
import RescheduleModal from './RescheduleModal'
import type { Job } from '../../types/api'

/**
 * Shown only when the customer is the one holding things up. Deliberately a
 * banner and not a badge: an unanswered reschedule turns into a missed
 * appointment, so it has to be impossible to scroll past.
 */
export default function RescheduleBanner({ jobs }: { jobs: Job[] }) {
  const [active, setActive] = useState<Job | null>(null)
  const waiting = jobs.filter((j) => j.rescheduleState === 'AWAITING_CUSTOMER')
  if (waiting.length === 0) return null

  return (
    <>
      <div style={{
        background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)',
        borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <CalendarClock size={17} style={{ color: '#B45309', flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
              {waiting.length === 1
                ? 'We need a new time for your visit'
                : `We need new times for ${waiting.length} of your visits`}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--t2)' }}>
              Choose one of the times we've suggested, or tell us what suits you.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {waiting.map((job) => (
            <button
              key={job.id}
              onClick={() => setActive(job)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, background: 'var(--bg-card)', border: '1px solid rgba(217,119,6,0.3)',
                borderRadius: 10, padding: '10px 13px', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{job.title}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#B45309' }}>
                Pick a time <ChevronRight size={13} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <RescheduleModal
          job={{
            id: active.id, title: active.title, scheduledStart: active.scheduledStart,
            status: active.status, rescheduleState: active.rescheduleState,
          }}
          isOpen
          onClose={() => setActive(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Mount it on the dashboard**

In `apps/customer-portal/src/pages/Dashboard.tsx`, import the banner and render
it above the existing content, passing whatever job array the page already
loads:

```tsx
import RescheduleBanner from '../components/reschedule/RescheduleBanner'
// …
      <RescheduleBanner jobs={jobs} />
```

If the dashboard hook returns only a truncated list, use `useMyJobs()` directly
for the banner — an open request on a job outside the first few rows still needs
to surface.

- [ ] **Step 3: Add badges to `MyHouse.tsx` and `MyProjects.tsx`**

Import `RescheduleBadge` and render `<RescheduleBadge state={job.rescheduleState} size="sm" />`
next to each job row's scheduled date.

- [ ] **Step 4: Build**

```bash
pnpm --filter customer-portal build
pnpm --filter admin-dashboard build
```

Expected: both clean.

- [ ] **Step 5: Full end-to-end walkthrough**

With everything running, confirm the whole loop in both directions:

1. **Staff-initiated:** admin offers 3 slots → customer dashboard shows the amber
   banner → customer picks one → admin inbox shows "Ready to apply" → admin
   applies → job time changes, technician cleared, job back in "Unassigned now",
   customer gets the confirmation email.
2. **Customer-initiated:** customer requests a reschedule with a specific time →
   admin inbox shows it → admin picks that slot → applies immediately in one
   action.
3. **Open ask both ways:** customer asks with no time → admin counters with
   slots → customer picks → admin applies.
4. **Decline:** admin declines a customer request → badge clears on both sides,
   original time intact.

- [ ] **Step 6: Stage (do not commit)**

```bash
git add apps/customer-portal/src/
```

---

## Plan self-review

Checked after writing, against `docs/superpowers/specs/2026-08-05-job-rescheduling-design.md`.

**Spec coverage.** Every spec section maps to a task: data model → Task 2;
negotiation and ball-position rules → Tasks 3–4; who may open → Task 3;
`EN_ROUTE` handling with `confirmEnRoute` → Task 7 (backend) and Tasks 16/18
(the confirm dialogs); apply's four steps → Task 7; `SCHEDULED → PENDING` →
Task 2; API → Tasks 5 and 8; badge/modal components → Tasks 15–16 and 21; all
admin placements → Tasks 17–19; portal placements and the dashboard banner →
Tasks 22–23; notifications → Tasks 9–12; reason codes → Tasks 1, 3, and the
stats strip in Task 18; nudge with its conditional claim → Task 13; concurrency,
stale slots, terminal-status and two-open-request guards → Tasks 2, 4, 7;
timezone handling → Task 1.

**Two gaps found and closed while reviewing:**
- The spec's phasing lists the stats strip as its own stage, but it is three
  lines of JSX on top of a query. It is folded into Task 18 rather than given a
  task of its own — splitting there would fail the "could a reviewer reject one
  and approve its neighbour" test.
- `SchedulingClient` assumes `GET /dispatch/assignments?jobId=` exists. It may
  not. Task 6 Step 5 makes verifying it an explicit step with a fallback, rather
  than leaving an implementer to discover it at runtime.

**Type consistency.** `rescheduleState` is spelled identically in the Prisma
model, both frontend `Job` types, and every component prop. The
`RescheduleActor` / `RescheduleMode` / `RescheduleStatus` / `RescheduleState` /
`RescheduleReason` names match between `packages/types` (Task 1) and the Prisma
enums (Task 2) — they must, since Prisma generates the same string values.
`slotFromWindow` returns `{ startAt, endAt, window }` and is consumed with those
exact names in Tasks 15 and 21. `respond()` returns `{ request, shouldApply }`
in Task 4 and is destructured that way in Task 8.

**One thing deliberately left as a runtime check rather than pinned here:** the
portal's query-key names (`['my-jobs']` vs whatever `keys.ts` actually defines).
Task 20 Step 2 calls this out explicitly instead of guessing, because guessing
wrong produces a silent no-op rather than an error.

---

## Notes for the implementer

- **The migration is written but never applied.** `JOBS_DATABASE_URL` points at
  a shared Supabase instance. Task 2 stops at `prisma generate`. Applying it is
  the repo owner's decision — flag it as ready.
- **Nothing is committed.** Every task ends at `git add`. The repo owner commits.
- **Two badge components, on purpose.** admin-dashboard and customer-portal have
  no shared UI package, and the copy differs per audience anyway. The shared part
  — enums, windows, the timezone helper — lives in `packages/types`.
- **Stages 1–2 (Tasks 1–8 plus 14–17) are the minimum shippable slice**: the
  negotiation works end to end from the job detail modals on both sides.
  Everything after is reach and polish.
