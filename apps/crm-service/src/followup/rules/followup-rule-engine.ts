import { Injectable } from '@nestjs/common';
import type { FollowupAction, FollowupRuleFacts, FollowupRuleReasonCode, FollowupRuleResult } from '@tscrm/types';

const COLD_LEAD_STATUSES = new Set(['NEW', 'CONTACTED', 'QUALIFIED']);
const QUOTE_PENDING_STATUSES = new Set(['SENT', 'VIEWED']);
const MAX_PREVIOUS_ATTEMPTS = 5;
const COLD_LEAD_DAYS = 3;
const QUOTE_PENDING_DAYS = 3;
const INACTIVE_SERVICE_DAYS = 90;

/**
 * Determines ONLY whether an entity needs a follow-up, and why.
 * Never decides channel/timing/message — that's the LLM layer's job.
 * Safety gates run first and short-circuit everything else.
 */
@Injectable()
export class FollowupRuleEngine {
  evaluate(facts: FollowupRuleFacts): FollowupRuleResult {
    if (!facts.automaticFollowupEnabled) {
      return this.noFollowup();
    }
    if (facts.previousFollowupAttempts > MAX_PREVIOUS_ATTEMPTS) {
      return this.noFollowup();
    }
    if (!facts.hasContactChannel) {
      return this.noFollowup();
    }

    if (facts.entityType === 'lead' && this.isColdLead(facts)) {
      return this.match(
        'LEAD_FOLLOWUP',
        'COLD_LEAD',
        `Cold lead in status ${facts.leadStatus}`,
        'lead.cold',
      );
    }

    if (this.isQuotePending(facts)) {
      return this.match(
        'QUOTE_FOLLOWUP',
        'QUOTE_PENDING',
        `Quote sent ${facts.daysSinceQuoteSent} days ago and still ${facts.quoteStatus}`,
        'quote.pending',
      );
    }

    if (this.isAgreementExpired(facts)) {
      return this.match(
        'RETENTION',
        'AGREEMENT_EXPIRED',
        'Maintenance agreement has expired',
        'agreement.expired',
      );
    }

    if (this.isCustomerInactive(facts)) {
      return this.match(
        'REENGAGEMENT',
        'CUSTOMER_INACTIVE',
        facts.engagementStatus === 'INACTIVE'
          ? 'Customer engagement status is INACTIVE'
          : `No recent service in ${facts.daysSinceLastService} days`,
        'reengagement.inactive',
      );
    }

    return this.noFollowup();
  }

  private isColdLead(facts: FollowupRuleFacts): boolean {
    return (
      !!facts.leadStatus &&
      COLD_LEAD_STATUSES.has(facts.leadStatus) &&
      (facts.daysSinceLeadCreated ?? 0) > COLD_LEAD_DAYS
    );
  }

  private isQuotePending(facts: FollowupRuleFacts): boolean {
    return (
      !!facts.quoteStatus &&
      QUOTE_PENDING_STATUSES.has(facts.quoteStatus) &&
      (facts.daysSinceQuoteSent ?? 0) > QUOTE_PENDING_DAYS
    );
  }

  private isAgreementExpired(facts: FollowupRuleFacts): boolean {
    if (facts.agreementStatus === 'EXPIRED') return true;
    if (!facts.agreementEndDate) return false;
    return new Date(facts.agreementEndDate).getTime() < Date.now();
  }

  private isCustomerInactive(facts: FollowupRuleFacts): boolean {
    return facts.engagementStatus === 'INACTIVE' || (facts.daysSinceLastService ?? 0) > INACTIVE_SERVICE_DAYS;
  }

  private noFollowup(): FollowupRuleResult {
    return { needsFollowup: false, action: null, reasonCode: null, reason: null, matchedRule: null };
  }

  private match(
    action: Exclude<FollowupAction, 'UPSELL'>,
    reasonCode: FollowupRuleReasonCode,
    reason: string,
    matchedRule: string,
  ): FollowupRuleResult {
    return { needsFollowup: true, action, reasonCode, reason, matchedRule };
  }
}
