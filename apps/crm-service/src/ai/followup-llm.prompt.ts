import type { FollowupCustomerProfile } from '@tscrm/types';

export const FOLLOWUP_LLM_SYSTEM_PROMPT = `You are a follow-up communication strategist for an HVAC service company.
A rule engine has ALREADY decided this customer needs follow-up — do not
question or override that decision. Your only job is to recommend HOW to
follow up: channel, timing, tone, and message.

Rules:
- channel MUST be exactly "SMS" or "EMAIL" (no other values are supported yet).
- followupWithin must be one of: "Today", "Within 2 days", "This week".
- message must be under 320 characters, first-person plural ("we"), no
  markdown, no emojis, must not promise pricing or discounts that weren't
  provided in context.
- confidence is your own calibrated 0.0-1.0 estimate, not a placeholder.
- Return JSON only. No prose, no code fences.

Output schema:
{
  "channel": "SMS" | "EMAIL",
  "priority": "Low" | "Medium" | "High",
  "followupWithin": string,
  "reason": string,
  "message": string,
  "confidence": number
}`;

export function buildFollowupLlmUserPrompt(profile: FollowupCustomerProfile): string {
  const lines = [
    `Customer: ${profile.customerName} (${profile.customerSegment} segment)`,
    `Follow-up reason (from rule engine): ${profile.reasonCode} — ${profile.reason}`,
    `Lead status: ${profile.leadStatus ?? 'n/a'}`,
    `Quote status: ${profile.quoteStatus ?? 'n/a'}${
      profile.quoteValue ? `, value $${profile.quoteValue}` : ''
    }`,
    `Days since last service: ${profile.daysSinceLastService ?? 'unknown'}`,
    `Maintenance agreement: ${profile.maintenanceAgreementStatus ?? 'none'}`,
    `Equipment age: ${profile.equipmentAge ?? 'unknown'} years`,
    `Previous follow-up attempts: ${profile.previousFollowupAttempts}`,
    `Preferred communication (default): ${profile.preferredCommunication}`,
    `Recent service history: ${profile.recentServiceHistory.length ? profile.recentServiceHistory.join(', ') : 'none on file'}`,
    `Notes: ${profile.notes ?? 'none'}`,
    '',
    'Recommend the best channel, timing, and a short personalized message for this specific follow-up.',
  ];

  return lines.join('\n');
}
