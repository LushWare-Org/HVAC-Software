import { Injectable } from '@nestjs/common';
import type { RetentionRuleFacts, RetentionRuleReasonCode, RetentionRuleResult } from '@tscrm/types';

const INACTIVE_SERVICE_DAYS = 180;
const FREQUENT_REPAIR_THRESHOLD = 3;
const COMPLAINT_THRESHOLD = 2;
const MAX_PREVIOUS_ATTEMPTS = 3;
const PREMIUM_ANNUAL_SPEND_THRESHOLD = 2400; // $200/mo average, matches PREMIUM_MONTHLY_SPEND elsewhere

/**
 * Determines ONLY whether a customer requires retention action, and why.
 * Never decides offer/channel/message/strategy — that's the LLM layer's job.
 * Safety gates run first and short-circuit everything else, matching the
 * FollowupRuleEngine pattern this mirrors (see ../../followup/rules).
 */
@Injectable()
export class RetentionRuleEngine {
  evaluate(facts: RetentionRuleFacts): RetentionRuleResult {
    // ---- Safety gates: never contact a customer these apply to ----
    if (!facts.automaticFollowupEnabled) {
      return this.noAction();
    }
    if (facts.previousRetentionAttempts >= MAX_PREVIOUS_ATTEMPTS) {
      return this.noAction();
    }
    if (!facts.hasContactChannel) {
      return this.noAction();
    }

    // ---- Customer Complaints: highest priority, dissatisfaction risk ----
    if (facts.complaintCount >= COMPLAINT_THRESHOLD) {
      return this.match(
        'CUSTOMER_COMPLAINTS',
        `Customer has ${facts.complaintCount} low ratings or complaints on file`,
        'complaints.dissatisfaction',
        true,
      );
    }

    // ---- Maintenance Agreement expired ----
    if (this.isAgreementExpired(facts)) {
      return this.match('AGREEMENT_EXPIRED', 'Maintenance agreement has expired', 'agreement.expired');
    }

    // ---- Frequent Repairs ----
    if (facts.repairCount12Months >= FREQUENT_REPAIR_THRESHOLD) {
      return this.match(
        'FREQUENT_REPAIRS',
        `${facts.repairCount12Months} repairs in the last 12 months`,
        'repairs.frequent',
      );
    }

    // ---- High Value Customer: premium segment, high spend, declining engagement ----
    if (this.isPremiumRetentionCandidate(facts)) {
      return this.match(
        'HIGH_VALUE_CUSTOMER',
        'Premium customer with high annual spend showing declining engagement',
        'segment.premium_at_risk',
      );
    }

    // ---- Inactive Customer ----
    if (facts.daysSinceLastService > INACTIVE_SERVICE_DAYS) {
      return this.match(
        'CUSTOMER_INACTIVE',
        `No service in ${facts.daysSinceLastService} days`,
        'inactivity.no_recent_service',
      );
    }

    return this.noAction();
  }

  private isAgreementExpired(facts: RetentionRuleFacts): boolean {
    if (facts.agreementStatus === 'EXPIRED') return true;
    if (!facts.agreementEndDate) return false;
    return new Date(facts.agreementEndDate).getTime() < Date.now();
  }

  private isPremiumRetentionCandidate(facts: RetentionRuleFacts): boolean {
    return (
      facts.customerSegment === 'premium' &&
      facts.averageAnnualSpend > PREMIUM_ANNUAL_SPEND_THRESHOLD &&
      facts.engagementTrend === 'decreasing'
    );
  }

  private noAction(): RetentionRuleResult {
    return { retentionRequired: false, highPriority: false, reasonCode: 'NONE', reason: null, matchedRule: null };
  }

  private match(
    reasonCode: Exclude<RetentionRuleReasonCode, 'NONE'>,
    reason: string,
    matchedRule: string,
    highPriority = false,
  ): RetentionRuleResult {
    return { retentionRequired: true, highPriority, reasonCode, reason, matchedRule };
  }
}
