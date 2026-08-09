import type { InsightCategory, InsightSignal } from './insight-types';
import type { ValidatedInsight } from './insight-validation.service';
import { RULE_ONLY_CONFIDENCE } from './insight-validation.service';
import {
  LOW_DEMAND_UTILIZATION_MAX,
  HIGH_UTILIZATION_MIN,
  PRICE_INCREASE_FRACTION,
  HIGH_PRIORITY_RETENTION_RISK_COUNT,
  HIGH_PRIORITY_PENDING_QUOTE_COUNT,
} from './insight-rule-engine';
import { HIGH_VALUE_LTV_THRESHOLD, CHURN_RISK_MIN_PROBABILITY, PENDING_QUOTE_AGING_DAYS } from './insight-data.service';

/** Backs the "Reason" button — a full breakdown of every number and rule behind one recommendation. */
export interface RecommendationExplanation {
  usedLlm: boolean;
  /** The rule engine's own factual sentence — always real, never LLM-authored, regardless of which text the card displays. */
  groundTruth: string;
  message: string;
  priority: string;
  expectedOutcome: string;
  action: string;
  impact: string;
  confidence: string;
  metrics: Record<string, number>;
}

const pctOfFraction = (n: number) => `${Math.round(n * 100)}%`;
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

function messageExplanation(category: InsightCategory, usedLlm: boolean): string {
  const criteria: Record<InsightCategory, string> = {
    retention_risk: `Counts active customers with at least ${money(HIGH_VALUE_LTV_THRESHOLD)} in active-agreement LTV ("high-value") whose computed churn probability is ${pctOfFraction(CHURN_RISK_MIN_PROBABILITY)} or higher (based on days since last completed job, completed-job count in the last year, and account tenure).`,
    pending_quotes: `Counts quotes still in SENT or VIEWED status that were created more than ${PENDING_QUOTE_AGING_DAYS} days ago.`,
    high_utilization: `Fires when scheduled job volume exceeds ${pctOfFraction(HIGH_UTILIZATION_MIN)} of technician capacity for the forecast window.`,
    low_demand: `Fires when scheduled job volume falls under ${pctOfFraction(LOW_DEMAND_UTILIZATION_MAX)} of technician capacity for the forecast window.`,
  };
  const source = usedLlm
    ? 'The text shown is LLM-authored, generated from these real facts — the LLM never invents the numbers.'
    : "No live LLM response was available, so the text shown is the rule engine's own sentence, assembled directly from these real facts.";
  return `${criteria[category]} ${source}`;
}

function priorityExplanation(category: InsightCategory, metrics: Record<string, number>, priority: 'Low' | 'Medium' | 'High'): string {
  switch (category) {
    case 'retention_risk':
      return `${priority}: ${metrics.atRiskHighValueCount ?? 0} at-risk high-value customer(s). The rule sets High at ${HIGH_PRIORITY_RETENTION_RISK_COUNT}+ at-risk customers, Medium below that.`;
    case 'pending_quotes':
      return `${priority}: ${metrics.agingPendingCount ?? 0} aging quote(s). The rule sets High at ${HIGH_PRIORITY_PENDING_QUOTE_COUNT}+ aging quotes, Medium below that.`;
    case 'high_utilization':
      return `${priority}: utilization is ${metrics.utilizationPercent ?? 0}% of capacity. The rule sets High above 100% of capacity, Medium between ${pctOfFraction(HIGH_UTILIZATION_MIN)} and 100%.`;
    case 'low_demand':
      return `${priority}: utilization is ${metrics.utilizationPercent ?? 0}% of capacity. The rule sets High below 40% utilization, Medium between 40% and ${pctOfFraction(LOW_DEMAND_UTILIZATION_MAX)}.`;
  }
}

function impactExplanation(category: InsightCategory, metrics: Record<string, number>, impact: number): string {
  switch (category) {
    case 'retention_risk': {
      const total = metrics.totalLtvAtRisk ?? 0;
      const rate = metrics.historicalSuccessRatePercent;
      return rate != null
        ? `${money(total)} total at-risk LTV × ${rate}% historical retention-call success rate (your own outcomes, last 180 days) ≈ ${money(impact)}.`
        : `${money(total)} total at-risk LTV — no historical retention-call success-rate data yet, so the full amount is used as the impact estimate.`;
    }
    case 'pending_quotes': {
      const total = metrics.agingPendingTotal ?? 0;
      const rate = metrics.historicalConversionRatePercent;
      return rate != null
        ? `${money(total)} pending total × ${rate}% historical close rate (won ÷ closed quotes, last 180 days) ≈ ${money(impact)}.`
        : `${money(total)} pending total — not enough closed-quote history yet, so the full amount is used as the impact estimate.`;
    }
    case 'high_utilization': {
      const jobs = metrics.scheduledJobs ?? 0;
      const pricePct = metrics.priceIncreasePercent ?? Math.round(PRICE_INCREASE_FRACTION * 100);
      return `${jobs} scheduled job(s) × trailing-30-day average job value × ${pricePct}% suggested price increase ≈ ${money(impact)}.`;
    }
    case 'low_demand': {
      const idle = metrics.idleSlots ?? 0;
      const avg = metrics.avgJobValue ?? 0;
      return `${idle} idle slot(s) × ${money(avg)} average job value ≈ ${money(impact)}.`;
    }
  }
}

function confidenceExplanation(usedLlm: boolean, confidence: number, priority: 'Low' | 'Medium' | 'High'): string {
  if (usedLlm) {
    return `LLM-estimated confidence (${Math.round(confidence * 100)}%) — the model's own assessment of how reliable this recommendation is, given the real facts it was shown. It never invents the dollar figures, only this score.`;
  }
  const fallbackPct = Math.round(RULE_ONLY_CONFIDENCE[priority] * 100);
  return `Rule-based fallback (no live LLM response for this recommendation): ${priority} priority defaults to ${fallbackPct}% confidence. High → ${Math.round(RULE_ONLY_CONFIDENCE.High * 100)}%, Medium → ${Math.round(RULE_ONLY_CONFIDENCE.Medium * 100)}%, Low → ${Math.round(RULE_ONLY_CONFIDENCE.Low * 100)}%.`;
}

function actionExplanation(usedLlm: boolean, actionLabel: string): string {
  return usedLlm
    ? `LLM-authored label ("${actionLabel}") for this recommendation's category — the underlying action type is fixed by the category rule, only the wording is LLM-written.`
    : `Rule-based fallback label ("${actionLabel}") — the canned default for this category, used because no live LLM response was available.`;
}

export function buildExplanation(signal: InsightSignal, validated: ValidatedInsight, usedLlm: boolean): RecommendationExplanation {
  return {
    usedLlm,
    groundTruth: signal.reason,
    message: messageExplanation(signal.category, usedLlm),
    priority: priorityExplanation(signal.category, signal.metrics, validated.priority),
    expectedOutcome: 'The "Expected outcome" text is a fixed template for this recommendation type, filled in with the real Impact and Confidence figures below — see those two for how they were calculated.',
    action: actionExplanation(usedLlm, validated.actionLabel),
    impact: impactExplanation(signal.category, signal.metrics, signal.impact),
    confidence: confidenceExplanation(usedLlm, validated.confidence, validated.priority),
    metrics: signal.metrics,
  };
}
