import { Module } from '@nestjs/common';
import { InvoicesController, StripeWebhookController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  controllers: [InvoicesController, StripeWebhookController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
