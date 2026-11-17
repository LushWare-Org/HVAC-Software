import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { RescheduleModule } from '../reschedule/reschedule.module';
import { SweepsController } from './sweeps.controller';

@Module({ imports: [JobsModule, RescheduleModule], controllers: [SweepsController] })
export class SweepsModule {}
