import { Module } from '@nestjs/common';
import { StockOperationsModule } from '../stock-operations/stock-operations.module';
import { LocationsModule } from '../locations/locations.module';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';

@Module({
  imports: [StockOperationsModule, LocationsModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
