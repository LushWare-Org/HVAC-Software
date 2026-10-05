import { AiGateway, createAiGuard, createQueueUsageRecorder, type AiGuard, type AiLogger } from '@tscrm/ai';
import { createRedisConnection } from '@tscrm/queue';
import { isFeatureEnabled } from '@tscrm/types';
import type { PrismaService } from '../prisma/prisma.service';

type RedisConn = ReturnType<typeof createRedisConnection>;

let shared: { guard: AiGuard; record: ReturnType<typeof createQueueUsageRecorder> } | null = null;
let redis: RedisConn | null = null;

/**
 * The gateway every crm AI feature uses. One guard and one usage recorder are
 * shared across them, so the company switch cache and the queue connection
 * exist once per process. Redis is only opened on the first AI call.
 */
export function createCrmAiGateway(prisma: PrismaService, logger: AiLogger): AiGateway {
  shared ??= {
    guard: createAiGuard({
      redis: { get: (key: string) => (redis ??= createRedisConnection()).get(key) },
      isEnabled: async (companyId) => {
        const company = await prisma.company.findUnique({ where: { id: companyId }, select: { features: true } });
        return isFeatureEnabled(company?.features, 'ai');
      },
    }),
    record: createQueueUsageRecorder('crm-service', { logger }),
  };
  return new AiGateway({ logger, guard: shared.guard, onCall: shared.record });
}
