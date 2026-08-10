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

const COMPANY_NAME = process.env.SENDGRID_FROM_NAME ?? process.env.SMTP_FROM_NAME ?? 'HVACtor.ai';
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
    const companyName = settings.name || COMPANY_NAME;
    const window = this.formatWindow(dto.etaStart, dto.etaEnd, settings.timezone);
    const avatarUrl = await this.fetchTechAvatar(companyId, dto.techUserId);

    const [email, sms] = await Promise.all([
      this.sendEmail(companyId, dto, window, avatarUrl, companyName),
      this.sendSms(companyId, dto, window, companyName),
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

  private async sendEmail(companyId: string, dto: EnRouteNotificationDto, window: string | null, avatarUrl: string | null, companyName: string): Promise<boolean> {
    if (!dto.customerEmail) return false;
    try {
      await this.notifications.sendEmail({
        companyId,
        jobId: dto.jobId,
        recipientId: dto.jobId,
        recipientName: dto.customerName,
        recipientEmail: dto.customerEmail,
        subject: `${dto.techName} is on the way — ${dto.jobTitle}`,
        htmlBody: this.buildEmailHtml(dto, window, avatarUrl, companyName),
      });
      return true;
    } catch (err) {
      this.logger.warn(`En-route email failed for job ${dto.jobId}: ${(err as Error).message}`);
      return false;
    }
  }

  private async sendSms(companyId: string, dto: EnRouteNotificationDto, window: string | null, companyName: string): Promise<boolean> {
    if (!dto.customerPhone) return false;
    const eta = window ? ` — expected ${window}` : '';
    const body =
      `Hi${dto.customerName ? ` ${dto.customerName}` : ''}, ${dto.techName} from ${companyName} ` +
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

  // Styled to match the rest of the job-status email family (solid accent
  // header with an uppercase eyebrow, 560px card, same footer line) — this
  // one just leads with the technician's photo since that's the one thing
  // customers actually want to see the moment their tech sets off.
  buildEmailHtml(dto: EnRouteNotificationDto, window: string | null, avatarUrl: string | null, companyName: string = COMPANY_NAME): string {
    const name = esc(dto.techName);
    const initials = dto.techName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const photo = avatarUrl
      ? `<img src="${esc(avatarUrl)}" alt="${name}" width="88" height="88" style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.15);display:block;" />`
      : `<div style="width:88px;height:88px;border-radius:50%;background:rgba(255,255,255,0.16);color:#fff;border:3px solid #ffffff;font:700 30px/82px Arial,sans-serif;text-align:center;">${esc(initials)}</div>`;
    const etaLine = window
      ? `Expected to arrive <strong>${esc(window)}</strong>`
      : 'They will arrive shortly';
    const greetName = dto.customerName ? esc(dto.customerName) : 'there';

    return `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#F3F4F6;padding:32px 18px;font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#111827;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E5E7EB;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.06);">
    <div style="padding:28px 32px;background:#2563EB;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.78);margin-bottom:14px;">Technician en route</div>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:16px;">${photo}</td>
        <td>
          <h1 style="margin:0 0 4px;font-size:20px;color:#ffffff;">${name} is on the way</h1>
          <p style="margin:0;font-size:13.5px;color:rgba(255,255,255,0.85);">${etaLine}</p>
        </td>
      </tr></table>
    </div>
    <div style="padding:30px 32px;">
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4B5563;">
        Hi ${greetName}, just a heads up — <strong>${name}</strong> from ${esc(companyName)} has started heading your way for your service visit.
      </p>
      <div style="border:1px solid #2563EB33;background:#2563EB0d;border-radius:12px;padding:16px 18px;">
        <p style="margin:0;font-size:11.5px;font-weight:700;text-transform:uppercase;color:#2563EB;letter-spacing:0.06em;margin-bottom:6px;">Your service</p>
        <p style="margin:0;font-size:14.5px;font-weight:700;color:#111827;">${esc(dto.jobTitle)}</p>
        ${dto.serviceAddress ? `<p style="margin:6px 0 0;font-size:13.5px;color:#4B5563;">${esc(dto.serviceAddress)}</p>` : ''}
      </div>
      <div style="margin-top:18px;padding:14px 16px;background:#F9FAFB;border-radius:10px;">
        <p style="margin:0;font-size:12.5px;line-height:1.7;color:#6B7280;">
          Please make sure someone's available at the address above around that time. If the timing doesn't work, just reply to this email or contact us and we'll help reschedule.
        </p>
      </div>
      <p style="margin:26px 0 0;font-size:12.5px;line-height:1.7;color:#6B7280;border-top:1px solid #E5E7EB;padding-top:16px;">
        Sent by ${esc(companyName)} · Powered by HVACtor.ai
      </p>
    </div>
  </div>
</body>
</html>`;
  }
}
