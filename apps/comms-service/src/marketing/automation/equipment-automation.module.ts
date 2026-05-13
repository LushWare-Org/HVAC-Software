import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName } from '@tscrm/queue';
import { EquipmentAutomationService } from './equipment-automation.service';
import { EquipmentAutomationProcessor } from './equipment-automation.processor';
import { CrmClient } from './crm.client';
import { SuppressionModule } from '../suppression/suppression.module';
import { SmsModule } from '../../sms/sms.module';
import { EmailModule } from '../../email/email.module';
import { WinbackModule } from '../winback/winback.module';
import { CampaignModule } from '../campaign/campaign.module';

// Equipment scan at 09:00 UTC, win-back scan at 10:00 UTC, campaign dispatch hourly
const EQUIPMENT_CRON = '0 9 * * *';
const WINBACK_CRON = '0 10 * * *';
const CAMPAIGN_DISPATCH_CRON = '0 * * * *';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QueueName.EQUIPMENT_AUTOMATION },
      { name: QueueName.MARKETING_SEND },
    ),
    SuppressionModule,
    SmsModule,
    EmailModule,
    WinbackModule,
    CampaignModule,
  ],
  providers: [
    EquipmentAutomationService,
    EquipmentAutomationProcessor,
    CrmClient,
  ],
  exports: [EquipmentAutomationService],
})
export class EquipmentAutomationModule implements OnModuleInit {
  constructor(
    @InjectQueue(QueueName.EQUIPMENT_AUTOMATION) private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    const existing = await this.queue.getRepeatableJobs();
    const jobNames = new Set(existing.map((j) => j.name));

    if (!jobNames.has('daily-equipment-scan')) {
      await this.queue.add(
        'daily-equipment-scan',
        { type: 'equipment-scan', companyId: 'ALL' },
        { repeat: { pattern: EQUIPMENT_CRON }, removeOnComplete: { count: 7 }, removeOnFail: { count: 30 } },
      );
    }

    if (!jobNames.has('daily-winback-scan')) {
      await this.queue.add(
        'daily-winback-scan',
        { companyId: 'ALL' },
        { repeat: { pattern: WINBACK_CRON }, removeOnComplete: { count: 7 }, removeOnFail: { count: 30 } },
      );
    }

    if (!jobNames.has('campaign-dispatch')) {
      await this.queue.add(
        'campaign-dispatch',
        {},
        { repeat: { pattern: CAMPAIGN_DISPATCH_CRON }, removeOnComplete: { count: 24 }, removeOnFail: { count: 5 } },
      );
    }
  }
}
