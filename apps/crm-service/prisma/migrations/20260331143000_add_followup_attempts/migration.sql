-- CreateTable
CREATE TABLE "followup_attempts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "lead_id" TEXT,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "churn_probability" DOUBLE PRECISION,
    "queue_job_id" TEXT,
    "reason" TEXT,
    "error_message" TEXT,
    "metadata" JSONB,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "queued_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "followup_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "followup_attempts_company_entity_triggered_idx" ON "followup_attempts"("company_id", "entity_type", "entity_id", "triggered_at");

-- CreateIndex
CREATE INDEX "followup_attempts_company_status_triggered_idx" ON "followup_attempts"("company_id", "status", "triggered_at");
