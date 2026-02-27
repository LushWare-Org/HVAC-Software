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
  ): Promise<PaginatedResponse<unknown>> {
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      isActive: true,
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
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
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
        this.prisma.customer.count({ where: { companyId, isActive: true } }),
        this.prisma.customer.count({
          where: { companyId, isActive: true, type: 'RESIDENTIAL' },
        }),
        this.prisma.customer.count({
          where: { companyId, isActive: true, type: 'COMMERCIAL' },
        }),
        this.prisma.customer.count({
          where: {
            companyId,
            isActive: true,
            agreements: { some: { status: 'ACTIVE' } },
          },
        }),
      ]);

    return { total, residential, commercial, withAgreements };
  }
}
