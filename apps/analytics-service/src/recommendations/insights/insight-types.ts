export type InsightCategory = 'low_demand' | 'high_utilization' | 'retention_risk' | 'pending_quotes';

/** Real, queried facts behind each possible insight — never invented. */
export interface UtilizationFacts {
  activeTechnicians: number;
  capacity: number; // sum of max_daily_jobs across active technicians, for the forecast window
  scheduledJobs: number;
  avgJobValue: number; // trailing-30-day average of jobs.estimatedValue
}

export interface RetentionFacts {
  atRiskHighValueCount: number;
  avgLtvAtRisk: number;
  totalLtvAtRisk: number;
  historicalSuccessRate: number | null; // real, from retention_recommendations outcomes; null if no data yet
}

export interface PendingQuoteFacts {
  agingPendingCount: number; // SENT/VIEWED and older than the pending-quote threshold
  agingPendingTotal: number;
  historicalConversionRate: number | null; // real, from closed Quote outcomes; null if no data yet
}

/** What the rule engine decides: whether a signal exists, its category, and every real number. Never LLM-authored. */
export interface InsightSignal {
  category: InsightCategory;
  reason: string;
  metrics: Record<string, number>;
  impact: number;
  suggestedPriority: 'Low' | 'Medium' | 'High';
}

/** What the LLM is allowed to author: copy and qualitative judgment only — never numbers. */
export interface InsightLlmRecommendation {
  title: string;
  description: string;
  actionLabel: string;
  priority: 'Low' | 'Medium' | 'High';
  reason: string;
  confidence: number;
}
