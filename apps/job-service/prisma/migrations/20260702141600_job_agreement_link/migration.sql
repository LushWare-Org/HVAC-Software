-- AlterTable: jobs — link to crm.service_agreements (cross-service ref, no FK)
ALTER TABLE "jobs"
  ADD COLUMN IF NOT EXISTS "agreementId" TEXT,
  ADD COLUMN IF NOT EXISTS "isAgreementJob" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "jobs_agreementId_idx" ON "jobs"("agreementId");
