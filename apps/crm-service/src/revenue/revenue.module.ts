import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RevenueAgent } from '../agents/revenue.agent';
import { RevenueRuleEngine } from './rules/revenue-rule-engine';
import { RevenueContextBuilder } from './context/revenue-context-builder';
import { RevenueValidationService } from './validation/revenue-validation.service';
import { RevenueDecisionService } from './decision/revenue-decision.service';
import { RevenueLlmClient } from '../ai/revenue-llm.client';

@Module({
  imports: [PrismaModule],
  providers: [
    RevenueRuleEngine,
    RevenueContextBuilder,
    RevenueLlmClient,
    RevenueValidationService,
    RevenueDecisionService,
    RevenueAgent,
  ],
  exports: [RevenueAgent],
})
export class RevenueModule {}
