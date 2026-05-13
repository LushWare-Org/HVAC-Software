import { Module } from '@nestjs/common';
import { AudienceService } from './audience.service';
import { AudienceController } from './audience.controller';
import { MarketingPrismaModule } from '../prisma/marketing-prisma.module';
import { CrmClient } from '../automation/crm.client';

@Module({
  imports: [MarketingPrismaModule],
  controllers: [AudienceController],
  providers: [AudienceService, CrmClient],
  exports: [AudienceService],
})
export class AudienceModule {}
