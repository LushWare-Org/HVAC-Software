import { Injectable } from '@nestjs/common';
import type { RevenueChannel, RevenueCustomerProfile, RevenueRuleResult } from '@tscrm/types';

export interface RevenueContextInput {
  name: string;
  ruleResult: RevenueRuleResult; // caller guarantees opportunityExists === true
  customerSegment: RevenueCustomerProfile['customerSegment'];
  lifetimeSpend: number;
  equipment: Array<{ type: string; ageYears: number | null }>;
  agreementStatus?: string;
  openQuotes: Array<{ amount: number; daysSincePending: number }>;
  overdueInvoices: Array<{ amount: number; daysOverdue: number }>;
  daysSinceLastService: number;
  previousRevenueActions: number;
  recipientPhone?: string;
  recipientEmail?: string;
  notes?: string;
}

/**
 * Turns raw CRM/finance rows into the structured profile the LLM layer is
 * allowed to see. The LLM never receives Prisma rows or raw SQL results
 * directly. Mirrors RetentionContextBuilder/UpsellContextBuilder.
 */
@Injectable()
export class RevenueContextBuilder {
  build(input: RevenueContextInput): RevenueCustomerProfile {
    if (!input.ruleResult.opportunityExists || input.ruleResult.reasonCode === 'NONE' || !input.ruleResult.reason) {
      throw new Error('RevenueContextBuilder.build() requires a rule result where opportunityExists is true');
    }

    return {
      customerName: input.name,
      customerSegment: input.customerSegment,
      lifetimeSpend: input.lifetimeSpend,
      equipment: input.equipment,
      maintenanceAgreementStatus: input.agreementStatus,
      openQuotes: input.openQuotes,
      overdueInvoices: input.overdueInvoices,
      lastServiceDays: input.daysSinceLastService,
      previousRevenueActions: input.previousRevenueActions,
      preferredCommunication: this.derivePreferredChannel(input),
      notes: input.notes,
      category: input.ruleResult.category,
      reasonCode: input.ruleResult.reasonCode,
      reason: input.ruleResult.reason,
      expectedRevenueImpact: input.ruleResult.expectedRevenueImpact,
    };
  }

  private derivePreferredChannel(input: RevenueContextInput): RevenueChannel {
    if (input.recipientPhone) return 'whatsapp';
    if (input.recipientEmail) return 'email';
    return 'call';
  }
}
