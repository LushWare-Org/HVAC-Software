import { Injectable, Logger } from '@nestjs/common';

interface ChurnInput {
  days_since_last_service: number;
  service_count_last_year: number;
  avg_monthly_spend: number;
  customer_tenure_days: number;
}

// Customers with churn probability <= this threshold get the review request.
// High-churn customers are excluded — a bad review worsens retention.
const GATE_THRESHOLD = 0.6;

@Injectable()
export class ChurnGateService {
  private readonly logger = new Logger(ChurnGateService.name);
  private readonly churnUrl = process.env.CHURN_SERVICE_URL ?? 'http://localhost:8000';

  async scoreAndGate(input: ChurnInput): Promise<{ score: number; passed: boolean }> {
    try {
      const res = await fetch(`${this.churnUrl}/predict/churn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) throw new Error(`churn-service ${res.status}`);

      const body = (await res.json()) as { churn_probability?: number };
      const score = Number(body.churn_probability ?? 1);
      return { score, passed: score <= GATE_THRESHOLD };
    } catch (err) {
      // Fail open — if churn-service is down, allow the review request
      this.logger.warn(`ChurnGate unavailable, failing open: ${(err as Error).message}`);
      return { score: -1, passed: true };
    }
  }
}
