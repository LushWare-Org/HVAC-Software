import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, customerId?: string) {
    return this.prisma.review.findMany({
      where: { companyId, ...(customerId ? { customerId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const review = await this.prisma.review.findFirst({
      where: { id, companyId },
    });
    if (!review) throw new NotFoundException(`Review ${id} not found`);
    return review;
  }

  async create(
    companyId: string,
    data: {
      customerId?: string;
      jobId?: string;
      rating: number;
      comment?: string;
      platform?: string;
      source?: string;
    },
  ) {
    const { source, ...rest } = data;
    return this.prisma.review.create({
      data: {
        ...rest,
        companyId,
        platform: rest.platform ?? source ?? 'internal',
        customerId: rest.customerId || null,
      },
    });
  }
}
