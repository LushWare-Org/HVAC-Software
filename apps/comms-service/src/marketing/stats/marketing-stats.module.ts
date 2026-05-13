import { Module } from '@nestjs/common';
import { MarketingStatsService } from './marketing-stats.service';
import { MarketingStatsController } from './marketing-stats.controller';
import { MarketingPrismaModule } from '../prisma/marketing-prisma.module';

@Module({
  imports: [MarketingPrismaModule],
  controllers: [MarketingStatsController],
  providers: [MarketingStatsService],
})
export class MarketingStatsModule {}
