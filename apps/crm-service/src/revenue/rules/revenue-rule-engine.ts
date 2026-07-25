import { Injectable } from '@nestjs/common';
import type { RevenueRuleFacts, RevenueRuleReasonCode, RevenueRuleResult } from '@tscrm/types';

const OVERDUE_INVOICE_DAYS = 30;
const PENDING_QUOTE_DAYS = 7;
const AGREEMENT_EXPIRY_WINDOW_DAYS = 30;
const UPSELL_EQUIPMENT_AGE_YEARS = 8;
const INACTIVE_SERVICE_DAYS = 180;
const MAX_PREVIOUS_ATTEMPTS = 3;

/**
 * Determines ONLY whether a revenue opportunity exists, its category, and why.
 * Never decides strategy/action/channel/message — that's the LLM layer's job.
 * Safety gates run first and short-circuit everything else, matching
 * RetentionRuleEngine/UpsellRuleEngine. Rules are checked in descending
 * business priority (cash-at-risk first, win-back last) and the first match
 * wins.
 */
@Injectable()
export class RevenueRuleEngine {
  evaluate(facts: RevenueRuleFacts): RevenueRuleResult {
    // ---- Safety gates: never contact a customer these apply to ----
    if (!facts.automaticFollowupEnabled) {
      return this.noOpportunity();
    }
    if (facts.previousRevenueAttempts >= MAX_PREVIOUS_ATTEMPTS) {
      return this.noOpportunity();
    }
    if (!facts.hasContactChannel) {
      return this.noOpportunity();
    }

    // ---- Overdue Invoice: protects cash flow, highest priority ----
    const overdueInvoice = this.findWorstOverdueInvoice(facts);
    if (overdueInvoice) {
      return this.match(
        'OVERDUE_INVOICE',
        `Invoice overdue by ${overdueInvoice.daysOverdue} days`,
        'invoice.overdue',
        overdueInvoice.amount,
        true,
      );
    }

    // ---- Pending Quotation: unresponded quote, recoverable pipeline revenue ----
    const pendingQuote = this.findOldestPendingQuote(facts);
    if (pendingQuote) {
      return this.match(
        'PENDING_QUOTE',
        `Customer has not responded to a quote for ${pendingQuote.daysSincePending} days`,
        'quote.pending',
        pendingQuote.amount,
      );
    }

    // ---- Maintenance Renewal: agreement expiring soon ----
    if (this.isAgreementExpiringSoon(facts)) {
      return this.match(
        'AGREEMENT_EXPIRING',
        'Maintenance agreement is expiring soon',
        'agreement.expiring',
        null,
      );
    }

    // ---- Upsell Opportunity: no active agreement, aging equipment ----
    if (this.isUpsellCandidate(facts)) {
      return this.match(
        'UPSELL_EQUIPMENT_AGE',
        `No maintenance agreement and oldest equipment is ${facts.oldestEquipmentAgeYears} years old`,
        'equipment.aging_no_agreement',
        null,
      );
    }

    // ---- Inactive Customer: lowest urgency, win-back ----
    if (facts.daysSinceLastService > INACTIVE_SERVICE_DAYS) {
      return this.match(
        'CUSTOMER_INACTIVE',
        `No service in ${facts.daysSinceLastService} days`,
        'customer.inactive',
        null,
      );
    }

    return this.noOpportunity();
  }

  private findWorstOverdueInvoice(facts: RevenueRuleFacts) {
    return facts.overdueInvoices
      .filter((invoice) => invoice.daysOverdue > OVERDUE_INVOICE_DAYS)
      .sort((a, b) => b.daysOverdue - a.daysOverdue)[0];
  }

  private findOldestPendingQuote(facts: RevenueRuleFacts) {
    return facts.openQuotes
      .filter((quote) => quote.daysSincePending > PENDING_QUOTE_DAYS)
      .sort((a, b) => b.daysSincePending - a.daysSincePending)[0];
  }

  private isAgreementExpiringSoon(facts: RevenueRuleFacts): boolean {
    if (facts.agreementStatus === 'PENDING_RENEWAL') return true;
    if (facts.agreementDaysUntilExpiry == null) return false;
    return facts.agreementDaysUntilExpiry >= 0 && facts.agreementDaysUntilExpiry <= AGREEMENT_EXPIRY_WINDOW_DAYS;
  }

  private isUpsellCandidate(facts: RevenueRuleFacts): boolean {
    return (
      !facts.hasActiveAgreement &&
      facts.oldestEquipmentAgeYears != null &&
      facts.oldestEquipmentAgeYears > UPSELL_EQUIPMENT_AGE_YEARS
    );
  }

  private noOpportunity(): RevenueRuleResult {
    return {
      opportunityExists: false,
      category: 'no_opportunity',
      highPriority: false,
      reasonCode: 'NONE',
      reason: null,
      matchedRule: null,
      expectedRevenueImpact: null,
    };
  }

  private match(
    reasonCode: Exclude<RevenueRuleReasonCode, 'NONE'>,
    reason: string,
    matchedRule: string,
    expectedRevenueImpact: number | null,
    highPriority = false,
  ): RevenueRuleResult {
    return {
      opportunityExists: true,
      category: this.categoryFor(reasonCode),
      highPriority,
      reasonCode,
      reason,
      matchedRule,
      expectedRevenueImpact,
    };
  }

  private categoryFor(reasonCode: Exclude<RevenueRuleReasonCode, 'NONE'>) {
    switch (reasonCode) {
      case 'OVERDUE_INVOICE':
        return 'payment_collection' as const;
      case 'PENDING_QUOTE':
        return 'quote_recovery' as const;
      case 'AGREEMENT_EXPIRING':
        return 'agreement_renewal' as const;
      case 'UPSELL_EQUIPMENT_AGE':
        return 'maintenance_plan' as const;
      case 'CUSTOMER_INACTIVE':
        return 're_engagement' as const;
    }
  }
}
