import { Module } from '@nestjs/common';
import { ProjectHousesController, HousesController } from './houses.controller';
import { HousesService } from './houses.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { LocalAuthModule } from '../auth/local-auth.module';

@Module({
  imports: [EquipmentModule, LocalAuthModule],
  controllers: [ProjectHousesController, HousesController],
  providers: [HousesService],
  exports: [HousesService],
})
export class HousesModule {}
