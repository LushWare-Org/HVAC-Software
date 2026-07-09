import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { EnRouteController } from './enroute.controller';
import { EnRouteNotificationService } from './enroute.service';

@Module({
  imports: [NotificationsModule, CompanySettingsModule],
  controllers: [EnRouteController],
  providers: [EnRouteNotificationService],
})
export class EnRouteModule {}
