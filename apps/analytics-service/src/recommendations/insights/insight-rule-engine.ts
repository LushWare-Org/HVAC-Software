import { Injectable } from '@nestjs/common';
import type { InsightSignal, PendingQuoteFacts, RetentionFacts, UtilizationFacts } from './insight-types';

const LOW_DEMAND_UTILIZATION_MAX = 0.6; // below this, capacity is going idle
const HIGH_UTILIZATION_MIN = 0.85; // above this, demand exceeds comfortable capacity
const PRICE_INCREASE_FRACTION = 0.12; // matches admin-dashboard's increase_price default (ACTION_PARAMS)
const MIN_RETENTION_RISK_COUNT = 1;
const MIN_PENDING_QUOTE_COUNT = 1;

/**
 * Determines ONLY whether each insight category applies and every real
 * number behind it (impact, metrics). Never authors copy — that's the LLM
 * layer's job (see InsightLlmClient). Mirrors UpsellRuleEngine/RevenueRuleEngine
 * in crm-service, but operates on company-wide aggregates instead of a single
 * customer.
 */
@Injectable()
export class InsightRuleEngine {
  evaluateLowDemand(facts: UtilizationFacts, forecastDays: number): InsightSignal | null {
    if (facts.capacity <= 0) return null;
    const utilization = facts.scheduledJobs / facts.capacity;
    if (utilization >= LOW_DEMAND_UTILIZATION_MAX) return null;

    const idleSlots = Math.max(0, facts.capacity - facts.scheduledJobs);
    const impact = Math.round(idleSlots * facts.avgJobValue);
    if (impact <= 0) return null;

    return {
      category: 'low_demand',
      reason: `Scheduled demand is ${Math.round(utilization * 100)}% of technician capacity over the next ${forecastDays} day(s); ${idleSlots} slots are projected to go unbooked.`,
      metrics: {
        utilizationPercent: Math.round(utilization * 100),
        idleSlots,
        avgJobValue: Math.round(facts.avgJobValue),
        activeTechnicians: facts.activeTechnicians,
      },
      impact,
      suggestedPriority: utilization < 0.4 ? 'High' : 'Medium',
    };
  }

  evaluateHighUtilization(facts: UtilizationFacts): InsightSignal | null {
    if (facts.capacity <= 0) return null;
    const utilization = facts.scheduledJobs / facts.capacity;
    if (utilization <= HIGH_UTILIZATION_MIN) return null;

    const jobsAboveComfortable = Math.max(0, facts.scheduledJobs - facts.capacity);
    const impact = Math.round(facts.scheduledJobs * facts.avgJobValue * PRICE_INCREASE_FRACTION);
    if (impact <= 0) return null;

    return {
      category: 'high_utilization',
      reason: `Technician utilization has reached ${Math.round(utilization * 100)}% of capacity; demand exceeds comfortable capacity by ${jobsAboveComfortable} job(s).`,
      metrics: {
        utilizationPercent: Math.round(utilization * 100),
        scheduledJobs: facts.scheduledJobs,
        priceIncreasePercent: Math.round(PRICE_INCREASE_FRACTION * 100),
      },
      impact,
      suggestedPriority: utilization > 1 ? 'High' : 'Medium',
    };
  }

  evaluateRetentionRisk(facts: RetentionFacts): InsightSignal | null {
    if (facts.atRiskHighValueCount < MIN_RETENTION_RISK_COUNT) return null;

    const impact = Math.round(
      facts.historicalSuccessRate != null
        ? facts.totalLtvAtRisk * facts.historicalSuccessRate
        : facts.totalLtvAtRisk,
    );
    if (impact <= 0) return null;

    return {
      category: 'retention_risk',
      reason: `${facts.atRiskHighValueCount} high-value customer(s) show churn signals (no recent service or a long service gap). Average annual value: $${Math.round(facts.avgLtvAtRisk).toLocaleString()}.`,
      metrics: {
        atRiskHighValueCount: facts.atRiskHighValueCount,
        avgLtvAtRisk: Math.round(facts.avgLtvAtRisk),
        totalLtvAtRisk: Math.round(facts.totalLtvAtRisk),
        ...(facts.historicalSuccessRate != null ? { historicalSuccessRatePercent: Math.round(facts.historicalSuccessRate * 100) } : {}),
      },
      impact,
      suggestedPriority: facts.atRiskHighValueCount >= 5 ? 'High' : 'Medium',
    };
  }

  evaluatePendingQuotes(facts: PendingQuoteFacts): InsightSignal | null {
    if (facts.agingPendingCount < MIN_PENDING_QUOTE_COUNT) return null;

    const impact = Math.round(
      facts.historicalConversionRate != null
        ? facts.agingPendingTotal * facts.historicalConversionRate
        : facts.agingPendingTotal,
    );
    if (impact <= 0) return null;

    return {
      category: 'pending_quotes',
      reason: `${facts.agingPendingCount} quote(s) worth $${Math.round(facts.agingPendingTotal).toLocaleString()} have been pending for over a week.`,
      metrics: {
        agingPendingCount: facts.agingPendingCount,
        agingPendingTotal: Math.round(facts.agingPendingTotal),
        ...(facts.historicalConversionRate != null ? { historicalConversionRatePercent: Math.round(facts.historicalConversionRate * 100) } : {}),
      },
      impact,
      suggestedPriority: facts.agingPendingCount >= 5 ? 'High' : 'Medium',
    };
  }
}
