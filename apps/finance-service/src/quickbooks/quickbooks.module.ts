import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QuickBooksService } from './quickbooks.service';
import { QuickBooksSyncService } from './quickbooks-sync.service';
import { QuickBooksController } from './quickbooks.controller';

@Module({
  imports: [PrismaModule],
  controllers: [QuickBooksController],
  providers: [QuickBooksService, QuickBooksSyncService],
  exports: [QuickBooksService, QuickBooksSyncService],
})
export class QuickBooksModule {}
