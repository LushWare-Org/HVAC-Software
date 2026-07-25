import type { RetentionRuleFacts } from '@tscrm/types';
import { RetentionRuleEngine } from './retention-rule-engine';

const baseFacts: RetentionRuleFacts = {
  customerId: 'cust-1',
  companyId: 'co-1',
  customerSegment: 'standard',
  daysSinceLastService: 10,
  repairCount12Months: 0,
  complaintCount: 0,
  averageAnnualSpend: 1000,
  engagementTrend: 'stable',
  automaticFollowupEnabled: true,
  previousRetentionAttempts: 0,
  hasContactChannel: true,
};

describe('RetentionRuleEngine', () => {
  let engine: RetentionRuleEngine;

  beforeEach(() => {
    engine = new RetentionRuleEngine();
  });

  describe('safety gates', () => {
    it('takes no action when the customer opted out', () => {
      const result = engine.evaluate({ ...baseFacts, automaticFollowupEnabled: false, daysSinceLastService: 300 });
      expect(result.retentionRequired).toBe(false);
      expect(result.reasonCode).toBe('NONE');
    });

    it('takes no action when previous retention attempts hit the configured limit', () => {
      const result = engine.evaluate({ ...baseFacts, previousRetentionAttempts: 3, daysSinceLastService: 300 });
      expect(result.retentionRequired).toBe(false);
    });

    it('allows retention just below the attempt limit', () => {
      const result = engine.evaluate({ ...baseFacts, previousRetentionAttempts: 2, daysSinceLastService: 300 });
      expect(result.retentionRequired).toBe(true);
    });

    it('takes no action when there is no contact channel', () => {
      const result = engine.evaluate({ ...baseFacts, hasContactChannel: false, daysSinceLastService: 300 });
      expect(result.retentionRequired).toBe(false);
    });
  });

  describe('maintenance agreement rule', () => {
    it('flags an EXPIRED agreement', () => {
      const result = engine.evaluate({ ...baseFacts, agreementStatus: 'EXPIRED' });
      expect(result).toMatchObject({ retentionRequired: true, reasonCode: 'AGREEMENT_EXPIRED' });
    });

    it('flags an ACTIVE agreement whose end date has passed', () => {
      const result = engine.evaluate({ ...baseFacts, agreementStatus: 'ACTIVE', agreementEndDate: '2020-01-01T00:00:00Z' });
      expect(result).toMatchObject({ retentionRequired: true, reasonCode: 'AGREEMENT_EXPIRED' });
    });

    it('does not flag an ACTIVE agreement with a future end date', () => {
      const result = engine.evaluate({ ...baseFacts, agreementStatus: 'ACTIVE', agreementEndDate: '2099-01-01T00:00:00Z' });
      expect(result.retentionRequired).toBe(false);
    });
  });

  describe('inactive customer rule', () => {
    it('flags a customer with no service in over 180 days', () => {
      const result = engine.evaluate({ ...baseFacts, daysSinceLastService: 181 });
      expect(result).toMatchObject({ retentionRequired: true, reasonCode: 'CUSTOMER_INACTIVE' });
    });

    it('does not flag a customer serviced within 180 days', () => {
      const result = engine.evaluate({ ...baseFacts, daysSinceLastService: 180 });
      expect(result.retentionRequired).toBe(false);
    });
  });

  describe('frequent repairs rule', () => {
    it('flags 3+ repairs in the last 12 months', () => {
      const result = engine.evaluate({ ...baseFacts, repairCount12Months: 3 });
      expect(result).toMatchObject({ retentionRequired: true, reasonCode: 'FREQUENT_REPAIRS' });
    });

    it('does not flag 2 repairs', () => {
      const result = engine.evaluate({ ...baseFacts, repairCount12Months: 2 });
      expect(result.retentionRequired).toBe(false);
    });
  });

  describe('customer complaints rule', () => {
    it('flags 2+ complaints as high priority', () => {
      const result = engine.evaluate({ ...baseFacts, complaintCount: 2 });
      expect(result).toMatchObject({ retentionRequired: true, reasonCode: 'CUSTOMER_COMPLAINTS', highPriority: true });
    });

    it('takes complaints over frequent repairs when both apply', () => {
      const result = engine.evaluate({ ...baseFacts, complaintCount: 2, repairCount12Months: 5 });
      expect(result.reasonCode).toBe('CUSTOMER_COMPLAINTS');
    });
  });

  describe('high value customer rule', () => {
    it('flags a premium customer with high spend and decreasing engagement', () => {
      const result = engine.evaluate({
        ...baseFacts,
        customerSegment: 'premium',
        averageAnnualSpend: 3000,
        engagementTrend: 'decreasing',
      });
      expect(result).toMatchObject({ retentionRequired: true, reasonCode: 'HIGH_VALUE_CUSTOMER' });
    });

    it('does not flag a premium customer with stable engagement', () => {
      const result = engine.evaluate({
        ...baseFacts,
        customerSegment: 'premium',
        averageAnnualSpend: 3000,
        engagementTrend: 'stable',
      });
      expect(result.retentionRequired).toBe(false);
    });

    it('does not flag a standard-segment customer even with high spend and declining engagement', () => {
      const result = engine.evaluate({
        ...baseFacts,
        customerSegment: 'standard',
        averageAnnualSpend: 3000,
        engagementTrend: 'decreasing',
      });
      expect(result.retentionRequired).toBe(false);
    });
  });

  it('takes no action when no rule matches', () => {
    const result = engine.evaluate(baseFacts);
    expect(result.retentionRequired).toBe(false);
    expect(result.reasonCode).toBe('NONE');
  });
});
