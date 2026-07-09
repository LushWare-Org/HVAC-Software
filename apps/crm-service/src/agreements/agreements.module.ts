import { Module } from '@nestjs/common';
import { AgreementsController, AgreementsConfirmController } from './agreements.controller';
import { AgreementsService } from './agreements.service';
import { AgreementsCron } from './agreements.cron';
import { EmailService } from '../email/email.service';

@Module({
  controllers: [AgreementsConfirmController, AgreementsController],
  providers: [AgreementsService, AgreementsCron, EmailService],
  exports: [AgreementsService],
})
export class AgreementsModule {}
