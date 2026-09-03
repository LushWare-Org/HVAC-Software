import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { StaffAlertsService } from './staff-alerts.service';
import { PartnerEventsWorker } from './partner-events.worker';

@Module({
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    WebhookDeliveryService,
    StaffAlertsService,
    PartnerEventsWorker,
  ],
  exports: [WebhookDeliveryService],
})
export class WebhooksModule {}
