import { Module } from '@nestjs/common';
import { ChurnClient } from '../ai/churn.client';
import { UpsellClient } from '../ai/upsell.client';
import { PrismaModule } from '../prisma/prisma.module';
import { FollowupProducer } from '../queues/followup.producer';
import { UpsellAgentService } from './upsell-agent.service';
import { UpsellController } from './upsell.controller';
import { UpsellCron } from './upsell.cron';

@Module({
  imports: [PrismaModule],
  controllers: [UpsellController],
  providers: [ChurnClient, UpsellClient, FollowupProducer, UpsellAgentService, UpsellCron],
  exports: [UpsellAgentService],
})
export class UpsellModule {}
