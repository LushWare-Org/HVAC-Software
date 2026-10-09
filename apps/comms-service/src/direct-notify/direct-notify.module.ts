import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebPushModule } from '../web-push/web-push.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { DirectNotifyController } from './direct-notify.controller';
import { DirectNotifyService } from './direct-notify.service';

@Module({
  imports: [NotificationsModule, WebPushModule, CompanySettingsModule],
  controllers: [DirectNotifyController],
  providers: [DirectNotifyService],
  exports: [DirectNotifyService],
})
export class DirectNotifyModule {}
