import { InsightRuleEngine } from './insight-rule-engine';
import type { PendingQuoteFacts, RetentionFacts, UtilizationFacts } from './insight-types';

describe('InsightRuleEngine', () => {
  let engine: InsightRuleEngine;

  beforeEach(() => {
    engine = new InsightRuleEngine();
  });

  describe('evaluateLowDemand', () => {
    const facts: UtilizationFacts = { activeTechnicians: 5, capacity: 40, scheduledJobs: 10, avgJobValue: 200 };

    it('fires when utilization is below the low-demand threshold', () => {
      const signal = engine.evaluateLowDemand(facts, 1);
      expect(signal).not.toBeNull();
      expect(signal!.category).toBe('low_demand');
      // idleSlots = 40 - 10 = 30, impact = 30 * 200
      expect(signal!.impact).toBe(6000);
      expect(signal!.metrics.utilizationPercent).toBe(25);
    });

    it('does not fire once utilization clears the threshold', () => {
      const signal = engine.evaluateLowDemand({ ...facts, scheduledJobs: 25 }, 1); // 62.5%
      expect(signal).toBeNull();
    });

    it('returns null when there is no technician capacity to compare against', () => {
      const signal = engine.evaluateLowDemand({ ...facts, capacity: 0 }, 1);
      expect(signal).toBeNull();
    });

    it('returns null when idle slots have no measurable dollar value', () => {
      const signal = engine.evaluateLowDemand({ ...facts, avgJobValue: 0 }, 1);
      expect(signal).toBeNull();
    });
  });

  describe('evaluateHighUtilization', () => {
    const facts: UtilizationFacts = { activeTechnicians: 5, capacity: 40, scheduledJobs: 38, avgJobValue: 200 };

    it('fires when utilization exceeds the high-utilization threshold', () => {
      const signal = engine.evaluateHighUtilization(facts); // 95%
      expect(signal).not.toBeNull();
      expect(signal!.category).toBe('high_utilization');
      // impact = scheduledJobs(38) * avgJobValue(200) * 0.12
      expect(signal!.impact).toBe(912);
    });

    it('does not fire below the threshold', () => {
      const signal = engine.evaluateHighUtilization({ ...facts, scheduledJobs: 30 }); // 75%
      expect(signal).toBeNull();
    });

    it('marks High priority once demand exceeds capacity outright', () => {
      const signal = engine.evaluateHighUtilization({ ...facts, scheduledJobs: 45 }); // 112.5%
      expect(signal!.suggestedPriority).toBe('High');
    });
  });

  describe('evaluateRetentionRisk', () => {
    it('returns null when no at-risk high-value customers exist', () => {
      const facts: RetentionFacts = { atRiskHighValueCount: 0, avgLtvAtRisk: 0, totalLtvAtRisk: 0, historicalSuccessRate: null };
      expect(engine.evaluateRetentionRisk(facts)).toBeNull();
    });

    it('uses raw LTV-at-risk as impact when there is no historical success rate', () => {
      const facts: RetentionFacts = { atRiskHighValueCount: 3, avgLtvAtRisk: 2800, totalLtvAtRisk: 8400, historicalSuccessRate: null };
      const signal = engine.evaluateRetentionRisk(facts);
      expect(signal!.impact).toBe(8400);
      expect(signal!.metrics.historicalSuccessRatePercent).toBeUndefined();
    });

    it('tightens impact using a real historical success rate when available', () => {
      const facts: RetentionFacts = { atRiskHighValueCount: 3, avgLtvAtRisk: 2800, totalLtvAtRisk: 8400, historicalSuccessRate: 0.5 };
      const signal = engine.evaluateRetentionRisk(facts);
      expect(signal!.impact).toBe(4200);
      expect(signal!.metrics.historicalSuccessRatePercent).toBe(50);
    });

    it('marks High priority at 5 or more at-risk customers', () => {
      const facts: RetentionFacts = { atRiskHighValueCount: 5, avgLtvAtRisk: 2000, totalLtvAtRisk: 10000, historicalSuccessRate: null };
      expect(engine.evaluateRetentionRisk(facts)!.suggestedPriority).toBe('High');
    });
  });

  describe('evaluatePendingQuotes', () => {
    it('returns null when there are no aging pending quotes', () => {
      const facts: PendingQuoteFacts = { agingPendingCount: 0, agingPendingTotal: 0, historicalConversionRate: null };
      expect(engine.evaluatePendingQuotes(facts)).toBeNull();
    });

    it('uses the full pending total as impact when there is no historical conversion rate', () => {
      const facts: PendingQuoteFacts = { agingPendingCount: 8, agingPendingTotal: 14600, historicalConversionRate: null };
      const signal = engine.evaluatePendingQuotes(facts);
      expect(signal!.impact).toBe(14600);
    });

    it('tightens impact using a real historical conversion rate when available', () => {
      const facts: PendingQuoteFacts = { agingPendingCount: 8, agingPendingTotal: 14600, historicalConversionRate: 0.55 };
      const signal = engine.evaluatePendingQuotes(facts);
      expect(signal!.impact).toBe(8030);
      expect(signal!.metrics.historicalConversionRatePercent).toBe(55);
    });
  });
});
