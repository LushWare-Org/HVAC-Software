import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationRulesController, AutomationEventsController } from './automation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [PrismaModule, NotificationsModule, TemplatesModule],
  controllers: [AutomationRulesController, AutomationEventsController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
