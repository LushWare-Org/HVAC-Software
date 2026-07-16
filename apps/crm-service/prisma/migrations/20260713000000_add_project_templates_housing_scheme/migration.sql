ALTER TABLE "crm"."projects" ADD COLUMN IF NOT EXISTS "templateType" TEXT NOT NULL DEFAULT 'STANDARD';

CREATE TABLE IF NOT EXISTS "crm"."houses" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "projectId" UUID NOT NULL,
  "label" TEXT NOT NULL,
  "address" TEXT,
  "ownerCustomerId" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "houses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "houses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "crm"."projects"("id") ON DELETE CASCADE,
  CONSTRAINT "houses_ownerCustomerId_fkey" FOREIGN KEY ("ownerCustomerId") REFERENCES "crm"."customers"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "houses_companyId_projectId_idx" ON "crm"."houses"("companyId", "projectId");
CREATE INDEX IF NOT EXISTS "houses_ownerCustomerId_idx" ON "crm"."houses"("ownerCustomerId");

ALTER TABLE "crm"."equipment" ADD COLUMN IF NOT EXISTS "houseId" TEXT;
CREATE INDEX IF NOT EXISTS "equipment_houseId_idx" ON "crm"."equipment"("houseId");

CREATE TABLE IF NOT EXISTS "crm"."house_issue_reports" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "houseId" TEXT NOT NULL,
  "equipmentId" TEXT,
  "reportedByCustomerId" TEXT NOT NULL,
  "errorCode" TEXT,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "resolvedNote" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "house_issue_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "house_issue_reports_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "crm"."houses"("id") ON DELETE CASCADE,
  CONSTRAINT "house_issue_reports_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "crm"."equipment"("id") ON DELETE SET NULL,
  CONSTRAINT "house_issue_reports_reportedByCustomerId_fkey" FOREIGN KEY ("reportedByCustomerId") REFERENCES "crm"."customers"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "house_issue_reports_companyId_status_idx" ON "crm"."house_issue_reports"("companyId", "status");
CREATE INDEX IF NOT EXISTS "house_issue_reports_houseId_idx" ON "crm"."house_issue_reports"("houseId");