import { Injectable } from '@nestjs/common';
import type { UpsellRuleFacts, UpsellRuleReasonCode, UpsellRuleResult, UpsellCategory } from '@tscrm/types';

const AGING_EQUIPMENT_YEARS = 8;
const FREQUENT_REPAIR_THRESHOLD = 3;
const OVERDUE_SERVICE_DAYS = 180;
const MAX_PREVIOUS_ATTEMPTS = 3;
const PREMIUM_UPGRADE_SPEND_THRESHOLD = 3600; // above the plain "premium" segment floor ($2400/yr) — reserved for the premium-upgrade offer specifically

/**
 * Determines ONLY whether a customer is eligible for an upsell opportunity,
 * which category it falls under, and why. Never decides the specific
 * offer/bundle/channel/message — that's the LLM layer's job. Safety gates run
 * first and short-circuit everything else, matching the RetentionRuleEngine
 * pattern this mirrors (see ../../retention/rules).
 */
@Injectable()
export class UpsellRuleEngine {
  evaluate(facts: UpsellRuleFacts): UpsellRuleResult {
    // ---- Safety gates: never pitch a customer these apply to ----
    if (!facts.automaticFollowupEnabled) {
      return this.noUpsell();
    }
    if (facts.previousUpsellAttempts >= MAX_PREVIOUS_ATTEMPTS) {
      return this.noUpsell();
    }
    if (!facts.hasContactChannel) {
      return this.noUpsell();
    }
    // Note: "same offer sent recently" is deliberately NOT a rule-engine gate —
    // it's checked at the validation layer (DUPLICATE_OFFER) after the category
    // is known, mirroring RetentionRuleEngine/RetentionValidationService.

    // ---- Equipment Replacement: aging equipment is the highest-value, most urgent opportunity ----
    if (facts.equipmentAgeYears > AGING_EQUIPMENT_YEARS) {
      return this.match(
        'replacement',
        'AGING_EQUIPMENT',
        `Oldest equipment is ${facts.equipmentAgeYears} years old`,
        'equipment.aging',
        true,
      );
    }

    // ---- Maintenance Plan: repeated repairs signal reliability risk ----
    if (facts.repairCount12Months >= FREQUENT_REPAIR_THRESHOLD) {
      return this.match(
        'maintenance_plan',
        'FREQUENT_REPAIRS',
        `${facts.repairCount12Months} repairs in the last 12 months`,
        'repairs.frequent',
        true,
      );
    }

    // ---- Extended Warranty: time-boxed opportunity on newly installed, still-covered equipment ----
    if (facts.hasNewEquipment && facts.warrantyActive) {
      return this.match(
        'extended_warranty',
        'WARRANTY_EXTENSION',
        'Newly installed equipment still has an active warranty',
        'warranty.extension_opportunity',
      );
    }

    // ---- Preventive Service: overdue for a scheduled visit ----
    if (facts.daysSinceLastService > OVERDUE_SERVICE_DAYS) {
      return this.match(
        'preventive_service',
        'OVERDUE_SERVICE',
        `No service in ${facts.daysSinceLastService} days`,
        'service.overdue',
      );
    }

    // ---- Premium Upgrade: premium segment, high spend ----
    if (facts.customerSegment === 'premium' && facts.averageAnnualSpend > PREMIUM_UPGRADE_SPEND_THRESHOLD) {
      return this.match(
        'premium_upgrade',
        'HIGH_VALUE_CUSTOMER',
        'High-value premium customer eligible for a premium upgrade',
        'segment.premium_high_value',
      );
    }

    return this.noUpsell();
  }

  private noUpsell(): UpsellRuleResult {
    return {
      upsellRequired: false,
      category: 'no_upsell',
      highPriority: false,
      reasonCode: 'NONE',
      reason: null,
      matchedRule: null,
    };
  }

  private match(
    category: UpsellCategory,
    reasonCode: Exclude<UpsellRuleReasonCode, 'NONE'>,
    reason: string,
    matchedRule: string,
    highPriority = false,
  ): UpsellRuleResult {
    return { upsellRequired: true, category, highPriority, reasonCode, reason, matchedRule };
  }
}
