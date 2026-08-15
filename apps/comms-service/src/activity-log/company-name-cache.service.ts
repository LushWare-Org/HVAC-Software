import { Injectable, Logger, Optional } from '@nestjs/common';
import axios from 'axios';

const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';
const TTL_MS = 10 * 60 * 1000; // 10 minutes

export type CompanyNameFetcher = (companyId: string) => Promise<string>;

async function fetchCompanyName(companyId: string): Promise<string> {
  const res = await axios.get(`${CRM_SERVICE_URL}/company`, {
    headers: serviceHeaders(companyId),
    timeout: 5_000,
  });
  return res.data?.name ?? companyId;
}

function serviceHeaders(companyId: string): Record<string, string> {
  if (process.env.BYPASS_AUTH === 'true') {
    return {
      'x-test-user-role': 'super_admin',
      'x-test-company-id': companyId,
      'x-test-user-id': 'activity-log-worker',
      'x-test-user-email': 'activity-log@tscrm.internal',
      'x-test-user-name': 'Activity Log Worker',
    };
  }
  return { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
}

/**
 * Resolves a companyId → companyName, caching each result for TTL_MS so the
 * activity-log worker isn't hitting crm-service once per event. Never throws
 * — a lookup failure falls back to the raw companyId so the event is still
 * written and displayable.
 */
@Injectable()
export class CompanyNameCacheService {
  private readonly logger = new Logger(CompanyNameCacheService.name);
  private readonly cache = new Map<string, { name: string; expiresAt: number }>();

  constructor(@Optional() private readonly fetcher: CompanyNameFetcher = fetchCompanyName) {}

  async resolve(companyId: string | null): Promise<string> {
    if (!companyId) return 'Unknown';

    const cached = this.cache.get(companyId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.name;
    }

    try {
      const name = await this.fetcher(companyId);
      this.cache.set(companyId, { name, expiresAt: Date.now() + TTL_MS });
      return name;
    } catch (err: any) {
      this.logger.warn(`Company name lookup failed for ${companyId}: ${err.message}`);
      return companyId;
    }
  }
}
