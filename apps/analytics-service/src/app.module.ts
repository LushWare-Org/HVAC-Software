import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@tscrm/auth-client';
import appConfig from './app.config';
import { RedisCacheService } from './redis-cache.service';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RevenueModule } from './revenue/revenue.module';
import { TechnicianMetricsModule } from './technician-metrics/technician-metrics.module';
import { JobsAnalyticsModule } from './jobs-analytics/jobs-analytics.module';
import { CustomerAnalyticsModule } from './customer-analytics/customer-analytics.module';
import { ExportsModule } from './exports/exports.module';
import { EventsModule } from './events/events.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { RevenueAgentModule } from './revenue-agent/revenue-agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      load: [appConfig],
    }),
    AuthModule,
    PrismaModule,
    HealthModule,
    DashboardModule,
    RevenueModule,
    TechnicianMetricsModule,
    JobsAnalyticsModule,
    CustomerAnalyticsModule,
    ExportsModule,
    EventsModule,
    RecommendationsModule,
    RevenueAgentModule,
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class AppModule {}
