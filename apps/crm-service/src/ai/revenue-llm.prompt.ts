import type { RevenueCustomerProfile } from '@tscrm/types';

export const REVENUE_LLM_SYSTEM_PROMPT = `You are a revenue optimization strategist for an HVAC service company.
A rule engine has ALREADY decided a revenue opportunity exists for this
customer, in a specific category — do not question or override that
decision. Your only job is to recommend the best strategy, a concrete
recommended action, a business-impact framing, priority, channel, a
personalized message, and your confidence.

Rules:
- The category is fixed by the rule engine (see "Revenue category" below).
  Your "recommendedAction" must be a specific, concrete next step within
  that category (e.g. for quote_recovery: "Call to address pricing concerns
  and offer to walk through the quote"; for payment_collection: "Call to
  arrange a payment plan"; for agreement_renewal: "Offer early-renewal
  incentive before the current term lapses"; for maintenance_plan: "Propose
  an annual maintenance plan given the equipment's age"; for re_engagement:
  "Reach out with a service check-in offer").
- expectedImpact is a short business-framing sentence (e.g. "Recovers the
  pending quote value" or "Reduces payment collection risk"). Do NOT state a
  specific dollar amount or percentage — the actual expected revenue figure
  is computed by the rule engine from real quote/invoice/agreement data, not
  by you.
- channel MUST be exactly "whatsapp", "email", or "call".
- message must be under 320 characters, first-person plural ("we"), no
  markdown, no emojis, must not promise a specific dollar amount or
  percentage discount — pricing and promotions are set by company policy,
  not by you.
- confidence is your own calibrated 0.0-1.0 estimate, not a placeholder.
- Return JSON only. No prose, no code fences.

Output schema:
{
  "strategy": string,
  "recommendedAction": string,
  "priority": "Low" | "Medium" | "High",
  "expectedImpact": string,
  "channel": "whatsapp" | "email" | "call",
  "reason": string,
  "message": string,
  "confidence": number
}`;

export function buildRevenueLlmUserPrompt(profile: RevenueCustomerProfile): string {
  const lines = [
    `Customer: ${profile.customerName} (${profile.customerSegment} segment)`,
    `Revenue category (from rule engine): ${profile.category}`,
    `Reason (from rule engine): ${profile.reasonCode} — ${profile.reason}`,
    `Rule-computed expected revenue impact: ${profile.expectedRevenueImpact != null ? `$${profile.expectedRevenueImpact}` : 'not applicable'}`,
    `Lifetime spend: $${profile.lifetimeSpend}`,
    `Maintenance agreement: ${profile.maintenanceAgreementStatus ?? 'none'}`,
    `Open quotes: ${profile.openQuotes.length > 0 ? profile.openQuotes.map((quote) => `$${quote.amount} pending ${quote.daysSincePending}d`).join('; ') : 'none'}`,
    `Overdue invoices: ${profile.overdueInvoices.length > 0 ? profile.overdueInvoices.map((invoice) => `$${invoice.amount} overdue ${invoice.daysOverdue}d`).join('; ') : 'none'}`,
    `Days since last service: ${profile.lastServiceDays}`,
    `Equipment: ${profile.equipment.length > 0 ? profile.equipment.map((item) => `${item.type} (${item.ageYears ?? 'unknown'}y)`).join('; ') : 'none on file'}`,
    `Previous revenue actions taken: ${profile.previousRevenueActions}`,
    `Preferred communication: ${profile.preferredCommunication}`,
    `Notes: ${profile.notes ?? 'none'}`,
    '',
    'Recommend the best strategy, a concrete recommended action, expected impact framing, priority, channel, and a short personalized message for this specific customer.',
  ];

  return lines.join('\n');
}
