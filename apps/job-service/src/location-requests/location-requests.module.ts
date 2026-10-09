import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { LocationRequestsController, PublicLocationRequestsController } from './location-requests.controller';
import { LocationRequestsService } from './location-requests.service';

@Module({
  imports: [JobsModule],
  controllers: [LocationRequestsController, PublicLocationRequestsController],
  providers: [LocationRequestsService],
})
export class LocationRequestsModule {}
