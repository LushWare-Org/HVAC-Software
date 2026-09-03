import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { BaseLocationService } from './base-location.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [UsersController],
  providers: [UsersService, BaseLocationService],
  exports: [UsersService, BaseLocationService],
})
export class UsersModule {}
