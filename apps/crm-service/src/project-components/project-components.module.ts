import { Module } from '@nestjs/common';
import { ProjectComponentsNestedController, ProjectComponentsController } from './project-components.controller';
import { ProjectComponentsService } from './project-components.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { LocalAuthModule } from '../auth/local-auth.module';

@Module({
  imports: [EquipmentModule, LocalAuthModule],
  controllers: [ProjectComponentsNestedController, ProjectComponentsController],
  providers: [ProjectComponentsService],
  exports: [ProjectComponentsService],
})
export class ProjectComponentsModule {}
