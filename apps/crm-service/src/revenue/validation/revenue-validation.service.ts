import { Injectable } from '@nestjs/common';
import type { RevenueCategory, RevenueChannel, RevenueLlmRecommendation } from '@tscrm/types';

const MAX_PREVIOUS_ATTEMPTS = 3;
const MAX_MESSAGE_LENGTH = 320;

// Failures that force No Opportunity outright. CHANNEL_UNAVAILABLE is
// deliberately NOT here — a silent channel substitution (e.g. LLM asked for
// whatsapp but only email is on file) is recoverable and shouldn't suppress
// an otherwise valid, policy-approved opportunity. Mirrors
// UpsellValidationService/RetentionValidationService.
const BLOCKING_CHECKS = new Set([
  'OPTED_OUT',
  'ATTEMPT_LIMIT_EXCEEDED',
  'NO_CONTACT_CHANNEL',
  'DUPLICATE_OFFER',
  'CATEGORY_NOT_AVAILABLE',
  'NO_DELIVERABLE_CHANNEL',
]);

/** Company policy: which revenue-opportunity categories are currently actionable. */
const CATEGORY_POLICY: Record<RevenueCategory, boolean> = {
  payment_collection: true,
  quote_recovery: true,
  agreement_renewal: true,
  maintenance_plan: true,
  re_engagement: true,
  no_opportunity: true,
};

export interface RevenueValidationInput {
  /** The category the rule engine decided on — never overridden by the LLM. */
  ruleCategory: RevenueCategory;
  expectedRevenueImpact: number | null;
  hasContactChannel: boolean;
  recipientPhone?: string;
  recipientEmail?: string;
  previousRevenueAttempts: number;
  automaticFollowupEnabled: boolean;
  /** Caller has already checked whether this exact category was surfaced recently (e.g. last 30 days). */
  sameOfferRecentlySent: boolean;
}

export interface RevenueValidationResult {
  passed: boolean;
  failedChecks: string[];
  finalCategory: RevenueCategory;
  finalAction: string | null;
  finalChannel: RevenueChannel | null;
  finalMessage: string | null;
  finalExpectedImpact: number | null;
}

/**
 * Never trusts the LLM recommendation directly — every field it produced is
 * re-checked against ground truth and company policy before anything gets
 * surfaced or queued. The rule engine's category (and its computed
 * expectedRevenueImpact) is authoritative; the LLM can only be rejected,
 * never allowed to pick a different category or invent a dollar figure.
 * Mirrors UpsellValidationService.
 */
@Injectable()
export class RevenueValidationService {
  validate(input: RevenueValidationInput, llmRec: RevenueLlmRecommendation | null): RevenueValidationResult {
    const failedChecks: string[] = [];

    if (!input.automaticFollowupEnabled) failedChecks.push('OPTED_OUT');
    if (input.previousRevenueAttempts >= MAX_PREVIOUS_ATTEMPTS) failedChecks.push('ATTEMPT_LIMIT_EXCEEDED');
    if (!input.hasContactChannel) failedChecks.push('NO_CONTACT_CHANNEL');
    if (input.sameOfferRecentlySent) failedChecks.push('DUPLICATE_OFFER');
    if (!CATEGORY_POLICY[input.ruleCategory]) failedChecks.push('CATEGORY_NOT_AVAILABLE');

    const requestedChannel = llmRec?.channel ?? null;
    const channelAvailable =
      requestedChannel === 'whatsapp' || requestedChannel === 'call'
        ? Boolean(input.recipientPhone)
        : requestedChannel === 'email'
          ? Boolean(input.recipientEmail)
          : false;

    if (requestedChannel && !channelAvailable) failedChecks.push('CHANNEL_UNAVAILABLE');

    const finalChannel: RevenueChannel | null =
      requestedChannel && channelAvailable
        ? requestedChannel
        : input.recipientPhone
          ? 'whatsapp'
          : input.recipientEmail
            ? 'email'
            : null;

    if (!finalChannel) failedChecks.push('NO_DELIVERABLE_CHANNEL');

    const blocked = failedChecks.some((check) => BLOCKING_CHECKS.has(check));
    const passed = failedChecks.length === 0;

    // Any blocking safety/policy check forces No Opportunity, regardless of what the LLM
    // proposed. No LLM recommendation at all (e.g. the LLM call failed) also forces No
    // Opportunity — the rule engine's category alone is never surfaced without the LLM's
    // message/confidence sign-off.
    const finalCategory: RevenueCategory = !blocked && llmRec ? input.ruleCategory : 'no_opportunity';
    const messageSafe = llmRec ? this.isMessageSafe(llmRec.message) : false;

    return {
      passed,
      failedChecks,
      finalCategory,
      finalAction: !blocked && llmRec ? llmRec.recommendedAction : null,
      finalChannel,
      finalMessage: !blocked && llmRec && messageSafe ? llmRec.message : null,
      finalExpectedImpact: finalCategory !== 'no_opportunity' ? input.expectedRevenueImpact : null,
    };
  }

  private isMessageSafe(message: string): boolean {
    return message.trim().length > 0 && message.length <= MAX_MESSAGE_LENGTH;
  }
}
