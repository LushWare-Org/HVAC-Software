/**
 * PushService — Firebase Cloud Messaging (FCM) push notifications
 *
 * Supports:
 *  - Single device push (token)
 *  - Topic-based broadcast (e.g. company-wide announcements)
 *  - Multicast to a list of tokens (up to 500 per call)
 *
 * Uses firebase-admin SDK (server-side) — credentials loaded from env vars.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PushDeliveryResult {
  success: boolean;
  externalId?: string;   // FCM message-id
  failedTokens?: string[];
  error?: string;
  durationMs: number;
}

export interface PushNotificationOptions {
  title: string;
  body: string;
  data?: Record<string, string>; // custom key-value pairs
  imageUrl?: string;
  sound?: string;
  badge?: number;           // iOS badge count
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private app: admin.app.App | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>('firebase.projectId') ?? '';
    const clientEmail = this.config.get<string>('firebase.clientEmail') ?? '';
    const privateKey = this.config.get<string>('firebase.privateKey') ?? '';

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase credentials not set — push notifications will be mocked');
      return;
    }

    // Avoid re-initialisation when hot-reloaded in dev
    if (!admin.apps.length) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      this.app = admin.app();
    }

    this.logger.log('Firebase Admin SDK initialised');
  }

  /**
   * Send to a single device token.
   */
  async sendToToken(token: string, opts: PushNotificationOptions): Promise<PushDeliveryResult> {
    const start = Date.now();
    try {
      if (!this.app) {
        this.logger.debug(`[MOCK PUSH] Token: ${token.substring(0, 20)}… | ${opts.title}`);
        return { success: true, externalId: `mock-fcm-${Date.now()}`, durationMs: 0 };
      }

      const message: admin.messaging.Message = {
        token,
        notification: { title: opts.title, body: opts.body, imageUrl: opts.imageUrl },
        data: opts.data,
        apns: {
          payload: {
            aps: {
              badge: opts.badge,
              sound: opts.sound ?? 'default',
            },
          },
        },
        android: {
          notification: { sound: opts.sound ?? 'default' },
        },
      };

      const messageId = await admin.messaging(this.app).send(message);
      this.logger.log(`Push sent to token — id: ${messageId}`);
      return { success: true, externalId: messageId, durationMs: Date.now() - start };
    } catch (err) {
      const error = (err as Error).message;
      this.logger.error(`Push failed for token: ${error}`);
      return { success: false, error, durationMs: Date.now() - start };
    }
  }

  /**
   * Multicast to up to 500 tokens in a single FCM request.
   */
  async sendMulticast(tokens: string[], opts: PushNotificationOptions): Promise<PushDeliveryResult> {
    const start = Date.now();
    if (!this.app) {
      this.logger.debug(`[MOCK PUSH MULTICAST] ${tokens.length} tokens | ${opts.title}`);
      return { success: true, durationMs: 0 };
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title: opts.title, body: opts.body },
      data: opts.data,
    };

    try {
      const batchResponse = await admin.messaging(this.app).sendEachForMulticast(message);
      const failedTokens = batchResponse.responses
        .map((r, i) => (!r.success ? tokens[i] : null))
        .filter((t): t is string => t !== null);

      this.logger.log(
        `Push multicast: ${batchResponse.successCount} sent, ${batchResponse.failureCount} failed`,
      );
      return {
        success: batchResponse.failureCount === 0,
        failedTokens,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      const error = (err as Error).message;
      this.logger.error(`Push multicast failed: ${error}`);
      return { success: false, error, durationMs: Date.now() - start };
    }
  }

  /**
   * Send to a topic (e.g. "company-uuid-announcements").
   */
  async sendToTopic(topic: string, opts: PushNotificationOptions): Promise<PushDeliveryResult> {
    const start = Date.now();
    if (!this.app) {
      this.logger.debug(`[MOCK PUSH TOPIC] Topic: ${topic} | ${opts.title}`);
      return { success: true, durationMs: 0 };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: { title: opts.title, body: opts.body },
        data: opts.data,
      };
      const messageId = await admin.messaging(this.app).send(message);
      return { success: true, externalId: messageId, durationMs: Date.now() - start };
    } catch (err) {
      const error = (err as Error).message;
      return { success: false, error, durationMs: Date.now() - start };
    }
  }
}
