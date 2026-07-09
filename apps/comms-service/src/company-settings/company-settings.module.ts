import { Module } from '@nestjs/common';
import { CompanySettingsClient } from './company-settings.client';

@Module({ providers: [CompanySettingsClient], exports: [CompanySettingsClient] })
export class CompanySettingsModule {}
