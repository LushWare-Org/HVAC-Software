import { Injectable } from '@nestjs/common';
import type { FollowupChannel, FollowupCustomerProfile, FollowupRuleResult } from '@tscrm/types';

const PREMIUM_MONTHLY_SPEND = 200;
const STANDARD_MONTHLY_SPEND = 50;

export interface FollowupContextInput {
  entityType: 'customer' | 'lead';
  name: string;
  ruleResult: FollowupRuleResult; // caller guarantees needsFollowup === true
  leadStatus?: string;
  quoteStatus?: string;
  quoteValue?: number;
  equipmentAge?: number;
  daysSinceLastService?: number;
  agreementStatus?: string;
  previousFollowupAttempts: number;
  recipientPhone?: string;
  recipientEmail?: string;
  recentServiceHistory: string[];
  averageMonthlySpend: number;
  notes?: string;
}

/**
 * Turns raw CRM rows into the structured profile the LLM layer is allowed to see.
 * The LLM never receives Prisma rows directly.
 */
@Injectable()
export class FollowupContextBuilder {
  build(input: FollowupContextInput): FollowupCustomerProfile {
    if (!input.ruleResult.needsFollowup || !input.ruleResult.reasonCode || !input.ruleResult.reason) {
      throw new Error('FollowupContextBuilder.build() requires a rule result where needsFollowup is true');
    }

    return {
      customerName: input.name,
      customerSegment: this.deriveSegment(input),
      leadStatus: input.leadStatus,
      quoteStatus: input.quoteStatus,
      quoteValue: input.quoteValue,
      equipmentAge: input.equipmentAge,
      daysSinceLastService: input.daysSinceLastService,
      maintenanceAgreementStatus: input.agreementStatus,
      previousFollowupAttempts: input.previousFollowupAttempts,
      preferredCommunication: this.derivePreferredChannel(input),
      recentServiceHistory: input.recentServiceHistory,
      notes: input.notes,
      reasonCode: input.ruleResult.reasonCode,
      reason: input.ruleResult.reason,
    };
  }

  private deriveSegment(input: FollowupContextInput): FollowupCustomerProfile['customerSegment'] {
    if (input.entityType === 'lead') return 'lead';
    if (input.averageMonthlySpend >= PREMIUM_MONTHLY_SPEND) return 'premium';
    if (input.averageMonthlySpend >= STANDARD_MONTHLY_SPEND) return 'standard';
    return 'budget';
  }

  private derivePreferredChannel(input: FollowupContextInput): FollowupChannel {
    return input.recipientPhone ? 'SMS' : 'EMAIL';
  }
}
