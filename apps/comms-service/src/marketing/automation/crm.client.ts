import { Injectable, Logger } from '@nestjs/common';

export interface CrmEquipment {
  id: string;
  companyId: string;
  customerId: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNo: string | null;
  installDate: string | null;   // ISO date string
  warrantyEnd: string | null;   // ISO date string
  consumables?: CrmEquipmentConsumable[];
}

export interface CrmEquipmentConsumable {
  id: string;
  kind: string;                 // FILTER | UV_BULB | PAD | OTHER
  partNumber: string | null;
  sizeSpec: string | null;
  rating: string | null;
  intervalDays: number;
  lastReplacedAt: string | null; // ISO date string
}

export interface CrmCustomer {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  zipCode: string | null;
  state: string | null;
  isActive: boolean;
}

// Equipment with its owner customer joined
export interface EquipmentWithCustomer extends CrmEquipment {
  customer: CrmCustomer;
}

export interface WinbackCandidate {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  zipCode: string | null;
  state: string | null;
  updatedAt: string;
  bookings: Array<{ preferredDate: string }>;
  agreements: Array<{ value: number | null; endDate: string | null }>;
}

@Injectable()
export class CrmClient {
  private readonly logger = new Logger(CrmClient.name);
  private readonly baseUrl = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';

  /**
   * Fetch equipment records that need lifecycle automation checks.
   * Uses internal service-to-service call with bypass headers (dev) or service JWT (prod).
   */
  async getEquipmentForAutomation(companyId: string): Promise<EquipmentWithCustomer[]> {
    try {
      const url = `${this.baseUrl}/customers/equipment/automation-candidates?companyId=${encodeURIComponent(companyId)}`;
      const res = await fetch(url, {
        headers: this.serviceHeaders(companyId),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        this.logger.warn(`CRM equipment fetch failed: ${res.status} for company ${companyId}`);
        return [];
      }

      return (await res.json()) as EquipmentWithCustomer[];
    } catch (err) {
      this.logger.warn(`CRM client error for company ${companyId}: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Fetch all companies that have equipment-automation enabled.
   * Returns a list of company IDs.
   */
  async getActiveCompanyIds(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/customers/equipment/company-ids-with-marketing`, {
        headers: this.serviceHeaders(),
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) return [];
      return (await res.json()) as string[];
    } catch {
      return [];
    }
  }

  /**
   * Fetch INACTIVE customers eligible for win-back (inactive >= inactiveDays).
   */
  async getWinbackCandidates(companyId: string, inactiveDays = 180): Promise<WinbackCandidate[]> {
    try {
      const url = `${this.baseUrl}/customers/winback-candidates?companyId=${encodeURIComponent(companyId)}&inactiveDays=${inactiveDays}`;
      const res = await fetch(url, {
        headers: this.serviceHeaders(companyId),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        this.logger.warn(`CRM winback fetch failed: ${res.status}`);
        return [];
      }
      return (await res.json()) as WinbackCandidate[];
    } catch (err) {
      this.logger.warn(`CRM winback client error: ${(err as Error).message}`);
      return [];
    }
  }

  async countAudienceMembers(companyId: string, filtersJson: string): Promise<number> {
    try {
      const url = `${this.baseUrl}/customers/audience/count?companyId=${encodeURIComponent(companyId)}&filters=${encodeURIComponent(filtersJson)}`;
      const res = await fetch(url, { headers: this.serviceHeaders(companyId), signal: AbortSignal.timeout(8_000) });
      if (!res.ok) return 0;
      return (await res.json()) as number;
    } catch {
      return 0;
    }
  }

  async resolveAudienceMembers(companyId: string, filtersJson: string): Promise<CrmCustomer[]> {
    try {
      const url = `${this.baseUrl}/customers/audience/members?companyId=${encodeURIComponent(companyId)}&filters=${encodeURIComponent(filtersJson)}`;
      const res = await fetch(url, { headers: this.serviceHeaders(companyId), signal: AbortSignal.timeout(15_000) });
      if (!res.ok) return [];
      return (await res.json()) as CrmCustomer[];
    } catch (err) {
      this.logger.warn(`CRM audience resolve error: ${(err as Error).message}`);
      return [];
    }
  }

  private serviceHeaders(companyId?: string): Record<string, string> {
    // In dev (BYPASS_AUTH=true), use test bypass headers.
    // In prod, a service-to-service JWT would be used instead.
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId ?? 'system',
        'x-test-user-id': 'automation-worker',
        'x-test-user-email': 'automation@tscrm.internal',
      };
    }
    return {
      Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}`,
    };
  }
}
