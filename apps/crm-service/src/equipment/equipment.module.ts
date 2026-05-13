import { Module } from '@nestjs/common';
import { EquipmentController } from './equipment.controller';
import { EquipmentAutomationController } from './equipment-automation.controller';
import { EquipmentService } from './equipment.service';

@Module({
  controllers: [EquipmentController, EquipmentAutomationController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}
