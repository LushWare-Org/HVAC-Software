import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@tscrm/auth-client';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { PdfModule } from './pdf/pdf.module';
import { QuotesModule } from './quotes/quotes.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { ExpensesModule } from './expenses/expenses.module';
import { QuickBooksModule } from './quickbooks/quickbooks.module';
import { CompanySettingsModule } from './company-settings/company-settings.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['../../.env', '.env'],
    }),
    AuthModule,
    PrismaModule,
    HealthModule,
    CompanySettingsModule,
    PdfModule,
    QuotesModule,
    InvoicesModule,
    PaymentsModule,
    ExpensesModule,
    QuickBooksModule,
  ],
})
export class AppModule {}
