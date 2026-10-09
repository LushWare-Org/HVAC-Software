import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { DirectNotifyModule } from '../direct-notify/direct-notify.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VisitRemindersService } from './visit-reminders.service';

@Module({
  imports: [ChatModule, CompanySettingsModule, DirectNotifyModule, NotificationsModule],
  providers: [VisitRemindersService],
  exports: [VisitRemindersService],
})
export class VisitRemindersModule {}
