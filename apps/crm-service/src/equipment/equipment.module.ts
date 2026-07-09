import { Module } from '@nestjs/common';
import { EquipmentController } from './equipment.controller';
import { EquipmentAutomationController } from './equipment-automation.controller';
import { EquipmentService } from './equipment.service';
import { ConsumablesService } from './consumables.service';

@Module({
  controllers: [EquipmentController, EquipmentAutomationController],
  providers: [EquipmentService, ConsumablesService],
  exports: [EquipmentService, ConsumablesService],
})
export class EquipmentModule {}
