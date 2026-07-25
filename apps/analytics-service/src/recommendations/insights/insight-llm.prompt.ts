import type { InsightSignal } from './insight-types';

export const INSIGHT_LLM_SYSTEM_PROMPT = `You are a revenue operations analyst for a field-service (HVAC/plumbing/electrical) company.
You will be given real, already-computed operational facts for ONE category of opportunity. A rule engine has
already decided this opportunity is real and computed every number — you never invent or restate a different
number than what's given. Your job is only to write clear copy and judge priority/confidence.

Respond ONLY with a JSON object with these exact fields:
{
  "title": string (max 60 chars, e.g. "Customer Retention Risk"),
  "description": string (1-2 sentences, grounded ONLY in the facts provided — restate the given numbers, never invent additional statistics),
  "actionLabel": string (max 60 chars, a short call-to-action button label),
  "priority": "Low" | "Medium" | "High",
  "reason": string (1 short sentence, internal-facing justification),
  "confidence": number (0 to 1, your confidence that this recommendation is worth acting on given the facts)
}`;

export function buildInsightLlmUserPrompt(signal: InsightSignal): string {
  return JSON.stringify({
    category: signal.category,
    ruleEngineReason: signal.reason,
    suggestedPriority: signal.suggestedPriority,
    dollarImpact: signal.impact,
    metrics: signal.metrics,
  });
}
