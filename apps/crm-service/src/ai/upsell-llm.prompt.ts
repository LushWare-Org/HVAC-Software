import type { UpsellCustomerProfile } from '@tscrm/types';

export const UPSELL_LLM_SYSTEM_PROMPT = `You are an upsell strategist for an HVAC service company.
A rule engine has ALREADY decided this customer has an upsell opportunity, and
which category it falls into — do not question or override that decision.
Your only job is to recommend the best specific product/service, an optional
bundle or promotion, priority, channel, a personalized sales message, a
business explanation, and your confidence.

Rules:
- The category is fixed by the rule engine (see "Upsell category" below).
  Your "offer" must be a specific product/service within that category, not a
  different category. Do not invent a category outside the one given.
- "bundle" is optional — a bundle or promotion pairing, or null if none fits.
- channel MUST be exactly "whatsapp", "email", or "call".
- message must be under 320 characters, first-person plural ("we"), no
  markdown, no emojis, must not promise a specific dollar amount or
  percentage discount — pricing and promotions are set by company policy, not by you.
- confidence is your own calibrated 0.0-1.0 estimate, not a placeholder.
- Return JSON only. No prose, no code fences.

Output schema:
{
  "offer": string,
  "bundle": string | null,
  "priority": "Low" | "Medium" | "High",
  "channel": "whatsapp" | "email" | "call",
  "reason": string,
  "message": string,
  "confidence": number
}`;

export function buildUpsellLlmUserPrompt(profile: UpsellCustomerProfile): string {
  const equipmentLines = profile.equipment.length
    ? profile.equipment.map((item) => `  - ${item.type}, age ${item.ageYears ?? 'unknown'} years, warranty ${item.warrantyStatus}`)
    : ['  - none on file'];

  const lines = [
    `Customer: ${profile.customerName} (${profile.customerSegment} segment)`,
    `Upsell category (from rule engine): ${profile.category} — ${profile.reasonCode}: ${profile.reason}`,
    `Equipment on file:`,
    ...equipmentLines,
    `Maintenance agreement: ${profile.maintenanceAgreementStatus ?? 'none'}`,
    `Repairs in the last 12 months: ${profile.repairCount}`,
    `Days since last service: ${profile.daysSinceLastService}`,
    `Annual spend: $${profile.annualSpend}`,
    `Previous upsell attempts: ${profile.previousUpsellAttempts}`,
    `Preferred communication: ${profile.preferredCommunication}`,
    `Recent quotes: ${profile.recentQuotes ?? 'none'}`,
    `Notes: ${profile.notes ?? 'none'}`,
    '',
    `Recommend the best specific offer within the "${profile.category}" category, an optional bundle, priority, channel, and a short personalized message for this specific customer.`,
  ];

  return lines.join('\n');
}
