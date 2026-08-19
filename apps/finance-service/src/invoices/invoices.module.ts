import { Module } from '@nestjs/common';
import { InvoicesController, StripeWebhookController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationClientModule } from '../notification-client/notification-client.module';
import { QuickBooksModule } from '../quickbooks/quickbooks.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { DocumentTemplatesModule } from '../document-templates/document-templates.module';
import { CrmModule } from '../crm/crm.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PdfModule, NotificationClientModule, QuickBooksModule, CompanySettingsModule, DocumentTemplatesModule, CrmModule, RealtimeModule],
  controllers: [InvoicesController, StripeWebhookController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
