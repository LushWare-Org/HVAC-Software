-- AddColumn: approvalStatus, approvalNote, skills, latitude, longitude to company_users
ALTER TABLE "crm"."company_users"
  ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS "approvalNote"   TEXT,
  ADD COLUMN IF NOT EXISTS "skills"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "latitude"       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude"      DOUBLE PRECISION;

-- Index for quickly listing pending technicians
CREATE INDEX IF NOT EXISTS "company_users_approval_idx"
  ON "crm"."company_users"("companyId", "approvalStatus");
