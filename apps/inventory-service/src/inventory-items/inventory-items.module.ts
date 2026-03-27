import { Module } from '@nestjs/common';
import { LocationsModule } from '../locations/locations.module';
import { InventoryItemsController } from './inventory-items.controller';
import { InventoryItemsService } from './inventory-items.service';

@Module({
  imports: [LocationsModule],
  controllers: [InventoryItemsController],
  providers: [InventoryItemsService],
  exports: [InventoryItemsService],
})
export class InventoryItemsModule {}
