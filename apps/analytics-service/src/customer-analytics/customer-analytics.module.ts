import { Module } from '@nestjs/common';
import { CustomerAnalyticsService } from './customer-analytics.service';
import { CustomerAnalyticsController } from './customer-analytics.controller';

@Module({
  controllers: [CustomerAnalyticsController],
  providers: [CustomerAnalyticsService],
  exports: [CustomerAnalyticsService],
})
export class CustomerAnalyticsModule {}
