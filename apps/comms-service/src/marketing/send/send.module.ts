import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@tscrm/queue';
import { SmsModule } from '../../sms/sms.module';
import { EmailModule } from '../../email/email.module';
import { SuppressionModule } from '../suppression/suppression.module';
import { MarketingSendWorker } from './marketing-send.worker';
import { WinbackProcessor } from '../winback/winback.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: QueueName.MARKETING_SEND }),
    SmsModule,
    EmailModule,
    SuppressionModule,
  ],
  providers: [MarketingSendWorker, WinbackProcessor],
  exports: [MarketingSendWorker],
})
export class SendModule {}
