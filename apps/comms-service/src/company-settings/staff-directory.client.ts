import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Roles that should hear about reschedule activity. Technicians are excluded —
 * they don't run the schedule, and a reschedule may well be *because* of them.
 */
const SCHEDULING_ROLES = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CacheEntry {
  value: StaffMember[];
  expiresAt: number;
}

/**
 * Answers "who should be told about this?" by reading crm-service's user list.
 * Mirrors CompanySettingsClient in this folder, including its auth pattern.
 *
 * Fails open with an empty list: a missing staff notification is a far smaller
 * problem than a crm blip breaking the reschedule flow it is reporting on.
 */
@Injectable()
export class StaffDirectoryClient {
  private readonly logger = new Logger(StaffDirectoryClient.name);
  private readonly cache = new Map<string, CacheEntry>();

  async getSchedulingStaff(companyId: string): Promise<StaffMember[]> {
    const hit = this.cache.get(companyId);
    if (hit && hit.expiresAt > Date.now()) return hit.value;

    try {
      // `slim=true` returns just id/name/email/role/isActive — everything needed
      // here, without dragging avatars and login history across the wire.
      const res = await fetch(`${CRM_SERVICE_URL}/users?limit=100&isActive=true&slim=true`, {
        headers: this.authHeaders(companyId),
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) throw new Error(`crm responded ${res.status}`);

      const body = (await res.json()) as { data?: StaffMember[] } | StaffMember[];
      const users = Array.isArray(body) ? body : body.data ?? [];
      const value = users.filter((u) => SCHEDULING_ROLES.includes(u.role));

      this.cache.set(companyId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    } catch (err) {
      this.logger.warn(`staff lookup failed for ${companyId}: ${(err as Error).message}`);
      return [];
    }
  }

  private authHeaders(companyId: string): Record<string, string> {
    const secret = process.env.JWT_SECRET;
    if (process.env.BYPASS_AUTH === 'true' || !secret) {
      return {
        'x-test-user-role': 'company_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'staff-directory-client',
        'x-test-user-email': 'service@tscrm.internal',
      };
    }
    const token = jwt.sign(
      {
        sub: 'staff-directory-client',
        email: 'service@tscrm.internal',
        company_id: companyId,
        role: 'company_admin',
      },
      secret,
      { expiresIn: '5m' },
    );
    return { Authorization: `Bearer ${token}` };
  }
}
