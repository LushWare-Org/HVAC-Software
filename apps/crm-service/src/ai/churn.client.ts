import { Injectable, Logger } from '@nestjs/common';

export interface ChurnPredictionInput {
  days_since_last_service: number;
  service_count_last_year: number;
  avg_monthly_spend: number;
  customer_tenure_days: number;
}

export interface FailurePredictionInput {
  equipment_age_days: number;
  days_since_last_service: number;
  service_count_last_year: number;
  usage_intensity: number;
  failure_history: number;
}

export interface RevenuePredictionInput {
  churn: ChurnPredictionInput;
  failure: FailurePredictionInput;
}

export interface RevenuePredictionResult {
  churn_probability: number;
  failure_probability: number;
  revenue_risk: number;
  recommended_action: string;
}

@Injectable()
export class ChurnClient {
  private readonly logger = new Logger(ChurnClient.name);
  private readonly baseUrls = this.resolveBaseUrls();
  private healthyBaseUrl?: string;

  async predictChurn(data: ChurnPredictionInput): Promise<number> {
    const errors: string[] = [];

    for (const baseUrl of this.getCandidateBaseUrls()) {
      try {
        const response = await fetch(`${baseUrl}/predict/churn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          const detail = await response.text();
          this.logger.warn(`Churn service request to ${baseUrl} failed with ${response.status}: ${detail}`);
          throw new Error(`Churn service returned ${response.status}`);
        }

        const payload = (await response.json()) as { churn_probability?: unknown };
        const churnProbability = Number(payload.churn_probability);

        if (!Number.isFinite(churnProbability)) {
          throw new Error('Churn service returned an invalid probability');
        }

        this.healthyBaseUrl = baseUrl;
        return churnProbability;
      } catch (error) {
        errors.push(`${baseUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (this.healthyBaseUrl === baseUrl) {
          this.healthyBaseUrl = undefined;
        }
      }
    }

    throw new Error(`Churn service unavailable (${errors.join('; ')})`);
  }

  async predictRevenue(data: RevenuePredictionInput): Promise<RevenuePredictionResult> {
    const errors: string[] = [];

    for (const baseUrl of this.getCandidateBaseUrls()) {
      try {
        const response = await fetch(`${baseUrl}/predict/revenue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          const detail = await response.text();
          this.logger.warn(`Churn service revenue request to ${baseUrl} failed with ${response.status}: ${detail}`);
          throw new Error(`Churn service returned ${response.status}`);
        }

        const payload = (await response.json()) as Partial<RevenuePredictionResult>;
        const result: RevenuePredictionResult = {
          churn_probability: Number(payload.churn_probability),
          failure_probability: Number(payload.failure_probability),
          revenue_risk: Number(payload.revenue_risk),
          recommended_action: String(payload.recommended_action ?? 'NONE'),
        };

        if (
          !Number.isFinite(result.churn_probability) ||
          !Number.isFinite(result.failure_probability) ||
          !Number.isFinite(result.revenue_risk)
        ) {
          throw new Error('Churn service returned an invalid revenue prediction');
        }

        this.healthyBaseUrl = baseUrl;
        return result;
      } catch (error) {
        errors.push(`${baseUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (this.healthyBaseUrl === baseUrl) {
          this.healthyBaseUrl = undefined;
        }
      }
    }

    throw new Error(`Churn service unavailable (${errors.join('; ')})`);
  }

  private getCandidateBaseUrls(): string[] {
    if (!this.healthyBaseUrl) {
      return this.baseUrls;
    }

    return [
      this.healthyBaseUrl,
      ...this.baseUrls.filter((baseUrl) => baseUrl !== this.healthyBaseUrl),
    ];
  }

  private resolveBaseUrls(): string[] {
    const configuredUrl = process.env.CHURN_SERVICE_URL?.trim();
    const candidates = [
      configuredUrl,
      'http://localhost:8000',
      'http://churn-service:8000',
    ].filter((url): url is string => Boolean(url));

    return Array.from(new Set(candidates.map((url) => url.replace(/\/+$/, ''))));
  }
}
