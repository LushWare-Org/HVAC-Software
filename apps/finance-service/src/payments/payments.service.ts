/**
 * PaymentsService
 * Read-only aggregation of payments; mutations happen via InvoicesService
 * (because a payment always belongs to an invoice).
 * Provides company-wide payment listing, filtering and metrics.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, PaymentMethod } from '../prisma/generated';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── List ──────────────────────────────────────────────────────────────────

  async findAll(
    companyId: string,
    params: {
      status?: PaymentStatus;
      method?: PaymentMethod;
      invoiceId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { status, method, invoiceId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where = {
      companyId,
      ...(status ? { status } : {}),
      ...(method ? { paymentMethod: method } : {}),
      ...(invoiceId ? { invoiceId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              customerName: true,
              customerEmail: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  // ── Single ────────────────────────────────────────────────────────────────

  async findOne(companyId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, companyId },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            customerName: true,
            customerEmail: true,
            total: true,
            balanceDue: true,
          },
        },
      },
    });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return payment;
  }

  // ── Metrics ───────────────────────────────────────────────────────────────

  async getMetrics(companyId: string, fromDate?: Date, toDate?: Date) {
    const dateFilter = fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {}),
          },
        }
      : {};

    const [totalRevenue, paymentsByMethod, outstandingBalance] = await this.prisma.$transaction([
      // Sum of all SUCCEEDED payments
      this.prisma.payment.aggregate({
        where: { companyId, status: PaymentStatus.SUCCEEDED, ...dateFilter },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Breakdown by payment method
      this.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: { companyId, status: PaymentStatus.SUCCEEDED, ...dateFilter },
        orderBy: { paymentMethod: 'asc' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Total outstanding (sum of all active invoice balance_due)
      this.prisma.invoice.aggregate({
        where: {
          companyId,
          status: { notIn: ['PAID', 'VOID'] },
        },
        _sum: { balanceDue: true },
      }),
    ]);

    return {
      totalRevenue: parseFloat((totalRevenue._sum.amount ?? 0).toString()),
      totalPayments: totalRevenue._count.id,
      outstandingBalance: parseFloat((outstandingBalance._sum.balanceDue ?? 0).toString()),
      byMethod: paymentsByMethod.map((r) => ({
        method: r.paymentMethod,
        total: parseFloat(((r._sum?.amount) ?? 0).toString()),
        count: ((r._count as any)?.id) ?? 0,
      })),
    };
  }
}
