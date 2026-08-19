import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationClientModule } from '../notification-client/notification-client.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { DocumentTemplatesModule } from '../document-templates/document-templates.module';
import { CrmModule } from '../crm/crm.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PdfModule, NotificationClientModule, CompanySettingsModule, DocumentTemplatesModule, CrmModule, RealtimeModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
