import { Module } from '@nestjs/common';
import { StockOperationsController } from './stock-operations.controller';
import { StockOperationsService } from './stock-operations.service';

@Module({
  controllers: [StockOperationsController],
  providers: [StockOperationsService],
  exports: [StockOperationsService],
})
export class StockOperationsModule {}
