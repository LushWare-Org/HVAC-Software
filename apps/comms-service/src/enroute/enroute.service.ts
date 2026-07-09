/**
 * EnRouteNotificationService — tells the customer their technician is on the way.
 *
 * Triggered by scheduling-service when an assignment transitions to EN_ROUTE.
 * Sends an email (technician photo + arrival window) and a short SMS through the
 * existing notification pipeline, so both land in delivery history. Every failure
 * is logged and swallowed — the technician's status update must never feel broken
 * because a notification could not go out.
 */
import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { EnRouteNotificationDto } from './dto/enroute.dto';

const COMPANY_NAME = process.env.SENDGRID_FROM_NAME ?? process.env.SMTP_FROM_NAME ?? 'T&S Services';
const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';
// Timezone used to render the arrival window in the customer's local time.
const COMPANY_TIMEZONE = process.env.COMPANY_TIMEZONE ?? 'America/Chicago';
const DEDUPE_TTL_MS = 30 * 60 * 1000;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

@Injectable()
export class EnRouteNotificationService {
  private readonly logger = new Logger(EnRouteNotificationService.name);
  // Double-tap guard: one email+SMS per assignment per EN_ROUTE transition.
  // In-memory is fine — duplicates across restarts/instances are harmless.
  private readonly sentAt = new Map<string, number>();

  constructor(
    private readonly notifications: NotificationsService,
    private readonly companySettings: CompanySettingsClient,
  ) {}

  async notify(companyId: string, dto: EnRouteNotificationDto): Promise<{ email: boolean; sms: boolean; deduped: boolean }> {
    const last = this.sentAt.get(dto.assignmentId);
    if (last && Date.now() - last < DEDUPE_TTL_MS) {
      this.logger.log(`En-route notification for assignment ${dto.assignmentId} suppressed (already sent)`);
      return { email: false, sms: false, deduped: true };
    }
    this.sentAt.set(dto.assignmentId, Date.now());
    this.pruneDedupe();

    const settings = await this.companySettings.getSettings(companyId);
    const window = this.formatWindow(dto.etaStart, dto.etaEnd, settings.timezone);
    const avatarUrl = await this.fetchTechAvatar(companyId, dto.techUserId);

    const [email, sms] = await Promise.all([
      this.sendEmail(companyId, dto, window, avatarUrl),
      this.sendSms(companyId, dto, window),
    ]);
    return { email, sms, deduped: false };
  }

  private pruneDedupe() {
    if (this.sentAt.size < 1000) return;
    const cutoff = Date.now() - DEDUPE_TTL_MS;
    for (const [k, v] of this.sentAt) if (v < cutoff) this.sentAt.delete(k);
  }

  /** "between 2:40 PM and 3:00 PM" | "around 2:40 PM" | null (no time known) */
  formatWindow(etaStart?: string, etaEnd?: string, timeZone: string = COMPANY_TIMEZONE): string | null {
    const fmt = (iso: string) =>
      new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone });
    if (etaStart && etaEnd) return `between ${fmt(etaStart)} and ${fmt(etaEnd)}`;
    if (etaStart) return `around ${fmt(etaStart)}`;
    return null;
  }

  private async fetchTechAvatar(companyId: string, techUserId: string): Promise<string | null> {
    try {
      const res = await fetch(`${CRM_SERVICE_URL}/users/${encodeURIComponent(techUserId)}`, {
        headers: this.serviceHeaders(companyId),
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) return null;
      const user = (await res.json()) as { avatarUrl?: string | null };
      return user.avatarUrl ?? null;
    } catch (err) {
      this.logger.warn(`Tech avatar lookup failed for ${techUserId}: ${(err as Error).message}`);
      return null;
    }
  }

  private serviceHeaders(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'enroute-notifier',
        'x-test-user-email': 'enroute@tscrm.internal',
      };
    }
    return { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
  }

  private async sendEmail(companyId: string, dto: EnRouteNotificationDto, window: string | null, avatarUrl: string | null): Promise<boolean> {
    if (!dto.customerEmail) return false;
    try {
      await this.notifications.sendEmail({
        companyId,
        jobId: dto.jobId,
        recipientId: dto.jobId,
        recipientName: dto.customerName,
        recipientEmail: dto.customerEmail,
        subject: `${dto.techName} is on the way — ${dto.jobTitle}`,
        htmlBody: this.buildEmailHtml(dto, window, avatarUrl),
      });
      return true;
    } catch (err) {
      this.logger.warn(`En-route email failed for job ${dto.jobId}: ${(err as Error).message}`);
      return false;
    }
  }

  private async sendSms(companyId: string, dto: EnRouteNotificationDto, window: string | null): Promise<boolean> {
    if (!dto.customerPhone) return false;
    const eta = window ? ` — expected ${window}` : '';
    const body =
      `Hi${dto.customerName ? ` ${dto.customerName}` : ''}, ${dto.techName} from ${COMPANY_NAME} ` +
      `is on the way for "${dto.jobTitle}"${eta}.`;
    try {
      await this.notifications.sendSms({
        companyId,
        jobId: dto.jobId,
        recipientId: dto.jobId,
        recipientName: dto.customerName,
        recipientPhone: dto.customerPhone,
        body,
      });
      return true;
    } catch (err) {
      this.logger.warn(`En-route SMS failed for job ${dto.jobId}: ${(err as Error).message}`);
      return false;
    }
  }

  buildEmailHtml(dto: EnRouteNotificationDto, window: string | null, avatarUrl: string | null): string {
    const name = esc(dto.techName);
    const initials = dto.techName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const photo = avatarUrl
      ? `<img src="${esc(avatarUrl)}" alt="${name}" width="96" height="96" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #2563eb;display:block;" />`
      : `<div style="width:96px;height:96px;border-radius:50%;background:#1e293b;color:#fff;border:3px solid #2563eb;font:700 32px/90px Arial,sans-serif;text-align:center;">${esc(initials)}</div>`;
    const etaLine = window
      ? `Expected arrival <strong style="color:#0f172a;">${esc(window)}</strong>`
      : 'They will arrive shortly';

    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;">
      <tr><td style="background:#0f172a;padding:18px 28px;">
        <span style="color:#ffffff;font-size:15px;font-weight:700;">${esc(COMPANY_NAME)}</span>
      </td></tr>
      <tr><td align="center" style="padding:28px 28px 8px;">${photo}</td></tr>
      <tr><td align="center" style="padding:4px 28px 0;">
        <p style="margin:8px 0 2px;font-size:19px;font-weight:700;color:#0f172a;">${name} is on the way</p>
        <p style="margin:0 0 14px;font-size:14px;color:#475569;">${etaLine}</p>
      </td></tr>
      <tr><td style="padding:6px 28px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
          <tr><td style="padding:14px 18px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Your service</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${esc(dto.jobTitle)}</p>
            ${dto.serviceAddress ? `<p style="margin:4px 0 0;font-size:13px;color:#475569;">${esc(dto.serviceAddress)}</p>` : ''}
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 28px 26px;">
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
          Please make sure someone is available at the service address.
          Sent by ${esc(COMPANY_NAME)} — reply to this email or contact us if the time doesn't work.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>`;
  }
}
