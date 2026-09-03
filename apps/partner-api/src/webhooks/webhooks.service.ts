import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PartnerEventType } from '@tscrm/queue';
import { PrismaService } from '../prisma/prisma.service';

export const ALL_EVENT_TYPES: string[] = Object.values(PartnerEventType);

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    companyId: string,
    keyId: string,
    input: { url: string; events: string[]; description?: string },
  ) {
    const unknown = input.events.filter((e) => !ALL_EVENT_TYPES.includes(e));
    if (unknown.length) {
      throw new BadRequestException(
        `Unknown event type(s): ${unknown.join(', ')}. Supported: ${ALL_EVENT_TYPES.join(', ')}`,
      );
    }

    this.assertDeliverableUrl(input.url);

    const secret = `whsec_${randomBytes(32).toString('hex')}`;
    const webhook = await this.prisma.partnerWebhook.create({
      data: {
        companyId,
        apiKeyId: keyId,
        url: input.url,
        secret,
        events: input.events,
        description: input.description ?? null,
      },
    });

    return {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      status: webhook.status,
      createdAt: webhook.createdAt,
      // Returned once, like an API key. Needed to verify our signature.
      secret,
      signatureNote:
        'Each delivery carries x-tscrm-timestamp and x-tscrm-signature. ' +
        'Recompute as HMAC-SHA256 of "<timestamp>.<raw body>" using this secret.',
    };
  }

  async list(companyId: string) {
    const hooks = await this.prisma.partnerWebhook.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    // The secret is never listed — only shown once, at registration.
    return hooks.map((w) => ({
      id: w.id,
      url: w.url,
      events: w.events,
      status: w.status,
      description: w.description,
      failureCount: w.failureCount,
      lastSuccessAt: w.lastSuccessAt,
      lastFailureAt: w.lastFailureAt,
      createdAt: w.createdAt,
    }));
  }

  async remove(companyId: string, id: string) {
    const existing = await this.prisma.partnerWebhook.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }
    await this.prisma.partnerWebhook.delete({ where: { id } });
    return { id, deleted: true };
  }

  async deliveries(companyId: string, id: string, limit = 20) {
    const existing = await this.prisma.partnerWebhook.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }
    return this.prisma.partnerWebhookDelivery.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      select: {
        eventType: true,
        entityId: true,
        attempt: true,
        statusCode: true,
        success: true,
        error: true,
        durationMs: true,
        createdAt: true,
      },
    });
  }

  /**
   * Rejects endpoints that would turn our outbound delivery into a probe of
   * our own network — the classic SSRF shape for a user-supplied webhook URL.
   */
  private assertDeliverableUrl(raw: string): void {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new BadRequestException('Webhook url must be an absolute URL');
    }

    // Two separate escape hatches on purpose. Allowing plain http for a local
    // integration test must NOT also switch off the internal-address check —
    // conflating them turns a convenience flag into an SSRF hole.
    const allowHttp = process.env.PARTNER_WEBHOOK_ALLOW_HTTP === 'true';
    const allowPrivateHost = process.env.PARTNER_WEBHOOK_ALLOW_PRIVATE_HOST === 'true';

    if (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) {
      throw new BadRequestException('Webhook url must use https');
    }

    const host = url.hostname.toLowerCase();
    const isPrivate =
      host === 'localhost' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host);

    if (isPrivate && !allowPrivateHost) {
      throw new BadRequestException(
        'Webhook url must be a publicly reachable host',
      );
    }
  }
}
