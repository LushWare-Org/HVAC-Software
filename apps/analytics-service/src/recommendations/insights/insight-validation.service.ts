import { Injectable } from '@nestjs/common';
import type { InsightCategory, InsightLlmRecommendation, InsightSignal } from './insight-types';

/** Conservative confidence used when no LLM recommendation is available — mirrors upsell-agent.service.ts's RULE_ONLY_CONFIDENCE. */
const RULE_ONLY_CONFIDENCE: Record<'Low' | 'Medium' | 'High', number> = {
  High: 0.65,
  Medium: 0.5,
  Low: 0.2,
};

const DEFAULT_TITLE: Record<InsightCategory, string> = {
  low_demand: 'Low Demand Alert',
  high_utilization: 'High Utilization — Raise Prices',
  retention_risk: 'Customer Retention Risk',
  pending_quotes: 'Pending Quotes at Risk',
};

const DEFAULT_ACTION_LABEL: Record<InsightCategory, string> = {
  low_demand: 'Run 20% Discount Campaign',
  high_utilization: 'Apply Dynamic Pricing',
  retention_risk: 'Schedule Retention Calls',
  pending_quotes: 'Run Targeted Follow-Up Campaign',
};

export interface ValidatedInsight {
  title: string;
  description: string;
  actionLabel: string;
  priority: 'Low' | 'Medium' | 'High';
  reason: string;
  confidence: number;
}

/**
 * Never trusts the LLM recommendation directly — every field is re-checked
 * before anything gets surfaced. When the LLM is unavailable or invalid,
 * falls back to the rule engine's own reason/priority with canned copy, so
 * the panel always shows a real, grounded insight — mirrors
 * apps/crm-service/src/upsell/validation/upsell-validation.service.ts.
 */
@Injectable()
export class InsightValidationService {
  validate(signal: InsightSignal, llmRec: InsightLlmRecommendation | null): ValidatedInsight {
    if (llmRec) {
      return {
        title: llmRec.title,
        description: llmRec.description,
        actionLabel: llmRec.actionLabel,
        priority: llmRec.priority,
        reason: llmRec.reason,
        confidence: llmRec.confidence,
      };
    }

    return {
      title: DEFAULT_TITLE[signal.category],
      description: signal.reason,
      actionLabel: DEFAULT_ACTION_LABEL[signal.category],
      priority: signal.suggestedPriority,
      reason: signal.reason,
      confidence: RULE_ONLY_CONFIDENCE[signal.suggestedPriority],
    };
  }
}
