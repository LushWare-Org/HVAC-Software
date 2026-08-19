import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import {
  CustomerEventsSubscriber,
  type CustomerEvent,
} from '../customer-events/customer-events.subscriber';

export interface CustomerPushInput {
  companyId: string;
  customerId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  jobId?: string;
  dedupeKey?: string;
}

/**
 * Job statuses worth interrupting a customer for, with their copy.
 * A status absent from this map is deliberately silent — an in-app realtime
 * update is enough for it.
 */
const JOB_STATUS_COPY: Record<string, { title: string; body: string }> = {
  SCHEDULED: { title: 'Your service is scheduled', body: 'Tap to see the details.' },
  EN_ROUTE: { title: 'Your technician is on the way', body: 'Tap to track the visit.' },
  ON_SITE: { title: 'Your technician has arrived', body: 'Work is starting shortly.' },
  COMPLETED: { title: 'Service completed', body: 'Tap to review the visit.' },
  CANCELLED: { title: 'Your service was cancelled', body: 'Tap for details.' },
};

/** Only staff-initiated changes push — the customer already knows their own actions. */
const QUOTE_COPY: Record<string, { title: string; body: string }> = {
  SENT: { title: 'New quote ready to review', body: 'Tap to view and respond.' },
};

const INVOICE_COPY: Record<string, { title: string; body: string }> = {
  SENT: { title: 'New invoice', body: 'Tap to view your invoice.' },
  OVERDUE: { title: 'Invoice overdue', body: 'Tap to settle your balance.' },
  PAID: { title: 'Payment received', body: 'Thank you — tap for your receipt.' },
};

@Injectable()
export class CustomerNotificationsService implements OnModuleInit {
  private readonly logger = new Logger(CustomerNotificationsService.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
    private readonly crm: CompanySettingsClient,
    private readonly subscriber: CustomerEventsSubscriber,
  ) {}

  onModuleInit() {
    this.subscriber.onCustomerEvent((evt) => {
      void this.handleCustomerEvent(evt);
    });
  }

  /**
   * The single path for "notify a customer by push" — resolves their token and
   * applies dedupe. Both the event triggers below and job-service's reminder
   * sweep (via POST /notifications/customer-push) go through here.
   */
  async pushToCustomer(input: CustomerPushInput): Promise<{ sent: boolean; reason?: string }> {
    if (input.dedupeKey) {
      const existing = await this.prisma.notification.findFirst({
        where: { companyId: input.companyId, dedupeKey: input.dedupeKey },
        select: { id: true },
      });
      if (existing) return { sent: false, reason: 'duplicate' };
    }

    const recipient = await this.crm.getCustomerPushRecipient(input.companyId, input.customerId);
    // No device has ever registered for this customer. Not an error — they may
    // simply use the web portal only.
    if (!recipient) return { sent: false, reason: 'no-token' };

    await this.notifications.sendPush({
      companyId: input.companyId,
      customerId: input.customerId,
      jobId: input.jobId,
      recipientId: recipient.recipientId,
      recipientName: recipient.recipientName,
      pushToken: recipient.pushToken,
      title: input.title,
      body: input.body,
      data: input.data,
      dedupeKey: input.dedupeKey,
    });

    return { sent: true };
  }

  /**
   * Maps a realtime event to a push, or to nothing. Customer-initiated changes
   * (they created the job, they approved the quote) are deliberately silent.
   */
  async handleCustomerEvent(evt: CustomerEvent): Promise<void> {
    const send = (
      title: string,
      body: string,
      data: Record<string, string>,
      jobId?: string,
    ) =>
      this.pushToCustomer({
        companyId: evt.companyId,
        customerId: evt.customerId,
        title,
        body,
        data,
        jobId,
      }).catch((err: Error) => {
        this.logger.warn(`customer push failed: ${err.message}`);
        return { sent: false as const };
      });

    if (evt.kind === 'job') {
      if (evt.event.change !== 'STATUS') return;
      const copy = JOB_STATUS_COPY[String(evt.event.status ?? '')];
      if (!copy) return;
      await send(copy.title, copy.body, { type: 'job_status', jobId: evt.event.jobId }, evt.event.jobId);
      return;
    }

    if (evt.kind === 'quote') {
      const copy = QUOTE_COPY[evt.event.change];
      if (!copy) return;
      await send(copy.title, copy.body, { type: 'quote', quoteId: evt.event.documentId });
      return;
    }

    const copy = INVOICE_COPY[evt.event.change];
    if (!copy) return;
    await send(copy.title, copy.body, { type: 'invoice', invoiceId: evt.event.documentId });
  }
}
