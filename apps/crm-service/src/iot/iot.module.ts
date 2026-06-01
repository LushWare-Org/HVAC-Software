import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../email/email.service';
import { IotController } from './iot.controller';
import { IotService } from './iot.service';
import { HoneywellClient } from './honeywell.client';
import { NestClient } from './nest.client';
import { IotTokenRefreshService } from './iot-token-refresh.service';
import { IotAlertsService } from './iot-alerts.service';
import { JobsClient } from './jobs.client';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [IotController],
  providers: [IotService, HoneywellClient, NestClient, IotTokenRefreshService, IotAlertsService, EmailService, JobsClient],
  exports: [IotService],
})
export class IotModule {}
