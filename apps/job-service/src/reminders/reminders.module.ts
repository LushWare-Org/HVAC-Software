import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { RemindersService } from './reminders.service';

@Module({ imports: [JobsModule], providers: [RemindersService] })
export class RemindersModule {}
