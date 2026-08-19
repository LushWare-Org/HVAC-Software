import { Module } from '@nestjs/common';
import { CustomerEventsSubscriber } from './customer-events.subscriber';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [MessagingModule],
  providers: [CustomerEventsSubscriber],
  exports: [CustomerEventsSubscriber],
})
export class CustomerEventsModule {}
