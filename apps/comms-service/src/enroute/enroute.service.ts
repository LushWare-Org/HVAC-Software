/**
 * EnRouteNotificationService — tells the customer their technician is on the way.
 *
 * Triggered two ways, whichever happens: scheduling-service when an assignment
 * is marked EN_ROUTE, and job-service (via the job-status event) when the
 * technician app marks the job itself EN_ROUTE. Sends an email (technician photo
 * + arrival window), a short SMS, and an in-app message (which also reaches the
 * customer's Telegram, photo included). Once per job per half hour, so the two
 * triggers never double up. Every failure is logged and swallowed: the
 * technician's status update must never feel broken because a notification
 * could not go out.
 */
import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobUpdatesService } from '../job-updates/job-updates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { EnRouteNotificationDto } from './dto/enroute.dto';
import { serviceAuthHeaders } from '@tscrm/auth-client';

const COMPANY_NAME = process.env.SENDGRID_FROM_NAME ?? process.env.SMTP_FROM_NAME ?? 'HVACtor.ai';
const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';
// Timezone used to render the arrival window in the customer's local time.
const COMPANY_TIMEZONE = process.env.COMPANY_TIMEZONE ?? 'America/Chicago';
const DEDUPE_TTL_MS = 30 * 60 * 1000;

