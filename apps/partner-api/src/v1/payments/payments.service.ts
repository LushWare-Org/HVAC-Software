import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ServiceClient } from '../../internal/service-client.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SANDBOX_NOTICE } from '../../sandbox/sandbox';
const NOT_YET_PAYABLE = new Set(['DRAFT']);
const ALREADY_SETTLED = new Set(['PAID', 'VOID', 'CANCELLED', 'WRITTEN_OFF']);

/** How long a partner-created customer is treated as unvetted. */
const NEW_CUSTOMER_COOLING_HOURS = 24;

export interface PaymentLinkResult {
  paymentUrl: string;
  invoiceId: string;
  invoiceNumber: string | null;
  amountDue: number;
  sentTo?: string;
  channel?: 'sms' | 'email';
  simulated?: boolean;
  notice?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly services: ServiceClient,
    private readonly prisma: PrismaService,
  ) {}

  async createLink(
    companyId: string,
    input: {
      customerId: string;
      invoiceId: string;
      send?: 'sms' | 'email';
    },
    sandbox = false,
  ): Promise<PaymentLinkResult> {
    await this.assertCustomerIsNotBrandNew(companyId, input.customerId);

    const invoice = await this.loadInvoice(companyId, input.invoiceId);

    // Same isolation rule as document sending: a real invoice id plus someone
    // else's customer id must not produce a payable link.
    if (invoice.customerId && invoice.customerId !== input.customerId) {
      throw new BadRequestException('That invoice does not belong to this customer');
    }

    const status = String(invoice.status).toUpperCase();
    if (ALREADY_SETTLED.has(status)) {
      throw new BadRequestException(
        `Invoice ${invoice.invoiceNumber ?? ''} is already ${status.toLowerCase()} — nothing to pay`.trim(),
      );
    }
    if (NOT_YET_PAYABLE.has(status)) {
      throw new BadRequestException(
        'That invoice has not been issued yet — the office needs to send it before it can be paid',
      );
    }

    const balanceDue = Number(invoice.balanceDue ?? invoice.total ?? 0);
    if (balanceDue <= 0) {
      throw new BadRequestException('Invoice has no balance due');
    }

    // Every guard above has already run. A sandbox key gets a link that is
    // obviously not payable, rather than a live Stripe checkout session.
    if (sandbox) {
      return {
        paymentUrl: `https://sandbox.invalid/pay/${input.invoiceId}`,
        invoiceId: input.invoiceId,
        invoiceNumber: invoice.invoiceNumber ?? null,
        amountDue: Math.round(balanceDue * 100) / 100,
        simulated: true,
        notice: SANDBOX_NOTICE,
        ...(input.send ? { channel: input.send, sentTo: '••••sandbox' } : {}),
      };
    }

    let link: any;
    try {
      link = await this.services.post<any>(
        'finance',
        `/invoices/${input.invoiceId}/payment-intent`,
        companyId,
      );
    } catch (err: any) {
      // Online payments being switched off is a business answer, not a fault —
      // pass it through so the agent can say so plainly.
      if (err?.response?.status === 403) {
        throw new ForbiddenException(
          'Online payments are not enabled for this company — offer to have the office call back',
        );
      }
      throw err;
    }

    const paymentUrl = link?.paymentUrl ?? link?.url;
    if (!paymentUrl) {
      throw new BadRequestException('Payment provider did not return a link');
    }

    const result: PaymentLinkResult = {
      paymentUrl,
      invoiceId: input.invoiceId,
      invoiceNumber: invoice.invoiceNumber ?? null,
      amountDue: Math.round(balanceDue * 100) / 100,
    };

    if (input.send) {
      const delivery = await this.sendLink(
        companyId,
        input.customerId,
        invoice,
        paymentUrl,
        balanceDue,
        input.send,
      );
      result.sentTo = delivery.sentTo;
      result.channel = input.send;
    }

    this.logger.log(
      `Payment link created for invoice ${input.invoiceId} (company ${companyId})`,
    );
    return result;
  }

  // ------------------------------------------------------------------
  // Guards
  // ------------------------------------------------------------------

  /**
   * A customer the agent itself created minutes ago is unvetted — their name,
   * address and number are whatever the caller said. Refuse to take money from
   * that record until a human has been near it.
   */
  private async assertCustomerIsNotBrandNew(companyId: string, customerId: string) {
    const hours = Number(
      process.env.PARTNER_NEW_CUSTOMER_PAYMENT_HOLD_HOURS ?? NEW_CUSTOMER_COOLING_HOURS,
    );
    if (hours <= 0) return;

    const since = new Date(Date.now() - hours * 3_600_000);
    const recent = await this.prisma.partnerNewCallerBooking.count({
      where: { companyId, customerId, createdAt: { gte: since } },
    });

    if (recent > 0) {
      throw new BadRequestException(
        'This customer record was created on this call and has not been verified yet — ' +
          'the office will follow up about payment',
      );
    }
  }

  private async loadInvoice(companyId: string, invoiceId: string) {
    try {
      return await this.services.get<any>(
        'finance',
        `/invoices/${invoiceId}`,
        companyId,
      );
    } catch {
      throw new NotFoundException('Invoice not found');
    }
  }

  // ------------------------------------------------------------------
  // Delivery
  // ------------------------------------------------------------------

  private async sendLink(
    companyId: string,
    customerId: string,
    invoice: any,
    paymentUrl: string,
    balanceDue: number,
    channel: 'sms' | 'email',
  ): Promise<{ sentTo: string }> {
    const customer = await this.services.get<any>(
      'crm',
      `/customers/${customerId}`,
      companyId,
    );

    const amount = balanceDue.toFixed(2);
    const label = invoice.invoiceNumber ? `invoice ${invoice.invoiceNumber}` : 'your invoice';

    if (channel === 'sms') {
      const phone = customer.mobile ?? customer.phone;
      if (!phone) {
        throw new BadRequestException(
          'No phone number on file for this customer — offer email instead',
        );
      }
      await this.services.post('comms', '/notifications/sms', companyId, {
        recipientId: customer.id,
        recipientName: `${customer.firstName} ${customer.lastName}`.trim(),
        // From the customer record, never from the request.
        recipientPhone: phone,
        body: `${customer.firstName}, here is a secure link to pay ${label} ($${amount}): ${paymentUrl}`,
        customerId: customer.id,
        invoiceId: invoice.id,
      });
      return { sentTo: this.maskPhone(phone) };
    }

    if (!customer.email) {
      throw new BadRequestException(
        'No email address on file for this customer — offer SMS instead',
      );
    }
    await this.services.post('comms', '/notifications/email', companyId, {
      recipientId: customer.id,
      recipientName: `${customer.firstName} ${customer.lastName}`.trim(),
      recipientEmail: customer.email,
      subject: `Payment link for ${label}`,
      htmlBody: [
        `<p>Hi ${customer.firstName},</p>`,
        `<p>As discussed on the phone, here is a secure link to pay ${label} for <strong>$${amount}</strong>.</p>`,
        `<p><a href="${paymentUrl}">Pay now</a></p>`,
        `<p>This link is specific to your invoice — please don't forward it.</p>`,
      ].join(''),
      customerId: customer.id,
      invoiceId: invoice.id,
    });
    return { sentTo: this.maskEmail(customer.email) };
  }

  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.length <= 4 ? '****' : `••••${digits.slice(-4)}`;
  }

  private maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!domain) return '••••';
    return `${name.slice(0, 1)}${'•'.repeat(Math.max(2, name.length - 1))}@${domain}`;
  }
}
