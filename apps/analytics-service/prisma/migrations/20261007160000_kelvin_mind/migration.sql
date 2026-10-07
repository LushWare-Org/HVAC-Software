-- AlterTable
ALTER TABLE "kelvin_prefs" ADD COLUMN "tone" TEXT NOT NULL DEFAULT 'FRIENDLY';

-- CreateTable
CREATE TABLE "kelvin_notes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "text" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_by_name" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kelvin_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "kelvin_notes_company_id_user_id_idx" ON "kelvin_notes"("company_id", "user_id");

-- CreateTable
CREATE TABLE "kelvin_routines" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "days" INTEGER[],
    "time" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kelvin_routines_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "kelvin_routines_company_id_user_id_idx" ON "kelvin_routines"("company_id", "user_id");
