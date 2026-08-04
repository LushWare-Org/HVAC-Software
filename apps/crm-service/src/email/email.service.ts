/**
 * EmailService — Transactional email sending for CRM.
 *
 * Configuration (set in .env):
 *   SMTP_HOST     — e.g. smtp.gmail.com
 *   SMTP_PORT     — 587 (TLS) or 465 (SSL)
 *   SMTP_USER     — sender email address
 *   SMTP_PASS     — app password / SMTP password
 *   SMTP_FROM     — "HVACtor.ai <noreply@example.com>"
 *
 * Dev fallback: if SMTP_HOST is not set, emails are printed to the console
 * so you can see the temp password during development without needing SMTP.
 *
 * Sender display name is per-tenant: every send() call can pass the actual
 * company's name (e.g. "Acme HVAC"), which becomes the "From" name instead of
 * a single fixed system name. HVACtor.ai is only the fallback when no tenant
 * name is available.
 */

import { Injectable, Logger } from '@nestjs/common';

const APP_NAME = process.env.APP_NAME ?? 'HVACtor.ai';

// Accept either:
//   SMTP_FROM="HVACtor.ai <noreply@example.com>"   (single var, full format)
//   SMTP_FROM_NAME + SMTP_FROM_EMAIL                 (two-var format used by some providers)
// Falls back to the sender's SMTP_USER if no explicit from address is set.
// Never falls back to a fake domain — that guarantees spam filtering.
function resolveSmtpFromEmail(): string {
  if (process.env.SMTP_FROM) {
    const match = process.env.SMTP_FROM.match(/<([^>]+)>/);
    if (match) return match[1];
  }
  return process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER ?? '';
}
const SMTP_FROM_EMAIL = resolveSmtpFromEmail();
const SMTP_FROM_NAME_DEFAULT = process.env.SMTP_FROM_NAME ?? APP_NAME;

// ── Shared design system for every transactional email in this service ──────
// Solid brand colors (matching the admin-dashboard/customer-portal palette),
// no gradients — accent color is chosen per context so the mail's tone
// matches what it's about (blue = general/account, violet = technician,
// green = success/confirmation, amber = reminder, red = alert).
export const EMAIL_ACCENT = {
  blue: '#2563EB',
  green: '#059669',
  amber: '#D97706',
  red: '#DC2626',
  violet: '#7C3AED',
  cyan: '#0891B2',
} as const;
export type EmailAccent = keyof typeof EMAIL_ACCENT;

const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#4B5563';
const TEXT_FAINT = '#6B7280';
const BORDER = '#E5E7EB';
const BG_PAGE = '#F3F4F6';
const BG_MUTED = '#F9FAFB';

/**
 * Wraps rendered content in the shared card shell: solid-color header band,
 * white rounded card body, consistent footer. Used by every template below
 * and available to other crm-service modules (agreements, IoT) so every
 * notification in the system looks and feels the same.
 */
export function renderEmailCard(opts: {
  accent: EmailAccent;
  eyebrow: string;
  title: string;
  subtitle?: string;
  bodyHtml: string;
  companyName: string;
}): string {
  const color = EMAIL_ACCENT[opts.accent];
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;background:${BG_PAGE};padding:32px 18px;font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:${TEXT_PRIMARY};">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.06);">
    <div style="padding:28px 32px;background:${color};">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.78);margin-bottom:8px;">${opts.eyebrow}</div>
      <h1 style="margin:0;font-size:21px;line-height:1.3;color:#ffffff;">${opts.title}</h1>
      ${opts.subtitle ? `<p style="margin:8px 0 0;font-size:13.5px;color:rgba(255,255,255,0.85);">${opts.subtitle}</p>` : ''}
    </div>
    <div style="padding:30px 32px;">
      ${opts.bodyHtml}
      <p style="margin:26px 0 0;font-size:12.5px;line-height:1.7;color:${TEXT_FAINT};border-top:1px solid ${BORDER};padding-top:16px;">
        Sent by ${opts.companyName} · Powered by HVACtor.ai
      </p>
    </div>
  </div>
