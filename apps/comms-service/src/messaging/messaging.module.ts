import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController, TwilioWebhookController } from './messaging.controller';
import { MessagingGateway } from './messaging.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [PrismaModule, SmsModule],
  controllers: [MessagingController, TwilioWebhookController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
