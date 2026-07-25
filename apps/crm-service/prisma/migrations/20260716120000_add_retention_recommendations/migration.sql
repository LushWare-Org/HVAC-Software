CREATE TABLE IF NOT EXISTS "retention_recommendations" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "rule_result" JSONB NOT NULL,
  "llm_recommendation" JSONB,
  "validation_result" JSONB NOT NULL,
  "final_action" TEXT NOT NULL,
  "final_offer" JSONB NOT NULL,
  "final_priority" TEXT NOT NULL,
  "final_channel" TEXT,
  "final_message" TEXT,
  "reason" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'generated',
  "manager_override" JSONB,
  "customer_accepted" BOOLEAN,
  "customer_declined" BOOLEAN,
  "retention_success" BOOLEAN,
  "revenue_generated" DECIMAL(10,2),
  "responded_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "retention_recommendations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "retention_recommendations_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "retention_recommendations_company_id_customer_id_created_a_idx"
  ON "retention_recommendations"("company_id", "customer_id", "created_at");

CREATE INDEX IF NOT EXISTS "retention_recommendations_company_id_status_final_action_idx"
  ON "retention_recommendations"("company_id", "status", "final_action");
