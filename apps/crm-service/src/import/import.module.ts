import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { ImportController } from './import.controller'
import { ImportService } from './import.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({ storage: undefined }), // memory storage — no disk writes
  ],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
