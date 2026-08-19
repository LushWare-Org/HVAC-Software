import { Module } from '@nestjs/common';
import { FinanceEventsPublisher } from './finance-events.publisher';

@Module({
  providers: [FinanceEventsPublisher],
  exports: [FinanceEventsPublisher],
})
export class RealtimeModule {}
