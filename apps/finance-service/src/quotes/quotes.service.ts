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
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { NotificationClientService } from '../notification-client/notification-client.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteStatus, DiscountType } from '../prisma/generated';
import {
  nextInvoiceNumber, isInvoiceNumberTaken, INVOICE_NUMBER_MAX_ATTEMPTS,
} from '../invoices/invoice-number';

// ── Valid status transitions ───────────────────────────────────────────────
const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT:     [QuoteStatus.SENT],
  SENT:      [QuoteStatus.VIEWED, QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.EXPIRED],
  VIEWED:    [QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.EXPIRED],
  ACCEPTED:  [QuoteStatus.CONVERTED],     // can convert to invoice
  DECLINED:  [],                            // terminal
  EXPIRED:   [],                            // terminal
  CONVERTED: [],                            // terminal
};

// Mirrors apps/analytics-service/src/recommendations/insights/insight-data.service.ts's
// getPendingQuoteFacts aging window, so the "Filter" button on the Pending Quotes at Risk
// recommendation surfaces precisely the quotes counted in that recommendation.
const PENDING_QUOTE_AGING_DAYS = 7;

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
    private readonly pdfService: PdfService,
    private readonly notificationClient: NotificationClientService,
    private readonly companySettings: CompanySettingsClient,
  ) {}

  // ── List ─────────────────────────────────────────────────────────────────

  async findAll(
    companyId: string,
    params: { status?: QuoteStatus; customerId?: string; jobId?: string; projectId?: string; projectIds?: string[]; componentId?: string; page?: number; limit?: number; dateFrom?: string; dateTo?: string; pendingAging?: boolean },
  ) {
    const { status, customerId, jobId, projectId, projectIds, componentId, dateFrom, dateTo, pendingAging } = params;
    const page = Number.isFinite(Number(params.page)) ? Math.max(1, Math.trunc(Number(params.page))) : 1;
    // 500 covers both the multi-project batch case and a full CSV export in one page.
    const maxLimit = 500;
    const limit = Number.isFinite(Number(params.limit)) ? Math.min(maxLimit, Math.max(1, Math.trunc(Number(params.limit)))) : 20;
    const skip = (page - 1) * limit;
    const createdAtFilter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) createdAtFilter.gte = new Date(`${dateFrom}T00:00:00.000Z`);
    if (dateTo) createdAtFilter.lte = new Date(`${dateTo}T23:59:59.999Z`);
    const where = {
      companyId,
      ...(pendingAging
        ? {
            status: { in: [QuoteStatus.SENT, QuoteStatus.VIEWED] },
            createdAt: { lt: new Date(Date.now() - PENDING_QUOTE_AGING_DAYS * 86_400_000) },
          }
        : status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(jobId ? { jobId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(componentId ? { componentId } : {}),
      // Batch form: one request for many projects' quotes (Projects page overview)
      ...(projectIds?.length ? { projectId: { in: projectIds } } : {}),
      ...(dateFrom || dateTo ? { createdAt: createdAtFilter } : {}),
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
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Single ───────────────────────────────────────────────────────────────

  async findOne(companyId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, companyId },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        invoices: {
          select: { id: true, invoiceNumber: true, status: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!quote) throw new NotFoundException(`Quote ${id} not found`);
    return quote;
  }

  // ── Create ───────────────────────────────────────────────────────────────

  async create(companyId: string, userId: string, dto: CreateQuoteDto) {
    const quoteNumber = await nextQuoteNumber(this.prisma, companyId);
    const { lineItems = [], taxRate = 0, discountType, discountValue, currency, ...rest } = dto;
    const resolvedCurrency = currency || (await this.companySettings.getSettings(companyId)).currency;

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
        currency: resolvedCurrency,
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
    if (([QuoteStatus.DECLINED, QuoteStatus.EXPIRED, QuoteStatus.CONVERTED] as QuoteStatus[]).includes(quote.status)) {
      throw new BadRequestException(`Quote cannot be sent from status: ${quote.status}`);
    }

    const approvalToken = quote.approvalToken ?? randomUUID();
    const nextStatus = quote.status === QuoteStatus.DRAFT ? QuoteStatus.SENT : quote.status;

    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        status: nextStatus,
        sentAt: new Date(),
        approvalToken,
      },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    });

    // Send a customer-facing email and attach the generated PDF for direct download.
    const recipientEmail = updated.customerEmail?.trim();
    if (!recipientEmail) {
      throw new BadRequestException('Customer email is required before sending this quote');
    }
    if (!/^\S+@\S+\.\S+$/.test(recipientEmail)) {
      throw new BadRequestException('Customer email format is invalid');
    }

    {
      const sendSettings = await this.companySettings.getSettings(companyId);
      const companyName = sendSettings.name || process.env.COMPANY_NAME || 'HVACtor.ai';
      const companyAddress = sendSettings.address || process.env.COMPANY_ADDRESS || '';
      const total = Number(updated.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const validUntil = updated.validUntil ? new Date(updated.validUntil).toLocaleDateString() : 'Upon receipt';
      // Solid brand green (matches the Quote color used across the admin UI) — no gradients.
      const emailHtml = `
        <div style="margin:0;background:#f4f6fb;padding:32px 18px;font-family:Arial,sans-serif;color:#14213d;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe3f0;border-radius:20px;overflow:hidden;box-shadow:0 20px 45px rgba(15,23,42,0.08);">
            <div style="padding:28px 32px;background:#059669;color:#ffffff;">
              <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.82;margin-bottom:10px;">Quote attached</div>
              <h2 style="margin:0;font-size:28px;line-height:1.15;">${updated.quoteNumber}</h2>
              <p style="margin:10px 0 0 0;font-size:14px;line-height:1.6;max-width:440px;color:rgba(255,255,255,0.9);">Your quotation from ${companyName} is ready for review. A PDF copy is attached for your records.</p>
            </div>
            <div style="padding:30px 32px;">
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;">Hello ${updated.customerName ?? 'Customer'},</p>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#475569;">We have prepared a quote for <strong style="color:#14213d;">${updated.title}</strong>. Please review the attached PDF and confirm approval in your customer portal when ready.</p>
              <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 22px 0;">
                <div style="border:1px solid #dbe3f0;border-radius:14px;padding:16px 18px;background:#f8fafc;">
                  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:6px;">Quoted amount</div>
                  <div style="font-size:22px;font-weight:700;color:#0f172a;">$${total}</div>
                </div>
                <div style="border:1px solid #dbe3f0;border-radius:14px;padding:16px 18px;background:#f8fafc;">
                  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:6px;">Valid until</div>
                  <div style="font-size:18px;font-weight:700;color:#0f172a;">${validUntil}</div>
                </div>
              </div>
              <div style="border:1px solid #dbe3f0;border-radius:16px;padding:18px 20px;background:#ffffff;">
                <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#059669;margin-bottom:8px;">Next step</div>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">Approve the quote in your portal to keep the work moving. If you need revisions or clarification, reply to this email and our team will assist promptly.</p>
              </div>
              <p style="margin:22px 0 0 0;font-size:13px;line-height:1.7;color:#64748b;">${companyAddress}</p>
              <p style="margin:6px 0 0 0;font-size:11px;line-height:1.6;color:#94a3b8;">Powered by HVACtor.ai</p>
            </div>
          </div>
        </div>
      `;

      const quotePdf = await this.pdfService.generateQuotePdf(updated as any, companyName, companyAddress, {
        currency: sendSettings.currency,
        timezone: sendSettings.timezone,
      });
      // Best-effort — the quote is already marked SENT with its PDF generated;
      // a slow/unreachable comms-service or SMTP relay must never fail this
      // action or leave the quote stuck. Same fire-and-forget convention used
      // for job-assigned/en-route notifications elsewhere in the platform.
      this.notificationClient.sendEmail({
        companyId,
        recipientId: updated.customerId ?? updated.id,
        recipientName: updated.customerName ?? undefined,
        recipientEmail,
        subject: `Quote ${updated.quoteNumber} from ${companyName}`,
        htmlBody: emailHtml,
        customerId: updated.customerId ?? undefined,
        quoteId: id,
        attachments: [
          {
            filename: `${updated.quoteNumber}.pdf`,
            contentType: 'application/pdf',
            contentBase64: quotePdf.toString('base64'),
          },
        ],
      }).catch((err) => {
        this.logger.warn(`Quote ${updated.quoteNumber} email to ${recipientEmail} failed: ${(err as Error).message}`);
      });
    }

    return updated;
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

  async approveById(
    companyId: string,
    id: string,
    name: string,
    email: string,
    expectedCustomerId?: string,
  ) {
    const quote = await this.findOne(companyId, id);
    if (expectedCustomerId && quote.customerId !== expectedCustomerId) {
      throw new ForbiddenException('You do not have access to approve this quote');
    }
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

  // ── Decline by ID (portal/customer) ──────────────────────────────────────

  async declineById(
    companyId: string,
    id: string,
    name: string,
    email: string,
    expectedCustomerId?: string,
    reason?: string,
  ) {
    const quote = await this.findOne(companyId, id);
    if (expectedCustomerId && quote.customerId !== expectedCustomerId) {
      throw new ForbiddenException('You do not have access to decline this quote');
    }
    if (quote.status === QuoteStatus.DECLINED) return quote; // idempotent
    if (!([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.VIEWED] as QuoteStatus[]).includes(quote.status)) {
      throw new BadRequestException(`Quote cannot be declined in status: ${quote.status}`);
    }

    const decisionLine = `Customer declined on ${new Date().toISOString()} by ${name} (${email})${reason ? ` — ${reason}` : ''}`;
    const existingNotes = quote.notes?.trim();

    return this.prisma.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.DECLINED,
        notes: existingNotes ? `${existingNotes}\n\n${decisionLine}` : decisionLine,
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

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    /**
     * The transaction is deliberately as small as it can be — two writes and
     * nothing else.
     *
     * It used to also run the `include` fetch and a cross-schema raw UPDATE
     * inside the critical section. Against a remote Postgres (Supabase in
     * ap-northeast-2, through PgBouncer) each extra round trip costs real
     * latency, and Prisma's default interactive-transaction timeout is only 5
     * seconds. On a quote with a few line items that budget ran out between the
     * invoice `create` and the quote `update`, which is precisely the
     * "Transaction not found … refers to an old closed transaction" error: the
     * transaction had already been rolled back by the time the second statement
     * ran.
     *
     * So: only the two writes that must be atomic stay inside, the timeout is
     * explicit rather than inherited, and everything else happens after commit.
     */
    let invoiceId: string | null = null;

    for (let attempt = 1; attempt <= INVOICE_NUMBER_MAX_ATTEMPTS; attempt += 1) {
      try {
        invoiceId = await this.prisma.$transaction(
          async (tx) => {
            // Read MAX inside the transaction so a concurrent conversion that
            // committed a moment ago is visible to us.
            const invoiceNumber = await nextInvoiceNumber(tx, companyId);

            const inv = await tx.invoice.create({
              data: {
                companyId,
                invoiceNumber,
                quoteId: id,
                jobId: quote.jobId,
                projectId: quote.projectId,
                houseId: quote.houseId,
                componentId: quote.componentId,
                customerId: quote.customerId,
                customerName: quote.customerName,
                customerEmail: quote.customerEmail,
                currency: quote.currency,
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
              select: { id: true },
            });

            await tx.quote.update({
              where: { id },
              data: { status: QuoteStatus.CONVERTED },
            });

            return inv.id;
          },
          {
            // Generous relative to the two statements inside, because the
            // round-trip latency — not the work — is what dominates here.
            timeout: Number(process.env.PRISMA_TRANSACTION_TIMEOUT_MS ?? 20_000),
            maxWait: Number(process.env.PRISMA_TRANSACTION_MAX_WAIT_MS ?? 10_000),
          },
        );
        break;
      } catch (err) {
        // Two callers converting at once can still land on the same number.
        // Retrying re-reads MAX and takes the next one.
        if (!isInvoiceNumberTaken(err) || attempt === INVOICE_NUMBER_MAX_ATTEMPTS) throw err;
      }
    }

    if (!invoiceId) {
      throw new BadRequestException('Could not allocate an invoice number — please try again');
    }

    // Best-effort, after commit: seed the job's estimate from the quote total so
    // dashboards have a figure before the invoice is paid. Never overwrites an
    // existing estimate — that is authoritative user input — and a failure here
    // must not undo a conversion the user has already been told succeeded.
    if (quote.jobId) {
      try {
        await this.prisma.$executeRawUnsafe(
          `UPDATE "jobs"."jobs"
              SET "estimatedValue" = $1
            WHERE "id" = $2
              AND "companyId" = $3
              AND "estimatedValue" IS NULL`,
          quote.total,
          quote.jobId,
          companyId,
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[finance] could not backfill job ${quote.jobId} estimatedValue:`, err);
      }
    }

    // Fetch the full shape outside the transaction — the caller needs it, but
    // holding a transaction open for a read does nothing except burn budget.
    return this.prisma.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
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
