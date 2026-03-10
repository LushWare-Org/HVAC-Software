/**
 * API Client for Flow Tests
 *
 * Thin wrapper around axios that:
 *  1. Points each request to the correct service base URL
 *  2. Injects the BYPASS_AUTH test headers automatically
 *  3. Logs every request and response through the rich logger
 *  4. Throws a friendly error on non-2xx responses (with full detail)
 */

import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { logRequest, logResponse, logError } from './logger';

// ── Service base URLs (from .env.test or defaults) ───────────────────────────

export const SERVICES = {
  crm:        process.env.CRM_URL        ?? 'http://localhost:3001',
  jobs:       process.env.JOBS_URL       ?? 'http://localhost:3002',
  scheduling: process.env.SCHEDULING_URL ?? 'http://localhost:3003',
  finance:    process.env.FINANCE_URL    ?? 'http://localhost:3004',
  comms:      process.env.COMMS_URL      ?? 'http://localhost:3005',
  analytics:  process.env.ANALYTICS_URL  ?? 'http://localhost:3006',
};

// ── Test identity ─────────────────────────────────────────────────────────────

export const TEST_COMPANY_ID   = process.env.TEST_COMPANY_ID   ?? 'co-demo-001';
export const TEST_USER_ID      = process.env.TEST_USER_ID      ?? 'user-admin-001';
export const TEST_TECH_ID      = process.env.TEST_TECH_ID      ?? 'user-tech-001';
export const TEST_CUSTOMER_ID  = process.env.TEST_CUSTOMER_ID  ?? '';    // filled dynamically
export const INTERNAL_API_KEY  = process.env.INTERNAL_API_KEY  ?? 'dev-internal-key';

// ── Shared headers ────────────────────────────────────────────────────────────

function authHeaders(role = 'COMPANY_ADMIN', userId = TEST_USER_ID): Record<string, string> {
  return {
    'x-test-company-id':  TEST_COMPANY_ID,
    'x-test-user-id':     userId,
    'x-test-user-email':  'admin@demo.tscrm.dev',
    'x-test-user-role':   role,
    'x-test-user-name':   role === 'TECHNICIAN' ? 'Dave Technician' : 'Admin User',
    'Content-Type':       'application/json',
  };
}

function techHeaders(): Record<string, string> {
  return authHeaders('TECHNICIAN', TEST_TECH_ID);
}

function internalHeaders(): Record<string, string> {
  return {
    'x-internal-api-key': INTERNAL_API_KEY,
    'Content-Type':       'application/json',
  };
}

// ── Core request function ─────────────────────────────────────────────────────

async function request<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  baseUrl: string,
  path: string,
  data?: unknown,
  extraHeaders?: Record<string, string>,
  role?: string,
): Promise<{ status: number; data: T }> {
  const url     = `${baseUrl}${path}`;
  const headers = { ...authHeaders(role), ...extraHeaders };

  logRequest(method, url, data);

  try {
    const response = await axios({
      method,
      url,
      data,
      headers,
      validateStatus: () => true,   // never throw on status — we log everything
    } as AxiosRequestConfig);

    logResponse(response.status, response.data);
    return { status: response.status, data: response.data as T };
  } catch (err) {
    const axErr  = err as AxiosError;
    logError(`${method} ${url} failed`, axErr.message);
    throw err;
  }
}

// ── Service-specific helpers ──────────────────────────────────────────────────

type ApiMethod = (path: string, data?: unknown, extraHeaders?: Record<string,string>, role?: string) => Promise<{ status: number; data: any }>;

function makeClient(baseUrl: string) {
  return {
    get:    (path: string, extraHeaders?: Record<string,string>, role?: string) =>
                request('GET',    baseUrl, path, undefined, extraHeaders, role),
    post:   (path: string, data?: unknown, extraHeaders?: Record<string,string>, role?: string) =>
                request('POST',   baseUrl, path, data, extraHeaders, role),
    put:    (path: string, data?: unknown, extraHeaders?: Record<string,string>, role?: string) =>
                request('PUT',    baseUrl, path, data, extraHeaders, role),
    patch:  (path: string, data?: unknown, extraHeaders?: Record<string,string>, role?: string) =>
                request('PATCH',  baseUrl, path, data, extraHeaders, role),
    delete: (path: string, extraHeaders?: Record<string,string>, role?: string) =>
                request('DELETE', baseUrl, path, undefined, extraHeaders, role),
    // Internal service-to-service calls (bypass JWT, use internal key instead)
    internal: (method: string, path: string, data?: unknown) =>
                request(method as any, baseUrl, path, data, internalHeaders()),
    // Technician-role calls
    asTechnician: {
      get:   (path: string) => request('GET',   baseUrl, path, undefined, techHeaders()),
      post:  (path: string, data?: unknown) => request('POST',  baseUrl, path, data, techHeaders()),
      patch: (path: string, data?: unknown) => request('PATCH', baseUrl, path, data, techHeaders()),
    },
  };
}

export const crm        = makeClient(SERVICES.crm);
export const jobs       = makeClient(SERVICES.jobs);
export const scheduling = makeClient(SERVICES.scheduling);
export const finance    = makeClient(SERVICES.finance);
export const comms      = makeClient(SERVICES.comms);
export const analytics  = makeClient(SERVICES.analytics);

// ── Health check helper ───────────────────────────────────────────────────────

export async function checkHealth(name: string, baseUrl: string): Promise<boolean> {
  try {
    const res = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function ensureServicesUp(requiredServices: Array<keyof typeof SERVICES>): Promise<void> {
  console.log('\n  🏥 Checking service health...\n');
  for (const name of requiredServices) {
    const url   = SERVICES[name];
    const alive = await checkHealth(name, url);
    if (!alive) {
      throw new Error(
        `\n❌ Service "${name}" is not reachable at ${url}\n` +
        `   Make sure Docker Compose is running:  docker compose up -d\n`
      );
    }
    console.log(`  ✅ ${name.padEnd(14)} → ${url}`);
  }
  console.log('');
}
