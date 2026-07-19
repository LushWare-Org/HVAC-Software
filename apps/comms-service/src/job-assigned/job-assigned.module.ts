import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagingModule } from '../messaging/messaging.module';
import { JobAssignedController } from './job-assigned.controller';
import { JobAssignedNotificationService } from './job-assigned.service';

@Module({
  imports: [NotificationsModule, MessagingModule],
  controllers: [JobAssignedController],
  providers: [JobAssignedNotificationService],
})
export class JobAssignedModule {}
