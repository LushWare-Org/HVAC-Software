/**
 * EmailService — Transactional email sending for CRM.
 *
 * Configuration (set in .env):
 *   SMTP_HOST     — e.g. smtp.gmail.com
 *   SMTP_PORT     — 587 (TLS) or 465 (SSL)
 *   SMTP_USER     — sender email address
 *   SMTP_PASS     — app password / SMTP password
 *   SMTP_FROM     — "T&S Services <noreply@example.com>"
 *
 * Dev fallback: if SMTP_HOST is not set, emails are printed to the console
 * so you can see the temp password during development without needing SMTP.
 */

import { Injectable, Logger } from '@nestjs/common';

const APP_NAME = process.env.APP_NAME ?? 'T&S Services';

// Accept either:
//   SMTP_FROM="T&S Services <noreply@example.com>"   (single var, full format)
//   SMTP_FROM_NAME + SMTP_FROM_EMAIL                 (two-var format used by some providers)
// Falls back to the sender's SMTP_USER if no explicit from address is set.
// Never falls back to a fake domain — that guarantees spam filtering.
function resolveSmtpFrom(): string {
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  const name  = process.env.SMTP_FROM_NAME  ?? APP_NAME;
  const email = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER ?? '';
  return email ? `${name} <${email}>` : name;
}
const SMTP_FROM = resolveSmtpFrom();

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
    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 28px 24px; border-radius: 12px; margin-bottom: 24px;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">Welcome to ${opts.companyName}! 🎉</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">Your customer portal account is ready.</p>
  </div>

  <p>Hi <strong>${opts.name}</strong>,</p>
  <p>An account has been created for you so you can track your jobs, view invoices, and communicate with our team.</p>

  <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
    <p style="margin: 0 0 8px; font-size: 13px; color: #0369a1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Details</p>
    <p style="margin: 4px 0;"><strong>Portal:</strong> <a href="${portalUrl}" style="color: #2563eb;">${portalUrl}</a></p>
    <p style="margin: 4px 0;"><strong>Email:</strong> ${opts.to}</p>
    <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="background: #e0f2fe; padding: 2px 8px; border-radius: 4px; font-size: 15px; letter-spacing: 1px;">${opts.tempPassword}</code></p>
  </div>

  <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
    <p style="margin: 0; font-size: 13px; color: #92400e;">
      ⚠️ <strong>Important:</strong> You will be asked to set a new password when you first sign in. Please do this before continuing.
    </p>
  </div>

  <p>If you have any questions, simply reply to this email or contact us directly.</p>
  <p>Welcome aboard!<br><strong>${opts.companyName} Team</strong></p>
</body>
</html>`;

    await this.send({ to: opts.to, subject, html });
  }

  async sendWelcomeTechnician(opts: {
    to: string;
    name: string;
    tempPassword: string;
    companyName: string;
    appName?: string;
  }): Promise<void> {
    const subject = `Your ${opts.companyName} technician account`;
    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 28px 24px; border-radius: 12px; margin-bottom: 24px;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">Welcome to the Team! 🔧</h1>
    <p style="color: #ddd6fe; margin: 8px 0 0;">Your technician account has been set up.</p>
  </div>

  <p>Hi <strong>${opts.name}</strong>,</p>
  <p>Your technician account at <strong>${opts.companyName}</strong> has been created by an administrator. Download the <strong>${opts.appName ?? 'T&S Technician'}</strong> app and sign in with the credentials below.</p>

  <div style="background: #faf5ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
    <p style="margin: 0 0 8px; font-size: 13px; color: #7c3aed; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Details</p>
    <p style="margin: 4px 0;"><strong>Email:</strong> ${opts.to}</p>
    <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="background: #ede9fe; padding: 2px 8px; border-radius: 4px; font-size: 15px; letter-spacing: 1px;">${opts.tempPassword}</code></p>
  </div>

  <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
    <p style="margin: 0; font-size: 13px; color: #92400e;">
      ⚠️ <strong>Action required:</strong> You will be prompted to set a new password when you first sign in. This must be done before you can use the app.
    </p>
  </div>

  <p>Questions? Contact your administrator directly.</p>
  <p>Good luck!<br><strong>${opts.companyName} Admin Team</strong></p>
</body>
</html>`;

    await this.send({ to: opts.to, subject, html });
  }

  private async send(opts: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.transporter) {
      // Dev fallback — print to console so admins can see the temp password
      this.logger.warn('━━━ DEV EMAIL (no SMTP configured) ━━━━━━━━━━━━━━━━━━━━━━');
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
      await this.transporter.sendMail({ from: SMTP_FROM, to: opts.to, subject: opts.subject, html: opts.html });
      this.logger.log(`Email sent to ${opts.to}: ${opts.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}:`, err);
      // Don't throw — email failure should not block account creation
    }
  }
}
