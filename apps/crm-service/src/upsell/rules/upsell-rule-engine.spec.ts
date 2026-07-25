import type { UpsellRuleFacts } from '@tscrm/types';
import { UpsellRuleEngine } from './upsell-rule-engine';

const baseFacts: UpsellRuleFacts = {
  customerId: 'cust-1',
  companyId: 'co-1',
  equipmentAgeYears: 2,
  repairCount12Months: 0,
  daysSinceLastService: 10,
  customerSegment: 'standard',
  averageAnnualSpend: 1000,
  hasNewEquipment: false,
  warrantyActive: false,
  automaticFollowupEnabled: true,
  previousUpsellAttempts: 0,
  hasContactChannel: true,
};

describe('UpsellRuleEngine', () => {
  let engine: UpsellRuleEngine;

  beforeEach(() => {
    engine = new UpsellRuleEngine();
  });

  describe('safety gates', () => {
    it('takes no upsell when the customer opted out', () => {
      const result = engine.evaluate({ ...baseFacts, automaticFollowupEnabled: false, equipmentAgeYears: 12 });
      expect(result.upsellRequired).toBe(false);
      expect(result.category).toBe('no_upsell');
      expect(result.reasonCode).toBe('NONE');
    });

    it('takes no upsell when previous attempts hit the configured limit', () => {
      const result = engine.evaluate({ ...baseFacts, previousUpsellAttempts: 3, equipmentAgeYears: 12 });
      expect(result.upsellRequired).toBe(false);
    });

    it('allows an upsell just below the attempt limit', () => {
      const result = engine.evaluate({ ...baseFacts, previousUpsellAttempts: 2, equipmentAgeYears: 12 });
      expect(result.upsellRequired).toBe(true);
    });

    it('takes no upsell when there is no contact channel', () => {
      const result = engine.evaluate({ ...baseFacts, hasContactChannel: false, equipmentAgeYears: 12 });
      expect(result.upsellRequired).toBe(false);
    });
  });

  describe('equipment replacement rule', () => {
    it('flags equipment older than 8 years', () => {
      const result = engine.evaluate({ ...baseFacts, equipmentAgeYears: 9 });
      expect(result).toMatchObject({ upsellRequired: true, category: 'replacement', reasonCode: 'AGING_EQUIPMENT', highPriority: true });
    });

    it('does not flag equipment exactly at 8 years', () => {
      const result = engine.evaluate({ ...baseFacts, equipmentAgeYears: 8 });
      expect(result.upsellRequired).toBe(false);
    });

    it('takes replacement over frequent repairs when both apply', () => {
      const result = engine.evaluate({ ...baseFacts, equipmentAgeYears: 9, repairCount12Months: 5 });
      expect(result.category).toBe('replacement');
    });
  });

  describe('maintenance plan rule', () => {
    it('flags 3+ repairs in the last 12 months', () => {
      const result = engine.evaluate({ ...baseFacts, repairCount12Months: 3 });
      expect(result).toMatchObject({ upsellRequired: true, category: 'maintenance_plan', reasonCode: 'FREQUENT_REPAIRS', highPriority: true });
    });

    it('does not flag 2 repairs', () => {
      const result = engine.evaluate({ ...baseFacts, repairCount12Months: 2 });
      expect(result.upsellRequired).toBe(false);
    });
  });

  describe('extended warranty rule', () => {
    it('flags new equipment with an active warranty', () => {
      const result = engine.evaluate({ ...baseFacts, hasNewEquipment: true, warrantyActive: true });
      expect(result).toMatchObject({ upsellRequired: true, category: 'extended_warranty', reasonCode: 'WARRANTY_EXTENSION' });
    });

    it('does not flag new equipment whose warranty already expired', () => {
      const result = engine.evaluate({ ...baseFacts, hasNewEquipment: true, warrantyActive: false });
      expect(result.upsellRequired).toBe(false);
    });
  });

  describe('preventive service rule', () => {
    it('flags a customer overdue for service by more than 180 days', () => {
      const result = engine.evaluate({ ...baseFacts, daysSinceLastService: 181 });
      expect(result).toMatchObject({ upsellRequired: true, category: 'preventive_service', reasonCode: 'OVERDUE_SERVICE' });
    });

    it('does not flag a customer serviced within 180 days', () => {
      const result = engine.evaluate({ ...baseFacts, daysSinceLastService: 180 });
      expect(result.upsellRequired).toBe(false);
    });
  });

  describe('premium upgrade rule', () => {
    it('flags a premium customer with spend above the premium-upgrade threshold', () => {
      const result = engine.evaluate({ ...baseFacts, customerSegment: 'premium', averageAnnualSpend: 4000 });
      expect(result).toMatchObject({ upsellRequired: true, category: 'premium_upgrade', reasonCode: 'HIGH_VALUE_CUSTOMER' });
    });

    it('does not flag a premium customer below the spend threshold', () => {
      const result = engine.evaluate({ ...baseFacts, customerSegment: 'premium', averageAnnualSpend: 3000 });
      expect(result.upsellRequired).toBe(false);
    });

    it('does not flag a standard-segment customer even with high spend', () => {
      const result = engine.evaluate({ ...baseFacts, customerSegment: 'standard', averageAnnualSpend: 5000 });
      expect(result.upsellRequired).toBe(false);
    });
  });

  it('takes no upsell when no rule matches', () => {
    const result = engine.evaluate(baseFacts);
    expect(result.upsellRequired).toBe(false);
    expect(result.reasonCode).toBe('NONE');
  });
});
