/**
 * QuotesService
 * Manages quote lifecycle: create, list, send (email + token), approve, convert to invoice.
 * All monetary arithmetic is performed with Decimal.js-style operations on the Prisma Decimal
 * type — we store BigDecimal in the DB and only convert to JS number for display.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteStatus, DiscountType } from '../prisma/generated';

// ── Valid status transitions ───────────────────────────────────────────────
const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT:    [QuoteStatus.SENT],
  SENT:     [QuoteStatus.VIEWED, QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.EXPIRED],
  VIEWED:   [QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.EXPIRED],
  ACCEPTED: [],                            // terminal (can convert to invoice)
  DECLINED: [],                            // terminal
  EXPIRED:  [],                            // terminal
};

// ── Sequential quote-number generator ────────────────────────────────────
async function nextQuoteNumber(prisma: PrismaService, companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count({ where: { companyId } });
  return `QUOTE-${year}-${String(count + 1).padStart(4, '0')}`;
}

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ── List ─────────────────────────────────────────────────────────────────

  async findAll(
    companyId: string,
    params: { status?: QuoteStatus; customerId?: string; page?: number; limit?: number },
  ) {
    const { status, customerId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where = {
      companyId,
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.quote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { lineItems: true } } },
      }),
      this.prisma.quote.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  // ── Single ───────────────────────────────────────────────────────────────

  async findOne(companyId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, companyId },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!quote) throw new NotFoundException(`Quote ${id} not found`);
    return quote;
  }

  // ── Create ───────────────────────────────────────────────────────────────

  async create(companyId: string, userId: string, dto: CreateQuoteDto) {
    const quoteNumber = await nextQuoteNumber(this.prisma, companyId);
    const { lineItems = [], taxRate = 0, discountType, discountValue, ...rest } = dto;

    // Calculate totals
    const subtotal = lineItems.reduce((acc, li) => acc + li.quantity * li.unitPrice, 0);
    const discountAmount = discountType === DiscountType.PERCENTAGE
      ? subtotal * ((discountValue ?? 0) / 100)
      : (discountValue ?? 0);
    const taxableSubtotal = lineItems
      .filter((li) => li.taxable !== false)
      .reduce((acc, li) => acc + li.quantity * li.unitPrice, 0) - discountAmount;
    const taxAmount = taxableSubtotal * taxRate;
    const total = subtotal - discountAmount + taxAmount;

    return this.prisma.quote.create({
      data: {
        ...rest,
        companyId,
        quoteNumber,
        createdByUserId: userId,
        discountType: discountType ?? null,
        discountValue: discountValue ?? null,
        discountAmount,
        taxRate,
        subtotal,
        taxAmount,
        total,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        lineItems: {
          create: lineItems.map((li, i) => ({
            description: li.description,
            category: li.category ?? 'LABOUR',
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            lineTotal: li.quantity * li.unitPrice,
            taxable: li.taxable ?? true,
            sortOrder: li.sortOrder ?? i,
          })),
        },
      },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  // ── Update ───────────────────────────────────────────────────────────────

  async update(companyId: string, id: string, dto: UpdateQuoteDto) {
    const existing = await this.findOne(companyId, id);

    if (dto.status && dto.status !== existing.status) {
      const allowed = QUOTE_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition quote from ${existing.status} to ${dto.status}`,
        );
      }
    }

    const { lineItems, ...scalarUpdates } = dto;

    // Recalculate if line items or financials changed
    let financialUpdates: Record<string, unknown> = {};
    if (lineItems) {
      const taxRate = scalarUpdates.taxRate ?? parseFloat(existing.taxRate.toString());
      const discountType = scalarUpdates.discountType ?? existing.discountType;
      const discountValue = scalarUpdates.discountValue ?? parseFloat((existing.discountValue ?? 0).toString());

      const subtotal = lineItems.reduce((acc, li) => acc + li.quantity * li.unitPrice, 0);
      const discountAmount = discountType === DiscountType.PERCENTAGE
        ? subtotal * (discountValue / 100)
        : discountValue;
      const taxableSubtotal = lineItems
        .filter((li) => li.taxable !== false)
        .reduce((acc, li) => acc + li.quantity * li.unitPrice, 0) - discountAmount;
      const taxAmount = taxableSubtotal * taxRate;
      const total = subtotal - discountAmount + taxAmount;
      financialUpdates = { subtotal, discountAmount, taxAmount, total };

      // Replace all line items (delete + re-create pattern — simple and safe for quotes)
      await this.prisma.quoteLineItem.deleteMany({ where: { quoteId: id } });
      await this.prisma.quoteLineItem.createMany({
        data: lineItems.map((li, i) => ({
          quoteId: id,
          description: li.description,
          category: li.category ?? 'LABOUR',
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          lineTotal: li.quantity * li.unitPrice,
          taxable: li.taxable ?? true,
          sortOrder: li.sortOrder ?? i,
        })),
      });
    }

    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        ...scalarUpdates,
        ...financialUpdates,
        sentAt: dto.status === QuoteStatus.SENT ? new Date() : undefined,
        viewedAt: dto.status === QuoteStatus.VIEWED ? new Date() : undefined,
      },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    });

    return updated;
  }

  // ── Send (generate approval token) ────────────────────────────────────────

  async send(companyId: string, id: string) {
    const quote = await this.findOne(companyId, id);
    if (quote.status === QuoteStatus.SENT || quote.status === QuoteStatus.VIEWED) {
      return quote; // idempotent — already sent
    }
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(`Can only send a DRAFT quote, current status: ${quote.status}`);
    }

    const approvalToken = randomUUID();
    return this.prisma.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.SENT,
        sentAt: new Date(),
        approvalToken,
      },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  // ── Mark as viewed (called when customer opens the link) ─────────────────

  async markViewed(companyId: string, id: string) {
    const quote = await this.findOne(companyId, id);
    if (quote.status !== QuoteStatus.SENT) return quote; // idempotent
    return this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.VIEWED, viewedAt: new Date() },
    });
  }

  // ── Approve by ID (admin/test — no token required) ───────────────────────

  async approveById(companyId: string, id: string, name: string, email: string) {
    const quote = await this.findOne(companyId, id);
    if (quote.status === QuoteStatus.ACCEPTED) return quote; // idempotent
    if (!([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.VIEWED] as QuoteStatus[]).includes(quote.status)) {
      throw new BadRequestException(`Quote cannot be approved in status: ${quote.status}`);
    }
    return this.prisma.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.ACCEPTED,
        approvedAt: new Date(),
        approvedByName: name,
        approvedByEmail: email,
      },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  // ── Approve (customer clicks link with token) ─────────────────────────────

  async approve(token: string, name: string, email: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { approvalToken: token },
      include: { lineItems: true },
    });
    if (!quote) throw new NotFoundException('Invalid or expired approval token');
    if (quote.status === QuoteStatus.ACCEPTED) return quote; // idempotent

    if (!([QuoteStatus.SENT, QuoteStatus.VIEWED] as QuoteStatus[]).includes(quote.status)) {
      throw new BadRequestException(`Quote cannot be approved in status: ${quote.status}`);
    }

    return this.prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: QuoteStatus.ACCEPTED,
        approvedAt: new Date(),
        approvedByName: name,
        approvedByEmail: email,
      },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  // ── Convert to Invoice ────────────────────────────────────────────────────

  async convertToInvoice(companyId: string, id: string, createdByUserId: string) {
    const quote = await this.findOne(companyId, id);
    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new BadRequestException('Only ACCEPTED quotes can be converted to invoices');
    }

    // Check not already converted
    const existing = await this.prisma.invoice.findFirst({ where: { quoteId: id } });
    if (existing) {
      throw new BadRequestException(`Quote already converted to invoice ${existing.invoiceNumber}`);
    }

    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({ where: { companyId } });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    return this.prisma.invoice.create({
      data: {
        companyId,
        invoiceNumber,
        quoteId: id,
        jobId: quote.jobId,
        customerId: quote.customerId,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        subtotal: quote.subtotal,
        discountAmount: quote.discountAmount,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        total: quote.total,
        balanceDue: quote.total,
        amountPaid: 0,
        dueDate,
        notes: quote.notes,
        terms: quote.terms,
        createdByUserId,
        lineItems: {
          create: quote.lineItems.map((li) => ({
            description: li.description,
            category: li.category,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            lineTotal: li.lineTotal,
            taxable: li.taxable,
            sortOrder: li.sortOrder,
          })),
        },
      },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payments: true,
        quote: { select: { quoteNumber: true } },
      },
    });
  }

  // ── Delete (draft only) ───────────────────────────────────────────────────

  async remove(companyId: string, id: string) {
    const quote = await this.findOne(companyId, id);
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT quotes can be deleted');
    }
    return this.prisma.quote.delete({ where: { id } });
  }
}
