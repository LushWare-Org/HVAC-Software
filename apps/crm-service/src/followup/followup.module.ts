import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FollowupAgent } from '../agents/followup.agent';
import { FollowupProducer, NoopFollowupProducer } from '../queues/followup.producer';
import { FollowupCron } from '../cron/followup.cron';
import { FollowupRuleEngine } from './rules/followup-rule-engine';
import { FollowupContextBuilder } from './context/followup-context-builder';
import { FollowupValidationService } from './validation/followup-validation.service';
import { FollowupDecisionService } from './decision/followup-decision.service';
import { FollowupLlmClient } from '../ai/followup-llm.client';

// Use real queue producer when Redis is configured via REDIS_URL (Upstash) or REDIS_HOST (direct)
const hasRedis = !!(process.env.REDIS_URL || process.env.REDIS_HOST);

const decisionProviders = [
  FollowupRuleEngine,
  FollowupContextBuilder,
  FollowupLlmClient,
  FollowupValidationService,
  FollowupDecisionService,
  FollowupAgent,
  FollowupCron,
];

const followupProviders = hasRedis
  ? [FollowupProducer, ...decisionProviders]
  : [{ provide: FollowupProducer, useClass: NoopFollowupProducer }, ...decisionProviders];

@Module({
  imports: [PrismaModule],
  providers: followupProviders,
  exports: [FollowupAgent],
})
export class FollowupModule {}
