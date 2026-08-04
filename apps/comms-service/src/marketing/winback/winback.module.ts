import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@tscrm/queue';
import { WinbackService } from './winback.service';
import { SuppressionModule } from '../suppression/suppression.module';
import { SmsModule } from '../../sms/sms.module';
import { EmailModule } from '../../email/email.module';
import { CrmClient } from '../automation/crm.client';
import { ChurnGateService } from '../review/churn-gate.service';
import { CompanySettingsModule } from '../../company-settings/company-settings.module';

// WinbackModule provides WinbackService (scan logic) and WinbackProcessor (step handlers).
// The daily scan cron is registered by EquipmentAutomationModule to avoid queue duplication.
// Step-2 email and step-3 SMS delayed jobs run on MARKETING_SEND via MarketingSendWorker.

@Module({
  imports: [
    BullModule.registerQueue({ name: QueueName.MARKETING_SEND }),
    SuppressionModule,
    SmsModule,
    EmailModule,
    CompanySettingsModule,
  ],
  providers: [WinbackService, CrmClient, ChurnGateService],
  exports: [WinbackService],
})
export class WinbackModule {}
