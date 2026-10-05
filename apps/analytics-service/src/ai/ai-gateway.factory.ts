import { AiGateway, createAiGuard, createQueueUsageRecorder, type AiGuard, type AiLogger } from '@tscrm/ai';
import { createRedisConnection } from '@tscrm/queue';
import { isFeatureEnabled } from '@tscrm/types';
import type { PrismaService } from '../prisma/prisma.service';

type RedisConn = ReturnType<typeof createRedisConnection>;

let shared: { guard: AiGuard; record: ReturnType<typeof createQueueUsageRecorder> } | null = null;
let redis: RedisConn | null = null;

/** Company feature flags, read across schemas like the rest of analytics. */
export async function companyFeatures(prisma: PrismaService, companyId: string): Promise<unknown> {
  const rows = await prisma.$queryRaw<{ features: unknown }[]>`SELECT features FROM crm.companies WHERE id = ${companyId}`;
  return rows[0]?.features ?? null;
}

/**
 * The gateway analytics AI features use, with the shared company switch and
 * monthly budget guard, and usage sent to the ai-usage queue.
 */
export function createAnalyticsAiGateway(prisma: PrismaService, logger: AiLogger): AiGateway {
  shared ??= {
    guard: createAiGuard({
      redis: { get: (key: string) => (redis ??= createRedisConnection()).get(key) },
      isEnabled: async (companyId) => isFeatureEnabled(await companyFeatures(prisma, companyId), 'ai'),
    }),
    record: createQueueUsageRecorder('analytics-service', { logger }),
  };
  return new AiGateway({ logger, guard: shared.guard, onCall: shared.record });
}
