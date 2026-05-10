import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuickBooksService } from './quickbooks.service';

@Injectable()
export class QuickBooksSyncService {
  private readonly logger = new Logger(QuickBooksSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly qbService: QuickBooksService,
  ) {}

  // ── Invoice sync ──────────────────────────────────────────────────────────

  async syncInvoice(invoiceId: string, companyId: string): Promise<void> {
    try {
      const auth = await this.qbService.getValidToken(companyId);
      if (!auth) return; // QB not connected for this company — silently skip

      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
      });
      if (!invoice) return;

      // Skip if already synced
      if (invoice.quickbooksId) return;

      const qbCustomerId = await this.qbService.findOrCreateQbCustomer(
        auth.token,
        auth.realmId,
        companyId,
        invoice.customerId,
        invoice.customerName,
        invoice.customerEmail,
      );

      const qbInvoiceId = await this.qbService.createQbInvoice(
        auth.token,
        auth.realmId,
        qbCustomerId,
        invoice,
      );

      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { quickbooksId: qbInvoiceId },
      });

      this.logger.log(`Invoice ${invoice.invoiceNumber} → QB Invoice ${qbInvoiceId}`);
    } catch (err) {
      this.logger.warn(`QB invoice sync failed [${invoiceId}]: ${(err as Error).message}`);
    }
  }

  // ── Payment sync ──────────────────────────────────────────────────────────

  async syncPayment(paymentId: string, companyId: string): Promise<void> {
    try {
      const auth = await this.qbService.getValidToken(companyId);
      if (!auth) return;

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { invoice: { include: { lineItems: true } } },
      });
      if (!payment) return;

      // Skip already synced payments
      if (payment.quickbooksId) return;

      // Ensure the invoice is synced first
      if (!payment.invoice.quickbooksId) {
        await this.syncInvoice(payment.invoiceId, companyId);
        // Re-fetch to get updated quickbooksId
        const updated = await this.prisma.invoice.findUnique({ where: { id: payment.invoiceId } });
        if (!updated?.quickbooksId) return; // invoice sync failed — skip payment too
        payment.invoice.quickbooksId = updated.quickbooksId;
      }

      const qbCustomerId = await this.qbService.findOrCreateQbCustomer(
        auth.token,
        auth.realmId,
        companyId,
        payment.invoice.customerId,
        payment.invoice.customerName,
        payment.invoice.customerEmail,
      );

      const qbPaymentId = await this.qbService.createQbPayment(
        auth.token,
        auth.realmId,
        qbCustomerId,
        payment.invoice.quickbooksId!,
        Number(payment.amount),
      );

      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { quickbooksId: qbPaymentId },
      });

      this.logger.log(`Payment ${paymentId} ($${payment.amount}) → QB Payment ${qbPaymentId}`);
    } catch (err) {
      this.logger.warn(`QB payment sync failed [${paymentId}]: ${(err as Error).message}`);
    }
  }

  // ── Void sync ─────────────────────────────────────────────────────────────

  async syncVoid(invoiceId: string, companyId: string): Promise<void> {
    try {
      const auth = await this.qbService.getValidToken(companyId);
      if (!auth) return;

      const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice?.quickbooksId) return; // not synced to QB — nothing to void

      await this.qbService.voidQbInvoice(auth.token, auth.realmId, invoice.quickbooksId);
      this.logger.log(`Invoice ${invoice.invoiceNumber} voided in QB`);
    } catch (err) {
      this.logger.warn(`QB void sync failed [${invoiceId}]: ${(err as Error).message}`);
    }
  }
}
