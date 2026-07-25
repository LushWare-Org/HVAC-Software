-- Extends upsell_recommendations for the rule-based + LLM upsell decision
-- engine (see apps/crm-service/src/upsell/). All existing columns and rows
-- are preserved; recommended_offer/confidence/status/rule_offer/model_offer/
-- trigger_source/priority_score/input_payload keep their existing meaning
-- (recommended_offer now holds the rule-decided UpsellCategory string).
-- all_scores is deprecated (no longer populated by the new pipeline) but
-- kept for backward compatibility with any historical rows/readers.

ALTER TABLE "upsell_recommendations"
  ADD COLUMN IF NOT EXISTS "rule_result" JSONB,
  ADD COLUMN IF NOT EXISTS "llm_recommendation" JSONB,
  ADD COLUMN IF NOT EXISTS "validation_result" JSONB,
  ADD COLUMN IF NOT EXISTS "llm_offer" TEXT,
  ADD COLUMN IF NOT EXISTS "bundle" TEXT,
  ADD COLUMN IF NOT EXISTS "channel" TEXT,
  ADD COLUMN IF NOT EXISTS "message" TEXT,
  ADD COLUMN IF NOT EXISTS "reason_code" TEXT,
  ADD COLUMN IF NOT EXISTS "reason" TEXT,
  ADD COLUMN IF NOT EXISTS "manager_override" JSONB,
  ADD COLUMN IF NOT EXISTS "offer_accepted" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "offer_rejected" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "upsell_conversion" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "revenue_generated" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "responded_at" TIMESTAMP(3);
