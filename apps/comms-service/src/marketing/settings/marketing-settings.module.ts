import { Module } from '@nestjs/common';
import { MarketingSettingsService } from './marketing-settings.service';
import { MarketingSettingsController } from './marketing-settings.controller';

@Module({
  controllers: [MarketingSettingsController],
  providers: [MarketingSettingsService],
  exports: [MarketingSettingsService],
})
export class MarketingSettingsModule {}