/** Same rule as scheduling-service's estimateETAWindow, minus the road router: straight line at 30 km/h, +15%, a 20-minute window. */
export function estimateEtaWindow(
  tech: { lat: number; lng: number } | null, job: { lat: number; lng: number } | null,
  scheduledStart: Date | null, scheduledEnd: Date | null, now: Date,
): { start: Date; end: Date } | null {
  if (tech && job) {
    const R = 6371, rad = (d: number) => (d * Math.PI) / 180;
    const dLat = rad(job.lat - tech.lat), dLng = rad(job.lng - tech.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(tech.lat)) * Math.cos(rad(job.lat)) * Math.sin(dLng / 2) ** 2;
    const km = 2 * R * Math.asin(Math.sqrt(h));
    const arrival = new Date(now.getTime() + (km / 30) * 3600_000 * 1.15);
    let start = new Date(Math.floor(arrival.getTime() / 600_000) * 600_000);
    if (start < now) start = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
    return { start, end: new Date(start.getTime() + 20 * 60_000) };
  }
  if (scheduledStart) return { start: new Date(scheduledStart), end: scheduledEnd ? new Date(scheduledEnd) : new Date(new Date(scheduledStart).getTime() + 3600_000) };
  return null;
}

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
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly jobUpdates?: JobUpdatesService,
  ) {}

  async notify(companyId: string, dto: EnRouteNotificationDto): Promise<{ email: boolean; sms: boolean; deduped: boolean }> {
    // Keyed by job, not assignment: both triggers (scheduling and job-service) must collapse into one.
    const last = this.sentAt.get(dto.jobId);
    if (last && Date.now() - last < DEDUPE_TTL_MS) {
      this.logger.log(`En-route notification for job ${dto.jobId} suppressed (already sent)`);
      return { email: false, sms: false, deduped: true };
    }
    this.sentAt.set(dto.jobId, Date.now());
    this.pruneDedupe();

    const settings = await this.companySettings.getSettings(companyId);
    const companyName = settings.name || COMPANY_NAME;
    const window = this.formatWindow(dto.etaStart, dto.etaEnd, settings.timezone);
    const avatarUrl = await this.fetchTechAvatar(companyId, dto.techUserId);
    // A solo job produces a one-member crew, so the template has a single shape
    // to render and the existing email is unchanged.
    const crew = dto.crew?.length
      ? await this.fetchCrewAvatars(companyId, dto.crew)
      : [{ name: dto.techName, isLead: true, avatarUrl }];

    const [email, sms] = await Promise.all([
      this.sendEmail(companyId, dto, window, avatarUrl, companyName, crew),
      this.sendSms(companyId, dto, window, companyName),
      this.jobUpdates?.post({
        companyId, customerId: dto.customerId ?? (await this.customerOf(companyId, dto.jobId)), jobId: dto.jobId, status: 'EN_ROUTE',
        jobTitle: dto.jobTitle, technicianName: crew.length > 1 ? `${dto.techName} and ${crew.length - 1} other${crew.length > 2 ? 's' : ''}` : dto.techName,
        arrivalWindow: window, techPhotoUrl: avatarUrl,
      }),
    ]);
    return { email, sms, deduped: false };
  }

  private async customerOf(companyId: string, jobId: string): Promise<string | null> {
    if (!this.prisma) return null;
    const rows = await this.prisma.$queryRawUnsafe<Array<{ customerId: string | null }>>(
      `SELECT "customerId" FROM jobs.jobs WHERE id = $1 AND "companyId" = $2`, jobId, companyId,
    ).catch(() => []);
    return rows[0]?.customerId ?? null;
  }

  /**
   * The technician app marked the JOB en route (job-service), which doesn't go
   * through scheduling-service's assignment flow. Gather the same facts here (the
   * lead technician, their last position, the job's place and time) and send the
   * same notification. If scheduling already sent it, the dedupe absorbs this.
   */
  async notifyFromJob(companyId: string, jobId: string): Promise<{ email: boolean; sms: boolean; deduped: boolean } | null> {
    if (!this.prisma) return null;
    const rows = await this.prisma.$queryRawUnsafe<Array<{
      assignmentId: string | null; techUserId: string | null; techName: string | null; techLat: number | null; techLng: number | null; lastSeen: Date | null;
      title: string; serviceAddress: string | null; customerId: string | null; customerName: string | null; customerEmail: string | null; customerPhone: string | null;
      lat: number | null; lng: number | null; scheduledStart: Date | null; scheduledEnd: Date | null; assignedToId: string | null; assignedToName: string | null;
    }>>(
      `SELECT a.id::text AS "assignmentId", t.user_id AS "techUserId", t.name AS "techName",
              ST_Y(t.current_location) AS "techLat", ST_X(t.current_location) AS "techLng", t.last_seen_at AS "lastSeen",
              j.title, j."serviceAddress", j."customerId", j."customerName", j."customerEmail", j."customerPhone",
              j."serviceLatitude" AS lat, j."serviceLongitude" AS lng, j."scheduledStart", j."scheduledEnd", j."assignedToId", j."assignedToName"
         FROM jobs.jobs j
         LEFT JOIN scheduling.dispatch_assignments a ON a.job_id = j.id AND a.company_id = j."companyId" AND a.status::text <> 'CANCELLED'
         LEFT JOIN scheduling.technicians t ON t.id = a.technician_id
        WHERE j.id = $1 AND j."companyId" = $2
        ORDER BY a.is_lead DESC NULLS LAST, a.assigned_at DESC NULLS LAST
        LIMIT 1`,
      jobId, companyId,
    );
    const r = rows[0];
    if (!r) return null;
    const techUserId = r.techUserId ?? r.assignedToId;
    const techName = r.techName ?? r.assignedToName;
    if (!techUserId || !techName) return null;
    // A position counts only if it's fresh; otherwise fall back to the booked time.
    const fresh = r.techLat != null && r.techLng != null && r.lastSeen && Date.now() - new Date(r.lastSeen).getTime() < 30 * 60_000;
    const eta = estimateEtaWindow(fresh ? { lat: Number(r.techLat), lng: Number(r.techLng) } : null,
      r.lat != null && r.lng != null ? { lat: Number(r.lat), lng: Number(r.lng) } : null, r.scheduledStart, r.scheduledEnd, new Date());
    return this.notify(companyId, {
      assignmentId: r.assignmentId ?? jobId, jobId, jobTitle: r.title, techUserId, techName,
      serviceAddress: r.serviceAddress ?? undefined, customerName: r.customerName ?? undefined,
      customerEmail: r.customerEmail ?? undefined, customerPhone: r.customerPhone ?? undefined,
      customerId: r.customerId ?? undefined,
      etaStart: eta?.start.toISOString(), etaEnd: eta?.end.toISOString(),
    } as EnRouteNotificationDto);
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

  /**
   * Avatars for the whole crew, in the order given. Each lookup is independent,
   * so one missing photo never costs the others theirs.
   */
  private async fetchCrewAvatars(
    companyId: string,
    crew: { userId: string; name: string; isLead: boolean }[],
  ): Promise<{ name: string; isLead: boolean; avatarUrl: string | null }[]> {
    return Promise.all(
      crew.map(async (m) => ({
        name: m.name,
        isLead: m.isLead,
        avatarUrl: await this.fetchTechAvatar(companyId, m.userId),
      })),
    );
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
    // Per-call token signed with JWT_SECRET; SERVICE_JWT was never set anywhere.
    return serviceAuthHeaders(companyId, 'comms:enroute-notifier');
  }

  private async sendEmail(companyId: string, dto: EnRouteNotificationDto, window: string | null, avatarUrl: string | null, companyName: string, crew: { name: string; isLead: boolean; avatarUrl: string | null }[] = []): Promise<boolean> {
    if (!dto.customerEmail) return false;
    try {
      await this.notifications.sendEmail({
        companyId,
        jobId: dto.jobId,
        recipientId: dto.jobId,
        recipientName: dto.customerName,
        recipientEmail: dto.customerEmail,
        subject: `${dto.techName} is on the way — ${dto.jobTitle}`,
        htmlBody: this.buildEmailHtml(dto, window, avatarUrl, companyName, crew),
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
    // Lead plus a count, never the full list: a crew of four would blow past a
    // single SMS segment and the customer pays for the extra ones.
    const others = Math.max(0, (dto.crew?.length ?? 1) - 1);
    const who = others > 0
      ? `${dto.techName} and ${others} other technician${others === 1 ? '' : 's'}`
      : dto.techName;
    const verb = others > 0 ? 'are' : 'is';
    const body =
      `Hi${dto.customerName ? ` ${dto.customerName}` : ''}, ${who} from ${companyName} ` +
      `${verb} on the way for "${dto.jobTitle}"${eta}.`;
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
  buildEmailHtml(dto: EnRouteNotificationDto, window: string | null, avatarUrl: string | null, companyName: string = COMPANY_NAME, crew: { name: string; isLead: boolean; avatarUrl: string | null }[] = []): string {
    const name = esc(dto.techName);
    const initials = dto.techName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const photo = avatarUrl
      ? `<img src="${esc(avatarUrl)}" alt="${name}" width="88" height="88" style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.15);display:block;" />`
      : `<div style="width:88px;height:88px;border-radius:50%;background:rgba(255,255,255,0.16);color:#fff;border:3px solid #ffffff;font:700 30px/82px Arial,sans-serif;text-align:center;">${esc(initials)}</div>`;
    const etaLine = window
      ? `Expected to arrive <strong>${esc(window)}</strong>`
      : 'They will arrive shortly';
    const greetName = dto.customerName ? esc(dto.customerName) : 'there';

    // With a crew, name everyone and say who leads. The customer is about to
    // open the door to three people; being told about one of them is worse than
    // being told about none.
    const others = crew.filter(m => !m.isLead);
    const crewBlock = others.length === 0 ? '' : `
    <div style="padding:0 32px 4px;">
      <p style="margin:18px 0 10px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6B7280;">Who is coming</p>
      ${crew.map(m => {
        const mn = esc(m.name);
        const mi = m.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const face = m.avatarUrl
          ? `<img src="${esc(m.avatarUrl)}" alt="${mn}" width="34" height="34" style="width:34px;height:34px;border-radius:50%;object-fit:cover;display:block;" />`
          : `<div style="width:34px;height:34px;border-radius:50%;background:#E5E7EB;color:#374151;font:700 13px/34px Arial,sans-serif;text-align:center;">${esc(mi)}</div>`;
        return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
          <td style="padding-right:10px;">${face}</td>
          <td style="font-size:14px;color:#111827;">${mn}${m.isLead ? ' <span style="color:#2563EB;font-weight:600;">· leading</span>' : ''}</td>
        </tr></table>`;
      }).join('')}
    </div>`;

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
    </div>${crewBlock}
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
