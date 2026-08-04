/**
 * InvoicesService
 * Handles invoice CRUD, status transitions, Stripe payment-intent creation,
 * and Stripe webhook processing (payment_intent.succeeded / payment_intent.payment_failed).
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { isFeatureEnabled } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { NotificationClientService } from '../notification-client/notification-client.service';
import { DocumentTemplateClient } from '../document-templates/document-template.client';
import { QuickBooksSyncService } from '../quickbooks/quickbooks-sync.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceStatus, PaymentStatus } from '../prisma/generated';

// ── Status transitions ────────────────────────────────────────────────────
const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT:          [InvoiceStatus.SENT],
  SENT:           [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.VOID],
  PARTIALLY_PAID: [InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.VOID],
  PAID:           [],
  OVERDUE:        [InvoiceStatus.PAID, InvoiceStatus.VOID],
  VOID:           [],
};

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly pdfService: PdfService,
    private readonly notificationClient: NotificationClientService,
    private readonly companySettings: CompanySettingsClient,
    private readonly documentTemplates: DocumentTemplateClient,
    @Optional() private readonly qbSync: QuickBooksSyncService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('stripe.secretKey') ?? '', {
      apiVersion: '2023-10-16',
    });
  }

  // ── List ─────────────────────────────────────────────────────────────────

  async findAll(
    companyId: string,
    params: {
      status?: InvoiceStatus;
      customerId?: string;
      jobId?: string;
      projectId?: string;
      projectIds?: string[];
      houseId?: string;
      page?: number;
      limit?: number;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const { status, customerId, jobId, projectId, projectIds, houseId, dateFrom, dateTo } = params;
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
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(jobId ? { jobId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(houseId ? { houseId } : {}),
      // Batch form: one request for many projects' invoices (Projects page overview)
      ...(projectIds?.length ? { projectId: { in: projectIds } } : {}),
      ...(dateFrom || dateTo ? { createdAt: createdAtFilter } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { lineItems: true, payments: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Single ────────────────────────────────────────────────────────────────

  async findOne(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        quote: { select: { quoteNumber: true } },
        recurringSchedule: true,
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(companyId: string, userId: string, dto: CreateInvoiceDto) {
    const { lineItems = [], taxRate = 0, dueDate, dueDays = 30, ...rest } = dto;
    // Default customer name/email when not provided (e.g. when creating from a quote reference)
    const customerName = rest.customerName ?? 'Unknown Customer';
    const customerEmail = rest.customerEmail ?? 'noreply@example.com';

    const subtotal = lineItems.reduce((acc, li) => acc + li.quantity * li.unitPrice, 0);
    const taxableSubtotal = lineItems
      .filter((li) => li.taxable !== false)
      .reduce((acc, li) => acc + li.quantity * li.unitPrice, 0);
    const taxAmount = taxableSubtotal * taxRate;
    const total = subtotal + taxAmount;

    const computedDueDate = dueDate
      ? new Date(dueDate)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + dueDays);
          return d;
        })();

    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({ where: { companyId } });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await this.prisma.invoice.create({
      data: {
        ...rest,
        customerName,
        customerEmail,
        companyId,
        invoiceNumber,
        createdByUserId: userId,
        subtotal,
        discountAmount: 0,
        taxRate,
        taxAmount,
        total,
        balanceDue: total,
        amountPaid: 0,
        dueDays,
        dueDate: computedDueDate,
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
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payments: true,
        quote: { select: { quoteNumber: true } },
      },
    });

    // Fire-and-forget QB sync — never blocks or throws
    this.qbSync?.syncInvoice(invoice.id, companyId).catch((err: Error) =>
      this.logger.warn(`QB sync skipped for invoice ${invoice.id}: ${err.message}`),
    );

    return invoice;
  }

  // ── Update status ─────────────────────────────────────────────────────────

  async updateStatus(companyId: string, id: string, status: InvoiceStatus) {
    const invoice = await this.findOne(companyId, id);
    const allowed = INVOICE_TRANSITIONS[invoice.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition invoice from ${invoice.status} to ${status}`,
      );
    }
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status,
        sentAt: status === InvoiceStatus.SENT ? new Date() : undefined,
        paidAt: status === InvoiceStatus.PAID ? new Date() : undefined,
        voidedAt: status === InvoiceStatus.VOID ? new Date() : undefined,
      },
    });
  }

  // ── Customer decision actions (portal) ───────────────────────────────────

  async approveByCustomer(
    companyId: string,
    id: string,
    customerName: string,
    customerEmail: string,
  ) {
    const invoice = await this.findOne(companyId, id);
    if (([InvoiceStatus.VOID, InvoiceStatus.PAID] as InvoiceStatus[]).includes(invoice.status)) {
      throw new BadRequestException(`Invoice cannot be approved in status: ${invoice.status}`);
    }

    const now = new Date();
    const decisionLine = `Customer approved on ${now.toISOString()} by ${customerName} (${customerEmail})`;
    const existingNotes = invoice.notes?.trim();

    return this.prisma.invoice.update({
      where: { id },
      data: {
        approvedAt: now,
        approvedByName: customerName,
        approvedByEmail: customerEmail,
        // Clear any prior decline so the record reflects the latest customer action
        declinedAt: null,
        declinedByName: null,
        declinedByEmail: null,
        declineReason: null,
        notes: existingNotes ? `${existingNotes}\n\n${decisionLine}` : decisionLine,
      },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        quote: { select: { quoteNumber: true } },
      },
    });
  }

  async declineByCustomer(
    companyId: string,
    id: string,
    customerName: string,
    customerEmail: string,
    reason?: string,
  ) {
    const invoice = await this.findOne(companyId, id);
    if (([InvoiceStatus.VOID, InvoiceStatus.PAID] as InvoiceStatus[]).includes(invoice.status)) {
      throw new BadRequestException(`Invoice cannot be declined in status: ${invoice.status}`);
    }

    const now = new Date();
    const decisionLine = `Customer declined on ${now.toISOString()} by ${customerName} (${customerEmail})${reason ? ` — ${reason}` : ''}`;
    const existingNotes = invoice.notes?.trim();

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.VOID,
        voidedAt: now,
        declinedAt: now,
        declinedByName: customerName,
        declinedByEmail: customerEmail,
        declineReason: reason ?? null,
        notes: existingNotes ? `${existingNotes}\n\n${decisionLine}` : decisionLine,
      },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        quote: { select: { quoteNumber: true } },
      },
    });
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  async send(companyId: string, id: string) {
    const invoice = await this.findOne(companyId, id);
    if (invoice.status === InvoiceStatus.VOID) {
      throw new BadRequestException('Cannot send a VOID invoice');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: invoice.status === InvoiceStatus.DRAFT ? InvoiceStatus.SENT : invoice.status,
        sentAt: new Date(),
      },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        quote: { select: { quoteNumber: true } },
      },
    });

    // Send a concise billing email and attach the invoice PDF for download.
    const recipientEmail = updated.customerEmail?.trim();
    if (!recipientEmail) {
      throw new BadRequestException('Customer email is required before sending this invoice');
    }
    if (!/^\S+@\S+\.\S+$/.test(recipientEmail)) {
      throw new BadRequestException('Customer email format is invalid');
    }

    {
      const sendSettings = await this.companySettings.getSettings(companyId);
      const companyName = sendSettings.name || process.env.COMPANY_NAME || 'HVACtor.ai';
      const companyAddress = sendSettings.address || process.env.COMPANY_ADDRESS || '';
      const total = Number(updated.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const dueDate = updated.dueDate ? new Date(updated.dueDate).toLocaleDateString() : '—';
      // Solid brand blue (matches the Invoice color used across the admin UI) — no gradients.
      const emailHtml = `
        <div style="margin:0;background:#f4f6fb;padding:32px 18px;font-family:Arial,sans-serif;color:#14213d;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe3f0;border-radius:20px;overflow:hidden;box-shadow:0 20px 45px rgba(15,23,42,0.08);">
            <div style="padding:28px 32px;background:#2563EB;color:#ffffff;">
              <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.82;margin-bottom:10px;">Invoice attached</div>
              <h2 style="margin:0;font-size:28px;line-height:1.15;">${updated.invoiceNumber}</h2>
              <p style="margin:10px 0 0 0;font-size:14px;line-height:1.6;max-width:460px;color:rgba(255,255,255,0.9);">Your invoice from ${companyName} is ready. A PDF copy is attached for your records and payment processing.</p>
            </div>
            <div style="padding:30px 32px;">
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;">Hello ${updated.customerName ?? 'Customer'},</p>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#475569;">Please find your invoice attached. The PDF is formatted for accounting records and vendor reconciliation.</p>
              <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 22px 0;">
                <div style="border:1px solid #dbe3f0;border-radius:14px;padding:16px 18px;background:#f8fafc;">
                  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:6px;">Invoice total</div>
                  <div style="font-size:22px;font-weight:700;color:#0f172a;">$${total}</div>
                </div>
                <div style="border:1px solid #dbe3f0;border-radius:14px;padding:16px 18px;background:#f8fafc;">
                  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:6px;">Due date</div>
                  <div style="font-size:18px;font-weight:700;color:#0f172a;">${dueDate}</div>
                </div>
              </div>
              <div style="border:1px solid #dbe3f0;border-radius:16px;padding:18px 20px;background:#ffffff;">
                <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#2563EB;margin-bottom:8px;">Payment</div>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">Use your customer portal to pay securely online or reply to this email if you need clarification on any line item.</p>
              </div>
              <p style="margin:22px 0 0 0;font-size:13px;line-height:1.7;color:#64748b;">${companyAddress}</p>
              <p style="margin:6px 0 0 0;font-size:11px;line-height:1.6;color:#94a3b8;">Powered by HVACtor.ai</p>
            </div>
          </div>
        </div>
      `;

      const invoicePdf = await this.pdfService.generateInvoicePdf(updated as any, companyName, companyAddress, {
        currency: sendSettings.currency,
        timezone: sendSettings.timezone,
      });
      // Best-effort — the invoice is already marked SENT with its PDF generated;
      // a slow/unreachable comms-service or SMTP relay must never fail this
      // action or leave the invoice stuck. Same fire-and-forget convention used
      // for job-assigned/en-route notifications elsewhere in the platform.
      this.notificationClient.sendEmail({
        companyId,
        recipientId: updated.customerId ?? updated.id,
        recipientName: updated.customerName ?? undefined,
        recipientEmail,
        subject: `Invoice ${updated.invoiceNumber} from ${companyName}`,
        htmlBody: emailHtml,
        customerId: updated.customerId ?? undefined,
        invoiceId: id,
        attachments: [
          {
            filename: `${updated.invoiceNumber}.pdf`,
            contentType: 'application/pdf',
            contentBase64: invoicePdf.toString('base64'),
          },
        ],
      }).catch((err) => {
        this.logger.warn(`Invoice ${updated.invoiceNumber} email to ${recipientEmail} failed: ${(err as Error).message}`);
      });
    }

    return updated;
  }

  // ── Create Stripe Checkout Session ───────────────────────────────────────

  async createPaymentIntent(companyId: string, id: string) {
    const settings = await this.companySettings.getSettings(companyId);
    if (!isFeatureEnabled(settings.features, 'onlinePayments')) {
      throw new ForbiddenException('Online payments are not enabled for this company');
    }

    const invoice = await this.findOne(companyId, id);
    if (([InvoiceStatus.PAID, InvoiceStatus.VOID] as InvoiceStatus[]).includes(invoice.status)) {
      throw new BadRequestException(`Invoice is ${invoice.status} — cannot create payment intent`);
    }

    const balanceDue = parseFloat(invoice.balanceDue.toString());
    if (balanceDue <= 0) throw new BadRequestException('Invoice has no balance due');

    const amountCents = Math.round(balanceDue * 100);
    const portalUrl =
      process.env.CUSTOMER_PORTAL_URL ??
      this.config.get<string>('app.frontendUrl') ??
      'https://tscrm-demo-customer.web.app';

    // Create a Stripe Checkout Session (hosted, no orphan PaymentIntent).
    // payment_intent_data.metadata carries invoiceId into the PaymentIntent
    // that Stripe creates when the customer pays, so the webhook can correlate.
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Invoice ${invoice.invoiceNumber}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ] as any,
      payment_intent_data: {
        metadata: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, companyId },
        description: `Invoice ${invoice.invoiceNumber} — ${invoice.customerName}`,
      },
      metadata: { invoiceId: invoice.id },
      success_url: `${portalUrl}/invoices?payment=success`,
      cancel_url: `${portalUrl}/invoices?payment=cancelled`,
      customer_email: invoice.customerEmail ?? undefined,
    });

    await this.prisma.invoice.update({
      where: { id },
      data: { stripePaymentUrl: session.url },
    });

    return {
      clientSecret: null,
      paymentIntentId: session.id,
      paymentUrl: session.url,
    };
  }

  // ── Stripe Webhook ────────────────────────────────────────────────────────

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('stripe.webhookSecret') ?? '';

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${(err as Error).message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'checkout.session.completed': {
        // Fired when customer pays via a Stripe PaymentLink (hosted page).
        // The session's payment_intent carries invoiceId in its metadata.
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_intent && typeof session.payment_intent === 'string') {
          const intent = await this.stripe.paymentIntents.retrieve(session.payment_intent);
          await this.handlePaymentSucceeded(intent);
        }
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }

  // ── Stripe event handlers ─────────────────────────────────────────────────

  private async handlePaymentSucceeded(intent: Stripe.PaymentIntent) {
    const invoiceId = intent.metadata?.invoiceId;
    if (!invoiceId) return;

    // Idempotency guard — both payment_intent.succeeded and checkout.session.completed
    // fire for the same payment; only process once.
    const alreadyProcessed = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: intent.id, status: PaymentStatus.SUCCEEDED },
    });
    if (alreadyProcessed) {
      this.logger.debug(`Payment for intent ${intent.id} already recorded — skipping duplicate`);
      return;
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) return;

    const paidAmount = intent.amount_received / 100;
    const totalPaid = parseFloat(invoice.amountPaid.toString()) + paidAmount;
    const balanceDue = Math.max(0, parseFloat(invoice.total.toString()) - totalPaid);
    const newStatus = balanceDue === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

    const [stripePayment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          companyId: invoice.companyId,
          invoiceId: invoice.id,
          amount: paidAmount,
          paymentMethod: 'CARD',
          status: PaymentStatus.SUCCEEDED,
          stripePaymentIntentId: intent.id,
          stripeChargeId: (intent.latest_charge as string) ?? null,
          paidAt: new Date(),
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: totalPaid,
          balanceDue,
          status: newStatus,
          paidAt: newStatus === InvoiceStatus.PAID ? new Date() : undefined,
        },
      }),
    ]);

    // Fire-and-forget QB sync for the Stripe payment
    this.qbSync?.syncPayment(stripePayment.id, invoice.companyId).catch((err: Error) =>
      this.logger.warn(`QB sync skipped for Stripe payment ${stripePayment.id}: ${err.message}`),
    );

    this.logger.log(`Invoice ${invoice.invoiceNumber} — payment of $${paidAmount} succeeded`);
  }

  private async handlePaymentFailed(intent: Stripe.PaymentIntent) {
    const invoiceId = intent.metadata?.invoiceId;
    if (!invoiceId) return;

    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return;

    await this.prisma.payment.create({
      data: {
        companyId: invoice.companyId,
        invoiceId: invoice.id,
        amount: intent.amount / 100,
        paymentMethod: 'CARD',
        status: PaymentStatus.FAILED,
        stripePaymentIntentId: intent.id,
      },
    });

    this.logger.warn(`Invoice ${invoice.invoiceNumber} — payment failed`);
  }

  // ── Mark overdue (batch job / cron) ──────────────────────────────────────

  async markOverdueInvoices() {
    const result = await this.prisma.invoice.updateMany({
      where: {
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
        dueDate: { lt: new Date() },
      },
      data: { status: InvoiceStatus.OVERDUE },
    });
    this.logger.log(`Marked ${result.count} invoice(s) as OVERDUE`);
    return result;
  }

  // ── Record manual payment ─────────────────────────────────────────────────

  async recordManualPayment(
    companyId: string,
    invoiceId: string,
    amount: number,
    method: string,
    notes?: string,
  ) {
    const invoice = await this.findOne(companyId, invoiceId);
    if (([InvoiceStatus.PAID, InvoiceStatus.VOID] as InvoiceStatus[]).includes(invoice.status)) {
      throw new BadRequestException(`Invoice is ${invoice.status}`);
    }

    const totalPaid = parseFloat(invoice.amountPaid.toString()) + amount;
    const balanceDue = Math.max(0, parseFloat(invoice.total.toString()) - totalPaid);
    const newStatus = balanceDue === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;
    const paidAt = new Date();

    // Every payment gets a receipt number at the moment it's recorded — this is
    // the customer's (and the company's own) proof the money was received, so
    // it needs to exist and be numbered even before the PDF/email step below.
    const receiptYear = paidAt.getFullYear();
    const receiptCount = await this.prisma.payment.count({ where: { companyId } });
    const receiptNumber = `RCPT-${receiptYear}-${String(receiptCount + 1).padStart(4, '0')}`;

    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          companyId,
          invoiceId,
          amount,
          paymentMethod: method as any,
          status: PaymentStatus.SUCCEEDED,
          paidAt,
          notes,
          receiptNumber,
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: totalPaid,
          balanceDue,
          status: newStatus,
          paidAt: newStatus === InvoiceStatus.PAID ? new Date() : undefined,
        },
      }),
    ]);

    // Fire-and-forget QB sync
    this.qbSync?.syncPayment(payment.id, companyId).catch((err: Error) =>
      this.logger.warn(`QB sync skipped for payment ${payment.id}: ${err.message}`),
    );

    // Fire-and-forget: generate the receipt PDF and email it to the customer —
    // proof of payment for both sides. Never blocks the payment from being
    // recorded if PDF rendering or comms-service is slow/unavailable (same
    // best-effort convention as the invoice/quote "send" email).
    this.sendPaymentReceipt(companyId, invoice, {
      amount, method, notes, paidAt, receiptNumber, balanceDue,
    }).catch((err) => {
      this.logger.warn(`Payment receipt ${receiptNumber} failed for invoice ${invoice.invoiceNumber}: ${(err as Error).message}`);
    });

    return [payment];
  }

  /** Generates the payment-receipt PDF and emails it to the customer. Best-effort — see caller. */
  private async sendPaymentReceipt(
    companyId: string,
    invoice: { id: string; invoiceNumber: string; total: unknown; customerId?: string | null; customerName?: string | null; customerEmail?: string | null },
    payment: { amount: number; method: string; notes?: string; paidAt: Date; receiptNumber: string; balanceDue: number },
  ): Promise<void> {
    const recipientEmail = invoice.customerEmail?.trim();
    if (!recipientEmail) return;

    const settings = await this.companySettings.getSettings(companyId);
    const companyName = settings.name || process.env.COMPANY_NAME || 'HVACtor.ai';
    const companyAddress = settings.address || process.env.COMPANY_ADDRESS || '';
    const template = await this.documentTemplates.resolve(companyId, 'PAYMENT_RECEIPT');

    const receiptPdf = await this.pdfService.generatePaymentReceiptPdf(
      {
        receiptNumber: payment.receiptNumber,
        amount: payment.amount,
        paymentMethod: payment.method,
        paidAt: payment.paidAt,
        notes: payment.notes,
        customerName: invoice.customerName ?? 'Customer',
        customerEmail: recipientEmail,
        invoiceNumber: invoice.invoiceNumber,
        invoiceTotal: invoice.total as any,
        balanceDue: payment.balanceDue,
      },
      companyName,
      companyAddress,
      { currency: settings.currency, timezone: settings.timezone },
      template,
    );

    const amountFmt = payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // Solid brand green (paid/success convention used across the admin UI) — no gradients.
    const emailHtml = `
      <div style="margin:0;background:#f4f6fb;padding:32px 18px;font-family:Arial,sans-serif;color:#14213d;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe3f0;border-radius:20px;overflow:hidden;box-shadow:0 20px 45px rgba(15,23,42,0.08);">
          <div style="padding:28px 32px;background:#059669;color:#ffffff;">
            <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.82;margin-bottom:10px;">Payment received</div>
            <h2 style="margin:0;font-size:26px;line-height:1.15;">${payment.receiptNumber}</h2>
            <p style="margin:10px 0 0 0;font-size:14px;line-height:1.6;max-width:460px;color:rgba(255,255,255,0.9);">Thank you — we've received your payment of $${amountFmt}. A PDF receipt is attached for your records.</p>
          </div>
          <div style="padding:30px 32px;">
            <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;">Hello ${invoice.customerName ?? 'Customer'},</p>
            <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#475569;">This confirms your payment against invoice <strong>${invoice.invoiceNumber}</strong>. Keep the attached PDF as proof of payment.</p>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 22px 0;">
              <div style="border:1px solid #dbe3f0;border-radius:14px;padding:16px 18px;background:#f0fdf4;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:6px;">Amount paid</div>
                <div style="font-size:22px;font-weight:700;color:#059669;">$${amountFmt}</div>
              </div>
              <div style="border:1px solid #dbe3f0;border-radius:14px;padding:16px 18px;background:#f8fafc;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:6px;">${payment.balanceDue > 0 ? 'Balance remaining' : 'Status'}</div>
                <div style="font-size:18px;font-weight:700;color:#0f172a;">${payment.balanceDue > 0 ? `$${payment.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Paid in full'}</div>
              </div>
            </div>
            <p style="margin:22px 0 0 0;font-size:13px;line-height:1.7;color:#64748b;">${companyAddress}</p>
            <p style="margin:6px 0 0 0;font-size:11px;line-height:1.6;color:#94a3b8;">Powered by HVACtor.ai</p>
          </div>
        </div>
      </div>
    `;

    await this.notificationClient.sendEmail({
      companyId,
      recipientId: invoice.customerId ?? invoice.id,
      recipientName: invoice.customerName ?? undefined,
      recipientEmail,
      customerId: invoice.customerId ?? undefined,
      invoiceId: invoice.id,
      subject: `Payment receipt ${payment.receiptNumber} — ${companyName}`,
      htmlBody: emailHtml,
      attachments: [
        {
          filename: `${payment.receiptNumber}.pdf`,
          contentType: 'application/pdf',
          contentBase64: receiptPdf.toString('base64'),
        },
      ],
    });
  }

  // ── Void ─────────────────────────────────────────────────────────────────

  async voidInvoice(companyId: string, id: string) {
    const invoice = await this.findOne(companyId, id);
    if (invoice.status === InvoiceStatus.VOID) return invoice;
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot void a paid invoice');
    }
    const voided = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.VOID, voidedAt: new Date() },
    });

    // Fire-and-forget QB void sync
    this.qbSync?.syncVoid(id, companyId).catch((err: Error) =>
      this.logger.warn(`QB void sync skipped for invoice ${id}: ${err.message}`),
    );

    return voided;
  }
}
