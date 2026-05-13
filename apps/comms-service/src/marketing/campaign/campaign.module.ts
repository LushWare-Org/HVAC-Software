import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@tscrm/queue';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { MarketingPrismaModule } from '../prisma/marketing-prisma.module';
import { AudienceModule } from '../audience/audience.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: QueueName.MARKETING_SEND }),
    MarketingPrismaModule,
    AudienceModule,
    TemplatesModule,
  ],
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
