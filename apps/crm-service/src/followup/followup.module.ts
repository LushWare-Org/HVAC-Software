import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChurnClient } from '../ai/churn.client';
import { FollowupAgent } from '../agents/followup.agent';
import { FollowupProducer, NoopFollowupProducer } from '../queues/followup.producer';
import { FollowupCron } from '../cron/followup.cron';

// Use real queue producer when Redis is configured via REDIS_URL (Upstash) or REDIS_HOST (direct)
const hasRedis = !!(process.env.REDIS_URL || process.env.REDIS_HOST);
const followupProviders = hasRedis
  ? [ChurnClient, FollowupProducer, FollowupAgent, FollowupCron]
  : [ChurnClient, { provide: FollowupProducer, useClass: NoopFollowupProducer }, FollowupAgent, FollowupCron];

@Module({
  imports: [PrismaModule],
  providers: followupProviders,
  exports: [FollowupAgent],
})
export class FollowupModule {}
