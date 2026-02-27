import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@tscrm/auth-client';
import { HealthModule } from './health/health.module';

// TODO Week 6: Add SMSModule, EmailModule, PushNotificationsModule, WorkflowAutomationModule
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
