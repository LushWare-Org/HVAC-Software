import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const CRM_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';

/**
 * Minimal cross-service reads needed to validate that a customer-supplied
 * projectId/houseId on a job actually belongs to them, before job-service links
 * the two. Job-service has no direct DB access to the crm schema (separate
 * connection per service, see CLAUDE.md) — this goes through crm-service's own
 * API, using the same service-to-service auth pattern as FinanceRenderClient.
 */
@Injectable()
export class CrmClient {
  private readonly logger = new Logger(CrmClient.name);

  async getProjectCustomerId(companyId: string, projectId: string): Promise<string | null | undefined> {
    try {
      const res = await axios.get(`${CRM_URL}/projects/${projectId}`, {
        timeout: 8_000,
        headers: this.serviceHeaders(companyId),
      });
      return res.data?.customerId ?? null;
    } catch (err: any) {
      if (err?.response?.status === 404) return undefined;
      this.logger.warn(`Could not verify project ${projectId}: ${err?.response?.status} ${err.message}`);
      return undefined;
    }
  }

  /** Tenant's current default currency, for jobs created without an explicit one. Fails open to USD. */
  async getDefaultCurrency(companyId: string): Promise<string> {
    try {
      const res = await axios.get(`${CRM_URL}/company/settings`, {
        timeout: 8_000,
        headers: this.serviceHeaders(companyId),
      });
      return res.data?.currency ?? 'USD';
    } catch (err: any) {
      this.logger.warn(`Could not fetch default currency for ${companyId}, using USD: ${err.message}`);
      return 'USD';
    }
  }

  /** Kept for the one-value call sites that only care about ownership. */
  async getComponentOwnerCustomerId(companyId: string, componentId: string): Promise<string | null | undefined> {
    const details = await this.getComponentDetails(companyId, componentId);
    return details?.ownerCustomerId;
  }

  /**
   * projectId is needed to auto-backfill a job's own projectId whenever a caller
   * sets componentId but forgot projectId (e.g. a booking flow that only knows the
   * component) — without this, the job never shows up in that project's Jobs tab
   * even though it's correctly linked to one of the project's components.
   */
  async getComponentDetails(companyId: string, componentId: string): Promise<{ ownerCustomerId: string | null; projectId: string } | undefined> {
    try {
      const res = await axios.get(`${CRM_URL}/components/${componentId}`, {
        timeout: 8_000,
        headers: this.serviceHeaders(companyId),
      });
      return { ownerCustomerId: res.data?.ownerCustomerId ?? null, projectId: res.data?.projectId };
    } catch (err: any) {
      if (err?.response?.status === 404) return undefined;
      this.logger.warn(`Could not verify component ${componentId}: ${err?.response?.status} ${err.message}`);
      return undefined;
    }
  }

  /**
   * The customer's contact details, for notifications on jobs whose own
   * denormalised `customerEmail` is empty.
   *
   * That gap is real: jobs created from the admin dashboard historically never
   * carried an email, so any notification gated on `job.customerEmail` silently
   * did nothing. Looking the customer up keeps those jobs reachable instead of
   * failing quietly.
   */
  async getCustomerContact(
    companyId: string,
    customerId: string,
  ): Promise<{ email: string | null; phone: string | null; name: string | null } | undefined> {
    try {
      const res = await axios.get(`${CRM_URL}/customers/${customerId}`, {
        timeout: 8_000,
        headers: this.serviceHeaders(companyId),
      });
      const c = res.data ?? {};
      const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
      return { email: c.email ?? null, phone: c.phone ?? null, name: name || null };
    } catch (err: any) {
      if (err?.response?.status === 404) return undefined;
      this.logger.warn(`Could not fetch customer ${customerId}: ${err?.response?.status} ${err.message}`);
      return undefined;
    }
  }

  private serviceHeaders(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'job-service-crm-client',
        'x-test-user-email': 'jobs-crm-client@tscrm.internal',
        'x-test-user-name': 'Job Service (CRM client)',
      };
    }
    return { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
  }
}
