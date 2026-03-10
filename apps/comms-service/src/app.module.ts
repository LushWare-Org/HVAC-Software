import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '@tscrm/auth-client';
import appConfig from './config/app.config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { SmsModule } from './sms/sms.module';
import { EmailModule } from './email/email.module';
import { PushModule } from './push/push.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TemplatesModule } from './templates/templates.module';
import { MessagingModule } from './messaging/messaging.module';
import { AutomationModule } from './automation/automation.module';

@Module({
  imports: [
    // ── Config ─────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['../../.env', '.env'],
    }),

    // ── Redis / BullMQ connection (global) ─────────────────────────────────
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    }),

    // ── Auth ───────────────────────────────────────────────────────────────
    AuthModule,

    // ── Infrastructure ─────────────────────────────────────────────────────
    HealthModule,
    PrismaModule,

    // ── Provider modules ───────────────────────────────────────────────────
    SmsModule,
    EmailModule,
    PushModule,

    // ── Domain modules ─────────────────────────────────────────────────────
    NotificationsModule,
    TemplatesModule,
    MessagingModule,
    AutomationModule,
  ],
})
export class AppModule {}