</body>
</html>`;
}

/** A tinted info box used inside email bodies — credentials, reminders, warnings, etc. */
export function emailInfoBox(opts: { accent: EmailAccent; label?: string; html: string }): string {
  const color = EMAIL_ACCENT[opts.accent];
  return `
  <div style="border:1px solid ${color}33;background:${color}0d;border-radius:12px;padding:16px 18px;margin:0 0 16px 0;">
    ${opts.label ? `<p style="margin:0 0 8px;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${color};">${opts.label}</p>` : ''}
    ${opts.html}
  </div>`;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any = null;

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    const host = process.env.SMTP_HOST;
    if (!host) {
      this.logger.warn(
        'SMTP_HOST not configured — emails will be printed to console (dev mode). ' +
          'Set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS in .env for real delivery.',
      );
      return;
    }
    try {
      // Dynamic import so the service starts even if nodemailer isn't installed yet
      const nodemailer = await import('nodemailer');
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      this.logger.log(`SMTP configured: ${host}:${process.env.SMTP_PORT ?? '587'}`);
    } catch (err) {
      this.logger.error('Failed to init nodemailer transporter:', err);
    }
  }

  async sendWelcomeCustomer(opts: {
    to: string;
    name: string;
    tempPassword: string;
    companyName: string;
    portalUrl?: string;
  }): Promise<void> {
    const portalUrl = opts.portalUrl ?? process.env.CUSTOMER_PORTAL_URL ?? 'http://localhost:5174';
    const subject = `Your ${opts.companyName} customer portal access`;
    const body = `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi <strong>${opts.name}</strong>,</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:${TEXT_MUTED};">
        An account has been created for you so you can track your jobs, view invoices, and message our team directly.
      </p>
      ${emailInfoBox({
        accent: 'blue',
        label: 'Your login details',
        html: `
          <p style="margin:4px 0;font-size:13.5px;"><strong>Portal:</strong> <a href="${portalUrl}" style="color:${EMAIL_ACCENT.blue};">${portalUrl}</a></p>
          <p style="margin:4px 0;font-size:13.5px;"><strong>Email:</strong> ${opts.to}</p>
          <p style="margin:4px 0;font-size:13.5px;"><strong>Temporary password:</strong> <code style="background:#e0eaff;padding:2px 8px;border-radius:5px;font-size:14px;letter-spacing:0.5px;">${opts.tempPassword}</code></p>
        `,
      })}
      ${emailInfoBox({
        accent: 'amber',
        html: `<p style="margin:0;font-size:13px;line-height:1.6;color:#92400e;">You'll be asked to set a new password the first time you sign in.</p>`,
      })}
      <p style="margin:0;font-size:13.5px;line-height:1.7;color:${TEXT_MUTED};">Questions? Just reply to this email.</p>
    `;
    const html = renderEmailCard({
      accent: 'blue',
      eyebrow: 'Account created',
      title: `Welcome to ${opts.companyName}`,
      subtitle: 'Your customer portal is ready to use.',
      bodyHtml: body,
      companyName: opts.companyName,
    });

    await this.send({ to: opts.to, subject, html, companyName: opts.companyName });
  }

  async sendWelcomeTechnician(opts: {
    to: string;
    name: string;
    tempPassword: string;
    companyName: string;
    appName?: string;
  }): Promise<void> {
    const subject = `Your ${opts.companyName} technician account`;
    const body = `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi <strong>${opts.name}</strong>,</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:${TEXT_MUTED};">
        Your technician account at <strong>${opts.companyName}</strong> is set up. Download the
        <strong>${opts.appName ?? 'HVACtor.ai Technician'}</strong> app and sign in below.
      </p>
      ${emailInfoBox({
        accent: 'violet',
        label: 'Your login details',
        html: `
          <p style="margin:4px 0;font-size:13.5px;"><strong>Email:</strong> ${opts.to}</p>
          <p style="margin:4px 0;font-size:13.5px;"><strong>Temporary password:</strong> <code style="background:#ede9fe;padding:2px 8px;border-radius:5px;font-size:14px;letter-spacing:0.5px;">${opts.tempPassword}</code></p>
        `,
      })}
      ${emailInfoBox({
        accent: 'amber',
        html: `<p style="margin:0;font-size:13px;line-height:1.6;color:#92400e;">You must set a new password on first sign-in before you can start taking jobs.</p>`,
      })}
      <p style="margin:0;font-size:13.5px;line-height:1.7;color:${TEXT_MUTED};">Questions? Contact your dispatcher or admin.</p>
    `;
    const html = renderEmailCard({
      accent: 'violet',
      eyebrow: 'Account created',
      title: 'Welcome to the team',
      subtitle: `Your ${opts.companyName} technician account has been set up.`,
      bodyHtml: body,
      companyName: opts.companyName,
    });

    await this.send({ to: opts.to, subject, html, companyName: opts.companyName });
  }

  async sendPasswordResetConfirmation(opts: {
    to: string;
    name: string;
    companyName: string;
    portalUrl?: string;
  }): Promise<void> {
    const portalUrl = opts.portalUrl ?? process.env.CUSTOMER_PORTAL_URL ?? 'http://localhost:5174';
    const subject = `Your ${opts.companyName} password was changed`;
    const when = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const body = `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi <strong>${opts.name}</strong>,</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:${TEXT_MUTED};">
        This confirms the password for your ${opts.companyName} account was changed on <strong>${when}</strong>.
      </p>
      ${emailInfoBox({
        accent: 'green',
        html: `<p style="margin:0;font-size:13px;line-height:1.7;color:${TEXT_MUTED};">Sign in with your new password any time at <a href="${portalUrl}" style="color:${EMAIL_ACCENT.green};font-weight:600;">${portalUrl}</a>.</p>`,
      })}
      ${emailInfoBox({
        accent: 'red',
        html: `<p style="margin:0;font-size:13px;line-height:1.6;color:#991b1b;"><strong>Wasn't you?</strong> Contact us immediately so we can secure your account.</p>`,
      })}
    `;
    const html = renderEmailCard({
      accent: 'green',
      eyebrow: 'Security update',
      title: 'Password changed successfully',
      bodyHtml: body,
      companyName: opts.companyName,
    });

    await this.send({ to: opts.to, subject, html, companyName: opts.companyName });
  }

  async sendMail(opts: { to: string; subject: string; html: string; companyName?: string }): Promise<void> {
    return this.send(opts);
  }

  private async send(opts: { to: string; subject: string; html: string; companyName?: string }): Promise<void> {
    const fromName = opts.companyName?.trim() || SMTP_FROM_NAME_DEFAULT;
    const from = SMTP_FROM_EMAIL ? `${fromName} <${SMTP_FROM_EMAIL}>` : fromName;

    if (!this.transporter) {
      // Dev fallback — print to console so admins can see the temp password
      this.logger.warn('━━━ DEV EMAIL (no SMTP configured) ━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.warn(`FROM:    ${from}`);
      this.logger.warn(`TO:      ${opts.to}`);
      this.logger.warn(`SUBJECT: ${opts.subject}`);
      // Extract text content from HTML for readable console output
      const text = opts.html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      this.logger.warn('BODY:\n' + text);
      this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }
    try {
      await this.transporter.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
      this.logger.log(`Email sent to ${opts.to}: ${opts.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}:`, err);
      // Don't throw — email failure should not block account creation
    }
  }
}
