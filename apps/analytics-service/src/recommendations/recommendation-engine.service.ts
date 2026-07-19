import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from '../redis-cache.service';
import { InsightDataService } from './insights/insight-data.service';
import { InsightRuleEngine } from './insights/insight-rule-engine';
import { InsightLlmClient } from './insights/insight-llm.client';
import { InsightValidationService } from './insights/insight-validation.service';
import type { InsightCategory, InsightSignal } from './insights/insight-types';
import type { Recommendation } from './recommendations.service';

const CACHE_TTL_SECONDS = 600; // 10 min — aggregate + LLM-backed, doesn't need to be live-fresh; "Refresh" button bypasses this

const ACTION_BY_CATEGORY: Record<InsightCategory, string> = {
  low_demand: 'discount_20',
  high_utilization: 'increase_price',
  retention_risk: 'call',
  pending_quotes: 'geo_target_discount',
};

const TREND_BY_CATEGORY: Record<InsightCategory, Recommendation['trend']> = {
  low_demand: 'down',
  high_utilization: 'up',
  retention_risk: 'down',
  pending_quotes: 'up',
};

const PRIORITY_MAP: Record<'Low' | 'Medium' | 'High', Recommendation['priority']> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

/**
 * Orchestrates InsightDataService (real cross-schema reads) -> InsightRuleEngine
 * (decides whether each opportunity is real and its dollar impact) ->
 * InsightLlmClient (writes copy/priority/confidence) -> InsightValidationService
 * (never trusts the LLM's numbers). Replaces the previous hardcoded
 * RAW_RECOMMENDATIONS mock array — every recommendation this returns is
 * derived from this company's actual data at request time.
 */
@Injectable()
export class RecommendationEngineService {
  private readonly logger = new Logger(RecommendationEngineService.name);

  constructor(
    private readonly dataService: InsightDataService,
    private readonly ruleEngine: InsightRuleEngine,
    private readonly llmClient: InsightLlmClient,
    private readonly validation: InsightValidationService,
    private readonly cache: RedisCacheService,
  ) {}

  async generate(companyId: string, forecastDaysInput?: number): Promise<Recommendation[]> {
    const forecastDays = forecastDaysInput ?? 1;
    const cacheKey = `analytics:recommendations:${companyId}:${forecastDays}`;
    const cached = await this.cache.get<Recommendation[]>(cacheKey);
    if (cached) return cached;

    const signals = await this.collectSignals(companyId, forecastDays);
    const recommendations = await Promise.all(signals.map((signal, index) => this.buildRecommendation(signal, index)));

    const scored = recommendations
      .map((r) => ({ ...r, priorityScore: Math.round(r.impact * r.confidence) }))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5);

    await this.cache.set(cacheKey, scored, CACHE_TTL_SECONDS);
    return scored;
  }

  private async collectSignals(companyId: string, forecastDays: number): Promise<InsightSignal[]> {
    const [utilization, retention, quotes] = await Promise.all([
      this.dataService.getUtilizationFacts(companyId, forecastDays).catch((error) => {
        this.logger.warn(`Utilization facts unavailable for ${companyId}: ${error instanceof Error ? error.message : 'unknown error'}`);
        return null;
      }),
      this.dataService.getRetentionFacts(companyId).catch((error) => {
        this.logger.warn(`Retention facts unavailable for ${companyId}: ${error instanceof Error ? error.message : 'unknown error'}`);
        return null;
      }),
      this.dataService.getPendingQuoteFacts(companyId).catch((error) => {
        this.logger.warn(`Pending quote facts unavailable for ${companyId}: ${error instanceof Error ? error.message : 'unknown error'}`);
        return null;
      }),
    ]);

    const signals: (InsightSignal | null)[] = [
      utilization ? this.ruleEngine.evaluateLowDemand(utilization, forecastDays) : null,
      utilization ? this.ruleEngine.evaluateHighUtilization(utilization) : null,
      retention ? this.ruleEngine.evaluateRetentionRisk(retention) : null,
      quotes ? this.ruleEngine.evaluatePendingQuotes(quotes) : null,
    ];

    return signals.filter((s): s is InsightSignal => s !== null);
  }

  private async buildRecommendation(signal: InsightSignal, index: number): Promise<Omit<Recommendation, 'priorityScore'>> {
    const llmRec = await this.llmClient.recommend(signal);
    const validated = this.validation.validate(signal, llmRec);

    return {
      id: `insight_${signal.category}_${Date.now()}_${index}`,
      title: validated.title,
      description: validated.description,
      action: ACTION_BY_CATEGORY[signal.category],
      actionLabel: validated.actionLabel,
      impact: signal.impact,
      confidence: validated.confidence,
      priority: PRIORITY_MAP[validated.priority],
      reason: validated.reason,
      trend: TREND_BY_CATEGORY[signal.category],
    };
  }
}
