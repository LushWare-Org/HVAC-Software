import { Injectable } from '@nestjs/common';
import type { FollowupChannel, FollowupLlmRecommendation } from '@tscrm/types';

const MAX_PREVIOUS_ATTEMPTS = 5;
const MAX_MESSAGE_LENGTH = 320;

const FOLLOWUP_WITHIN_DELAY_MS: Record<string, number> = {
  Today: 0,
  'Within 2 days': 24 * 60 * 60 * 1000,
  'This week': 3 * 24 * 60 * 60 * 1000,
};

export interface FollowupValidationInput {
  hasContactChannel: boolean;
  recipientPhone?: string;
  recipientEmail?: string;
  previousFollowupAttempts: number;
  automaticFollowupEnabled: boolean;
  /** Caller has already run the existing 48h duplicate-suppression check (hasRecentFollowup). */
  recentFollowupExists: boolean;
}

export interface FollowupValidationResult {
  passed: boolean;
  failedChecks: string[];
  finalChannel: FollowupChannel | null;
  finalMessage: string | null;
  scheduledFor: string | null; // ISO timestamp
}

/**
 * Never trusts the LLM recommendation directly — every field it produced is
 * re-checked against ground truth before anything gets queued.
 */
@Injectable()
export class FollowupValidationService {
  validate(input: FollowupValidationInput, llmRec: FollowupLlmRecommendation | null): FollowupValidationResult {
    const failedChecks: string[] = [];

    if (!input.hasContactChannel) failedChecks.push('NO_CONTACT_CHANNEL');
    if (input.previousFollowupAttempts > MAX_PREVIOUS_ATTEMPTS) failedChecks.push('ATTEMPT_LIMIT_EXCEEDED');
    if (!input.automaticFollowupEnabled) failedChecks.push('OPTED_OUT');
    if (input.recentFollowupExists) failedChecks.push('INTERVAL_NOT_SATISFIED');

    const requestedChannel = llmRec?.channel ?? null;
    const channelAvailable =
      requestedChannel === 'SMS'
        ? Boolean(input.recipientPhone)
        : requestedChannel === 'EMAIL'
          ? Boolean(input.recipientEmail)
          : false;

    if (requestedChannel && !channelAvailable) {
      failedChecks.push('CHANNEL_UNAVAILABLE');
    }

    const finalChannel: FollowupChannel | null =
      requestedChannel && channelAvailable
        ? requestedChannel
        : input.recipientPhone
          ? 'SMS'
          : input.recipientEmail
            ? 'EMAIL'
            : null;

    if (!finalChannel) failedChecks.push('NO_DELIVERABLE_CHANNEL');

    const finalMessage = llmRec && this.isMessageSafe(llmRec.message) ? llmRec.message : null;
    const scheduledFor = this.mapFollowupWithinToDate(llmRec?.followupWithin);

    return {
      passed: failedChecks.length === 0,
      failedChecks,
      finalChannel,
      finalMessage,
      scheduledFor,
    };
  }

  private isMessageSafe(message: string): boolean {
    return message.trim().length > 0 && message.length <= MAX_MESSAGE_LENGTH;
  }

  private mapFollowupWithinToDate(followupWithin: string | undefined): string | null {
    if (!followupWithin) return null;
    const delayMs = FOLLOWUP_WITHIN_DELAY_MS[followupWithin];
    if (delayMs === undefined) return null;
    if (delayMs === 0) return null; // "Today" = send immediately, no scheduling needed
    return new Date(Date.now() + delayMs).toISOString();
  }
}
