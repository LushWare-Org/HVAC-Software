import { Module } from '@nestjs/common';
import { RescheduleController } from './reschedule.controller';
import { RescheduleService } from './reschedule.service';
import { RescheduleApplyService } from './reschedule-apply.service';
import { SchedulingClient } from './scheduling.client';
import { RescheduleNotifyClient } from './reschedule-notify.client';
import { RescheduleNudgeCron } from './reschedule-nudge.cron';

@Module({
  controllers: [RescheduleController],
  providers: [
    RescheduleService,
    RescheduleApplyService,
    SchedulingClient,
    RescheduleNotifyClient,
    RescheduleNudgeCron,
  ],
  exports: [RescheduleService],
})
export class RescheduleModule {}
