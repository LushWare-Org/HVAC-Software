import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationClientModule } from '../notification-client/notification-client.module';

@Module({
  imports: [PdfModule, NotificationClientModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
