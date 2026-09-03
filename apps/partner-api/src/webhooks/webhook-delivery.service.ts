import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { PartnerEventJob } from '@tscrm/queue';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Delivers business events to partner endpoints.
 *
 * Every request is signed so a partner can prove the payload came from us and
 * was not tampered with. A partner endpoint that keeps failing is suspended
 * rather than retried forever — one broken integration must not consume the
 * delivery budget of every other partner.
 */

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 4;
/** Consecutive failures before an endpoint is parked. */
const FAILURE_SUSPEND_THRESHOLD = 20;

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Signature a partner should recompute to verify a delivery.
   * Signing the timestamp alongside the body stops a captured request being
   * replayed later.
   */
  static sign(secret: string, timestamp: string, body: string): string {
    return createHmac('sha256', secret)
      .update(`${timestamp}.${body}`)
      .digest('hex');
  }

  /** Constant-time comparison helper, published for partners' own tests. */
  static verify(
    secret: string,
    timestamp: string,
    body: string,
    presented: string,
  ): boolean {
    const expected = WebhookDeliveryService.sign(secret, timestamp, body);
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(presented ?? '', 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /** Fans one event out to every matching subscription for its company. */
  async dispatch(event: PartnerEventJob): Promise<{ delivered: number; failed: number }> {
    const subscriptions = await this.prisma.partnerWebhook.findMany({
      where: {
        companyId: event.companyId,
        status: 'ACTIVE',
        events: { has: event.type },
      },
    });

    if (!subscriptions.length) {
      return { delivered: 0, failed: 0 };
    }

    // Partners are independent — one slow endpoint must not delay the others.
    const results = await Promise.all(
      subscriptions.map((sub) => this.deliver(sub, event)),
    );

    return {
      delivered: results.filter(Boolean).length,
      failed: results.filter((r) => !r).length,
    };
  }

  private async deliver(subscription: any, event: PartnerEventJob): Promise<boolean> {
    const body = JSON.stringify({
      id: `${event.type}:${event.entityId}:${event.occurredAt}`,
      type: event.type,
      occurredAt: event.occurredAt,
      data: { id: event.entityId, ...event.data },
    });

    const timeoutMs = Number(process.env.PARTNER_WEBHOOK_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const timestamp = String(Date.now());
      const startedAt = Date.now();

      try {
        const res = await axios.post(subscription.url, body, {
          timeout: timeoutMs,
          headers: {
            'content-type': 'application/json',
            'x-tscrm-event': event.type,
            'x-tscrm-timestamp': timestamp,
            'x-tscrm-signature': WebhookDeliveryService.sign(
              subscription.secret,
              timestamp,
              body,
            ),
            'x-tscrm-delivery-attempt': String(attempt),
          },
          // 4xx is the partner's answer, not a transport failure — inspect it
          // rather than letting axios throw, so we don't retry a rejection.
          validateStatus: () => true,
        });

        const ok = res.status >= 200 && res.status < 300;
        await this.recordAttempt(subscription, event, attempt, {
          statusCode: res.status,
          success: ok,
          durationMs: Date.now() - startedAt,
        });

        if (ok) {
          await this.markSuccess(subscription.id);
          return true;
        }

        // A 4xx other than 429 means the partner rejected the payload;
        // retrying an identical body will not help.
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          await this.markFailure(subscription.id);
          return false;
        }
      } catch (err: any) {
        await this.recordAttempt(subscription, event, attempt, {
          success: false,
          error: err?.message ?? String(err),
          durationMs: Date.now() - startedAt,
        });
      }

      if (attempt < MAX_ATTEMPTS) {
        await this.sleep(this.backoffMs(attempt));
      }
    }

    await this.markFailure(subscription.id);
    return false;
  }

  /** 1s, 4s, 9s — spread out enough for a brief outage to clear. */
  private backoffMs(attempt: number): number {
    return attempt * attempt * 1000;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async recordAttempt(
    subscription: any,
    event: PartnerEventJob,
    attempt: number,
    outcome: {
      statusCode?: number;
      success: boolean;
      error?: string;
      durationMs: number;
    },
  ): Promise<void> {
    try {
      await this.prisma.partnerWebhookDelivery.create({
        data: {
          webhookId: subscription.id,
          companyId: subscription.companyId,
          eventType: event.type,
          entityId: event.entityId,
          attempt,
          statusCode: outcome.statusCode ?? null,
          success: outcome.success,
          error: outcome.error?.slice(0, 500) ?? null,
          durationMs: outcome.durationMs,
        },
      });
    } catch (err) {
      this.logger.warn(`Could not record webhook delivery: ${err}`);
    }
  }

  private async markSuccess(id: string): Promise<void> {
    await this.prisma.partnerWebhook
      .update({
        where: { id },
        data: { failureCount: 0, lastSuccessAt: new Date() },
      })
      .catch(() => undefined);
  }

  private async markFailure(id: string): Promise<void> {
    try {
      const updated = await this.prisma.partnerWebhook.update({
        where: { id },
        data: { failureCount: { increment: 1 }, lastFailureAt: new Date() },
      });

      if (updated.failureCount >= FAILURE_SUSPEND_THRESHOLD) {
        await this.prisma.partnerWebhook.update({
          where: { id },
          data: { status: 'SUSPENDED' },
        });
        this.logger.warn(
          `Suspended webhook ${id} after ${updated.failureCount} consecutive failures`,
        );
      }
    } catch {
      // The subscription may have been deleted mid-flight.
    }
  }
}
