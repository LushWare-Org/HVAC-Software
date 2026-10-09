import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { EnRouteController } from './enroute.controller';
import { EnRouteNotificationService } from './enroute.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JobUpdatesModule } from '../job-updates/job-updates.module';

@Module({
  imports: [NotificationsModule, CompanySettingsModule, PrismaModule, JobUpdatesModule],
  controllers: [EnRouteController],
  providers: [EnRouteNotificationService],
  exports: [EnRouteNotificationService],
})
export class EnRouteModule {}
