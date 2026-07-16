import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RetentionAgent } from '../agents/retention.agent';
import { RetentionRuleEngine } from './rules/retention-rule-engine';
import { RetentionContextBuilder } from './context/retention-context-builder';
import { RetentionValidationService } from './validation/retention-validation.service';
import { RetentionDecisionService } from './decision/retention-decision.service';
import { RetentionLlmClient } from '../ai/retention-llm.client';

@Module({
  imports: [PrismaModule],
  providers: [
    RetentionRuleEngine,
    RetentionContextBuilder,
    RetentionLlmClient,
    RetentionValidationService,
    RetentionDecisionService,
    RetentionAgent,
  ],
  exports: [RetentionAgent],
})
export class RetentionModule {}
