import { Injectable, Logger } from '@nestjs/common';

export interface UpsellRecommendationInput {
  equipment_age: number;
  failure_count: number;
  last_service_days: number;
  avg_spend: number;
  usage_hours_per_week: number;
  churn_probability?: number;
  failure_risk?: number;
}

export interface UpsellRecommendationResult {
  recommended_offer: string;
  confidence: number;
  all_scores: Record<string, number>;
  rule_offer?: string | null;
  model_offer?: string | null;
  priority_score: number;
}

@Injectable()
export class UpsellClient {
  private readonly logger = new Logger(UpsellClient.name);
  private readonly baseUrls = this.resolveBaseUrls();
  private healthyBaseUrl?: string;

  async recommendOffer(data: UpsellRecommendationInput): Promise<UpsellRecommendationResult> {
    const errors: string[] = [];

    for (const baseUrl of this.getCandidateBaseUrls()) {
      try {
        const response = await fetch(`${baseUrl}/recommend-offer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          const detail = await response.text();
          this.logger.warn(`Upsell service request to ${baseUrl} failed with ${response.status}: ${detail}`);
          throw new Error(`Upsell service returned ${response.status}`);
        }

        const payload = (await response.json()) as Partial<UpsellRecommendationResult>;
        const result: UpsellRecommendationResult = {
          recommended_offer: String(payload.recommended_offer ?? ''),
          confidence: Number(payload.confidence),
          all_scores: this.normalizeScores(payload.all_scores),
          rule_offer: payload.rule_offer ?? null,
          model_offer: payload.model_offer ?? null,
          priority_score: Number(payload.priority_score ?? payload.confidence ?? 0),
        };

        if (!result.recommended_offer || !Number.isFinite(result.confidence) || !Number.isFinite(result.priority_score)) {
          throw new Error('Upsell service returned an invalid recommendation');
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

    throw new Error(`Upsell service unavailable (${errors.join('; ')})`);
  }

  private normalizeScores(scores: unknown): Record<string, number> {
    if (!scores || typeof scores !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(scores as Record<string, unknown>)
        .map(([key, value]) => [key, Number(value)])
        .filter(([, value]) => Number.isFinite(value)),
    );
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
    const configuredUrl = process.env.UPSELL_SERVICE_URL?.trim();
    const churnUrl = process.env.CHURN_SERVICE_URL?.trim();
    const candidates = [
      configuredUrl,
      churnUrl,
      'http://localhost:8000',
      'http://churn-service:8000',
    ].filter((url): url is string => Boolean(url));

    return Array.from(new Set(candidates.map((url) => url.replace(/\/+$/, ''))));
  }
}
