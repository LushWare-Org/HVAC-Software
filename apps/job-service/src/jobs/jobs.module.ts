import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { CrmClient } from './crm.client';
import { ScheduleNoticeService } from './schedule-notice.service';
import { VisitCareService } from './visit-care.service';
import { RedisCacheService } from '../redis-cache.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, RedisCacheService, CrmClient, ScheduleNoticeService, VisitCareService],

  exports: [JobsService, ScheduleNoticeService, VisitCareService],
})
export class JobsModule {}
