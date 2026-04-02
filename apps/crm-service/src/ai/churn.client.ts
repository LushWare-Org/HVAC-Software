import { Injectable, Logger } from '@nestjs/common';

export interface ChurnPredictionInput {
  days_since_last_service: number;
  service_count_last_year: number;
  avg_monthly_spend: number;
  customer_tenure_days: number;
}

@Injectable()
export class ChurnClient {
  private readonly logger = new Logger(ChurnClient.name);
  private readonly baseUrl = process.env.CHURN_SERVICE_URL ?? 'http://churn-service:8000';

  async predictChurn(data: ChurnPredictionInput): Promise<number> {
    const response = await fetch(`${this.baseUrl}/predict/churn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const detail = await response.text();
      this.logger.warn(`Churn service request failed with ${response.status}: ${detail}`);
      throw new Error(`Churn service returned ${response.status}`);
    }

    const payload = (await response.json()) as { churn_probability?: unknown };
    const churnProbability = Number(payload.churn_probability);

    if (!Number.isFinite(churnProbability)) {
      throw new Error('Churn service returned an invalid probability');
    }

    return churnProbability;
  }
}
