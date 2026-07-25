import type { RevenueRuleFacts } from '@tscrm/types';
import { RevenueRuleEngine } from './revenue-rule-engine';

const baseFacts: RevenueRuleFacts = {
  customerId: 'cust-1',
  companyId: 'co-1',
  openQuotes: [],
  overdueInvoices: [],
  hasActiveAgreement: true,
  daysSinceLastService: 10,
  oldestEquipmentAgeYears: 2,
  automaticFollowupEnabled: true,
  previousRevenueAttempts: 0,
  hasContactChannel: true,
};

describe('RevenueRuleEngine', () => {
  let engine: RevenueRuleEngine;

  beforeEach(() => {
    engine = new RevenueRuleEngine();
  });

  describe('safety gates', () => {
    it('takes no action when the customer opted out', () => {
      const result = engine.evaluate({
        ...baseFacts,
        automaticFollowupEnabled: false,
        overdueInvoices: [{ id: 'inv-1', daysOverdue: 45, amount: 500 }],
      });
      expect(result.opportunityExists).toBe(false);
      expect(result.reasonCode).toBe('NONE');
    });

    it('takes no action when previous revenue attempts hit the configured limit', () => {
      const result = engine.evaluate({
        ...baseFacts,
        previousRevenueAttempts: 3,
        overdueInvoices: [{ id: 'inv-1', daysOverdue: 45, amount: 500 }],
      });
      expect(result.opportunityExists).toBe(false);
    });

    it('allows an opportunity just below the attempt limit', () => {
      const result = engine.evaluate({
        ...baseFacts,
        previousRevenueAttempts: 2,
        overdueInvoices: [{ id: 'inv-1', daysOverdue: 45, amount: 500 }],
      });
      expect(result.opportunityExists).toBe(true);
    });

    it('takes no action when there is no contact channel', () => {
      const result = engine.evaluate({
        ...baseFacts,
        hasContactChannel: false,
        overdueInvoices: [{ id: 'inv-1', daysOverdue: 45, amount: 500 }],
      });
      expect(result.opportunityExists).toBe(false);
    });
  });

  describe('overdue invoice rule', () => {
    it('flags an invoice overdue beyond 30 days', () => {
      const result = engine.evaluate({ ...baseFacts, overdueInvoices: [{ id: 'inv-1', daysOverdue: 31, amount: 750 }] });
      expect(result).toMatchObject({
        opportunityExists: true,
        category: 'payment_collection',
        reasonCode: 'OVERDUE_INVOICE',
        expectedRevenueImpact: 750,
        highPriority: true,
      });
    });

    it('does not flag an invoice overdue by exactly 30 days', () => {
      const result = engine.evaluate({ ...baseFacts, overdueInvoices: [{ id: 'inv-1', daysOverdue: 30, amount: 750 }] });
      expect(result.opportunityExists).toBe(false);
    });

    it('picks the most overdue invoice when several qualify', () => {
      const result = engine.evaluate({
        ...baseFacts,
        overdueInvoices: [
          { id: 'inv-1', daysOverdue: 31, amount: 100 },
          { id: 'inv-2', daysOverdue: 60, amount: 900 },
        ],
      });
      expect(result.expectedRevenueImpact).toBe(900);
    });
  });

  describe('pending quote rule', () => {
    it('flags a quote pending beyond 7 days', () => {
      const result = engine.evaluate({ ...baseFacts, openQuotes: [{ id: 'q-1', daysSincePending: 8, amount: 1200 }] });
      expect(result).toMatchObject({
        opportunityExists: true,
        category: 'quote_recovery',
        reasonCode: 'PENDING_QUOTE',
        expectedRevenueImpact: 1200,
      });
    });

    it('does not flag a quote pending for exactly 7 days', () => {
      const result = engine.evaluate({ ...baseFacts, openQuotes: [{ id: 'q-1', daysSincePending: 7, amount: 1200 }] });
      expect(result.opportunityExists).toBe(false);
    });

    it('yields to an overdue invoice when both apply', () => {
      const result = engine.evaluate({
        ...baseFacts,
        openQuotes: [{ id: 'q-1', daysSincePending: 30, amount: 1200 }],
        overdueInvoices: [{ id: 'inv-1', daysOverdue: 31, amount: 500 }],
      });
      expect(result.reasonCode).toBe('OVERDUE_INVOICE');
    });
  });

  describe('agreement renewal rule', () => {
    it('flags an agreement expiring within 30 days', () => {
      const result = engine.evaluate({ ...baseFacts, agreementStatus: 'ACTIVE', agreementDaysUntilExpiry: 15 });
      expect(result).toMatchObject({ opportunityExists: true, category: 'agreement_renewal', reasonCode: 'AGREEMENT_EXPIRING' });
    });

    it('flags a PENDING_RENEWAL agreement regardless of days remaining', () => {
      const result = engine.evaluate({ ...baseFacts, agreementStatus: 'PENDING_RENEWAL', agreementDaysUntilExpiry: null });
      expect(result).toMatchObject({ opportunityExists: true, reasonCode: 'AGREEMENT_EXPIRING' });
    });

    it('does not flag an agreement expiring in more than 30 days', () => {
      const result = engine.evaluate({ ...baseFacts, agreementStatus: 'ACTIVE', agreementDaysUntilExpiry: 31 });
      expect(result.opportunityExists).toBe(false);
    });
  });

  describe('upsell equipment-age rule', () => {
    it('flags no active agreement with equipment older than 8 years', () => {
      const result = engine.evaluate({ ...baseFacts, hasActiveAgreement: false, oldestEquipmentAgeYears: 9 });
      expect(result).toMatchObject({ opportunityExists: true, category: 'maintenance_plan', reasonCode: 'UPSELL_EQUIPMENT_AGE' });
    });

    it('does not flag when the customer already has an active agreement', () => {
      const result = engine.evaluate({ ...baseFacts, hasActiveAgreement: true, oldestEquipmentAgeYears: 9 });
      expect(result.opportunityExists).toBe(false);
    });

    it('does not flag equipment at exactly 8 years old', () => {
      const result = engine.evaluate({ ...baseFacts, hasActiveAgreement: false, oldestEquipmentAgeYears: 8 });
      expect(result.opportunityExists).toBe(false);
    });
  });

  describe('inactive customer rule', () => {
    it('flags a customer with no service in over 180 days', () => {
      const result = engine.evaluate({ ...baseFacts, daysSinceLastService: 181 });
      expect(result).toMatchObject({ opportunityExists: true, category: 're_engagement', reasonCode: 'CUSTOMER_INACTIVE' });
    });

    it('does not flag a customer serviced within 180 days', () => {
      const result = engine.evaluate({ ...baseFacts, daysSinceLastService: 180 });
      expect(result.opportunityExists).toBe(false);
    });
  });

  it('takes no action when no rule matches', () => {
    const result = engine.evaluate(baseFacts);
    expect(result.opportunityExists).toBe(false);
    expect(result.category).toBe('no_opportunity');
    expect(result.reasonCode).toBe('NONE');
  });
});
