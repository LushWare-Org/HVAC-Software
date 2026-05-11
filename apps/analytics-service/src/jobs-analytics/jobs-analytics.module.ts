import { Module } from '@nestjs/common';
import { JobsAnalyticsService } from './jobs-analytics.service';
import { JobsAnalyticsController } from './jobs-analytics.controller';
import { RedisCacheService } from '../redis-cache.service';

@Module({
  controllers: [JobsAnalyticsController],
  providers: [JobsAnalyticsService, RedisCacheService],
  exports: [JobsAnalyticsService],
})
export class JobsAnalyticsModule {}
