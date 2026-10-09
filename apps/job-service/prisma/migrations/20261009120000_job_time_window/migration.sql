-- A customer can ask for an arrival window ("Morning 8-12") instead of an exact time.
-- timeMode: EXACT (a specific time) or WINDOW (an arrival window). Idempotent.
ALTER TABLE "jobs"."jobs"
  ADD COLUMN IF NOT EXISTS "timeMode" TEXT NOT NULL DEFAULT 'EXACT',
  ADD COLUMN IF NOT EXISTS "windowStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "windowEnd" TIMESTAMP(3);
