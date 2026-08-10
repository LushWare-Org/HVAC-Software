import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@tscrm/auth-client';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { TradeTemplatesModule } from './trade-templates/trade-templates.module';
import { PriceBookModule } from './price-book/price-book.module';
import { JobsModule } from './jobs/jobs.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { RescheduleModule } from './reschedule/reschedule.module';
import { RealtimeModule } from './realtime/realtime.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['../../.env', '.env'],
    }),
    AuthModule,
    PrismaModule,
    RealtimeModule,
    HealthModule,
    TradeTemplatesModule,
    PriceBookModule,
    JobsModule,
    WorkOrdersModule,
    RescheduleModule,
  ],
})
export class AppModule {}
