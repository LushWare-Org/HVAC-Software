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

  async patch(
    companyId: string,
    id: string,
    data: {
      status?: string;
      estimatedValue?: number;
      customerId?: string;
      convertedAt?: string;
      notes?: string;
      // accepted but not persisted (compatibility aliases)
      lastContactedAt?: string;
      qualificationNotes?: string;
    },
  ) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const { lastContactedAt: _lca, qualificationNotes, ...rest } = data;
    const updateData: any = { ...rest };
    if (qualificationNotes) updateData.notes = qualificationNotes;
    if (rest.status === 'WON' && !rest.convertedAt) updateData.convertedAt = new Date();
    if (rest.convertedAt) updateData.convertedAt = new Date(rest.convertedAt);
    if (rest.estimatedValue !== undefined) updateData.estimatedValue = rest.estimatedValue;
    if (rest.customerId !== undefined) updateData.customerId = rest.customerId;

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
