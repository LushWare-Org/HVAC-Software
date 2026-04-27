-- Add review type + technician linkage to reviews
CREATE TYPE "ReviewType" AS ENUM ('JOB', 'COMPANY');

ALTER TABLE "reviews"
  ADD COLUMN "type"           "ReviewType" NOT NULL DEFAULT 'JOB',
  ADD COLUMN "customerName"   TEXT,
  ADD COLUMN "technicianId"   TEXT,
  ADD COLUMN "technicianName" TEXT;

-- Customer-submitted reviews default to published so they appear immediately
ALTER TABLE "reviews" ALTER COLUMN "isPublished" SET DEFAULT TRUE;

CREATE INDEX "reviews_technicianId_idx"      ON "reviews"("technicianId");
CREATE INDEX "reviews_companyId_type_idx"    ON "reviews"("companyId", "type");
CREATE INDEX "reviews_jobId_idx"             ON "reviews"("jobId");
