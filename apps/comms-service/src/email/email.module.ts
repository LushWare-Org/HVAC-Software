import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  imports: [CompanySettingsModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
