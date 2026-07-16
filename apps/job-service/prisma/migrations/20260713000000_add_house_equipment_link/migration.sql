ALTER TABLE "jobs"
  ADD COLUMN IF NOT EXISTS "houseId" TEXT,
  ADD COLUMN IF NOT EXISTS "equipmentId" TEXT;

CREATE INDEX IF NOT EXISTS "jobs_houseId_idx" ON "jobs"("houseId");
CREATE INDEX IF NOT EXISTS "jobs_equipmentId_idx" ON "jobs"("equipmentId");