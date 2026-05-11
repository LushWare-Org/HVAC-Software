import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpenseCategory } from '../prisma/generated';
import { clampPagination } from '@tscrm/types';

export interface CreateExpenseDto {
  jobId?: string;
  technicianId?: string;
  category?: ExpenseCategory;
  description: string;
  amount: number;
  vendor?: string;
  receiptUrl?: string;
  expenseDate?: string; // ISO
  isReimbursable?: boolean;
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    companyId: string,
    params: {
      jobId?: string;
      technicianId?: string;
      category?: ExpenseCategory;
      page?: number;
      limit?: number;
    },
  ) {
    const { jobId, technicianId, category } = params;
    const { page, limit, skip } = clampPagination({ page: params.page, limit: params.limit });
    const where = {
      companyId,
      ...(jobId ? { jobId } : {}),
      ...(technicianId ? { technicianId } : {}),
      ...(category ? { category } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        orderBy: { expenseDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, companyId },
    });
    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    return expense;
  }

  async create(companyId: string, userId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        ...dto,
        companyId,
        createdByUserId: userId,
        category: dto.category ?? ExpenseCategory.OTHER,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
      },
    });
  }

  async update(companyId: string, id: string, dto: Partial<CreateExpenseDto>) {
    await this.findOne(companyId, id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async getJobExpenseSummary(companyId: string, jobId: string) {
    const result = await this.prisma.expense.aggregate({
      where: { companyId, jobId },
      _sum: { amount: true },
      _count: { id: true },
    });
    return {
      total: parseFloat((result._sum.amount ?? 0).toString()),
      count: result._count.id,
    };
  }
}
