import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: Record<string, string>;
}

@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger(WebPushService.name);
  private enabled = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('vapid.publicKey') ?? '';
    const privateKey = this.config.get<string>('vapid.privateKey') ?? '';
    const subject = this.config.get<string>('vapid.subject') ?? 'mailto:admin@tscrm.com';

    if (!publicKey || !privateKey) {
      this.logger.warn('VAPID keys not configured — web push disabled');
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.enabled = true;
    this.logger.log('Web push (VAPID) initialised');
  }

  getPublicKey(): string {
    return this.config.get<string>('vapid.publicKey') ?? '';
  }

  async subscribe(
    companyId: string,
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
    userAgent?: string,
  ) {
    return this.prisma.webPushSubscription.upsert({
      where: { endpoint },
      create: { companyId, userId, endpoint, p256dh, auth, userAgent },
      update: { companyId, userId, p256dh, auth, userAgent },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.webPushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  async sendToUser(userId: string, payload: WebPushPayload): Promise<void> {
    if (!this.enabled) return;

    const subs = await this.prisma.webPushSubscription.findMany({ where: { userId } });
    const dead: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
          );
        } catch (err: any) {
          // 410 Gone = subscription expired; clean it up
          if (err?.statusCode === 410) dead.push(sub.endpoint);
          else this.logger.warn(`Web push failed for ${sub.endpoint}: ${err?.message}`);
        }
      }),
    );

    if (dead.length) {
      await this.prisma.webPushSubscription.deleteMany({ where: { endpoint: { in: dead } } });
    }
  }

  async sendToCompany(companyId: string, payload: WebPushPayload): Promise<void> {
    if (!this.enabled) return;

    const subs = await this.prisma.webPushSubscription.findMany({ where: { companyId } });
    const dead: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
          );
        } catch (err: any) {
          if (err?.statusCode === 410) dead.push(sub.endpoint);
        }
      }),
    );

    if (dead.length) {
      await this.prisma.webPushSubscription.deleteMany({ where: { endpoint: { in: dead } } });
    }
  }
}
