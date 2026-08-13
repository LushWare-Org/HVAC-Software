import { Global, Module } from '@nestjs/common';
import { JobEventsPublisher } from './job-events.publisher';

/**
 * Global so any module that mutates a job can publish without each one wiring
 * up its own import — the publisher is stateless from the caller's side and
 * holds a single shared Redis connection.
 */
@Global()
@Module({
  providers: [JobEventsPublisher],
  exports: [JobEventsPublisher],
})
export class RealtimeModule {}
