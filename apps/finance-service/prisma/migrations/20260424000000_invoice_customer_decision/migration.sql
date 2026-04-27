-- Persist the customer's approve / decline decision directly on the invoice
-- so the UI can hide the Accept button across page reloads.

ALTER TABLE "finance"."Invoice"
  ADD COLUMN IF NOT EXISTS "approvedAt"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedByName"   TEXT,
  ADD COLUMN IF NOT EXISTS "approvedByEmail"  TEXT,
  ADD COLUMN IF NOT EXISTS "declinedAt"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "declinedByName"   TEXT,
  ADD COLUMN IF NOT EXISTS "declinedByEmail"  TEXT,
  ADD COLUMN IF NOT EXISTS "declineReason"    TEXT;
