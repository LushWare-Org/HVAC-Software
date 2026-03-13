import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    companyId: string,
    options: { status?: string; search?: string; page?: number; limit?: number } = {},
  ) {
    const page  = Math.max(1, options.page  ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 50));
    const skip  = (page - 1) * limit;

    const where: any = { companyId };
    if (options.status) where.status = options.status as any;
    if (options.search) {
      const q = options.search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName:  { contains: q, mode: 'insensitive' } },
        { email:     { contains: q, mode: 'insensitive' } },
        { phone:     { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: { customer: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(companyId: string, data: {
    firstName: string; lastName: string; email?: string; phone?: string;
    source?: string; serviceInterest?: string; estimatedValue?: number; notes?: string; assignedToId?: string;
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

    // Auto-create customer when lead is won and not already linked
    if (status === 'WON' && !lead.customerId) {
      const customer = await this.prisma.customer.create({
        data: {
          companyId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email ?? undefined,
          phone: lead.phone ?? undefined,
          mobile: lead.whatsappNo ?? undefined,
          source: lead.source ?? 'lead_conversion',
          notes: lead.notes ?? undefined,
          type: (lead.type === 'COMMERCIAL' ? 'COMMERCIAL' : 'RESIDENTIAL') as any,
        },
      });
      updateData.customerId = customer.id;

      // Copy lead addresses to the new customer
      const leadAddresses = await this.prisma.address.findMany({ where: { leadId: lead.id } });
      if (leadAddresses.length > 0) {
        await this.prisma.address.createMany({
          data: leadAddresses.map((a) => ({
            companyId,
            customerId: customer.id,
            type: a.type,
            line1: a.line1,
            line2: a.line2 ?? undefined,
            city: a.city ?? undefined,
            state: a.state ?? undefined,
            postcode: a.postcode ?? undefined,
            isPrimary: a.isPrimary,
          })),
        });
      }
    }

    return this.prisma.lead.update({ where: { id }, data: updateData });
  }

  async patch(
    companyId: string,
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      whatsappNo?: string;
      type?: string;
      source?: string;
      serviceInterest?: string;
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

    return this.prisma.$transaction(async (tx) => {
      // Auto-create customer when lead is won and not already linked
      if (rest.status === 'WON' && !lead.customerId && !rest.customerId) {
        const customer = await tx.customer.create({
          data: {
            companyId,
            firstName: rest.firstName ?? lead.firstName,
            lastName: rest.lastName ?? lead.lastName,
            email: rest.email ?? lead.email ?? undefined,
            phone: rest.phone ?? lead.phone ?? undefined,
            mobile: rest.whatsappNo ?? lead.whatsappNo ?? undefined,
            source: rest.source ?? lead.source ?? 'lead_conversion',
            notes: rest.notes ?? lead.notes ?? undefined,
            type: ((rest.type ?? lead.type) === 'COMMERCIAL' ? 'COMMERCIAL' : 'RESIDENTIAL') as any,
          },
        });
        updateData.customerId = customer.id;

        // Copy lead addresses to the new customer
        const leadAddresses = await tx.address.findMany({ where: { leadId: lead.id } });
        if (leadAddresses.length > 0) {
          await tx.address.createMany({
            data: leadAddresses.map((a) => ({
              companyId,
              customerId: customer.id,
              type: a.type,
              line1: a.line1,
              line2: a.line2 ?? undefined,
              city: a.city ?? undefined,
              state: a.state ?? undefined,
              postcode: a.postcode ?? undefined,
              isPrimary: a.isPrimary,
            })),
          });
        }
      }

      return tx.lead.update({ where: { id }, data: updateData });
    });
  }

  async remove(companyId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId } });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.prisma.lead.delete({ where: { id } });
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
