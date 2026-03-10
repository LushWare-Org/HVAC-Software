import { Module } from '@nestjs/common';
import { JobsAnalyticsService } from './jobs-analytics.service';
import { JobsAnalyticsController } from './jobs-analytics.controller';

@Module({
  controllers: [JobsAnalyticsController],
  providers: [JobsAnalyticsService],
  exports: [JobsAnalyticsService],
})
export class JobsAnalyticsModule {}
