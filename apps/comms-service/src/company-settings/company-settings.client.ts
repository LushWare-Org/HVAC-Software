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

  /**
   * The customer's portal CompanyUser and push token, or null when they have
   * never signed in on a device. Deliberately uncached: a token can be
   * registered or cleared at any login/logout, and a stale one means a push
   * silently goes nowhere.
   */
  async getCustomerPushRecipient(
    companyId: string,
    customerId: string,
  ): Promise<{ recipientId: string; recipientName?: string; pushToken: string } | null> {
    try {
      const res = await fetch(`${CRM_SERVICE_URL}/customers/${customerId}/portal-user`, {
        headers: this.authHeaders(companyId),
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) return null;
      const user = (await res.json()) as
        | { id: string; name?: string | null; pushToken?: string | null }
        | null;
      if (!user?.pushToken) return null;
      return {
        recipientId: user.id,
        recipientName: user.name ?? undefined,
        pushToken: user.pushToken,
      };
    } catch (err) {
      this.logger.warn(
        `customer push recipient lookup failed for ${customerId}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Who to reach and how: name, email, and the portal login (for push) of a
   * customer, or the same for a staff member. Null when not found.
   */
  async getContact(
    companyId: string,
    to: 'customer' | 'staff',
    id: string,
  ): Promise<{ name: string; email: string | null; userId: string | null; pushToken: string | null; avatarUrl?: string | null } | null> {
    const get = async <T>(path: string): Promise<T | null> => {
      const res = await fetch(`${CRM_SERVICE_URL}${path}`, { headers: this.authHeaders(companyId), signal: AbortSignal.timeout(5_000) });
      if (!res.ok) return null;
      return (await res.json()) as T;
    };
    try {
      if (to === 'staff') {
        const u = await get<{ id: string; name?: string; email?: string; pushToken?: string | null; avatarUrl?: string | null }>(`/users/${encodeURIComponent(id)}`);
        if (!u) return null;
        return { name: u.name ?? '', email: u.email ?? null, userId: u.id, pushToken: u.pushToken ?? null, avatarUrl: u.avatarUrl ?? null };
      }
      const c = await get<{ firstName?: string; lastName?: string; email?: string | null }>(`/customers/${encodeURIComponent(id)}`);
      if (!c) return null;
      const portal = await get<{ id: string; pushToken?: string | null } | null>(`/customers/${encodeURIComponent(id)}/portal-user`);
      return {
        name: [c.firstName, c.lastName].filter(Boolean).join(' ').trim(),
        email: c.email ?? null,
        userId: portal?.id ?? null,
        pushToken: portal?.pushToken ?? null,
      };
    } catch (err) {
      this.logger.warn(`contact lookup failed for ${to} ${id}: ${(err as Error).message}`);
      return null;
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
