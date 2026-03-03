import { Module } from '@nestjs/common';
import {
  JobTypesController,
  JobTemplatesController,
  TemplateTasksController,
  CustomFieldDefsController,
} from './trade-templates.controller';
import { TradeTemplatesService } from './trade-templates.service';

@Module({
  controllers: [
    JobTypesController,
    JobTemplatesController,
    TemplateTasksController,
    CustomFieldDefsController,
  ],
  providers: [TradeTemplatesService],
  exports: [TradeTemplatesService],
})
export class TradeTemplatesModule {}
