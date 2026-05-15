import { Module } from '@nestjs/common';
import { MarketingPrismaModule } from './prisma/marketing-prisma.module';
import { SuppressionModule } from './suppression/suppression.module';
import { PublicModule } from './public/public.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SendModule } from './send/send.module';
import { ReviewModule } from './review/review.module';
import { EquipmentAutomationModule } from './automation/equipment-automation.module';
import { WinbackModule } from './winback/winback.module';
import { TemplatesModule } from './templates/templates.module';
import { AudienceModule } from './audience/audience.module';
import { CampaignModule } from './campaign/campaign.module';
import { MarketingStatsModule } from './stats/marketing-stats.module';
import { MarketingSettingsModule } from './settings/marketing-settings.module';
import { ComplianceModule } from './compliance/compliance.module';

@Module({
  imports: [
    MarketingPrismaModule,
    SuppressionModule,
    PublicModule,
    WebhooksModule,
    SendModule,
    ReviewModule,
    EquipmentAutomationModule,
    WinbackModule,
    TemplatesModule,
    AudienceModule,
    CampaignModule,
    MarketingStatsModule,
    MarketingSettingsModule,
    ComplianceModule,
  ],
})
export class MarketingModule {}
