import { Injectable } from '@nestjs/common';
import type { UpsellChannel, UpsellCustomerProfile, UpsellCustomerSegment, UpsellRuleResult } from '@tscrm/types';

export interface UpsellContextEquipmentInput {
  type: string;
  ageYears: number | null;
  warrantyStatus: 'active' | 'expired' | 'unknown';
}

export interface UpsellContextInput {
  name: string;
  ruleResult: UpsellRuleResult; // caller guarantees upsellRequired === true
  customerSegment: UpsellCustomerSegment;
  averageAnnualSpend: number;
  equipment: UpsellContextEquipmentInput[];
  agreementStatus?: string;
  repairCount: number;
  daysSinceLastService: number;
  previousUpsellAttempts: number;
  recipientPhone?: string;
  recipientEmail?: string;
  recentQuotes?: string;
  notes?: string;
}

/**
 * Turns raw CRM rows into the structured profile the LLM layer is allowed to
 * see. The LLM never receives Prisma rows directly. Mirrors RetentionContextBuilder.
 */
@Injectable()
export class UpsellContextBuilder {
  build(input: UpsellContextInput): UpsellCustomerProfile {
    if (!input.ruleResult.upsellRequired || input.ruleResult.reasonCode === 'NONE' || !input.ruleResult.reason) {
      throw new Error('UpsellContextBuilder.build() requires a rule result where upsellRequired is true');
    }

    return {
      customerName: input.name,
      customerSegment: input.customerSegment,
      equipment: input.equipment,
      maintenanceAgreementStatus: input.agreementStatus,
      repairCount: input.repairCount,
      daysSinceLastService: input.daysSinceLastService,
      annualSpend: input.averageAnnualSpend,
      previousUpsellAttempts: input.previousUpsellAttempts,
      preferredCommunication: this.derivePreferredChannel(input),
      recentQuotes: input.recentQuotes,
      notes: input.notes,
      category: input.ruleResult.category,
      reasonCode: input.ruleResult.reasonCode,
      reason: input.ruleResult.reason,
    };
  }

  private derivePreferredChannel(input: UpsellContextInput): UpsellChannel {
    if (input.recipientPhone) return 'whatsapp';
    if (input.recipientEmail) return 'email';
    return 'call';
  }
}
