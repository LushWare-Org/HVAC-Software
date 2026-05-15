import { Injectable } from '@nestjs/common';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';

export interface DeletionResult {
  sendJobsDeleted: number;
  suppressionsDeleted: number;
  reviewRequestsDeleted: number;
  total: number;
}

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: MarketingPrismaService) {}

  async deleteCustomerData(
    companyId: string,
    customerId: string,
    deletedBy: string,
  ): Promise<DeletionResult> {
    const sendJobs = await this.prisma.sendJob.findMany({
      where: { companyId, customerId },
      select: { id: true, channel: true, address: true },
    });

    const addressPairs = [
      ...new Map(
        sendJobs.map((j) => [`${j.channel}:${j.address}`, { channel: j.channel, address: j.address }]),
      ).values(),
    ];

    const sendJobIds = sendJobs.map((j) => j.id);
    if (sendJobIds.length > 0) {
      await this.prisma.sendEvent.deleteMany({ where: { sendJobId: { in: sendJobIds } } });
    }

    const { count: sendJobsDeleted } = await this.prisma.sendJob.deleteMany({
      where: { companyId, customerId },
    });

    let suppressionsDeleted = 0;
    for (const { channel, address } of addressPairs) {
      const { count } = await this.prisma.suppression.deleteMany({
        where: { companyId, channel, address },
      });
      suppressionsDeleted += count;
    }

    const { count: reviewRequestsDeleted } = await this.prisma.reviewRequest.deleteMany({
      where: { companyId, customerId },
    });

    const total = sendJobsDeleted + suppressionsDeleted + reviewRequestsDeleted;

    await this.prisma.marketingDeletionLog.create({
      data: { companyId, customerId, deletedBy, recordsDeleted: total },
    });

    return { sendJobsDeleted, suppressionsDeleted, reviewRequestsDeleted, total };
  }

  async getDeletionLog(companyId: string) {
    return this.prisma.marketingDeletionLog.findMany({
      where: { companyId },
      orderBy: { deletedAt: 'desc' },
      take: 100,
    });
  }
}
