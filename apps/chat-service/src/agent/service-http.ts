import axios, { type AxiosRequestConfig } from 'axios';
import type { AgentContext } from './types';

export type ServiceName = 'crm' | 'jobs' | 'scheduling' | 'finance' | 'comms' | 'analytics';

const BASE: Record<ServiceName, () => string> = {
  crm: () => process.env.CRM_SERVICE_URL ?? 'http://localhost:3001',
  jobs: () => process.env.JOBS_SERVICE_URL ?? 'http://localhost:3002',
  scheduling: () => process.env.SCHEDULING_SERVICE_URL ?? 'http://localhost:3003',
  finance: () => process.env.FINANCE_SERVICE_URL ?? 'http://localhost:3004',
  comms: () => process.env.COMMS_SERVICE_URL ?? 'http://localhost:3005',
  analytics: () => process.env.ANALYTICS_SERVICE_URL ?? 'http://localhost:3006',
};

/**
 * Calls the other services as the signed-in user, so tenant scoping, roles and
 * customer-only filtering are enforced by the services themselves, exactly as
 * if the person had clicked the button. Writes carry x-ai-action so logs can
 * tell assistant-made changes apart.
 */
export class ServiceHttp {
  constructor(private readonly ctx: AgentContext, private readonly aiAction?: string) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = {};
    if (process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production' && !this.ctx.token) {
      h['x-test-company-id'] = this.ctx.companyId;
      h['x-test-user-id'] = this.ctx.userId;
      h['x-test-user-role'] = this.ctx.role;
      h['x-test-user-email'] = this.ctx.email;
      if (this.ctx.customerId) h['x-test-customer-id'] = this.ctx.customerId;
    } else if (this.ctx.token) {
      h.Authorization = `Bearer ${this.ctx.token}`;
    }
    if (this.aiAction) h['x-ai-action'] = this.aiAction;
    return h;
  }

  private async call<T>(method: 'get' | 'post' | 'patch' | 'put' | 'delete', service: ServiceName, path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    const config: AxiosRequestConfig = { method, url: `${BASE[service]()}${path}`, headers: this.headers(), params, data: body, timeout: 15_000 };
    const res = await axios.request<T>(config);
    return res.data;
  }

  get<T = any>(service: ServiceName, path: string, params?: Record<string, unknown>) {
    return this.call<T>('get', service, path, undefined, params);
  }
  post<T = any>(service: ServiceName, path: string, body?: unknown) {
    return this.call<T>('post', service, path, body);
  }
  patch<T = any>(service: ServiceName, path: string, body?: unknown) {
    return this.call<T>('patch', service, path, body);
  }
  put<T = any>(service: ServiceName, path: string, body?: unknown) {
    return this.call<T>('put', service, path, body);
  }
  delete<T = any>(service: ServiceName, path: string) {
    return this.call<T>('delete', service, path);
  }
}

/** A service's own error message ("Cannot send a VOID invoice"), for the person to read. */
export function serviceErrorMessage(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { message?: unknown } }; message?: string };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg.join('; ');
  if (typeof msg === 'string') return msg;
  if (e.response?.status === 403) return 'Your role is not allowed to do that.';
  if (e.response?.status === 404) return 'Not found. It may have been deleted.';
  return e.message ?? 'The service did not respond.';
}
