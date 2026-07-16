import { Injectable } from '@nestjs/common';
import type { RetentionChannel, RetentionCustomerProfile, RetentionRuleResult } from '@tscrm/types';

export interface RetentionContextInput {
  name: string;
  ruleResult: RetentionRuleResult; // caller guarantees retentionRequired === true
  customerSegment: RetentionCustomerProfile['customerSegment'];
  averageAnnualSpend: number;
  equipmentAge?: number;
  agreementStatus?: string;
  daysSinceLastService: number;
  repairCount: number;
  complaintCount: number;
  previousRetentionAttempts: number;
  activeContracts: number;
  recipientPhone?: string;
  recipientEmail?: string;
  notes?: string;
}

/**
 * Turns raw CRM rows into the structured profile the LLM layer is allowed to
 * see. The LLM never receives Prisma rows directly. Mirrors FollowupContextBuilder.
 */
@Injectable()
export class RetentionContextBuilder {
  build(input: RetentionContextInput): RetentionCustomerProfile {
    if (!input.ruleResult.retentionRequired || input.ruleResult.reasonCode === 'NONE' || !input.ruleResult.reason) {
      throw new Error('RetentionContextBuilder.build() requires a rule result where retentionRequired is true');
    }

    return {
      customerName: input.name,
      customerSegment: input.customerSegment,
      annualSpend: input.averageAnnualSpend,
      equipmentAge: input.equipmentAge,
      maintenanceAgreementStatus: input.agreementStatus,
      daysSinceLastService: input.daysSinceLastService,
      repairCount: input.repairCount,
      complaintCount: input.complaintCount,
      preferredCommunication: this.derivePreferredChannel(input),
      previousRetentionAttempts: input.previousRetentionAttempts,
      activeContracts: input.activeContracts,
      notes: input.notes,
      reasonCode: input.ruleResult.reasonCode,
      reason: input.ruleResult.reason,
    };
  }

  private derivePreferredChannel(input: RetentionContextInput): RetentionChannel {
    if (input.recipientPhone) return 'whatsapp';
    if (input.recipientEmail) return 'email';
    return 'call';
  }
}
