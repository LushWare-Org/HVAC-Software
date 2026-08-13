import { Injectable, Logger } from '@nestjs/common';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '@tscrm/types';
import * as jwt from 'jsonwebtoken';

const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  value: CompanySettings;
  expiresAt: number;
}

/**
 * Reads per-tenant settings from crm-service with a short in-memory cache.
 * Fails open to USD / all-features-on defaults so a crm blip never blocks
 * this service's own work.
 */
@Injectable()
export class CompanySettingsClient {
  private readonly logger = new Logger(CompanySettingsClient.name);
  private readonly cache = new Map<string, CacheEntry>();

  async getSettings(companyId: string): Promise<CompanySettings> {
    const hit = this.cache.get(companyId);
    if (hit && hit.expiresAt > Date.now()) return hit.value;

    try {
      const res = await fetch(`${CRM_SERVICE_URL}/company/settings`, {
        headers: this.authHeaders(companyId),
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) throw new Error(`crm responded ${res.status}`);
      const value = (await res.json()) as CompanySettings;
      this.cache.set(companyId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    } catch (err) {
      this.logger.warn(
        `settings fetch failed for ${companyId}, using defaults: ${(err as Error).message}`,
      );
      return { id: companyId, name: '', address: null, logoUrl: null, ...DEFAULT_COMPANY_SETTINGS };
    }
  }

  private authHeaders(companyId: string): Record<string, string> {
    // Same service-to-service pattern as comms enroute → crm: dev bypass
    // headers when BYPASS_AUTH, otherwise a short-lived HS256 system token
    // minted per company (mirrors the Go scheduling-service systemToken).
    const secret = process.env.JWT_SECRET;
    if (process.env.BYPASS_AUTH === 'true' || !secret) {
      return {
        'x-test-user-role': 'company_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'company-settings-client',
        'x-test-user-email': 'service@tscrm.internal',
      };
    }
    const token = jwt.sign(
      {
        sub: 'company-settings-client',
        email: 'service@tscrm.internal',
        name: 'Settings Client',
        company_id: companyId,
        role: 'company_admin',
      },
      secret,
      { expiresIn: '5m' },
    );
    return { Authorization: `Bearer ${token}` };
  }
}
