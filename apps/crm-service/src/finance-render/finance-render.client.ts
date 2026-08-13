import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';

const FINANCE_URL = process.env.FINANCE_SERVICE_URL ?? 'http://localhost:3004';

export interface RenderAgreementInput {
  companyId: string;
  templateId?: string;
  companyName: string;
  companyAddress: string;
  context: {
    name: string; description?: string; customerName: string; customerEmail: string;
    startDate: string; endDate?: string; serviceType?: string; serviceInterval?: string;
    visitsIncluded?: number; visitsUsed?: number; billingAmount?: number; billingCycle?: string;
    nextBillingDate?: string; signedByName?: string; signedAt?: string;
  };
}

@Injectable()
export class FinanceRenderClient {
  private readonly logger = new Logger(FinanceRenderClient.name);

  async renderAgreement(input: RenderAgreementInput): Promise<Buffer> {
    try {
      const res = await axios.post(`${FINANCE_URL}/internal/documents/render`, input, {
        responseType: 'arraybuffer',
        timeout: 20_000,
        headers: this.serviceHeaders(input.companyId),
      });
      return Buffer.from(res.data);
    } catch (err: any) {
      this.logger.error(`Agreement PDF render failed: ${err?.response?.status} ${err.message}`);
      throw new ServiceUnavailableException('Could not generate the agreement PDF — try again shortly');
    }
  }

  private serviceHeaders(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'finance-render-client',
        'x-test-user-email': 'finance-render@tscrm.internal',
        'x-test-user-name': 'Finance Render Client',
      };
    }
    return { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
  }
}
