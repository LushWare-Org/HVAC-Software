import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationClientService } from './notification-client.service';

@Module({
  imports: [HttpModule],
  providers: [NotificationClientService],
  exports: [NotificationClientService],
})
export class NotificationClientModule {}
