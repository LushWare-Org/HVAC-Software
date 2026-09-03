import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { PartnerAuthModule } from './auth/auth.module';
import { ApiKeyGuard } from './auth/api-key.guard';
import { ScopesGuard } from './auth/scopes.guard';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';
import { CallLogMiddleware } from './logging/call-log.middleware';
import { InternalModule } from './internal/internal.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { DocsModule } from './docs/docs.module';
import { V1Module } from './v1/v1.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    RateLimitModule,
    InternalModule,
    PartnerAuthModule,
    HealthModule,
    DocsModule,
    WebhooksModule,
    V1Module,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: ScopesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Middleware, not an interceptor — see CallLogMiddleware for why.
    consumer.apply(CallLogMiddleware).forRoutes('*');
  }
}
