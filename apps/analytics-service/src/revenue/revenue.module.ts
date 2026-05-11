import { Module } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { RevenueController } from './revenue.controller';
import { RedisCacheService } from '../redis-cache.service';

@Module({
  controllers: [RevenueController],
  providers: [RevenueService, RedisCacheService],
  exports: [RevenueService],
})
export class RevenueModule {}
