/**
 * EmailService — SMTP / SendGrid email delivery
 *
 * Free-first strategy:
 *  - SMTP (Brevo/Gmail/Zoho/etc.) when configured
 *  - SendGrid as fallback when SMTP is not configured
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import * as Handlebars from 'handlebars';
import nodemailer, { Transporter } from 'nodemailer';

const sgMailClient = (
  (sgMail as unknown as { default?: typeof sgMail }).default ?? sgMail
) as typeof sgMail;

type EmailProvider = 'smtp' | 'sendgrid' | 'none';

export interface EmailDeliveryResult {
  success: boolean;
  provider?: 'smtp' | 'sendgrid';
  externalId?: string;   // SendGrid message-id from X-Message-Id header
  error?: string;
  durationMs: number;
}

export interface SendEmailAttachment {
  filename: string;
  contentType: string;
  contentBase64: string;
}

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;      // Pre-rendered HTML (we render HBS before calling this)
  textBody?: string;     // Plain text fallback
  replyTo?: string;
  attachments?: SendEmailAttachment[];
  headers?: Record<string, string>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;

  get senderEmail(): string { return this.fromEmail; }
  private readonly provider: EmailProvider;
  private readonly smtpTransporter?: Transporter;

  constructor(private readonly config: ConfigService) {
    const configuredProvider = (this.config.get<string>('email.provider') ?? 'auto').toLowerCase();

    const smtpHost = this.config.get<string>('smtp.host') ?? '';
    const smtpPort = Number(this.config.get<number>('smtp.port') ?? 587);
    const smtpSecure = Boolean(this.config.get<boolean>('smtp.secure') ?? false);
    const smtpUser = this.config.get<string>('smtp.user') ?? '';
    const smtpPass = this.config.get<string>('smtp.pass') ?? '';

    const smtpConfigured = Boolean(smtpHost && smtpUser && smtpPass);

    const apiKey = this.config.get<string>('sendgrid.apiKey') ?? '';
    const sendgridConfigured = Boolean(apiKey);

    if (configuredProvider === 'smtp') {
      this.provider = smtpConfigured ? 'smtp' : 'none';
    } else if (configuredProvider === 'sendgrid') {
      this.provider = sendgridConfigured ? 'sendgrid' : 'none';
    } else {
      // auto mode: prefer SMTP to keep costs low, fallback to SendGrid.
      this.provider = smtpConfigured ? 'smtp' : sendgridConfigured ? 'sendgrid' : 'none';
    }

    this.fromEmail =
      this.provider === 'smtp'
        ? this.config.get<string>('smtp.fromEmail') ?? this.config.get<string>('sendgrid.fromEmail') ?? 'no-reply@tscrm.com'
        : this.config.get<string>('sendgrid.fromEmail') ?? this.config.get<string>('smtp.fromEmail') ?? 'no-reply@tscrm.com';
    this.fromName =
      this.provider === 'smtp'
        ? this.config.get<string>('smtp.fromName') ?? this.config.get<string>('sendgrid.fromName') ?? 'T&S Services'
        : this.config.get<string>('sendgrid.fromName') ?? this.config.get<string>('smtp.fromName') ?? 'T&S Services';

    if (this.provider === 'smtp') {
      this.smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log(`Email provider: SMTP (${smtpHost}:${smtpPort})`);
    } else if (this.provider === 'sendgrid') {
      sgMailClient.setApiKey(apiKey);
      this.logger.log('Email provider: SendGrid');
    } else {
      this.logger.error(
        'No email provider configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS (free-friendly) or SENDGRID_API_KEY.',
      );
    }
  }

  async send(opts: SendEmailOptions): Promise<EmailDeliveryResult> {
    const start = Date.now();
    try {
      if (this.provider === 'none') {
        const missingConfigError = 'No email provider configured in comms-service';
        this.logger.error(`Email send blocked to ${opts.to}: ${missingConfigError}`);
        return { success: false, error: missingConfigError, durationMs: Date.now() - start };
      }

      if (this.provider === 'smtp') {
        if (!this.smtpTransporter) {
          return { success: false, error: 'SMTP transporter is not initialized', durationMs: Date.now() - start };
        }

        const info = await this.smtpTransporter.sendMail({
          from: { name: this.fromName, address: this.fromEmail },
          to: opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
          replyTo: opts.replyTo ?? this.fromEmail,
          subject: opts.subject,
          html: opts.htmlBody,
          text: opts.textBody ?? this.htmlToText(opts.htmlBody),
          headers: opts.headers,
          attachments: (opts.attachments ?? []).map((attachment) => ({
            filename: attachment.filename,
            content: Buffer.from(attachment.contentBase64, 'base64'),
            contentType: attachment.contentType,
          })),
        });

        const externalId =
          (Array.isArray(info.messageId) ? info.messageId[0] : info.messageId) ||
          (Array.isArray((info as any).response) ? (info as any).response[0] : (info as any).response) ||
          undefined;

        this.logger.log(`Email sent via SMTP to ${opts.to} — subject: ${opts.subject}`);
        return { success: true, provider: 'smtp', externalId, durationMs: Date.now() - start };
      }

      const msg: sgMail.MailDataRequired = {
        to: { email: opts.to, name: opts.toName },
        from: { email: this.fromEmail, name: this.fromName },
        replyTo: opts.replyTo ?? this.fromEmail,
        subject: opts.subject,
        html: opts.htmlBody,
        text: opts.textBody ?? this.htmlToText(opts.htmlBody),
        attachments: (opts.attachments ?? []).map((attachment) => ({
          content: attachment.contentBase64,
          filename: attachment.filename,
          type: attachment.contentType,
          disposition: 'attachment',
        })),
      };

      const [response] = await sgMailClient.send(msg);
      const externalId = Array.isArray(response.headers['x-message-id'])
        ? response.headers['x-message-id'][0]
        : response.headers['x-message-id'] ?? undefined;

      this.logger.log(`Email sent to ${opts.to} — subject: ${opts.subject}`);
      return { success: true, provider: 'sendgrid', externalId, durationMs: Date.now() - start };
    } catch (err) {
      const sgError = err as {
        message?: string;
        code?: number;
        response?: { body?: { errors?: Array<{ message?: string }> } };
      };
      const providerMessage = sgError.response?.body?.errors
        ?.map((e) => e.message)
        .filter(Boolean)
        .join('; ');
      const error = providerMessage || sgError.message || 'Unknown email provider error';
      const statusText = sgError.code ? ` (${sgError.code})` : '';
      this.logger.error(`Email send failed to ${opts.to}${statusText}: ${error}`);
      return { success: false, error, durationMs: Date.now() - start };
    }
  }

  /**
   * Compile a Handlebars template string with context variables.
   * Used by processors and automation workflows.
   */
  compileTemplate(templateStr: string, context: Record<string, unknown>): string {
    const compiled = Handlebars.compile(templateStr);
    return compiled(context);
  }

  /**
   * Naive HTML → plain text strip for text fallback.
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }
}
