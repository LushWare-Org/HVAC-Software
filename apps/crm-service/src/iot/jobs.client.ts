import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const JOBS_URL = process.env.JOBS_SERVICE_URL ?? 'http://localhost:3002';

export interface CreateIotJobInput {
  companyId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  serviceAddress: string;
  title: string;
  description: string;
  priority: 'EMERGENCY' | 'HIGH' | 'NORMAL';
  internalNotes: string;
  tags: string[];
}

@Injectable()
export class JobsClient {
  private readonly logger = new Logger(JobsClient.name);

  async createJob(input: CreateIotJobInput): Promise<{ id: string } | null> {
    try {
      const res = await axios.post(
        `${JOBS_URL}/jobs`,
        {
          customerId: input.customerId,
          customerName: input.customerName,
          customerEmail: input.customerEmail ?? undefined,
          customerPhone: input.customerPhone ?? undefined,
          serviceAddress: input.serviceAddress,
          title: input.title,
          description: input.description,
          priority: input.priority,
          internalNotes: input.internalNotes,
          tags: input.tags,
        },
        { headers: this.serviceHeaders(input.companyId), timeout: 8_000 },
      );
      this.logger.log(`Auto-job created [${input.priority}] ${res.data?.id} for customer ${input.customerId}`);
      return { id: res.data?.id };
    } catch (err: any) {
      this.logger.error(`Auto-job creation failed: ${err?.response?.status} ${err.message}`);
      return null;
    }
  }

  private serviceHeaders(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'iot-automation',
        'x-test-user-email': 'iot@tscrm.internal',
        'x-test-user-name': 'IoT Automation',
      };
    }
    return { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
  }
}
