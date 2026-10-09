import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { ChatModule } from '../chat/chat.module';
import { TelegramController, TelegramWebhookController } from './telegram.controller';
import { TelegramPoller } from './telegram.poller';
import { TelegramRelay } from './telegram.relay';
import { TelegramService } from './telegram.service';

@Module({
  imports: [PrismaModule, NotificationsModule, CompanySettingsModule, ChatModule],
  controllers: [TelegramController, TelegramWebhookController],
  providers: [TelegramService, TelegramRelay, TelegramPoller],
})
export class TelegramModule {}
