import { Module } from '@nestjs/common';
import { EquipmentController, EquipmentItemController } from './equipment.controller';
import { EquipmentAutomationController } from './equipment-automation.controller';
import { EquipmentService } from './equipment.service';
import { EquipmentScanService } from './equipment-scan.service';
import { ConsumablesService } from './consumables.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [EquipmentController, EquipmentItemController, EquipmentAutomationController],
  providers: [EquipmentService, EquipmentScanService, ConsumablesService],
  exports: [EquipmentService, ConsumablesService],
})
export class EquipmentModule {}
