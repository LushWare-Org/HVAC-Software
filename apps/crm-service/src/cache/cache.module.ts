import { Global, Module } from '@nestjs/common';
import { TtlCacheService } from './ttl-cache.service';

/**
 * Global so every feature module shares ONE TtlCacheService instance —
 * critical for invalidation: a booking/agreement/equipment write must bust
 * the customer status-summary cached by CustomersService. Registering the
 * service per-module would give each module its own private cache and
 * writes would never invalidate reads.
 */
@Global()
@Module({
  providers: [TtlCacheService],
  exports: [TtlCacheService],
})
export class CacheModule {}
