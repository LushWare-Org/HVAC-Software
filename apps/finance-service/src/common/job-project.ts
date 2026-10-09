import { Logger } from '@nestjs/common';

const logger = new Logger('JobProject');

/**
 * A quote or invoice for a project job belongs to that project. Without this,
 * one made from the Finance page, a job's own "Create invoice" or Kelvin never
 * showed up in the project's Finances tab or budget. A project the caller chose
 * wins; a failed lookup never blocks the document.
 */
export async function withJobProject<T extends { jobId?: string; projectId?: string; componentId?: string }>(
  prisma: { $queryRawUnsafe: (sql: string, ...values: unknown[]) => Promise<unknown> },
  companyId: string,
  dto: T,
): Promise<T> {
  if (!dto.jobId || dto.projectId) return dto;
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT "projectId", "componentId" FROM "jobs"."jobs" WHERE "id" = $1 AND "companyId" = $2 LIMIT 1`,
      dto.jobId,
      companyId,
    )) as Array<{ projectId: string | null; componentId: string | null }>;
    const job = rows[0];
    if (!job?.projectId) return dto;
    return { ...dto, projectId: job.projectId, ...(job.componentId && !dto.componentId && { componentId: job.componentId }) };
  } catch (err) {
    logger.warn(`Could not read the project of job ${dto.jobId}: ${(err as Error).message}`);
    return dto;
  }
}
