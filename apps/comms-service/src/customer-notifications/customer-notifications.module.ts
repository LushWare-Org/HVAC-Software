import { Module } from '@nestjs/common';
import { CustomerNotificationsService } from './customer-notifications.service';
import { CustomerNotificationsController } from './customer-notifications.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { CustomerEventsModule } from '../customer-events/customer-events.module';

@Module({
  imports: [NotificationsModule, PrismaModule, CompanySettingsModule, CustomerEventsModule],
  controllers: [CustomerNotificationsController],
  providers: [CustomerNotificationsService],
  exports: [CustomerNotificationsService],
})
export class CustomerNotificationsModule {}
