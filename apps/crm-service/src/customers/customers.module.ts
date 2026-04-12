import { Module } from '@nestjs/common';
import { ChurnClient } from '../ai/churn.client';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  controllers: [CustomersController],
  providers: [ChurnClient, CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
