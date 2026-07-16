import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FollowupProducer } from '../queues/followup.producer';
import { UpsellRuleEngine } from './rules/upsell-rule-engine';
import { UpsellContextBuilder } from './context/upsell-context-builder';
import { UpsellValidationService } from './validation/upsell-validation.service';
import { UpsellDecisionService } from './decision/upsell-decision.service';
import { UpsellLlmClient } from '../ai/upsell-llm.client';
import { UpsellAgentService } from './upsell-agent.service';
import { UpsellController } from './upsell.controller';
import { UpsellCron } from './upsell.cron';

@Module({
  imports: [PrismaModule],
  controllers: [UpsellController],
  providers: [
    FollowupProducer,
    UpsellRuleEngine,
    UpsellContextBuilder,
    UpsellLlmClient,
    UpsellValidationService,
    UpsellDecisionService,
    UpsellAgentService,
    UpsellCron,
  ],
  exports: [UpsellAgentService],
})
export class UpsellModule {}
