-- AlterTable: add cancellation reason + parts shortage fields
ALTER TABLE "jobs"."jobs"
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "hasPartShortage"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "partShortageNote"   TEXT;
