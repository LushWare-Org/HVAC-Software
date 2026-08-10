import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { RescheduleNotificationController } from './reschedule.controller';
import { RescheduleNotificationService } from './reschedule-notification.service';

@Module({
  imports: [NotificationsModule, CompanySettingsModule],
  controllers: [RescheduleNotificationController],
  providers: [RescheduleNotificationService],
})
export class RescheduleNotificationModule {}
