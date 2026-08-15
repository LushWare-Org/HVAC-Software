import { Injectable } from '@nestjs/common';
import { RecommendationEngineService } from './recommendation-engine.service';
import type { RecommendationExplanation } from './insights/insight-explanation';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  actionLabel: string;
  impact: number;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  trend: 'up' | 'down' | 'neutral';
  priorityScore: number;
  explanation: RecommendationExplanation;
}

@Injectable()
export class RecommendationsService {
  constructor(private readonly engine: RecommendationEngineService) {}

  getRecommendations(companyId: string, forecastDays?: number): Promise<Recommendation[]> {
    return this.engine.generate(companyId, forecastDays);
  }
}
