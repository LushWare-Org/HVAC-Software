import { Module } from '@nestjs/common';
import { CustomerAddressesController, LeadAddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';

@Module({
  controllers: [CustomerAddressesController, LeadAddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
