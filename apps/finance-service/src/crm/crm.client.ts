import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const CRM_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';

/**
 * Minimal cross-service reads needed to validate that a customer-supplied
 * projectId/houseId on a quote/invoice actually belongs to them, and to
 * auto-backfill projectId from houseId at creation. Mirrors job-service's
 * CrmClient exactly — finance-service has no direct DB access to the crm
 * schema (separate connection per service, see CLAUDE.md).
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

  private serviceHeaders(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'finance-service-crm-client',
        'x-test-user-email': 'finance-crm-client@tscrm.internal',
        'x-test-user-name': 'Finance Service (CRM client)',
      };
    }
    return { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
  }
}
