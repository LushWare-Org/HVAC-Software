import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, status?: string) {
    return this.prisma.lead.findMany({
      where: {
        companyId,
        ...(status && { status: status as any }),
      },
      include: { customer: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(companyId: string, data: {
    firstName: string; lastName: string; email?: string; phone?: string;
    source?: string; estimatedValue?: number; notes?: string; assignedToId?: string;
  }) {
    return this.prisma.lead.create({
      data: { ...data, companyId, estimatedValue: data.estimatedValue },
    });
  }

  async updateStatus(companyId: string, id: string, status: string, notes?: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const updateData: any = { status };
    if (notes) updateData.notes = notes;
    if (status === 'WON') updateData.convertedAt = new Date();

    return this.prisma.lead.update({ where: { id }, data: updateData });
  }

  async getPipelineSummary(companyId: string) {
    const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'];
    const counts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await this.prisma.lead.count({ where: { companyId, status: status as any } }),
      })),
    );
    return counts;
  }
}
