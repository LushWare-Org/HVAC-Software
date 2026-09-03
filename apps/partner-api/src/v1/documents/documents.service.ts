import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ServiceClient, unwrapList } from '../../internal/service-client.service';
import { SANDBOX_NOTICE } from '../../sandbox/sandbox';

export type DocumentType = 'invoice' | 'quote';
export type SendChannel = 'sms' | 'email';

export interface SendResult {
  sent: true;
  channel: SendChannel;
  /** Masked, so an agent can confirm delivery without reading it out in full. */
  sentTo: string;
  documentType: DocumentType;
  documentId: string;
  /** Email only — false when the PDF could not be rendered in time. */
  attachmentIncluded?: boolean;
  /** Present on sandbox keys: the message was validated but not delivered. */
  simulated?: boolean;
  notice?: string;
}

/** Invoice states that still owe money — what an agent should talk about. */
const SETTLED_INVOICE = new Set(['PAID', 'VOID', 'CANCELLED', 'WRITTEN_OFF']);
/** Never sent to the customer, so never part of what they owe. */
const NOT_YET_BILLED = new Set(['DRAFT']);
/** Quote states a customer can still act on. */
const OPEN_QUOTE = new Set(['DRAFT', 'SENT', 'PENDING', 'VIEWED']);

/**
 * Reading documents out on a call, and putting them in the customer's hand.
 *
 * The governing rule: the agent never chooses a recipient. It names a customer
 * and a document; the phone number and email address come from the customer
 * record. A compromised partner key therefore cannot be used to send anything
 * to an arbitrary address.
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly services: ServiceClient) {}

  // ------------------------------------------------------------------
  // Reading
  // ------------------------------------------------------------------

  async listInvoices(companyId: string, customerId: string, openOnly: boolean) {
    const payload = await this.services.get('finance', '/invoices', companyId, {
      customerId,
      limit: 50,
    });
    const all = unwrapList<any>(payload).map((i) => ({
      id: i.id,
      number: i.invoiceNumber ?? null,
      status: i.status,
      // Decimal(10,2) arrives as a string; dollars end to end.
      total: Number(i.total ?? 0),
      balanceDue: Number(i.balanceDue ?? i.total ?? 0),
      dueDate: i.dueDate ?? null,
      isSettled: SETTLED_INVOICE.has(String(i.status).toUpperCase()),
      /** Draft — the customer has not been billed for this yet. */
      isDraft: NOT_YET_BILLED.has(String(i.status).toUpperCase()),
    }));

    // "Open" means payable: not settled, and actually issued.
    const payable = all.filter((i) => !i.isSettled && !i.isDraft);
    return {
      invoices: openOnly ? payable : all,
      totalOutstanding:
        Math.round(payable.reduce((s, i) => s + i.balanceDue, 0) * 100) / 100,
    };
  }

  async listQuotes(companyId: string, customerId: string, openOnly: boolean) {
    const payload = await this.services.get('finance', '/quotes', companyId, {
      customerId,
      limit: 50,
    });
    const all = unwrapList<any>(payload).map((q) => ({
      id: q.id,
      number: q.quoteNumber ?? null,
      status: q.status,
      total: Number(q.total ?? 0),
      validUntil: q.validUntil ?? q.expiresAt ?? null,
      isOpen: OPEN_QUOTE.has(String(q.status).toUpperCase()),
    }));

    return { quotes: openOnly ? all.filter((q) => q.isOpen) : all };
  }

  // ------------------------------------------------------------------
  // Sending
  // ------------------------------------------------------------------

  async send(
    companyId: string,
    input: {
      customerId: string;
      documentType: DocumentType;
      documentId: string;
      channel: SendChannel;
    },
    sandbox = false,
  ): Promise<SendResult> {
    const customer = await this.loadCustomer(companyId, input.customerId);
    const doc = await this.loadDocument(
      companyId,
      input.documentType,
      input.documentId,
    );

    // The document must belong to the customer the agent named. Without this,
    // a valid document id plus any customer id would leak one customer's
    // invoice to another.
    if (doc.customerId && doc.customerId !== input.customerId) {
      throw new BadRequestException(
        'That document does not belong to this customer',
      );
    }

    return input.channel === 'sms'
      ? this.sendBySms(companyId, customer, input.documentType, doc, sandbox)
      : this.sendByEmail(companyId, customer, input.documentType, doc, sandbox);
  }

  private async sendBySms(
    companyId: string,
    customer: any,
    type: DocumentType,
    doc: any,
    sandbox: boolean,
  ): Promise<SendResult> {
    const phone = customer.mobile ?? customer.phone;
    if (!phone) {
      throw new BadRequestException(
        'No phone number on file for this customer — offer email instead',
      );
    }

    const label = this.documentLabel(type, doc);
    const body =
      type === 'invoice'
        ? `${customer.firstName}, here is ${label} for $${Number(doc.balanceDue ?? doc.total ?? 0).toFixed(2)}. View or pay: ${this.portalLink(type, doc.id)}`
        : `${customer.firstName}, here is ${label} for $${Number(doc.total ?? 0).toFixed(2)}. View it here: ${this.portalLink(type, doc.id)}`;

    // Every check above has already run, so a sandbox call fails wherever a
    // live one would. Only the delivery itself is withheld.
    if (sandbox) {
      return {
        sent: true,
        channel: 'sms' as const,
        sentTo: this.maskPhone(phone),
        documentType: type,
        documentId: doc.id,
        simulated: true,
        notice: SANDBOX_NOTICE,
      };
    }

    await this.services.post('comms', '/notifications/sms', companyId, {
      recipientId: customer.id,
      recipientName: `${customer.firstName} ${customer.lastName}`.trim(),
      // Taken from the customer record, never from the request.
      recipientPhone: phone,
      body,
      customerId: customer.id,
      ...(type === 'invoice' ? { invoiceId: doc.id } : {}),
    });

    return {
      sent: true,
      channel: 'sms' as const,
      sentTo: this.maskPhone(phone),
      documentType: type,
      documentId: doc.id,
    };
  }

  private async sendByEmail(
    companyId: string,
    customer: any,
    type: DocumentType,
    doc: any,
    sandbox: boolean,
  ): Promise<SendResult> {
    if (!customer.email) {
      throw new BadRequestException(
        'No email address on file for this customer — offer SMS instead',
      );
    }

    if (sandbox) {
      return {
        sent: true,
        channel: 'email' as const,
        sentTo: this.maskEmail(customer.email),
        documentType: type,
        documentId: doc.id,
        attachmentIncluded: false,
        simulated: true,
        notice: SANDBOX_NOTICE,
      };
    }

    const label = this.documentLabel(type, doc);
    // The PDF is a nicety: if rendering is slow or down, the customer should
    // still get the message and the link.
    const pdf = await this.services.optional(
      `${type} pdf`,
      () => this.fetchPdfBase64(companyId, type, doc.id),
      null,
    );

    await this.services.post('comms', '/notifications/email', companyId, {
      recipientId: customer.id,
      recipientName: `${customer.firstName} ${customer.lastName}`.trim(),
      recipientEmail: customer.email,
      subject: `${label} from your service team`,
      htmlBody: this.emailBody(customer, type, doc, label),
      customerId: customer.id,
      ...(type === 'invoice' ? { invoiceId: doc.id } : { quoteId: doc.id }),
      ...(pdf
        ? {
            attachments: [
              {
                filename: `${type}-${doc.invoiceNumber ?? doc.quoteNumber ?? doc.id}.pdf`,
                contentType: 'application/pdf',
                contentBase64: pdf,
              },
            ],
          }
        : {}),
    });

    return {
      sent: true,
      channel: 'email' as const,
      sentTo: this.maskEmail(customer.email),
      documentType: type,
      documentId: doc.id,
      attachmentIncluded: Boolean(pdf),
    };
  }

  /** Booking confirmation to the number/address already on the customer. */
  async sendBookingConfirmation(
    companyId: string,
    bookingId: string,
    channel: SendChannel,
    sandbox = false,
  ) {
    const bookings = await this.services.get('crm', '/bookings', companyId, {
      limit: 500,
    });
    const booking = unwrapList<any>(bookings).find((b) => b.id === bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (!booking.customerId) {
      throw new BadRequestException(
        'This booking has no customer record to send a confirmation to',
      );
    }

    const customer = await this.loadCustomer(companyId, booking.customerId);
    const when = new Date(booking.preferredDate).toUTCString();
    const status = String(booking.status).toUpperCase();
    // Never imply a pending booking is settled.
    const wording =
      status === 'CONFIRMED'
        ? `is confirmed for ${when}`
        : `has been requested for ${when} and is awaiting confirmation`;

    if (channel === 'sms') {
      const phone = customer.mobile ?? customer.phone;
      if (!phone) throw new BadRequestException('No phone number on file');
      if (sandbox) {
        return {
          sent: true,
          channel,
          sentTo: this.maskPhone(phone),
          bookingStatus: status,
          simulated: true,
          notice: SANDBOX_NOTICE,
        };
      }
      await this.services.post('comms', '/notifications/sms', companyId, {
        recipientId: customer.id,
        recipientName: `${customer.firstName} ${customer.lastName}`.trim(),
        recipientPhone: phone,
        body: `${customer.firstName}, your ${booking.serviceType} appointment ${wording}. We'll be in touch if anything changes.`,
        customerId: customer.id,
      });
      return { sent: true, channel, sentTo: this.maskPhone(phone), bookingStatus: status };
    }

    if (!customer.email) throw new BadRequestException('No email address on file');
    if (sandbox) {
      return {
        sent: true,
        channel,
        sentTo: this.maskEmail(customer.email),
        bookingStatus: status,
        simulated: true,
        notice: SANDBOX_NOTICE,
      };
    }
    await this.services.post('comms', '/notifications/email', companyId, {
      recipientId: customer.id,
      recipientName: `${customer.firstName} ${customer.lastName}`.trim(),
      recipientEmail: customer.email,
      subject: `Your ${booking.serviceType} appointment`,
      htmlBody: `<p>Hi ${customer.firstName},</p><p>Your <strong>${booking.serviceType}</strong> appointment ${wording}.</p><p>We'll be in touch if anything changes.</p>`,
      customerId: customer.id,
    });
    return {
      sent: true,
      channel,
      sentTo: this.maskEmail(customer.email),
      bookingStatus: status,
    };
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private async loadCustomer(companyId: string, customerId: string) {
    try {
      return await this.services.get<any>(
        'crm',
        `/customers/${customerId}`,
        companyId,
      );
    } catch {
      throw new NotFoundException('Customer not found');
    }
  }

  private async loadDocument(
    companyId: string,
    type: DocumentType,
    id: string,
  ): Promise<any> {
    const path = type === 'invoice' ? `/invoices/${id}` : `/quotes/${id}`;
    try {
      return await this.services.get<any>('finance', path, companyId);
    } catch {
      throw new NotFoundException(`${type} not found`);
    }
  }

  private async fetchPdfBase64(
    companyId: string,
    type: DocumentType,
    id: string,
  ): Promise<string> {
    const path = type === 'invoice' ? `/invoices/${id}/pdf` : `/quotes/${id}/pdf`;
    const buffer = await this.services.getBinary('finance', path, companyId);
    return Buffer.from(buffer).toString('base64');
  }

  private documentLabel(type: DocumentType, doc: any): string {
    const number = doc.invoiceNumber ?? doc.quoteNumber;
    return number
      ? `${type === 'invoice' ? 'invoice' : 'quote'} ${number}`
      : `your ${type}`;
  }

  private portalLink(type: DocumentType, id: string): string {
    const base = (process.env.CUSTOMER_PORTAL_URL ?? '').replace(/\/$/, '');
    return `${base}/${type === 'invoice' ? 'invoices' : 'quotes'}/${id}`;
  }

  private emailBody(
    customer: any,
    type: DocumentType,
    doc: any,
    label: string,
  ): string {
    const amount = Number(
      type === 'invoice' ? (doc.balanceDue ?? doc.total ?? 0) : (doc.total ?? 0),
    ).toFixed(2);
    return [
      `<p>Hi ${customer.firstName},</p>`,
      `<p>As discussed on the phone, here is ${label} for <strong>$${amount}</strong>.</p>`,
      `<p><a href="${this.portalLink(type, doc.id)}">View it online</a></p>`,
      `<p>Thanks for your business.</p>`,
    ].join('');
  }

  /** Confirms where it went without reading the whole number back on a call. */
  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.length <= 4 ? '****' : `••••${digits.slice(-4)}`;
  }

  private maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!domain) return '••••';
    const head = name.slice(0, 1);
    return `${head}${'•'.repeat(Math.max(2, name.length - 1))}@${domain}`;
  }
}
