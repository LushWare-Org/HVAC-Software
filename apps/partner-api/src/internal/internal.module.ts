import { Global, Module } from '@nestjs/common';
import { InternalTokenService } from './internal-token.service';
import { ServiceClient } from './service-client.service';

@Global()
@Module({
  providers: [InternalTokenService, ServiceClient],
  exports: [InternalTokenService, ServiceClient],
})
export class InternalModule {}
