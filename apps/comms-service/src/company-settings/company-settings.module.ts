import { Module } from '@nestjs/common';
import { CompanySettingsClient } from './company-settings.client';
import { StaffDirectoryClient } from './staff-directory.client';

@Module({
  providers: [CompanySettingsClient, StaffDirectoryClient],
  exports: [CompanySettingsClient, StaffDirectoryClient],
})
export class CompanySettingsModule {}
