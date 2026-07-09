import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationClientModule } from '../notification-client/notification-client.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';

@Module({
  imports: [PdfModule, NotificationClientModule, CompanySettingsModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
