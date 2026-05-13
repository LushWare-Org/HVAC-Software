import { Global, Module } from '@nestjs/common';
import { MarketingPrismaService } from './marketing-prisma.service';

@Global()
@Module({
  providers: [MarketingPrismaService],
  exports: [MarketingPrismaService],
})
export class MarketingPrismaModule {}
