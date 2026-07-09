import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { CompanySettingsModule } from '../company-settings/company-settings.module';

@Module({
  imports: [CompanySettingsModule],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
