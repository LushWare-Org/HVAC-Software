import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebPushModule } from '../web-push/web-push.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { ChatBus } from './chat.bus';
import { ChatController } from './chat.controller';
import { ChatDirectory } from './chat.directory';
import { ChatGateway } from './chat.gateway';
import { ChatNotifier } from './chat.notifier';
import { ChatService } from './chat.service';

@Module({
  imports: [PrismaModule, NotificationsModule, WebPushModule, CompanySettingsModule],
  controllers: [ChatController],
  providers: [ChatBus, ChatDirectory, ChatService, ChatGateway, ChatNotifier],
  exports: [ChatService, ChatBus, ChatDirectory, ChatGateway],
})
export class ChatModule {}
