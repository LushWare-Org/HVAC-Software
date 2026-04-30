import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { ActionExecutorService } from './action-executor.service';
import { ExecutionLoggerService } from './execution-logger.service';

@Module({
  controllers: [RecommendationsController],
  providers: [RecommendationsService, ActionExecutorService, ExecutionLoggerService],
})
export class RecommendationsModule {}
