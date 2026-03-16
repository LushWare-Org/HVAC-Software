import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginatedResponse } from '@tscrm/types';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  private provisionalPortalSignupFilter = {
    AND: [
      { source: 'portal' },
      { engagementStatus: 'INACTIVE' as const },
      { tags: { has: 'portal-signup' } },
    ],
  };

  async create(companyId: string, dto: CreateCustomerDto) {
    // Check for duplicate email within same company
    if (dto.email) {
      const existing = await this.prisma.customer.findFirst({
        where: { companyId, email: dto.email, isActive: true },
      });
      if (existing) {
        throw new ConflictException(
          `Customer with email ${dto.email} already exists`,
        );
      }
    }

    return this.prisma.customer.create({
      data: { ...dto, companyId },
      include: { contacts: true },
    });
  }

  async findAll(
    companyId: string,
    page = 1,
    limit = 20,
    search?: string,
    type?: string,
    isActive?: boolean,
  ): Promise<PaginatedResponse<unknown>> {
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
      isActive: isActive !== undefined ? isActive : true,
      NOT: this.provisionalPortalSignupFilter,
      ...(type && { type: type as any }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: { _count: { select: { contacts: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
      include: {
        contacts: true,
        addresses: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }] },
        equipment: { orderBy: { createdAt: 'desc' } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { leads: true, agreements: true, bookings: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    return customer;
  }

  async update(companyId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(companyId, id); // ensures it exists + belongs to company

    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    // Soft delete — preserve history
    return this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats(companyId: string) {
    const [total, residential, commercial, withAgreements] =
      await this.prisma.$transaction([
        this.prisma.customer.count({
          where: { companyId, isActive: true, NOT: this.provisionalPortalSignupFilter },
        }),
        this.prisma.customer.count({
          where: { companyId, isActive: true, type: 'RESIDENTIAL', NOT: this.provisionalPortalSignupFilter },
        }),
        this.prisma.customer.count({
          where: { companyId, isActive: true, type: 'COMMERCIAL', NOT: this.provisionalPortalSignupFilter },
        }),
        this.prisma.customer.count({
          where: {
            companyId,
            isActive: true,
            NOT: this.provisionalPortalSignupFilter,
            agreements: { some: { status: 'ACTIVE' } },
          },
        }),
      ]);

    return { total, residential, commercial, withAgreements };
  }

  // Called by customer portal: find Customer linked to the portal user's account
  async findMe(companyId: string, userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { companyId, auth0UserId: userId },
      include: {
        contacts: true,
        addresses: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        equipment: { orderBy: { createdAt: 'desc' } },
        _count: { select: { leads: true, agreements: true, bookings: true } },
      },
    });
    if (!customer) throw new NotFoundException('Customer profile not found');
    return customer;
  }

  async updateMe(companyId: string, userId: string, dto: Partial<{ firstName: string; lastName: string; email: string; phone: string; mobile: string; address: string; city: string; state: string; zipCode: string; notes: string }>) {
    const customer = await this.findMe(companyId, userId);
    return this.prisma.customer.update({ where: { id: customer.id }, data: dto });
  }
}
