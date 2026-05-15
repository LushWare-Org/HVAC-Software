import { Injectable } from '@nestjs/common';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { UpdateMarketingSettingsDto } from './marketing-settings.dto';

@Injectable()
export class MarketingSettingsService {
  constructor(private readonly prisma: MarketingPrismaService) {}

  async get(companyId: string) {
    return this.prisma.marketingSettings.upsert({
      where: { companyId },
      create: { companyId },
      update: {},
    });
  }

  async update(companyId: string, dto: UpdateMarketingSettingsDto) {
    return this.prisma.marketingSettings.upsert({
      where: { companyId },
      create: { companyId, ...dto },
      update: dto,
    });
  }
}
