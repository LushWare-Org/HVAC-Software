-- AlterTable: add Meta Lead Ads attribution fields to leads
ALTER TABLE "crm"."leads"
  ADD COLUMN IF NOT EXISTS "leadgenId" TEXT,
  ADD COLUMN IF NOT EXISTS "adName"    TEXT,
  ADD COLUMN IF NOT EXISTS "formId"    TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "leads_leadgenId_idx" ON "crm"."leads"("leadgenId");
