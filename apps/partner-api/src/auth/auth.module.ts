import { Global, Module } from '@nestjs/common';
import { AuthModule as JwtAuthClientModule } from '@tscrm/auth-client';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';

@Global()
@Module({
  imports: [JwtAuthClientModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class PartnerAuthModule {}
