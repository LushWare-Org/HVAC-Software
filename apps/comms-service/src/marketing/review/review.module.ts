import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@tscrm/queue';
import { ReviewRequestService } from './review-request.service';
import { ReviewRequestController } from './review-request.controller';
import { ChurnGateService } from './churn-gate.service';
import { SuppressionModule } from '../suppression/suppression.module';
import { SmsModule } from '../../sms/sms.module';
import { EmailModule } from '../../email/email.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: QueueName.MARKETING_SEND }),
    SuppressionModule,
    SmsModule,
    EmailModule,
  ],
  providers: [ReviewRequestService, ChurnGateService],
  controllers: [ReviewRequestController],
  exports: [ReviewRequestService],
})
export class ReviewModule {}
