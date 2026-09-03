import { Injectable, Logger } from '@nestjs/common';
import { PartnerEventJob, PartnerEventType } from '@tscrm/queue';
import { ServiceClient, unwrapList } from '../internal/service-client.service';

const ALERT_ROLES = new Set(['company_admin', 'office_manager', 'dispatcher']);

@Injectable()
export class StaffAlertsService {
  private readonly logger = new Logger(StaffAlertsService.name);

  constructor(private readonly services: ServiceClient) {}

  async notify(event: PartnerEventJob): Promise<number> {
    const message = this.message(event);
    if (!message) {
      return 0;
    }

    const staff = await this.services.optional(
      'staff lookup',
      () => this.services.get('crm', '/users', event.companyId, { limit: 200 }),
      null,
    );
    if (staff === null) {
      return 0;
    }

    const recipients = unwrapList<any>(staff).filter(
      (u) =>
        u.isActive !== false &&
        ALERT_ROLES.has(String(u.role)) &&
        Boolean(u.pushToken),
    );

    let sent = 0;
    for (const user of recipients) {
      const ok = await this.services.optional(
        `staff push to ${user.id}`,
        async () => {
          await this.services.post('comms', '/notifications/push', event.companyId, {
            recipientId: user.id,
            recipientName: user.name,
            // comms-service's sendPush takes the token directly; the CRM user
            // record is where staff tokens live.
            token: user.pushToken,
            title: message.title,
            body: message.body,
          });
          return true;
        },
        false,
      );
      if (ok) sent++;
    }

    if (sent) {
      this.logger.log(`Alerted ${sent} staff about ${event.type} ${event.entityId}`);
    }
    return sent;
  }

  private message(event: PartnerEventJob): { title: string; body: string } | null {
    const d = event.data ?? {};
    const who = (d.customerName as string) ?? 'A customer';

    switch (event.type) {
      case PartnerEventType.JOB_COMPLETED:
        return {
          title: 'Job completed',
          body: `${who}'s ${d.jobType ?? 'job'} has been marked complete.`,
        };
      case PartnerEventType.INVOICE_PAID:
        return {
          title: 'Invoice paid',
          body: `${who} paid ${d.invoiceNumber ? `invoice ${d.invoiceNumber}` : 'an invoice'}${
            d.amount ? ` — $${Number(d.amount).toFixed(2)}` : ''
          }.`,
        };
      case PartnerEventType.QUOTE_ACCEPTED:
        return {
          title: 'Quote accepted',
          body: `${who} accepted ${d.quoteNumber ? `quote ${d.quoteNumber}` : 'a quote'}${
            d.amount ? ` — $${Number(d.amount).toFixed(2)}` : ''
          }.`,
        };
      case PartnerEventType.BOOKING_CONFIRMED:
        return {
          title: 'Booking confirmed',
          body: `${who}'s ${d.serviceType ?? 'appointment'} is confirmed.`,
        };
      default:
        return null;
    }
  }
}
