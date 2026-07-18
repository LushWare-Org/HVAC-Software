import { Module } from '@nestjs/common';
import { UpsellModule } from '../upsell/upsell.module';
import { FollowupModule } from '../followup/followup.module';
import { RetentionModule } from '../retention/retention.module';
import { RevenueModule } from '../revenue/revenue.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomersEquipmentService } from './customers-equipment.service';

@Module({
  imports: [UpsellModule, FollowupModule, RetentionModule, RevenueModule],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersEquipmentService],
  exports: [CustomersService, CustomersEquipmentService],
})
export class CustomersModule {}
