/**
 * RescheduleNotificationService — delivers reschedule notifications.
 *
 * Mirrors EnRouteNotificationService: every failure is logged and swallowed,
 * because by the time this runs the reschedule has already been recorded in
 * job-service and must not appear to have failed.
 *
 * Routing rule: whoever did *not* just act is the one who needs telling. The
 * newest round's `openedBy` identifies who acted. APPLIED and CLOSED always go
 * to the customer — those are outcomes they need regardless of who caused them.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { StaffDirectoryClient } from '../company-settings/staff-directory.client';
import { Channel, DeliveryStatus } from '../prisma/generated';
import { buildRescheduleEmail, type RescheduleEmailEvent } from './reschedule-email';
import { RescheduleNotificationDto } from './dto/reschedule-notification.dto';

const PORTAL_URL = process.env.CUSTOMER_PORTAL_URL ?? 'https://tscrm-demo-customer.web.app';

@Injectable()
export class RescheduleNotificationService {
  private readonly logger = new Logger(RescheduleNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly companySettings: CompanySettingsClient,
    private readonly staff: StaffDirectoryClient,
  ) {}

  async notify(companyId: string, dto: RescheduleNotificationDto): Promise<{ email: boolean; inApp: number }> {
    const { event, job, request } = dto;
    const settings = await this.companySettings.getSettings(companyId);
    const companyName = settings.name || 'HVACtor.ai';
    const timeZone = settings.timezone || 'America/Chicago';

    let email = false;
    let inApp = 0;

    if (this.isCustomerFacing(event, request)) {
      const { subject, html } = buildRescheduleEmail({
        event: event as RescheduleEmailEvent,
        companyName,
        customerName: job.customerName ?? 'there',
        jobTitle: job.title ?? 'your service',
        jobNumber: job.jobNumber,
        reasonText: request.reason ?? undefined,
        slots: Array.isArray(request.slots) ? request.slots : [],
        appliedSlot: this.appliedSlot(request),
        portalUrl: `${PORTAL_URL}/jobs?reschedule=${encodeURIComponent(job.id)}`,
        timeZone,
      });

      if (job.customerEmail) {
        try {
          await this.notifications.sendEmail({
            companyId,
            customerId: job.customerId ?? undefined,
            jobId: job.id,
            recipientId: job.customerId ?? job.id,
            recipientName: job.customerName ?? undefined,
            recipientEmail: job.customerEmail,
            subject,
            htmlBody: html,
          });
          email = true;
        } catch (err) {
          this.logger.warn(`Reschedule email failed for job ${job.id}: ${(err as Error).message}`);
        }
      }

      // In-app regardless of whether email worked — the portal badge and bell
      // are the customer's reliable path even with no email on file.
      inApp += await this.writeInApp({
        companyId,
        recipientId: job.customerId ?? job.id,
        recipientName: job.customerName ?? undefined,
        customerId: job.customerId ?? undefined,
        jobId: job.id,
        title: subject,
        body: this.customerBody(event, job),
      });
    } else {
      // Staff side is in-app only — the Reschedules inbox is where the work
      // actually happens, and emailing every dispatcher would be noise.
      const recipients = await this.staff.getSchedulingStaff(companyId);
      const title = this.staffTitle(event, job);
      const body = this.staffBody(event, job);
      for (const member of recipients) {
        inApp += await this.writeInApp({
          companyId,
          recipientId: member.id,
          recipientName: member.name,
          jobId: job.id,
          title,
          body,
        });
      }
    }

    this.logger.log(`Reschedule ${event} for job ${job.id}: email=${email} inApp=${inApp}`);
    return { email, inApp };
  }

  /**
   * APPLIED/CLOSED are outcomes the customer always needs. Otherwise the side
   * that did not act gets told, and `openedBy` on the newest round says who
   * acted — a staff-opened round means the customer is next.
   */
  private isCustomerFacing(event: string, request: Record<string, any>): boolean {
    if (event === 'APPLIED' || event === 'CLOSED') return true;
    return request.openedBy === 'ADMIN';
  }

  private appliedSlot(request: Record<string, any>) {
    if (!request.pickedSlotId || !Array.isArray(request.slots)) return undefined;
    return request.slots.find((s: any) => s.id === request.pickedSlotId);
  }

  private staffTitle(event: string, job: Record<string, any>): string {
    const label = job.jobNumber ?? job.title ?? 'a job';
    const customer = job.customerName ?? 'A customer';
    switch (event) {
      case 'OPENED':    return `${customer} asked to reschedule ${label}`;
      case 'RESPONDED': return `${customer} responded on ${label}`;
      case 'NUDGE':     return `Still waiting: reschedule on ${label}`;
      case 'CLOSED':    return `Reschedule closed on ${label}`;
      default:          return `Reschedule update on ${label}`;
    }
  }

  private staffBody(event: string, job: Record<string, any>): string {
    const title = job.title ?? 'a job';
    switch (event) {
      case 'NUDGE':
        return `A reschedule on ${title} has had no reply. Open the Reschedules tab to deal with it.`;
      case 'CLOSED':
        return `The reschedule request for ${title} was closed.`;
      default:
        return `${title} needs a reschedule decision — see the Reschedules tab.`;
    }
  }

  private customerBody(event: string, job: Record<string, any>): string {
    const title = job.title ?? 'your service';
    switch (event) {
      case 'APPLIED':   return `${title} has been moved to a new time.`;
      case 'CLOSED':    return `The reschedule request for ${title} was closed.`;
      case 'NUDGE':     return `We're still waiting to hear back about rescheduling ${title}.`;
      case 'RESPONDED': return `There is an update on the reschedule for ${title}.`;
      default:          return `We'd like to move ${title} — please pick a time that suits you.`;
    }
  }

  /**
   * Writes the row directly rather than going through
   * NotificationsService.sendInApp, which is built for a human broadcasting to
   * a list and also creates a "sender copy" — wrong for a system event.
   */
  private async writeInApp(data: {
    companyId: string; recipientId: string; recipientName?: string;
    customerId?: string; jobId: string; title: string; body: string;
  }): Promise<number> {
    try {
      await this.prisma.notification.create({
        data: {
          companyId: data.companyId,
          customerId: data.customerId,
          jobId: data.jobId,
          recipientId: data.recipientId,
          recipientName: data.recipientName,
          channel: Channel.IN_APP,
          title: data.title,
          body: data.body,
          status: DeliveryStatus.SENT,
          isRead: false,
          type: 'reschedule',
        },
      });
      return 1;
    } catch (err) {
      this.logger.warn(`In-app reschedule notification failed: ${(err as Error).message}`);
      return 0;
    }
  }
}
