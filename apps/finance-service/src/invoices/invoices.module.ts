import { Module } from '@nestjs/common';
import { InvoicesController, StripeWebhookController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationClientModule } from '../notification-client/notification-client.module';
import { QuickBooksModule } from '../quickbooks/quickbooks.module';

@Module({
  imports: [PdfModule, NotificationClientModule, QuickBooksModule],
  controllers: [InvoicesController, StripeWebhookController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
