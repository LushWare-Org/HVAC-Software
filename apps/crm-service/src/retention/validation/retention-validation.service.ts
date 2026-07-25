import { Injectable } from '@nestjs/common';
import type { RetentionAction, RetentionChannel, RetentionLlmRecommendation } from '@tscrm/types';

const MAX_PREVIOUS_ATTEMPTS = 3;
const MAX_MESSAGE_LENGTH = 320;

// Failures that force No Action outright. CHANNEL_UNAVAILABLE is deliberately
// NOT here — a silent channel substitution (e.g. LLM asked for whatsapp but
// only email is on file) is recoverable and shouldn't suppress an otherwise
// valid, policy-approved offer.
const BLOCKING_CHECKS = new Set([
  'OPTED_OUT',
  'ATTEMPT_LIMIT_EXCEEDED',
  'NO_CONTACT_CHANNEL',
  'DUPLICATE_OFFER',
  'OFFER_NOT_ALLOWED',
  'NO_DELIVERABLE_CHANNEL',
]);

/** Company policy: the only offers this retention agent is allowed to promise. */
const OFFER_POLICY: Record<RetentionAction, { type: string; discount: number }> = {
  premium_contract_offer: { type: 'premium', discount: 0 },
  discount_retention_offer: { type: 'discounted', discount: 20 },
  maintenance_plan_offer: { type: 'standard', discount: 10 },
  no_action: { type: 'none', discount: 0 },
};

export interface RetentionValidationInput {
  hasContactChannel: boolean;
  recipientPhone?: string;
  recipientEmail?: string;
  previousRetentionAttempts: number;
  automaticFollowupEnabled: boolean;
  /** Caller has already checked whether this exact action was offered recently (e.g. last 30 days). */
  sameOfferRecentlySent: boolean;
}

export interface RetentionValidationResult {
  passed: boolean;
  failedChecks: string[];
  finalAction: RetentionAction;
  finalOffer: { type: string; discount: number };
  finalChannel: RetentionChannel | null;
  finalMessage: string | null;
}

/**
 * Never trusts the LLM recommendation directly — every field it produced is
 * re-checked against ground truth and company policy before anything gets
 * surfaced or queued. Mirrors FollowupValidationService.
 */
@Injectable()
export class RetentionValidationService {
  validate(input: RetentionValidationInput, llmRec: RetentionLlmRecommendation | null): RetentionValidationResult {
    const failedChecks: string[] = [];

    if (!input.automaticFollowupEnabled) failedChecks.push('OPTED_OUT');
    if (input.previousRetentionAttempts >= MAX_PREVIOUS_ATTEMPTS) failedChecks.push('ATTEMPT_LIMIT_EXCEEDED');
    if (!input.hasContactChannel) failedChecks.push('NO_CONTACT_CHANNEL');
    if (input.sameOfferRecentlySent) failedChecks.push('DUPLICATE_OFFER');

    const requestedAction = llmRec?.action ?? null;
    const actionAllowed = requestedAction === null || requestedAction in OFFER_POLICY;
    if (!actionAllowed) failedChecks.push('OFFER_NOT_ALLOWED');

    const requestedChannel = llmRec?.channel ?? null;
    const channelAvailable =
      requestedChannel === 'whatsapp' || requestedChannel === 'call'
        ? Boolean(input.recipientPhone)
        : requestedChannel === 'email'
          ? Boolean(input.recipientEmail)
          : false;

    if (requestedChannel && !channelAvailable) failedChecks.push('CHANNEL_UNAVAILABLE');

    const finalChannel: RetentionChannel | null =
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

    // Any blocking safety/policy check forces No Action, regardless of what the LLM proposed.
    const finalAction: RetentionAction = !blocked && requestedAction && actionAllowed ? requestedAction : 'no_action';
    const finalMessage = !blocked && llmRec && finalAction !== 'no_action' && this.isMessageSafe(llmRec.message)
      ? llmRec.message
      : null;

    return {
      passed,
      failedChecks,
      finalAction,
      finalOffer: OFFER_POLICY[finalAction],
      finalChannel,
      finalMessage,
    };
  }

  private isMessageSafe(message: string): boolean {
    return message.trim().length > 0 && message.length <= MAX_MESSAGE_LENGTH;
  }
}
