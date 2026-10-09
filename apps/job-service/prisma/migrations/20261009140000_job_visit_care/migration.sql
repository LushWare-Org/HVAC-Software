-- Visit care: waiting before telling the customer, customer confirmation, and reminders.
--   noticeDueAt     when the pending "your visit is booked/changed" message may go out
--   notifiedAt      when the customer was last told
--   confirmedAt     when the customer confirmed; confirmedFor is the start time they confirmed
--   remindedEveFor / remindedSoonFor  the start time each reminder was sent for
-- Idempotent.
ALTER TABLE "jobs"."jobs"
  ADD COLUMN IF NOT EXISTS "noticeDueAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "notifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "confirmedFor" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "remindedEveFor" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "remindedSoonFor" TIMESTAMP(3);
