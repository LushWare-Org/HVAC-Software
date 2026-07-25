-- Adds revenue_recommendations for the rule-based + LLM revenue optimization
-- decision engine (see apps/crm-service/src/revenue/). Modeled directly on
-- retention_recommendations (clean from-scratch shape, no legacy ML columns).
-- Outcome columns (manager_override, customer_accepted/declined,
-- revenue_realized, responded_at) are provisioned but unwired by application
-- code today; they become the training dataset for a future ML-backed
-- replacement of the rule engine, same as retention/upsell.

CREATE TABLE IF NOT EXISTS "revenue_recommendations" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "rule_result" JSONB NOT NULL,
  "llm_recommendation" JSONB,
  "validation_result" JSONB NOT NULL,
  "final_category" TEXT NOT NULL,
  "final_action" TEXT,
  "final_priority" TEXT NOT NULL,
  "final_channel" TEXT,
  "final_message" TEXT,
  "reason" TEXT NOT NULL,
  "expected_revenue_impact" DECIMAL(10,2),
  "confidence" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'generated',
  "manager_override" JSONB,
  "customer_accepted" BOOLEAN,
  "customer_declined" BOOLEAN,
  "revenue_realized" DECIMAL(10,2),
  "responded_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "revenue_recommendations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "revenue_recommendations_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "revenue_recommendations_company_id_customer_id_created_at_idx"
  ON "revenue_recommendations"("company_id", "customer_id", "created_at");

CREATE INDEX IF NOT EXISTS "revenue_recommendations_company_id_status_final_category_idx"
  ON "revenue_recommendations"("company_id", "status", "final_category");
