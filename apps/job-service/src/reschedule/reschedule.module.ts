import { Module } from '@nestjs/common';
import { RescheduleController } from './reschedule.controller';
import { RescheduleService } from './reschedule.service';
import { RescheduleApplyService } from './reschedule-apply.service';
import { SchedulingClient } from './scheduling.client';
import { RescheduleNotifyClient } from './reschedule-notify.client';
import { RescheduleNudgeCron } from './reschedule-nudge.cron';
import { CrmClient } from '../jobs/crm.client';

@Module({
  controllers: [RescheduleController],
  providers: [
    RescheduleService,
    RescheduleApplyService,
    SchedulingClient,
    RescheduleNotifyClient,
    RescheduleNudgeCron,
    // Lets RescheduleNotifyClient fill in a missing customerEmail before
    // handing the job to comms-service.
    CrmClient,
  ],
  exports: [RescheduleService],
})
export class RescheduleModule {}
