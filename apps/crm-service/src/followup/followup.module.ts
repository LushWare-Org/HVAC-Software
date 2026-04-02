import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChurnClient } from '../ai/churn.client';
import { FollowupAgent } from '../agents/followup.agent';
import { FollowupProducer } from '../queues/followup.producer';
import { FollowupCron } from '../cron/followup.cron';

@Module({
  imports: [PrismaModule],
  providers: [ChurnClient, FollowupProducer, FollowupAgent, FollowupCron],
  exports: [FollowupAgent],
})
export class FollowupModule {}
