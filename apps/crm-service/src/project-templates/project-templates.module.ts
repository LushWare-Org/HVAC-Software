import { Module } from '@nestjs/common';
import { ProjectTemplatesController } from './project-templates.controller';
import { ProjectTemplatesService } from './project-templates.service';
import { LocalAuthModule } from '../auth/local-auth.module';

@Module({
  imports: [LocalAuthModule],
  controllers: [ProjectTemplatesController],
  providers: [ProjectTemplatesService],
  exports: [ProjectTemplatesService],
})
export class ProjectTemplatesModule {}
