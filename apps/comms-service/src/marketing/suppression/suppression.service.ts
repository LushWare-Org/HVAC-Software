import { Injectable } from '@nestjs/common';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { MarketingChannel, SuppressionReason } from '../prisma/generated';

@Injectable()
export class SuppressionService {
  constructor(private readonly prisma: MarketingPrismaService) {}

  async isSuppressed(companyId: string, channel: MarketingChannel, address: string): Promise<boolean> {
    const normalised = this.normalise(channel, address);
    const record = await this.prisma.suppression.findUnique({
      where: { companyId_channel_address: { companyId, channel, address: normalised } },
      select: { id: true },
    });
    return record !== null;
  }

  async addSuppression(
    companyId: string,
    channel: MarketingChannel,
    address: string,
    reason: SuppressionReason,
  ): Promise<void> {
    const normalised = this.normalise(channel, address);
    await this.prisma.suppression.upsert({
      where: { companyId_channel_address: { companyId, channel, address: normalised } },
      create: { companyId, channel, address: normalised, reason },
      update: { reason },
    });
  }

  async removeSuppression(companyId: string, channel: MarketingChannel, address: string): Promise<void> {
    const normalised = this.normalise(channel, address);
    await this.prisma.suppression.deleteMany({
      where: { companyId, channel, address: normalised },
    });
  }

  private normalise(channel: MarketingChannel, address: string): string {
    return channel === MarketingChannel.EMAIL ? address.toLowerCase().trim() : address.trim();
  }
}
