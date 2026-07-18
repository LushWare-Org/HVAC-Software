import { Injectable } from '@nestjs/common';

interface ChurnInput {
  days_since_last_service: number;
  service_count_last_year: number;
  avg_monthly_spend: number;
  customer_tenure_days: number;
}

// Customers with churn probability <= this threshold get the review request.
// High-churn customers are excluded — a bad review worsens retention.
const GATE_THRESHOLD = 0.6;

/**
 * Rule-based churn scoring — mirrors CustomersService.classifyChurnAndFailureRisk
 * in crm-service. No ML model call: churn probability is a deterministic
 * function of service recency, service frequency, and tenure.
 */
@Injectable()
export class ChurnGateService {
  async scoreAndGate(input: ChurnInput): Promise<{ score: number; passed: boolean }> {
    const score = this.classifyChurnProbability(input);
    return { score, passed: score <= GATE_THRESHOLD };
  }

  private classifyChurnProbability(input: ChurnInput): number {
    const probability =
      (input.days_since_last_service > 180 ? 0.45 : input.days_since_last_service > 90 ? 0.25 : 0.08) +
      (input.service_count_last_year === 0 ? 0.25 : 0) +
      (input.customer_tenure_days < 90 ? 0.08 : 0);

    return Number(Math.min(0.95, probability).toFixed(3));
  }
}
