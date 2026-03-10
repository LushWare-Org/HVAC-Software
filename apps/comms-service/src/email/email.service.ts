/**
 * EmailService — SendGrid email delivery
 *
 * Uses @sendgrid/mail for transactional email.
 * Handlebars templates are compiled server-side — we send HTML bodies,
 * NOT SendGrid dynamic templates (keeps template control in our codebase).
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import * as Handlebars from 'handlebars';

export interface EmailDeliveryResult {
  success: boolean;
  externalId?: string;   // SendGrid message-id from X-Message-Id header
  error?: string;
  durationMs: number;
}

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;      // Pre-rendered HTML (we render HBS before calling this)
  textBody?: string;     // Plain text fallback
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isConfigured: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('sendgrid.apiKey') ?? '';
    this.fromEmail = this.config.get<string>('sendgrid.fromEmail') ?? 'no-reply@tscrm.com';
    this.fromName = this.config.get<string>('sendgrid.fromName') ?? 'T&S Services';
    this.isConfigured = !!apiKey;

    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      this.logger.warn('SendGrid API key not set — emails will be logged only in non-prod');
    }
  }

  async send(opts: SendEmailOptions): Promise<EmailDeliveryResult> {
    const start = Date.now();
    try {
      if (!this.isConfigured) {
        this.logger.debug(`[MOCK EMAIL] To: ${opts.to} | Subject: ${opts.subject}`);
        return { success: true, externalId: `mock-msg-${Date.now()}`, durationMs: 0 };
      }

      const msg: sgMail.MailDataRequired = {
        to: { email: opts.to, name: opts.toName },
        from: { email: this.fromEmail, name: this.fromName },
        replyTo: opts.replyTo ?? this.fromEmail,
        subject: opts.subject,
        html: opts.htmlBody,
        text: opts.textBody ?? this.htmlToText(opts.htmlBody),
      };

      const [response] = await sgMail.send(msg);
      const externalId = Array.isArray(response.headers['x-message-id'])
        ? response.headers['x-message-id'][0]
        : response.headers['x-message-id'] ?? undefined;

      this.logger.log(`Email sent to ${opts.to} — subject: ${opts.subject}`);
      return { success: true, externalId, durationMs: Date.now() - start };
    } catch (err) {
      const error = (err as Error).message;
      this.logger.error(`Email send failed to ${opts.to}: ${error}`);
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
