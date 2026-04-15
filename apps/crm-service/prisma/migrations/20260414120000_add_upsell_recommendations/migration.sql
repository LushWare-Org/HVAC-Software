CREATE TABLE IF NOT EXISTS "upsell_recommendations" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "recommended_offer" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "all_scores" JSONB,
  "rule_offer" TEXT,
  "model_offer" TEXT,
  "trigger_source" TEXT,
  "priority_score" DOUBLE PRECISION,
  "input_payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "upsell_recommendations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "upsell_recommendations_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "upsell_recommendations_company_id_customer_id_created_at_idx"
  ON "upsell_recommendations"("company_id", "customer_id", "created_at");

CREATE INDEX IF NOT EXISTS "upsell_recommendations_company_id_status_priority_score_idx"
  ON "upsell_recommendations"("company_id", "status", "priority_score");
