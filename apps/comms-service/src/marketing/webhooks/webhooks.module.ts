import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { SmsModule } from '../../sms/sms.module';
import { SuppressionModule } from '../suppression/suppression.module';

@Module({
  imports: [SmsModule, SuppressionModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
