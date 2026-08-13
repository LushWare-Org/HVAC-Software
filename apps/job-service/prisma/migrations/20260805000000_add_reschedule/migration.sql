-- Rescheduling: two-way negotiation over a job's appointment.
-- Design: docs/superpowers/specs/2026-08-05-job-rescheduling-design.md
--
-- Written by hand rather than via `prisma migrate dev`, which refuses to run in
-- a non-interactive shell. Idempotent throughout so it is safe to re-run.

-- ── Enums ───────────────────────────────────────────────────────────────────
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

-- ── Job: denormalized "whose move is it" pointer ────────────────────────────
-- Nullable, so existing rows need no backfill: null means no open request.
ALTER TABLE "jobs"."jobs"
  ADD COLUMN IF NOT EXISTS "rescheduleState" "jobs"."RescheduleState";

CREATE INDEX IF NOT EXISTS "jobs_companyId_rescheduleState_idx"
  ON "jobs"."jobs"("companyId", "rescheduleState");

-- ── Requests and their candidate slots ──────────────────────────────────────
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
-- index, so it is declared here and enforced by the database — the service's
-- own check exists only to return a friendlier error.
CREATE UNIQUE INDEX IF NOT EXISTS "reschedule_one_open_per_job"
  ON "jobs"."reschedule_requests"("jobId")
  WHERE "status" IN ('AWAITING_RESPONSE', 'SLOT_PICKED');

-- ── Foreign keys ────────────────────────────────────────────────────────────
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
