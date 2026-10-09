-- What the customer was last told about their visit (time and technician), so a change is
-- announced once and only when it really changed. Idempotent.
ALTER TABLE "jobs"."jobs"
  ADD COLUMN IF NOT EXISTS "notifiedStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "notifiedTechId" TEXT;
