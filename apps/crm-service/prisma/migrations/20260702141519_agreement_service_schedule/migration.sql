-- AlterEnum: new agreement lifecycle states
ALTER TYPE "AgreementStatus" ADD VALUE IF NOT EXISTS 'PENDING_RENEWAL';
ALTER TYPE "AgreementStatus" ADD VALUE IF NOT EXISTS 'RENEWED';

-- AlterTable: service_agreements — pricing, service schedule, auto job creation, confirmation
ALTER TABLE "service_agreements"
  ADD COLUMN IF NOT EXISTS "billingAmount" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "nextBillingDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "serviceType" TEXT,
  ADD COLUMN IF NOT EXISTS "serviceInterval" TEXT,
  ADD COLUMN IF NOT EXISTS "serviceIntervalDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "visitsIncluded" INTEGER,
  ADD COLUMN IF NOT EXISTS "visitsUsed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastServiceDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextServiceDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "autoCreateJobs" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "leadDays" INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS "jobTemplateId" TEXT,
  ADD COLUMN IF NOT EXISTS "customerConfirmedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "confirmToken" TEXT,
  ADD COLUMN IF NOT EXISTS "renewalReminderSent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "renewedFromId" TEXT;

-- CreateTable: agreement_amendments
CREATE TABLE IF NOT EXISTS "agreement_amendments" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "changedFields" JSONB NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedByName" TEXT,
    "customerNotifiedAt" TIMESTAMP(3),
    "customerConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "agreement_amendments_agreementId_idx" ON "agreement_amendments"("agreementId");
CREATE UNIQUE INDEX IF NOT EXISTS "service_agreements_confirmToken_key" ON "service_agreements"("confirmToken");
CREATE INDEX IF NOT EXISTS "service_agreements_companyId_status_idx" ON "service_agreements"("companyId", "status");
CREATE INDEX IF NOT EXISTS "service_agreements_companyId_nextServiceDate_idx" ON "service_agreements"("companyId", "nextServiceDate");

-- AddForeignKey (guarded — constraint may exist from a partial run)
DO $$ BEGIN
  ALTER TABLE "agreement_amendments"
    ADD CONSTRAINT "agreement_amendments_agreementId_fkey"
    FOREIGN KEY ("agreementId") REFERENCES "service_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
