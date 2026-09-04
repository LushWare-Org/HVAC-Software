import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { InternalTokenService } from './internal-token.service';

export type BackendService = 'crm' | 'jobs' | 'scheduling' | 'finance' | 'comms';

const DEFAULT_BASE_URLS: Record<BackendService, string> = {
  crm: 'http://localhost:3001',
  jobs: 'http://localhost:3002',
  scheduling: 'http://localhost:3003',
  finance: 'http://localhost:3004',
  comms: 'http://localhost:3005',
};

const ENV_KEYS: Record<BackendService, string> = {
  crm: 'CRM_SERVICE_URL',
  jobs: 'JOBS_SERVICE_URL',
  scheduling: 'SCHEDULING_SERVICE_URL',
  finance: 'FINANCE_SERVICE_URL',
  comms: 'COMMS_SERVICE_URL',
};

@Injectable()
export class ServiceClient {
  private readonly logger = new Logger(ServiceClient.name);
  private readonly http: AxiosInstance;

  constructor(private readonly tokens: InternalTokenService) {
    this.http = axios.create({
      timeout: Number(process.env.PARTNER_UPSTREAM_TIMEOUT_MS ?? 4000),
    });
  }

  private baseUrl(service: BackendService): string {
    return process.env[ENV_KEYS[service]] ?? DEFAULT_BASE_URLS[service];
  }

  async get<T>(
    service: BackendService,
    path: string,
    companyId: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl(service)}${path}`;
    const res = await this.http.get<T>(url, {
      params,
      headers: { Authorization: `Bearer ${this.tokens.tokenFor(companyId)}` },
    });
    return res.data;
  }

  async getBinary(
    service: BackendService,
    path: string,
    companyId: string,
  ): Promise<Buffer> {
    const url = `${this.baseUrl(service)}${path}`;
    const res = await this.http.get(url, {
      responseType: 'arraybuffer',
      timeout: Number(process.env.PARTNER_PDF_TIMEOUT_MS ?? 30000),
      headers: { Authorization: `Bearer ${this.tokens.tokenFor(companyId)}` },
    });
    return Buffer.from(res.data as ArrayBuffer);
  }

  async post<T>(
    service: BackendService,
    path: string,
    companyId: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl(service)}${path}`;
    const res = await this.http.post<T>(url, body, {
      headers: { Authorization: `Bearer ${this.tokens.tokenFor(companyId)}` },
    });
    return res.data;
  }

  async patch<T>(
    service: BackendService,
    path: string,
    companyId: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl(service)}${path}`;
    const res = await this.http.patch<T>(url, body, {
      headers: { Authorization: `Bearer ${this.tokens.tokenFor(companyId)}` },
    });
    return res.data;
  }

  async optional<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      this.logger.warn(`${label} unavailable: ${err?.message ?? err}`);
      return fallback;
    }
  }
}

/** Services return either a bare array or a { data, meta } envelope. */
export function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  return [];
}
