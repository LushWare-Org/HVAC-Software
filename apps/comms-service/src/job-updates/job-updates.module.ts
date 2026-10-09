import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatModule } from '../chat/chat.module';
import { JobUpdatesService } from './job-updates.service';

@Module({
  imports: [PrismaModule, ChatModule],
  providers: [JobUpdatesService],
  exports: [JobUpdatesService],
})
export class JobUpdatesModule {}
