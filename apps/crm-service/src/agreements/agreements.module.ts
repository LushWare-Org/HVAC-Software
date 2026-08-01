import { Module } from '@nestjs/common';
import { AgreementsController, AgreementsConfirmController } from './agreements.controller';
import { AgreementsService } from './agreements.service';
import { AgreementsCron } from './agreements.cron';
import { EmailService } from '../email/email.service';
import { FinanceRenderClient } from '../finance-render/finance-render.client';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [AgreementsConfirmController, AgreementsController],
  providers: [AgreementsService, AgreementsCron, EmailService, FinanceRenderClient],
  exports: [AgreementsService],
})
export class AgreementsModule {}
