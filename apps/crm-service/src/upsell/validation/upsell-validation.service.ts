import { Injectable } from '@nestjs/common';
import type { UpsellCategory, UpsellChannel, UpsellLlmRecommendation } from '@tscrm/types';

const MAX_PREVIOUS_ATTEMPTS = 3;
const MAX_MESSAGE_LENGTH = 320;

// Failures that force No Upsell outright. CHANNEL_UNAVAILABLE is deliberately
// NOT here — a silent channel substitution (e.g. LLM asked for whatsapp but
// only email is on file) is recoverable and shouldn't suppress an otherwise
// valid, policy-approved opportunity.
const BLOCKING_CHECKS = new Set([
  'OPTED_OUT',
  'ATTEMPT_LIMIT_EXCEEDED',
  'NO_CONTACT_CHANNEL',
  'DUPLICATE_OFFER',
  'CATEGORY_NOT_AVAILABLE',
  'NO_DELIVERABLE_CHANNEL',
]);

/** Company policy: which upsell categories are currently being sold. */
const CATEGORY_POLICY: Record<UpsellCategory, boolean> = {
  replacement: true,
  maintenance_plan: true,
  preventive_service: true,
  premium_upgrade: true,
  extended_warranty: true,
  no_upsell: true,
};

export interface UpsellValidationInput {
  /** The category the rule engine decided on — never overridden by the LLM. */
  ruleCategory: UpsellCategory;
  hasContactChannel: boolean;
  recipientPhone?: string;
  recipientEmail?: string;
  previousUpsellAttempts: number;
  automaticFollowupEnabled: boolean;
  /** Caller has already checked whether this exact category was offered recently (e.g. last 30 days). */
  sameOfferRecentlySent: boolean;
}

export interface UpsellValidationResult {
  passed: boolean;
  failedChecks: string[];
  finalCategory: UpsellCategory;
  finalOffer: string | null;
  finalBundle: string | null;
  finalChannel: UpsellChannel | null;
  finalMessage: string | null;
}

/**
 * Never trusts the LLM recommendation directly — every field it produced is
 * re-checked against ground truth and company policy before anything gets
 * surfaced or queued. The rule engine's category is authoritative; the LLM
 * can only be rejected, never allowed to pick a different category. Mirrors
 * RetentionValidationService.
 */
@Injectable()
export class UpsellValidationService {
  validate(input: UpsellValidationInput, llmRec: UpsellLlmRecommendation | null): UpsellValidationResult {
    const failedChecks: string[] = [];

    if (!input.automaticFollowupEnabled) failedChecks.push('OPTED_OUT');
    if (input.previousUpsellAttempts >= MAX_PREVIOUS_ATTEMPTS) failedChecks.push('ATTEMPT_LIMIT_EXCEEDED');
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

    const finalChannel: UpsellChannel | null =
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

    // Any blocking safety/policy check forces No Upsell, regardless of what the LLM proposed.
    // When there's no LLM recommendation at all (call failed, quota exhausted), the rule
    // engine's category still surfaces — it's the authoritative "is there an opportunity"
    // signal — but finalOffer/finalBundle/finalMessage stay null below, since only the LLM
    // is trusted to write the customer-facing copy.
    const finalCategory: UpsellCategory = !blocked ? input.ruleCategory : 'no_upsell';
    const messageSafe = llmRec ? this.isMessageSafe(llmRec.message) : false;

    return {
      passed,
      failedChecks,
      finalCategory,
      finalOffer: !blocked && llmRec ? llmRec.offer : null,
      finalBundle: !blocked && llmRec ? llmRec.bundle : null,
      finalChannel,
      finalMessage: !blocked && llmRec && messageSafe ? llmRec.message : null,
    };
  }

  private isMessageSafe(message: string): boolean {
    return message.trim().length > 0 && message.length <= MAX_MESSAGE_LENGTH;
  }
}
