import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationRulesController, AutomationEventsController } from './automation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TemplatesModule } from '../templates/templates.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { EnRouteModule } from '../enroute/enroute.module';
import { JobUpdatesModule } from '../job-updates/job-updates.module';
import { VisitRemindersModule } from '../visit-reminders/visit-reminders.module';

@Module({
  imports: [PrismaModule, NotificationsModule, TemplatesModule, CompanySettingsModule, EnRouteModule, JobUpdatesModule, VisitRemindersModule],
  controllers: [AutomationRulesController, AutomationEventsController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
