-- CreateTable
CREATE TABLE "kelvin_events" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT,
    "type" TEXT NOT NULL,
    "action" TEXT,
    "record_ref" TEXT,
    "summary" TEXT NOT NULL,
    "confirmed_by" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kelvin_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "kelvin_events_company_id_user_id_created_at_idx" ON "kelvin_events"("company_id", "user_id", "created_at");
CREATE INDEX "kelvin_events_company_id_item_id_idx" ON "kelvin_events"("company_id", "item_id");

-- CreateTable
CREATE TABLE "kelvin_prefs" (
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "speak_mode" TEXT NOT NULL DEFAULT 'ALL',
    "quiet_until" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "kelvin_prefs_pkey" PRIMARY KEY ("company_id", "user_id")
);
