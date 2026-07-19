import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { ActionExecutorService } from './action-executor.service';
import { ExecutionLoggerService } from './execution-logger.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { InsightDataService } from './insights/insight-data.service';
import { InsightRuleEngine } from './insights/insight-rule-engine';
import { InsightLlmClient } from './insights/insight-llm.client';
import { InsightValidationService } from './insights/insight-validation.service';
import { RedisCacheService } from '../redis-cache.service';

@Module({
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    ActionExecutorService,
    ExecutionLoggerService,
    RecommendationEngineService,
    InsightDataService,
    InsightRuleEngine,
    InsightLlmClient,
    InsightValidationService,
    RedisCacheService,
  ],
})
export class RecommendationsModule {}
