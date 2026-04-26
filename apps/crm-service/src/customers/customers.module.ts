import { Module } from '@nestjs/common';
import { ChurnClient } from '../ai/churn.client';
import { UpsellModule } from '../upsell/upsell.module';
import { FollowupModule } from '../followup/followup.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [UpsellModule, FollowupModule],
  controllers: [CustomersController],
  providers: [ChurnClient, CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
