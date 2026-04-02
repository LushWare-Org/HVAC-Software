import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@tscrm/queue';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SmsProcessor } from './processors/sms.processor';
import { EmailProcessor } from './processors/email.processor';
import { PushProcessor } from './processors/push.processor';
import { SmsModule } from '../sms/sms.module';
import { EmailModule } from '../email/email.module';
import { PushModule } from '../push/push.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FollowupWorker } from '../workers/followup.worker';

@Module({
  imports: [
    PrismaModule,
    SmsModule,
    EmailModule,
    PushModule,
    BullModule.registerQueue(
      { name: QueueName.SEND_SMS },
      { name: QueueName.SEND_EMAIL },
      { name: QueueName.SEND_PUSH },
      { name: QueueName.FOLLOWUP },
    ),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, SmsProcessor, EmailProcessor, PushProcessor, FollowupWorker],
  exports: [NotificationsService],
})
export class NotificationsModule {}
