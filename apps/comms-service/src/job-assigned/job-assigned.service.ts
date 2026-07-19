/**
 * JobAssignedNotificationService — tells a technician they've been given a job.
 *
 * Triggered by scheduling-service the moment a dispatcher assigns (smart or
 * manual). Fans out over every channel the technician can be reached on:
 *   1. Socket push (`job_assigned` + `notification_new` to user:<techUserId>)
 *      — the app's SocketContext invalidates its job queries, so the job
 *      appears in "My Jobs" within a second, no refresh needed.
 *   2. In-app notification (Notifications tab + badge).
 *   3. Mobile push via the token registered on CompanyUser.pushToken.
 *   4. Email.
 *
 * Every failure is logged and swallowed — assignment must never fail because
 * a notification could not go out.
 */
import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { MessagingGateway } from '../messaging/messaging.gateway';
import { JobAssignedDto } from './dto/job-assigned.dto';

const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';
const DEDUPE_TTL_MS = 5 * 60 * 1000;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface TechUser {
  id: string;
  name?: string | null;
  email?: string | null;
  pushToken?: string | null;
}

@Injectable()
export class JobAssignedNotificationService {
  private readonly logger = new Logger(JobAssignedNotificationService.name);
  // One fan-out per assignment — re-assign clicks / retries are harmless no-ops.
  private readonly sentAt = new Map<string, number>();

  constructor(
    private readonly notifications: NotificationsService,
    private readonly gateway: MessagingGateway,
  ) {}

  async notify(companyId: string, dto: JobAssignedDto) {
    const last = this.sentAt.get(dto.assignmentId);
    if (last && Date.now() - last < DEDUPE_TTL_MS) {
      return { deduped: true };
    }
    this.sentAt.set(dto.assignmentId, Date.now());
    this.pruneDedupe();

    const title = 'New job assigned';
    const when = dto.scheduledStart
      ? new Date(dto.scheduledStart).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : 'unscheduled';
    const body = `${dto.jobTitle}${dto.customerName ? ` — ${dto.customerName}` : ''} (${when})`;

    // 1. Socket first — this is what makes the app update instantly.
    try {
      this.gateway.broadcastToUser(dto.techUserId, 'job_assigned', {
        jobId: dto.jobId,
        assignmentId: dto.assignmentId,
        title,
        body,
      });
      this.gateway.broadcastToUser(dto.techUserId, 'notification_new', { title, body });
    } catch (err) {
      this.logger.warn(`job-assigned socket emit failed: ${(err as Error).message}`);
    }

    // 2. In-app notification (drives the Notifications tab).
    const inApp = this.notifications.sendInApp({
      companyId,
      sender: { userId: 'system', name: 'Dispatch', companyId, role: 'dispatcher' } as any,
      title,
      body,
      type: 'job_assigned',
      recipients: [{ recipientId: dto.techUserId, recipientName: dto.techName }],
    }).catch((err) => {
      this.logger.warn(`job-assigned in-app failed: ${err.message}`);
      return null;
    });

    // 3 + 4. Push + email need the CRM user record (token + address).
    const user = await this.fetchTechUser(companyId, dto.techUserId);

    const push = user?.pushToken
      ? this.notifications.sendPush({
          companyId,
          jobId: dto.jobId,
          recipientId: dto.techUserId,
          recipientName: dto.techName,
          pushToken: user.pushToken,
          title,
          body,
          data: { jobId: dto.jobId, type: 'job_assigned' },
        }).catch((err) => {
          this.logger.warn(`job-assigned push failed: ${err.message}`);
          return null;
        })
      : Promise.resolve(null);

    const email = user?.email
      ? this.notifications.sendEmail({
          companyId,
          jobId: dto.jobId,
          recipientId: dto.techUserId,
          recipientName: dto.techName,
          recipientEmail: user.email,
          subject: `New job assigned: ${dto.jobTitle}`,
          htmlBody: this.emailHtml(dto, when),
        }).catch((err) => {
          this.logger.warn(`job-assigned email failed: ${err.message}`);
          return null;
        })
      : Promise.resolve(null);

    await Promise.all([inApp, push, email]);
    return { deduped: false };
  }

  private emailHtml(dto: JobAssignedDto, when: string): string {
    return `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 12px;">You've been assigned a new job</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#6b7280;">Job</td><td style="padding:6px 0;font-weight:bold;">${esc(dto.jobTitle)}</td></tr>
          ${dto.customerName ? `<tr><td style="padding:6px 0;color:#6b7280;">Customer</td><td style="padding:6px 0;">${esc(dto.customerName)}</td></tr>` : ''}
          ${dto.address ? `<tr><td style="padding:6px 0;color:#6b7280;">Address</td><td style="padding:6px 0;">${esc(dto.address)}</td></tr>` : ''}
          <tr><td style="padding:6px 0;color:#6b7280;">Scheduled</td><td style="padding:6px 0;">${esc(when)}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:13px;margin-top:18px;">Open the technician app for full details and to update your status.</p>
      </div>`;
  }

  private async fetchTechUser(companyId: string, techUserId: string): Promise<TechUser | null> {
    try {
      const res = await fetch(`${CRM_SERVICE_URL}/users/${encodeURIComponent(techUserId)}`, {
        headers: this.serviceHeaders(companyId),
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) return null;
      return (await res.json()) as TechUser;
    } catch (err) {
      this.logger.warn(`Tech user lookup failed for ${techUserId}: ${(err as Error).message}`);
      return null;
    }
  }

  private serviceHeaders(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'comms-service',
      };
    }
    return { 'x-internal-company-id': companyId };
  }

  private pruneDedupe() {
    if (this.sentAt.size < 1000) return;
    const cutoff = Date.now() - DEDUPE_TTL_MS;
    for (const [k, v] of this.sentAt) if (v < cutoff) this.sentAt.delete(k);
  }
}
