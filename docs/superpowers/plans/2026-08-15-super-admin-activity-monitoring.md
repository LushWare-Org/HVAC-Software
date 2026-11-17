# Super Admin Activity Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `super_admin` a permanent, real-time, tenant-wise feed of every API call across all 8 backend services and 3 frontends, so the upcoming trial can be monitored live without refreshing.

**Architecture:** Every NestJS service gets a shared `ActivityLogInterceptor` (new `packages/activity-log`) that times each request, redacts sensitive fields, resolves a human description from a per-service template registry, and enqueues the event on a new BullMQ queue. `scheduling-service` (Go) posts the same event shape to a new internal ingest endpoint instead, since it has no BullMQ client. A single `comms-service` worker consumes that queue, writes to a new `ActivityLog` Postgres table (`comms` schema), and broadcasts over a new Socket.IO `/activity` namespace restricted to `super_admin`. `admin-dashboard` gets a `/system-activity` page (nav item + route gated to `super_admin`) with a live, filterable, auto-appending feed plus infinite-scroll history.

**Tech Stack:** NestJS interceptors, BullMQ (`packages/queue`), Prisma (Postgres, `comms` schema), Socket.IO (`@nestjs/websockets`), Go/Gin middleware, React 19 + TanStack Query + socket.io-client.

**Spec:** docs/superpowers/specs/2026-08-15-super-admin-activity-monitoring-design.md

## Global Constraints

- Every table/query in this codebase carries `company_id` — the ONE deliberate exception is `super_admin`-only access to the activity log across tenants; every layer (socket auth, controller guard, route visibility) enforces `Role.SUPER_ADMIN` independently.
- No new database — `comms-service` uses Postgres (`comms` schema) via Prisma, same shared Supabase instance as every other service. Migrations are applied only via `scripts/apply-migrations.mjs` (never `prisma migrate dev`).
- Retention is 90 days, enforced by a nightly BullMQ repeatable job (no native TTL in Postgres).
- Redaction (`password`, `token`, `secret`, `cardNumber`, `cvv`, `ssn`, `authorization`, case-insensitive) is applied before an event ever leaves the producing service — never after.
- Money/pagination/status-enum conventions from CLAUDE.md apply as usual: `clampPagination` for the query endpoint, UPPER_SNAKE_CASE for `status`.
- Logging must never add latency or fail the real request — enqueue happens fire-and-forget after the response is already resolved.

---

## Task 1: Shared queue name + event type

**Files:**
- Modify: `packages/queue/src/index.ts`
- Modify: `packages/types/src/index.ts`

**Interfaces:**
- Produces: `QueueName.ACTIVITY_LOG` (BullMQ queue name), `ActivityLogEvent` type (the shape every producer builds and the processor consumes).

- [ ] **Step 1: Add the queue name**

In `packages/queue/src/index.ts`, add to the `QueueName` enum:

```ts
export enum QueueName {
  SEND_SMS = 'send-sms',
  SEND_EMAIL = 'send-email',
  SEND_PUSH = 'send-push',
  GENERATE_PDF = 'generate-pdf',
  PROCESS_PAYMENT = 'process-payment',
  SEND_INVOICE = 'send-invoice',
  APPOINTMENT_REMINDER = 'appointment-reminder',
  REVIEW_REQUEST = 'review-request',
  JOB_STATUS_NOTIFICATION = 'job-status-notification',
  FOLLOWUP = 'followup-queue',
  MARKETING_SEND = 'marketing-send',
  EQUIPMENT_AUTOMATION = 'equipment-automation',
  ACTIVITY_LOG = 'activity-log',
}
```

- [ ] **Step 2: Add the shared event type**

In `packages/types/src/index.ts`, add near the bottom of the file:

```ts
// ---- Activity log (super-admin monitoring dashboard) ----
export type ActivityLogService =
  | 'crm' | 'jobs' | 'scheduling' | 'finance' | 'comms' | 'analytics' | 'inventory' | 'churn';

export type ActivityLogStatus = 'SUCCESS' | 'FAILURE';

export interface ActivityLogEvent {
  companyId: string | null;
  service: ActivityLogService;
  method: string;
  path: string;
  actorUserId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  description: string;
  status: ActivityLogStatus;
  statusCode: number;
  durationMs: number;
  requestSummary?: Record<string, unknown>;
  responseSummary?: Record<string, unknown>;
  errorMessage?: string;
}
```

- [ ] **Step 3: Build both packages**

Run: `pnpm --filter @tscrm/queue build && pnpm --filter @tscrm/types build`
Expected: both complete with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add packages/queue/src/index.ts packages/types/src/index.ts
git commit -m "feat(activity-log): add ACTIVITY_LOG queue name and ActivityLogEvent type"
```

---

## Task 2: `packages/activity-log` — redact()

**Files:**
- Create: `packages/activity-log/package.json`
- Create: `packages/activity-log/tsconfig.json`
- Create: `packages/activity-log/src/redact.ts`
- Test: `packages/activity-log/src/redact.spec.ts`

**Interfaces:**
- Consumes: nothing (pure function).
- Produces: `redact(obj: unknown, maxBytes?: number): Record<string, unknown> | undefined` — used by Task 4's interceptor.

- [ ] **Step 1: Scaffold the package**

`packages/activity-log/package.json`:

```json
{
  "name": "@tscrm/activity-log",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@tscrm/queue": "workspace:*",
    "@tscrm/types": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "rimraf": "^5.0.0",
    "typescript": "^5.4.0"
  },
  "peerDependencies": {
    "@nestjs/common": "^10.0.0"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node"
  }
}
```

`packages/activity-log/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.spec.ts"]
}
```

- [ ] **Step 2: Write the failing test**

`packages/activity-log/src/redact.spec.ts`:

```ts
import { redact } from './redact';

describe('redact', () => {
  it('returns undefined for undefined input', () => {
    expect(redact(undefined)).toBeUndefined();
  });

  it('strips a top-level sensitive key, case-insensitively', () => {
    const result = redact({ email: 'a@b.com', Password: 'hunter2', token: 'abc' });
    expect(result).toEqual({ email: 'a@b.com', Password: '[REDACTED]', token: '[REDACTED]' });
  });

  it('strips sensitive keys nested inside objects and arrays', () => {
    const result = redact({
      customer: { name: 'Joe', cardNumber: '4111111111111111' },
      items: [{ secret: 'x' }, { label: 'ok' }],
    });
    expect(result).toEqual({
      customer: { name: 'Joe', cardNumber: '[REDACTED]' },
      items: [{ secret: '[REDACTED]' }, { label: 'ok' }],
    });
  });

  it('does not touch values whose key does not match the blocklist', () => {
    const result = redact({ authorNote: 'authorization is required for entry' });
    expect(result).toEqual({ authorNote: 'authorization is required for entry' });
  });

  it('truncates output past the byte cap', () => {
    const big = { blob: 'x'.repeat(5000) };
    const result = redact(big, 100) as any;
    expect(result.truncated).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @tscrm/activity-log test -- redact.spec.ts`
Expected: FAIL — `Cannot find module './redact'`

- [ ] **Step 4: Implement `redact()`**

`packages/activity-log/src/redact.ts`:

```ts
const SENSITIVE_KEYS = new Set([
  'password', 'token', 'secret', 'cardnumber', 'cvv', 'ssn', 'authorization',
  'accesstoken', 'refreshtoken', 'apikey',
]);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? '[REDACTED]' : redactValue(val);
    }
    return out;
  }
  return value;
}

/**
 * Recursively strips sensitive fields (by key name, case-insensitive) from a
 * request/response body before it is ever attached to an ActivityLogEvent.
 * Returns undefined for undefined input. Truncates to maxBytes (default 2KB)
 * so one enormous payload can't bloat the activity log.
 */
export function redact(obj: unknown, maxBytes = 2048): Record<string, unknown> | undefined {
  if (obj === undefined || obj === null) return undefined;
  const cleaned = redactValue(obj);
  const json = JSON.stringify(cleaned);
  if (json.length <= maxBytes) {
    return cleaned as Record<string, unknown>;
  }
  return { truncated: true, preview: json.slice(0, maxBytes) };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @tscrm/activity-log test -- redact.spec.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add packages/activity-log
git commit -m "feat(activity-log): add redact() with recursive sensitive-key stripping"
```

---

## Task 3: `packages/activity-log` — describeAction() + template registry

**Files:**
- Create: `packages/activity-log/src/templates/types.ts`
- Create: `packages/activity-log/src/templates/crm.ts`
- Create: `packages/activity-log/src/templates/jobs.ts`
- Create: `packages/activity-log/src/templates/finance.ts`
- Create: `packages/activity-log/src/templates/comms.ts`
- Create: `packages/activity-log/src/templates/scheduling.ts`
- Create: `packages/activity-log/src/describe-action.ts`
- Test: `packages/activity-log/src/describe-action.spec.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `describeAction(service, method, routePattern, reqBody, resBody): { action: string; description: string }` — used by Task 4's interceptor.

- [ ] **Step 1: Write the failing test**

`packages/activity-log/src/describe-action.spec.ts`:

```ts
import { describeAction } from './describe-action';

describe('describeAction', () => {
  it('matches a templated route and fills the description from the response body', () => {
    const result = describeAction('jobs', 'POST', '/jobs', {}, { id: 'j1', title: 'Fix AC unit' });
    expect(result.action).toBe('job.created');
    expect(result.description).toBe('Created job "Fix AC unit"');
  });

  it('matches a templated route with a path param placeholder', () => {
    const result = describeAction('jobs', 'PATCH', '/jobs/:id/status', { status: 'COMPLETED' }, {});
    expect(result.action).toBe('job.status_changed');
    expect(result.description).toBe('Changed job status to COMPLETED');
  });

  it('falls back to a generic description for an untemplated route', () => {
    const result = describeAction('inventory', 'GET', '/inventory/items/:id', {}, {});
    expect(result.action).toBe('http.request');
    expect(result.description).toBe('GET /inventory/items/:id');
  });

  it('falls back gracefully when the template function throws', () => {
    const result = describeAction('crm', 'POST', '/crm/customers', {}, {}); // no name in body
    expect(result.action).toBe('customer.created');
    expect(result.description).toBe('Created a new customer');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tscrm/activity-log test -- describe-action.spec.ts`
Expected: FAIL — `Cannot find module './describe-action'`

- [ ] **Step 3: Define the template shape**

`packages/activity-log/src/templates/types.ts`:

```ts
export interface DescribedAction {
  action: string;
  description: string;
}

export type ActionTemplateFn = (reqBody: any, resBody: any) => DescribedAction;

/** Keyed by `METHOD route-pattern`, e.g. `"POST /jobs"`, `"PATCH /jobs/:id/status"`. */
export type ActionTemplateMap = Record<string, ActionTemplateFn>;
```

- [ ] **Step 4: Seed the highest-value per-service templates**

`packages/activity-log/src/templates/jobs.ts`:

```ts
import type { ActionTemplateMap } from './types';

export const jobsTemplates: ActionTemplateMap = {
  'POST /jobs': (_req, res) => ({
    action: 'job.created',
    description: `Created job "${res?.title ?? 'Untitled'}"`,
  }),
  'PATCH /jobs/:id/status': (req) => ({
    action: 'job.status_changed',
    description: `Changed job status to ${req?.status ?? 'unknown'}`,
  }),
};
```

`packages/activity-log/src/templates/crm.ts`:

```ts
import type { ActionTemplateMap } from './types';

export const crmTemplates: ActionTemplateMap = {
  'POST /customers': (req) => ({
    action: 'customer.created',
    description: req?.name ? `Created customer "${req.name}"` : 'Created a new customer',
  }),
  'POST /leads': (req) => ({
    action: 'lead.created',
    description: req?.name ? `Created lead "${req.name}"` : 'Created a new lead',
  }),
  'POST /agreements': (_req, res) => ({
    action: 'agreement.created',
    description: `Created agreement ${res?.id ?? ''}`.trim(),
  }),
  'POST /agreements/:id/confirm': () => ({
    action: 'agreement.confirmed',
    description: 'Confirmed an agreement',
  }),
  'POST /auth/login': (req) => ({
    action: 'auth.login',
    description: req?.email ? `${req.email} logged in` : 'A user logged in',
  }),
  'POST /auth/register': (req) => ({
    action: 'auth.register',
    description: req?.email ? `${req.email} signed up` : 'A new customer signed up',
  }),
};
```

`packages/activity-log/src/templates/finance.ts`:

```ts
import type { ActionTemplateMap } from './types';

export const financeTemplates: ActionTemplateMap = {
  'POST /quotes': (_req, res) => ({
    action: 'quote.created',
    description: `Created quote ${res?.id ?? ''}`.trim(),
  }),
  'POST /invoices': (_req, res) => ({
    action: 'invoice.created',
    description: `Created invoice ${res?.id ?? ''}`.trim(),
  }),
  'POST /invoices/:id/send': () => ({
    action: 'invoice.sent',
    description: 'Sent an invoice to the customer',
  }),
  'POST /invoices/:id/pay': (_req, res) => ({
    action: 'invoice.paid',
    description: `Recorded payment on invoice ${res?.id ?? ''}`.trim(),
  }),
};
```

`packages/activity-log/src/templates/comms.ts`:

```ts
import type { ActionTemplateMap } from './types';

export const commsTemplates: ActionTemplateMap = {
  'POST /messaging/threads/:id/messages': (req) => ({
    action: 'email.sent',
    description: req?.channel === 'SMS' ? 'Sent an SMS to the customer' : 'Sent an email to the customer',
  }),
};
```

`packages/activity-log/src/templates/scheduling.ts`:

```ts
import type { ActionTemplateMap } from './types';

export const schedulingTemplates: ActionTemplateMap = {
  'POST /dispatch/assign': (_req, res) => ({
    action: 'technician.assigned',
    description: `Assigned technician to job${res?.jobId ? ` ${res.jobId}` : ''}`,
  }),
};
```

- [ ] **Step 5: Implement `describeAction()`**

`packages/activity-log/src/describe-action.ts`:

```ts
import type { ActivityLogService } from '@tscrm/types';
import type { ActionTemplateMap, DescribedAction } from './templates/types';
import { crmTemplates } from './templates/crm';
import { jobsTemplates } from './templates/jobs';
import { financeTemplates } from './templates/finance';
import { commsTemplates } from './templates/comms';
import { schedulingTemplates } from './templates/scheduling';

const REGISTRY: Partial<Record<ActivityLogService, ActionTemplateMap>> = {
  crm: crmTemplates,
  jobs: jobsTemplates,
  finance: financeTemplates,
  comms: commsTemplates,
  scheduling: schedulingTemplates,
};

/**
 * Looks up a human-readable description for a route in the per-service
 * template registry. Every route gets logged regardless — an untemplated
 * route (or a template that throws on unexpected input) falls back to a
 * generic "METHOD path" description rather than dropping the entry.
 */
export function describeAction(
  service: ActivityLogService,
  method: string,
  routePattern: string,
  reqBody: unknown,
  resBody: unknown,
): DescribedAction {
  const key = `${method.toUpperCase()} ${routePattern}`;
  const fn = REGISTRY[service]?.[key];
  if (fn) {
    try {
      return fn(reqBody, resBody);
    } catch {
      // fall through to generic fallback below
    }
  }
  return { action: 'http.request', description: `${method.toUpperCase()} ${routePattern}` };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @tscrm/activity-log test -- describe-action.spec.ts`
Expected: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
git add packages/activity-log/src/templates packages/activity-log/src/describe-action.ts packages/activity-log/src/describe-action.spec.ts
git commit -m "feat(activity-log): add describeAction() with seeded per-service templates"
```

---

## Task 4: `packages/activity-log` — ActivityLogInterceptor

**Files:**
- Create: `packages/activity-log/src/activity-log.interceptor.ts`
- Create: `packages/activity-log/src/index.ts`
- Test: `packages/activity-log/src/activity-log.interceptor.spec.ts`

**Interfaces:**
- Consumes: `redact()` (Task 2), `describeAction()` (Task 3), `createQueue`/`QueueName` (`@tscrm/queue`), `ActivityLogEvent` (`@tscrm/types`).
- Produces: `ActivityLogInterceptor` (NestJS `NestInterceptor`, constructed with an `ActivityLogService` name) — registered globally per service's `main.ts` in Task 10.

- [ ] **Step 1: Write the failing test**

`packages/activity-log/src/activity-log.interceptor.spec.ts`:

```ts
import { of, throwError } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { ActivityLogInterceptor } from './activity-log.interceptor';

function makeContext(opts: {
  method: string;
  route: string;
  user?: any;
  body?: any;
}): ExecutionContext {
  const req: any = {
    method: opts.method,
    body: opts.body ?? {},
    user: opts.user,
    route: { path: opts.route },
  };
  const res: any = { statusCode: 200 };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as any;
}

describe('ActivityLogInterceptor', () => {
  it('enqueues a SUCCESS event with actor info pulled from request.user', (done) => {
    const enqueued: any[] = [];
    const interceptor = new ActivityLogInterceptor('jobs', {
      add: async (_name: string, event: any) => enqueued.push(event),
    } as any);

    const context = makeContext({
      method: 'POST',
      route: '/jobs',
      user: { userId: 'u1', name: 'Jane', role: 'dispatcher', companyId: 'co-1' },
      body: { title: 'Fix AC' },
    });
    const handler: CallHandler = { handle: () => of({ id: 'j1', title: 'Fix AC' }) };

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(enqueued).toHaveLength(1);
        expect(enqueued[0]).toMatchObject({
          service: 'jobs',
          companyId: 'co-1',
          actorUserId: 'u1',
          actorRole: 'dispatcher',
          status: 'SUCCESS',
          statusCode: 200,
          action: 'job.created',
        });
        done();
      },
    });
  });

  it('enqueues a FAILURE event and rethrows when the handler errors', (done) => {
    const enqueued: any[] = [];
    const interceptor = new ActivityLogInterceptor('jobs', {
      add: async (_name: string, event: any) => enqueued.push(event),
    } as any);

    const context = makeContext({ method: 'POST', route: '/jobs' });
    const handler: CallHandler = {
      handle: () => throwError(() => Object.assign(new Error('boom'), { status: 400 })),
    };

    interceptor.intercept(context, handler).subscribe({
      error: (err) => {
        expect(err.message).toBe('boom');
        expect(enqueued).toHaveLength(1);
        expect(enqueued[0]).toMatchObject({ status: 'FAILURE', statusCode: 400, errorMessage: 'boom' });
        done();
      },
    });
  });

  it('never throws when the queue enqueue itself fails', (done) => {
    const interceptor = new ActivityLogInterceptor('jobs', {
      add: async () => { throw new Error('redis down'); },
    } as any);

    const context = makeContext({ method: 'GET', route: '/jobs' });
    const handler: CallHandler = { handle: () => of([]) };

    interceptor.intercept(context, handler).subscribe({
      next: (val) => expect(val).toEqual([]),
      complete: () => done(),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tscrm/activity-log test -- activity-log.interceptor.spec.ts`
Expected: FAIL — `Cannot find module './activity-log.interceptor'`

- [ ] **Step 3: Implement the interceptor**

`packages/activity-log/src/activity-log.interceptor.ts`:

```ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import type { Queue } from 'bullmq';
import { createQueue, QueueName } from '@tscrm/queue';
import type { ActivityLogEvent, ActivityLogService } from '@tscrm/types';
import { redact } from './redact';
import { describeAction } from './describe-action';

/**
 * Global interceptor that logs every request this service handles to the
 * activity-log queue. Never adds latency to the real response and never
 * fails the real request — enqueueing happens after the response value is
 * already flowing back to the caller, and any enqueue failure is logged and
 * swallowed.
 */
@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLogInterceptor.name);
  private readonly queue: Queue;

  constructor(private readonly service: ActivityLogService, queue?: Queue) {
    this.queue = queue ?? createQueue(QueueName.ACTIVITY_LOG);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req: any = context.switchToHttp().getRequest();
    const res: any = context.switchToHttp().getResponse();
    const start = Date.now();
    const method = req.method;
    const routePattern: string = req.route?.path ?? req.url ?? 'unknown';

    const build = (status: 'SUCCESS' | 'FAILURE', statusCode: number, resBody: unknown, errorMessage?: string) => {
      const { action, description } = describeAction(this.service, method, routePattern, req.body, resBody);
      const event: ActivityLogEvent = {
        companyId: req.user?.companyId ?? null,
        service: this.service,
        method,
        path: routePattern,
        actorUserId: req.user?.userId ?? null,
        actorName: req.user?.name ?? null,
        actorRole: req.user?.role ?? null,
        action,
        description,
        status,
        statusCode,
        durationMs: Date.now() - start,
        requestSummary: redact(req.body),
        responseSummary: redact(resBody),
        ...(errorMessage ? { errorMessage } : {}),
      };
      return event;
    };

    const enqueue = (event: ActivityLogEvent) => {
      this.queue.add('log-event', event).catch((err) => {
        this.logger.warn(`Failed to enqueue activity-log event: ${err.message}`);
      });
    };

    return next.handle().pipe(
      tap((body) => enqueue(build('SUCCESS', res.statusCode ?? 200, body))),
      catchError((err) => {
        const statusCode = err.status ?? err.statusCode ?? 500;
        enqueue(build('FAILURE', statusCode, undefined, err.message ?? 'Unknown error'));
        return throwError(() => err);
      }),
    );
  }
}
```

- [ ] **Step 4: Export from the package index**

`packages/activity-log/src/index.ts`:

```ts
export { ActivityLogInterceptor } from './activity-log.interceptor';
export { redact } from './redact';
export { describeAction } from './describe-action';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @tscrm/activity-log test -- activity-log.interceptor.spec.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Build the package**

Run: `pnpm --filter @tscrm/activity-log build`
Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add packages/activity-log/src/activity-log.interceptor.ts packages/activity-log/src/activity-log.interceptor.spec.ts packages/activity-log/src/index.ts
git commit -m "feat(activity-log): add ActivityLogInterceptor"
```

---

## Task 5: comms-service — ActivityLog Prisma model + migration

**Files:**
- Modify: `apps/comms-service/prisma/schema.prisma`
- Modify: `scripts/apply-migrations.mjs`

**Interfaces:**
- Produces: `PrismaService.activityLog` model (`create`, `findMany`, `count`, `deleteMany`) — used by Tasks 6, 8, 9.

- [ ] **Step 1: Add the model**

In `apps/comms-service/prisma/schema.prisma`, add at the end of the file:

```prisma
// ── ActivityLog — super-admin cross-tenant monitoring feed ───────────────
// One row per API call across every service. Written by ActivityLogProcessor
// (activity-log/activity-log.processor.ts) consuming the ACTIVITY_LOG BullMQ
// queue; queried only by Role.SUPER_ADMIN via ActivityLogController.

model ActivityLog {
  id              String   @id @default(uuid())
  companyId       String?
  companyName     String
  service         String
  method          String
  path            String
  actorUserId     String?
  actorName       String?
  actorRole       String?
  action          String
  description     String
  status          String
  statusCode      Int
  durationMs      Int
  requestSummary  Json?
  responseSummary Json?
  errorMessage    String?
  createdAt       DateTime @default(now())

  @@index([companyId, createdAt])
  @@index([action, createdAt])
  @@index([status, createdAt])
  @@index([createdAt])
  @@map("activity_logs")
}
```

- [ ] **Step 2: Regenerate the Prisma client**

Run: `pnpm --filter comms-service prisma generate`
Expected: `Generated Prisma Client` with no errors; `activityLog` appears in `apps/comms-service/src/prisma/generated/index.d.ts`.

- [ ] **Step 3: Append the migration**

In `scripts/apply-migrations.mjs`, add to the `migrations` array (find the last entry and add after it, before the closing `];`):

```js
  {
    schema: 'comms',
    name: '20260815010000_add_activity_logs',
    sql: `
CREATE TABLE IF NOT EXISTS "comms"."activity_logs" (
  "id" TEXT NOT NULL,
  "companyId" TEXT,
  "companyName" TEXT NOT NULL,
  "service" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorName" TEXT,
  "actorRole" TEXT,
  "action" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "requestSummary" JSONB,
  "responseSummary" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "activity_logs_companyId_createdAt_idx" ON "comms"."activity_logs"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "activity_logs_action_createdAt_idx" ON "comms"."activity_logs"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "activity_logs_status_createdAt_idx" ON "comms"."activity_logs"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "activity_logs_createdAt_idx" ON "comms"."activity_logs"("createdAt");
    `.trim(),
  },
```

- [ ] **Step 4: Apply the migration**

Run: `node scripts/apply-migrations.mjs`
Expected: `[apply] 20260815010000_add_activity_logs …` then `[ok]` under `=== Schema: comms ===`.

- [ ] **Step 5: Verify the table exists**

Run: `pnpm --filter comms-service prisma studio` (or a quick `psql` check) and confirm `activity_logs` is visible under the `comms` schema with the columns above. Close Studio when done.

- [ ] **Step 6: Commit**

```bash
git add apps/comms-service/prisma/schema.prisma scripts/apply-migrations.mjs apps/comms-service/src/prisma/generated
git commit -m "feat(activity-log): add ActivityLog Prisma model and migration"
```

---

## Task 6: comms-service — ActivityLogProcessor (BullMQ worker)

**Files:**
- Create: `apps/comms-service/src/activity-log/activity-log.module.ts`
- Create: `apps/comms-service/src/activity-log/activity-log.processor.ts`
- Create: `apps/comms-service/src/activity-log/company-name-cache.service.ts`
- Modify: `apps/comms-service/src/app.module.ts`
- Test: `apps/comms-service/src/activity-log/activity-log.processor.spec.ts`

**Interfaces:**
- Consumes: `PrismaService` (existing), `ActivityLogEvent` (`@tscrm/types`), `createRedisConnection` (`@tscrm/queue`).
- Produces: `ActivityLogProcessor.handleEvent(event: ActivityLogEvent): Promise<ActivityLog>` — Task 7's gateway broadcast is triggered from inside this method. `CompanyNameCacheService.resolve(companyId): Promise<string>` — used by the processor.

- [ ] **Step 1: Write the failing test for the company-name cache**

`apps/comms-service/src/activity-log/company-name-cache.service.spec.ts`:

```ts
import { CompanyNameCacheService } from './company-name-cache.service';

describe('CompanyNameCacheService', () => {
  it('fetches a company name once and caches it for subsequent calls', async () => {
    const fetcher = jest.fn().mockResolvedValue('Acme HVAC');
    const cache = new CompanyNameCacheService(fetcher);

    const first = await cache.resolve('co-1');
    const second = await cache.resolve('co-1');

    expect(first).toBe('Acme HVAC');
    expect(second).toBe('Acme HVAC');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('falls back to the raw id when the fetch fails', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('down'));
    const cache = new CompanyNameCacheService(fetcher);

    const result = await cache.resolve('co-2');

    expect(result).toBe('co-2');
  });

  it('returns "Unknown" for a null companyId without calling the fetcher', async () => {
    const fetcher = jest.fn();
    const cache = new CompanyNameCacheService(fetcher);

    const result = await cache.resolve(null);

    expect(result).toBe('Unknown');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter comms-service test -- company-name-cache.service.spec.ts`
Expected: FAIL — `Cannot find module './company-name-cache.service'`

- [ ] **Step 3: Implement the cache**

`apps/comms-service/src/activity-log/company-name-cache.service.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';
const TTL_MS = 10 * 60 * 1000; // 10 minutes

export type CompanyNameFetcher = (companyId: string) => Promise<string>;

async function fetchCompanyName(companyId: string): Promise<string> {
  const res = await axios.get(`${CRM_SERVICE_URL}/company`, {
    headers: serviceHeaders(companyId),
    timeout: 5_000,
  });
  return res.data?.name ?? companyId;
}

function serviceHeaders(companyId: string): Record<string, string> {
  if (process.env.BYPASS_AUTH === 'true') {
    return {
      'x-test-user-role': 'super_admin',
      'x-test-company-id': companyId,
      'x-test-user-id': 'activity-log-worker',
      'x-test-user-email': 'activity-log@tscrm.internal',
      'x-test-user-name': 'Activity Log Worker',
    };
  }
  return { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
}

/**
 * Resolves a companyId → companyName, caching each result for TTL_MS so the
 * activity-log worker isn't hitting crm-service once per event. Never throws
 * — a lookup failure falls back to the raw companyId so the event is still
 * written and displayable.
 */
@Injectable()
export class CompanyNameCacheService {
  private readonly logger = new Logger(CompanyNameCacheService.name);
  private readonly cache = new Map<string, { name: string; expiresAt: number }>();

  constructor(private readonly fetcher: CompanyNameFetcher = fetchCompanyName) {}

  async resolve(companyId: string | null): Promise<string> {
    if (!companyId) return 'Unknown';

    const cached = this.cache.get(companyId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.name;
    }

    try {
      const name = await this.fetcher(companyId);
      this.cache.set(companyId, { name, expiresAt: Date.now() + TTL_MS });
      return name;
    } catch (err: any) {
      this.logger.warn(`Company name lookup failed for ${companyId}: ${err.message}`);
      return companyId;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter comms-service test -- company-name-cache.service.spec.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Write the failing test for the processor**

`apps/comms-service/src/activity-log/activity-log.processor.spec.ts`:

```ts
import { ActivityLogProcessor } from './activity-log.processor';
import type { ActivityLogEvent } from '@tscrm/types';

describe('ActivityLogProcessor', () => {
  const baseEvent: ActivityLogEvent = {
    companyId: 'co-1',
    service: 'jobs',
    method: 'POST',
    path: '/jobs',
    actorUserId: 'u1',
    actorName: 'Jane',
    actorRole: 'dispatcher',
    action: 'job.created',
    description: 'Created job "Fix AC"',
    status: 'SUCCESS',
    statusCode: 201,
    durationMs: 42,
  };

  it('writes a row with the resolved company name and broadcasts it', async () => {
    const created = { id: 'log-1', ...baseEvent, companyName: 'Acme HVAC', createdAt: new Date() };
    const prisma = { activityLog: { create: jest.fn().mockResolvedValue(created) } } as any;
    const companyNames = { resolve: jest.fn().mockResolvedValue('Acme HVAC') } as any;
    const broadcast = jest.fn();

    const stubWorker = { on: jest.fn(), close: jest.fn() };
    const processor = new ActivityLogProcessor(
      prisma,
      companyNames,
      { broadcastActivity: broadcast } as any,
      stubWorker as any,
    );
    const result = await processor.handleEvent(baseEvent);

    expect(companyNames.resolve).toHaveBeenCalledWith('co-1');
    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ companyId: 'co-1', companyName: 'Acme HVAC', action: 'job.created' }),
    });
    expect(broadcast).toHaveBeenCalledWith(created);
    expect(result).toBe(created);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm --filter comms-service test -- activity-log.processor.spec.ts`
Expected: FAIL — `Cannot find module './activity-log.processor'`

- [ ] **Step 7: Implement the processor**

`apps/comms-service/src/activity-log/activity-log.processor.ts`:

```ts
import { Injectable, Logger, Optional, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'bullmq';
import { createRedisConnection, QueueName } from '@tscrm/queue';
import type { ActivityLogEvent } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyNameCacheService } from './company-name-cache.service';
import { ActivityGateway } from './activity.gateway';

/**
 * The single write+broadcast choke point for every activity-log event,
 * regardless of which of the 8 services originated it (NestJS services push
 * here via BullMQ directly; scheduling-service pushes via the ingest
 * endpoint in ActivityLogController, which enqueues the same way).
 */
@Injectable()
export class ActivityLogProcessor implements OnModuleDestroy {
  private readonly logger = new Logger(ActivityLogProcessor.name);
  private readonly worker: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyNames: CompanyNameCacheService,
    private readonly gateway: ActivityGateway,
    @Optional() worker?: Worker,
  ) {
    // `worker` is injectable so unit tests can construct this class without
    // opening a real Redis connection (which would otherwise keep Jest's
    // process alive after the test finishes).
    this.worker =
      worker ??
      new Worker(QueueName.ACTIVITY_LOG, async (job) => this.handleEvent(job.data as ActivityLogEvent), {
        connection: createRedisConnection(),
      });
    this.worker.on('failed', (job, err) => {
      this.logger.error(`Activity-log job ${job?.id} failed: ${err.message}`);
    });
  }

  async handleEvent(event: ActivityLogEvent) {
    const companyName = await this.companyNames.resolve(event.companyId);
    const created = await this.prisma.activityLog.create({
      data: {
        companyId: event.companyId,
        companyName,
        service: event.service,
        method: event.method,
        path: event.path,
        actorUserId: event.actorUserId,
        actorName: event.actorName,
        actorRole: event.actorRole,
        action: event.action,
        description: event.description,
        status: event.status,
        statusCode: event.statusCode,
        durationMs: event.durationMs,
        requestSummary: (event.requestSummary ?? undefined) as any,
        responseSummary: (event.responseSummary ?? undefined) as any,
        errorMessage: event.errorMessage,
      },
    });
    this.gateway.broadcastActivity(created);
    return created;
  }

  async onModuleDestroy() {
    await this.worker.close();
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm --filter comms-service test -- activity-log.processor.spec.ts`
Expected: PASS (1 test)

- [ ] **Step 9: Wire the module (gateway comes in Task 7 — stub it here, fill in next task)**

`apps/comms-service/src/activity-log/activity-log.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompanyNameCacheService } from './company-name-cache.service';
import { ActivityLogProcessor } from './activity-log.processor';
import { ActivityGateway } from './activity.gateway';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogCleanupService } from './activity-log-cleanup.service';

@Module({
  imports: [PrismaModule],
  controllers: [ActivityLogController],
  providers: [CompanyNameCacheService, ActivityLogProcessor, ActivityGateway, ActivityLogCleanupService],
  exports: [ActivityGateway],
})
export class ActivityLogModule {}
```

(`ActivityGateway`, `ActivityLogController`, and `ActivityLogCleanupService` don't exist yet — Tasks 7–9 add them. This module file will not compile until Task 9 completes; that's expected mid-plan and is why Task 7/8/9 come immediately next, before any other service is touched.)

- [ ] **Step 10: Register the module in app.module.ts**

In `apps/comms-service/src/app.module.ts`, add the import and add `ActivityLogModule` to the `imports` array (after `CompanySettingsModule`):

```ts
import { ActivityLogModule } from './activity-log/activity-log.module';
```

```ts
    CompanySettingsModule,
    ActivityLogModule,
```

- [ ] **Step 11: Commit**

```bash
git add apps/comms-service/src/activity-log/activity-log.processor.ts apps/comms-service/src/activity-log/activity-log.processor.spec.ts apps/comms-service/src/activity-log/company-name-cache.service.ts apps/comms-service/src/activity-log/company-name-cache.service.spec.ts apps/comms-service/src/activity-log/activity-log.module.ts apps/comms-service/src/app.module.ts
git commit -m "feat(activity-log): add ActivityLogProcessor and company-name cache"
```

---

## Task 7: comms-service — ActivityGateway (Socket.IO `/activity` namespace)

**Files:**
- Create: `apps/comms-service/src/activity-log/activity.gateway.ts`
- Test: `apps/comms-service/src/activity-log/activity.gateway.spec.ts`

**Interfaces:**
- Consumes: nothing new (JWT verification mirrors `MessagingGateway`'s pattern).
- Produces: `ActivityGateway.broadcastActivity(entry): void` — consumed by Task 6's processor (already wired via constructor injection).

- [ ] **Step 1: Write the failing test**

`apps/comms-service/src/activity-log/activity.gateway.spec.ts`:

```ts
import { ActivityGateway } from './activity.gateway';

function makeSocket(overrides: Partial<any> = {}) {
  return {
    handshake: { auth: {}, query: {}, headers: {} },
    join: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  };
}

describe('ActivityGateway', () => {
  it('rejects a connection with no auth at all', async () => {
    const gateway = new ActivityGateway();
    const client = makeSocket();
    await gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('rejects a dev-bypass connection whose role is not super_admin', async () => {
    const gateway = new ActivityGateway();
    const client = makeSocket({
      handshake: { auth: {}, query: { companyId: 'co-1', userId: 'u1', userRole: 'company_admin' }, headers: {} },
    });
    await gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('accepts a dev-bypass connection whose role is super_admin and joins company:all', async () => {
    const gateway = new ActivityGateway();
    const client = makeSocket({
      handshake: { auth: {}, query: { companyId: 'co-1', userId: 'u1', userRole: 'super_admin' }, headers: {} },
    });
    await gateway.handleConnection(client as any);
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.join).toHaveBeenCalledWith('company:all');
  });

  it('broadcastActivity emits to both the company room and company:all', () => {
    const gateway = new ActivityGateway();
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    (gateway as any).server = { to };

    gateway.broadcastActivity({ companyId: 'co-1', action: 'job.created' } as any);

    expect(to).toHaveBeenCalledWith('company:co-1');
    expect(to).toHaveBeenCalledWith('company:all');
    expect(emit).toHaveBeenCalledWith('activity:new', expect.objectContaining({ action: 'job.created' }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter comms-service test -- activity.gateway.spec.ts`
Expected: FAIL — `Cannot find module './activity.gateway'`

- [ ] **Step 3: Implement the gateway**

`apps/comms-service/src/activity-log/activity.gateway.ts`:

```ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

interface ActivitySocket extends Socket {
  userRole?: string;
}

/**
 * Real-time feed for the super-admin activity monitoring dashboard.
 * The ONE deliberate, narrow exception to this codebase's per-company
 * scoping — enforced here at the socket layer (role check on connect),
 * again in ActivityLogController's route guard, and again in the
 * admin-dashboard route itself. A non-super_admin connection is rejected
 * outright, never merely hidden.
 */
@WebSocketGateway({
  namespace: '/activity',
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://tscrm-demo-admin.web.app',
      'https://tscrm-demo-customer.web.app',
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ActivityGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ActivityGateway.name);

  async handleConnection(client: ActivitySocket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.query?.token ??
        (client.handshake.headers?.authorization as string | undefined)?.replace('Bearer ', '');

      let role: string | undefined;

      if (!token) {
        const companyId =
          (client.handshake.headers['x-test-company-id'] as string) ?? (client.handshake.query?.companyId as string);
        const userId =
          (client.handshake.headers['x-test-user-id'] as string) ?? (client.handshake.query?.userId as string);
        role =
          (client.handshake.headers['x-test-user-role'] as string) ?? (client.handshake.query?.userRole as string);

        if (!companyId || !userId || !role) {
          this.logger.warn(`Activity socket ${client.id} — no auth`);
          client.disconnect(true);
          return;
        }
      } else {
        const secret = process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production';
        const decoded = jwt.verify(token, secret) as any;
        role = decoded.role;
      }

      client.userRole = role;
      if ((role ?? '').toLowerCase() !== 'super_admin') {
        this.logger.warn(`Activity socket ${client.id} rejected — role "${role}" is not super_admin`);
        client.disconnect(true);
        return;
      }

      client.join('company:all');
      this.logger.log(`Activity socket ${client.id} connected as super_admin`);
    } catch (err: any) {
      this.logger.warn(`Activity socket ${client.id} auth failed: ${err.message}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('watch_company')
  handleWatchCompany(@ConnectedSocket() client: ActivitySocket, @MessageBody() data: { companyId: string }) {
    if (!data?.companyId) return;
    client.join(`company:${data.companyId}`);
  }

  @SubscribeMessage('unwatch_company')
  handleUnwatchCompany(@ConnectedSocket() client: ActivitySocket, @MessageBody() data: { companyId: string }) {
    if (!data?.companyId) return;
    client.leave(`company:${data.companyId}`);
  }

  /** Called by ActivityLogProcessor right after a row is written. */
  broadcastActivity(entry: unknown) {
    const companyId = (entry as any)?.companyId;
    if (companyId) {
      this.server.to(`company:${companyId}`).emit('activity:new', entry);
    }
    this.server.to('company:all').emit('activity:new', entry);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter comms-service test -- activity.gateway.spec.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/comms-service/src/activity-log/activity.gateway.ts apps/comms-service/src/activity-log/activity.gateway.spec.ts
git commit -m "feat(activity-log): add ActivityGateway with super_admin-only /activity namespace"
```

---

## Task 8: comms-service — ActivityLogController (query API + Go ingest endpoint)

**Files:**
- Create: `apps/comms-service/src/activity-log/activity-log.controller.ts`
- Create: `apps/comms-service/src/activity-log/dto/query-activity-log.dto.ts`
- Test: `apps/comms-service/src/activity-log/activity-log.controller.spec.ts`

**Interfaces:**
- Consumes: `PrismaService`, `clampPagination` (`@tscrm/types`), `Roles`/`RolesGuard`/`JwtAuthGuard` (`@tscrm/auth-client`), `ActivityLogProcessor.handleEvent` (Task 6), `ActivityLogEvent` (`@tscrm/types`).
- Produces: `GET /comms/activity-log`, `GET /comms/activity-log/companies`, `POST /comms/activity-log/ingest` — the ingest route is consumed by Go's `scheduling-service` middleware in Task 11.

- [ ] **Step 1: Write the failing test**

`apps/comms-service/src/activity-log/activity-log.controller.spec.ts`:

```ts
import { ForbiddenException } from '@nestjs/common';
import { ActivityLogController } from './activity-log.controller';
import { Role } from '@tscrm/types';

describe('ActivityLogController', () => {
  function makePrisma() {
    return {
      activityLog: {
        findMany: jest.fn().mockResolvedValue([{ id: 'log-1' }]),
        count: jest.fn().mockResolvedValue(1),
        findMany2: undefined,
      },
    } as any;
  }

  it('lists activity, applying company/service/status/date filters and clamped pagination', async () => {
    const prisma = makePrisma();
    const controller = new ActivityLogController(prisma, { handleEvent: jest.fn() } as any);

    const result = await controller.list({
      companyId: 'co-1', service: 'jobs', status: 'FAILURE', page: '1', limit: '20',
    } as any);

    expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'co-1', service: 'jobs', status: 'FAILURE' }),
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      }),
    );
    expect(result.items).toEqual([{ id: 'log-1' }]);
    expect(result.total).toBe(1);
  });

  it('omits the companyId filter when companyId is "all" or absent', async () => {
    const prisma = makePrisma();
    const controller = new ActivityLogController(prisma, { handleEvent: jest.fn() } as any);

    await controller.list({ companyId: 'all' } as any);

    const where = prisma.activityLog.findMany.mock.calls[0][0].where;
    expect(where.companyId).toBeUndefined();
  });

  it('lists distinct companies seen in the log', async () => {
    const prisma = makePrisma();
    prisma.activityLog.findMany.mockResolvedValueOnce([
      { companyId: 'co-1', companyName: 'Acme' },
      { companyId: 'co-2', companyName: 'Bolt Co' },
    ]);
    const controller = new ActivityLogController(prisma, { handleEvent: jest.fn() } as any);

    const result = await controller.companies();

    expect(result).toEqual([
      { companyId: 'co-1', companyName: 'Acme' },
      { companyId: 'co-2', companyName: 'Bolt Co' },
    ]);
  });

  it('ingest hands the event to the processor and returns 202', async () => {
    const handleEvent = jest.fn().mockResolvedValue({ id: 'log-9' });
    const controller = new ActivityLogController({} as any, { handleEvent } as any);

    const result = await controller.ingest({ service: 'scheduling', action: 'technician.assigned' } as any);

    expect(handleEvent).toHaveBeenCalledWith(expect.objectContaining({ service: 'scheduling' }));
    expect(result).toEqual({ accepted: true });
  });
});

describe('ActivityLogController RBAC', () => {
  it('is annotated for Role.SUPER_ADMIN only (guarded at the class level)', () => {
    const roles = Reflect.getMetadata('roles', ActivityLogController);
    expect(roles).toEqual([Role.SUPER_ADMIN]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter comms-service test -- activity-log.controller.spec.ts`
Expected: FAIL — `Cannot find module './activity-log.controller'`

- [ ] **Step 3: Write the query DTO**

`apps/comms-service/src/activity-log/dto/query-activity-log.dto.ts`:

```ts
import { IsIn, IsOptional, IsString } from 'class-validator';

export class QueryActivityLogDto {
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() service?: string;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsIn(['SUCCESS', 'FAILURE']) status?: 'SUCCESS' | 'FAILURE';
  @IsOptional() @IsString() actorUserId?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}
```

- [ ] **Step 4: Implement the controller**

`apps/comms-service/src/activity-log/activity-log.controller.ts`:

```ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '@tscrm/auth-client';
import { Role, clampPagination } from '@tscrm/types';
import type { ActivityLogEvent } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogProcessor } from './activity-log.processor';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

@Controller('activity-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class ActivityLogController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: ActivityLogProcessor,
  ) {}

  @Get()
  async list(@Query() query: QueryActivityLogDto) {
    const { page, limit, skip } = clampPagination({ page: query.page, limit: query.limit });

    const where: Record<string, unknown> = {};
    if (query.companyId && query.companyId !== 'all') where.companyId = query.companyId;
    if (query.service) where.service = query.service;
    if (query.action) where.action = query.action;
    if (query.status) where.status = query.status;
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  @Get('companies')
  async companies() {
    const rows = await this.prisma.activityLog.findMany({
      distinct: ['companyId'],
      select: { companyId: true, companyName: true },
      where: { companyId: { not: null } },
      orderBy: { companyName: 'asc' },
    });
    return rows.map((r) => ({ companyId: r.companyId, companyName: r.companyName }));
  }

  /**
   * Internal ingest for services with no BullMQ client (scheduling-service,
   * Go). Auth is service-to-service (same x-test-*/SERVICE_JWT convention
   * used elsewhere), not exposed to any frontend.
   */
  @Post('ingest')
  async ingest(@Body() event: ActivityLogEvent) {
    await this.processor.handleEvent(event);
    return { accepted: true };
  }
}
```

Note: the `ingest` route is also gated by the class-level `@Roles(Role.SUPER_ADMIN)` guard above, which is wrong for a service-to-service call — fix this in Step 5.

- [ ] **Step 5: Split ingest into its own unguarded controller**

Service-to-service calls don't carry a super_admin JWT — they use the `x-test-*`/`SERVICE_JWT` service-auth convention from `serviceHeaders()` (see `CompanyNameCacheService` in Task 6), not a real user role. Guarding `/ingest` the same way as the human-facing query routes would reject every legitimate call. Split it out:

Replace the whole file `apps/comms-service/src/activity-log/activity-log.controller.ts` with two controllers:

```ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '@tscrm/auth-client';
import { Role, clampPagination } from '@tscrm/types';
import type { ActivityLogEvent } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogProcessor } from './activity-log.processor';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

/** Human-facing query API — super_admin only, every route. */
@Controller('activity-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class ActivityLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: QueryActivityLogDto) {
    const { page, limit, skip } = clampPagination({ page: query.page, limit: query.limit });

    const where: Record<string, unknown> = {};
    if (query.companyId && query.companyId !== 'all') where.companyId = query.companyId;
    if (query.service) where.service = query.service;
    if (query.action) where.action = query.action;
    if (query.status) where.status = query.status;
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  @Get('companies')
  async companies() {
    const rows = await this.prisma.activityLog.findMany({
      distinct: ['companyId'],
      select: { companyId: true, companyName: true },
      where: { companyId: { not: null } },
      orderBy: { companyName: 'asc' },
    });
    return rows.map((r) => ({ companyId: r.companyId, companyName: r.companyName }));
  }
}

/**
 * Internal ingest for services with no BullMQ client (scheduling-service,
 * Go). Deliberately NOT role-guarded — it's a service-to-service endpoint,
 * never called from a frontend, and carries no user JWT. It funnels into
 * the exact same write+broadcast path as every NestJS-originated event.
 */
@Controller('activity-log')
export class ActivityLogIngestController {
  constructor(private readonly processor: ActivityLogProcessor) {}

  @Post('ingest')
  async ingest(@Body() event: ActivityLogEvent) {
    await this.processor.handleEvent(event);
    return { accepted: true };
  }
}
```

- [ ] **Step 6: Update the test file for the two-controller split**

Replace `apps/comms-service/src/activity-log/activity-log.controller.spec.ts` with:

```ts
import { ActivityLogController, ActivityLogIngestController } from './activity-log.controller';
import { Role } from '@tscrm/types';

function makePrisma() {
  return {
    activityLog: {
      findMany: jest.fn().mockResolvedValue([{ id: 'log-1' }]),
      count: jest.fn().mockResolvedValue(1),
    },
  } as any;
}

describe('ActivityLogController', () => {
  it('lists activity, applying company/service/status/date filters and clamped pagination', async () => {
    const prisma = makePrisma();
    const controller = new ActivityLogController(prisma);

    const result = await controller.list({
      companyId: 'co-1', service: 'jobs', status: 'FAILURE', page: '1', limit: '20',
    } as any);

    expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'co-1', service: 'jobs', status: 'FAILURE' }),
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      }),
    );
    expect(result.items).toEqual([{ id: 'log-1' }]);
    expect(result.total).toBe(1);
  });

  it('omits the companyId filter when companyId is "all" or absent', async () => {
    const prisma = makePrisma();
    const controller = new ActivityLogController(prisma);

    await controller.list({ companyId: 'all' } as any);

    const where = prisma.activityLog.findMany.mock.calls[0][0].where;
    expect(where.companyId).toBeUndefined();
  });

  it('lists distinct companies seen in the log', async () => {
    const prisma = makePrisma();
    prisma.activityLog.findMany.mockResolvedValueOnce([
      { companyId: 'co-1', companyName: 'Acme' },
      { companyId: 'co-2', companyName: 'Bolt Co' },
    ]);
    const controller = new ActivityLogController(prisma);

    const result = await controller.companies();

    expect(result).toEqual([
      { companyId: 'co-1', companyName: 'Acme' },
      { companyId: 'co-2', companyName: 'Bolt Co' },
    ]);
  });

  it('is annotated for Role.SUPER_ADMIN only (guarded at the class level)', () => {
    const roles = Reflect.getMetadata('roles', ActivityLogController);
    expect(roles).toEqual([Role.SUPER_ADMIN]);
  });
});

describe('ActivityLogIngestController', () => {
  it('hands the event to the processor and returns accepted', async () => {
    const handleEvent = jest.fn().mockResolvedValue({ id: 'log-9' });
    const controller = new ActivityLogIngestController({ handleEvent } as any);

    const result = await controller.ingest({ service: 'scheduling', action: 'technician.assigned' } as any);

    expect(handleEvent).toHaveBeenCalledWith(expect.objectContaining({ service: 'scheduling' }));
    expect(result).toEqual({ accepted: true });
  });

  it('carries no @Roles metadata (service-to-service, not user-guarded)', () => {
    const roles = Reflect.getMetadata('roles', ActivityLogIngestController);
    expect(roles).toBeUndefined();
  });
});
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm --filter comms-service test -- activity-log.controller.spec.ts`
Expected: PASS (6 tests)

- [ ] **Step 8: Register both controllers in the module**

In `apps/comms-service/src/activity-log/activity-log.module.ts`, update the import and `controllers` array:

```ts
import { ActivityLogController, ActivityLogIngestController } from './activity-log.controller';
```

```ts
  controllers: [ActivityLogController, ActivityLogIngestController],
```

- [ ] **Step 9: Commit**

```bash
git add apps/comms-service/src/activity-log/activity-log.controller.ts apps/comms-service/src/activity-log/activity-log.controller.spec.ts apps/comms-service/src/activity-log/dto apps/comms-service/src/activity-log/activity-log.module.ts
git commit -m "feat(activity-log): add super_admin query API and unguarded service-ingest endpoint"
```

---

## Task 9: comms-service — 90-day retention cleanup job

**Files:**
- Create: `apps/comms-service/src/activity-log/activity-log-cleanup.service.ts`
- Test: `apps/comms-service/src/activity-log/activity-log-cleanup.service.spec.ts`

**Interfaces:**
- Consumes: `PrismaService`, `createQueue`/`QueueName` (`@tscrm/queue`).
- Produces: nothing consumed elsewhere — this is a leaf, self-scheduling service.

- [ ] **Step 1: Write the failing test**

`apps/comms-service/src/activity-log/activity-log-cleanup.service.spec.ts`:

```ts
import { ActivityLogCleanupService } from './activity-log-cleanup.service';

describe('ActivityLogCleanupService', () => {
  it('deletes rows older than 90 days', async () => {
    const prisma = { activityLog: { deleteMany: jest.fn().mockResolvedValue({ count: 12 }) } } as any;
    const service = new ActivityLogCleanupService(prisma);

    const result = await service.runCleanup();

    expect(prisma.activityLog.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
    const cutoff = prisma.activityLog.deleteMany.mock.calls[0][0].where.createdAt.lt as Date;
    const daysAgo = (Date.now() - cutoff.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysAgo).toBeGreaterThan(89.9);
    expect(daysAgo).toBeLessThan(90.1);
    expect(result).toEqual({ deleted: 12 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter comms-service test -- activity-log-cleanup.service.spec.ts`
Expected: FAIL — `Cannot find module './activity-log-cleanup.service'`

- [ ] **Step 2.5: Add a dedicated `ACTIVITY_LOG_CLEANUP` queue name**

Reusing `QueueName.ACTIVITY_LOG` for both log ingestion (Task 6) and this nightly
sweep would put two BullMQ `Worker`s on the same queue — they COMPETE for jobs
rather than each seeing every job, so a real log-event could be silently
swallowed by the cleanup worker (or the cleanup tick misprocessed as a log
event) depending on which Worker happens to grab it. In `packages/queue/src/index.ts`,
add a second, separate queue name:

```ts
export enum QueueName {
  SEND_SMS = 'send-sms',
  SEND_EMAIL = 'send-email',
  SEND_PUSH = 'send-push',
  GENERATE_PDF = 'generate-pdf',
  PROCESS_PAYMENT = 'process-payment',
  SEND_INVOICE = 'send-invoice',
  APPOINTMENT_REMINDER = 'appointment-reminder',
  REVIEW_REQUEST = 'review-request',
  JOB_STATUS_NOTIFICATION = 'job-status-notification',
  FOLLOWUP = 'followup-queue',
  MARKETING_SEND = 'marketing-send',
  EQUIPMENT_AUTOMATION = 'equipment-automation',
  ACTIVITY_LOG = 'activity-log',
  // Separate from ACTIVITY_LOG on purpose: two Workers listening on the same
  // BullMQ queue COMPETE for jobs rather than each seeing every job, so the
  // nightly retention sweep must run on its own queue — sharing one would
  // risk a real log-event job being silently swallowed by the cleanup
  // worker (or vice versa) depending on which Worker happens to grab it.
  ACTIVITY_LOG_CLEANUP = 'activity-log-cleanup',
}
```

Run: `pnpm --filter @tscrm/queue build` — expect no errors.

- [ ] **Step 3: Implement the cleanup service**

`apps/comms-service/src/activity-log/activity-log-cleanup.service.ts`:

```ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'bullmq';
import { createRedisConnection, createQueue, QueueName } from '@tscrm/queue';
import { PrismaService } from '../prisma/prisma.service';

const RETENTION_DAYS = 90;
const CLEANUP_JOB_NAME = 'run-cleanup';

/**
 * Nightly sweep enforcing the 90-day retention window. Postgres has no
 * native TTL index (unlike the Mongo TTL index this design originally
 * assumed — see the spec's data-model correction note), so this is a BullMQ
 * repeatable job instead: scheduled once at module init, runs on its own
 * cron regardless of how many times the service restarts. Uses its own
 * QueueName.ACTIVITY_LOG_CLEANUP queue — separate from the high-volume
 * ACTIVITY_LOG ingestion queue so the two Workers never compete for jobs.
 * The constructor takes only `prisma` (no eager queue/Worker creation) so
 * unit tests can `new` this class directly without opening a real Redis
 * connection — the real Worker is created lazily in onModuleInit, which
 * only NestJS's lifecycle (not a plain constructor call) triggers.
 */
@Injectable()
export class ActivityLogCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ActivityLogCleanupService.name);
  private worker?: Worker;

  constructor(private readonly prisma: PrismaService) {}

  async runCleanup(): Promise<{ deleted: number }> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await this.prisma.activityLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
    this.logger.log(`Activity-log cleanup: removed ${result.count} rows older than ${RETENTION_DAYS} days`);
    return { deleted: result.count };
  }

  async onModuleInit() {
    const cleanupQueue = createQueue(QueueName.ACTIVITY_LOG_CLEANUP);
    await cleanupQueue.add(
      CLEANUP_JOB_NAME,
      {},
      { repeat: { pattern: '0 3 * * *' }, jobId: CLEANUP_JOB_NAME },
    );
    await cleanupQueue.close();

    this.worker = new Worker(QueueName.ACTIVITY_LOG_CLEANUP, async () => this.runCleanup(), {
      connection: createRedisConnection(),
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter comms-service test -- activity-log-cleanup.service.spec.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Full comms-service build + test suite**

Run: `pnpm --filter comms-service build && pnpm --filter comms-service test`
Expected: build succeeds, all comms-service tests (existing + new) pass. This is the first point the whole `ActivityLogModule` compiles end-to-end (Tasks 6–9 combined) — fix any wiring errors here before moving on.

- [ ] **Step 6: Commit**

```bash
git add apps/comms-service/src/activity-log/activity-log-cleanup.service.ts apps/comms-service/src/activity-log/activity-log-cleanup.service.spec.ts
git commit -m "feat(activity-log): add 90-day retention cleanup job"
```

---

## Task 10: Wire `ActivityLogInterceptor` into every NestJS service

**Files:**
- Modify: `apps/crm-service/src/main.ts`, `apps/crm-service/package.json`
- Modify: `apps/job-service/src/main.ts`, `apps/job-service/package.json`
- Modify: `apps/finance-service/src/main.ts`, `apps/finance-service/package.json`
- Modify: `apps/comms-service/src/main.ts`
- Modify: `apps/analytics-service/src/main.ts`, `apps/analytics-service/package.json`
- Modify: `apps/inventory-service/src/main.ts`, `apps/inventory-service/package.json`

**Interfaces:**
- Consumes: `ActivityLogInterceptor` (`@tscrm/activity-log`, Task 4).
- Produces: nothing new — this is pure registration, no new exports.

- [ ] **Step 1: Add `@tscrm/activity-log` (and `@tscrm/queue` where missing) to each service's `package.json`**

`apps/job-service/package.json`, `apps/finance-service/package.json`, `apps/analytics-service/package.json`, `apps/inventory-service/package.json` — add both lines next to the existing `@tscrm/auth-client`/`@tscrm/types` entries:

```json
    "@tscrm/activity-log": "workspace:*",
    "@tscrm/queue": "workspace:*",
```

`apps/crm-service/package.json` and `apps/comms-service/package.json` already have `@tscrm/queue` — add only:

```json
    "@tscrm/activity-log": "workspace:*",
```

- [ ] **Step 2: Install workspace links**

Run: `pnpm install`
Expected: completes with no errors; `node_modules/@tscrm/activity-log` symlinked into each of the 6 services.

- [ ] **Step 3: Register the interceptor in each `main.ts`**

For each service below, add the import and the `app.useGlobalInterceptors(...)` call right after `app.useGlobalPipes(...)`. The `service` name passed matches the values used throughout the template registry (Task 3) and the `ActivityLogService` union (Task 1).

`apps/crm-service/src/main.ts`:
```ts
import { ActivityLogInterceptor } from '@tscrm/activity-log';
```
```ts
  app.useGlobalInterceptors(new ActivityLogInterceptor('crm'));
```

`apps/job-service/src/main.ts`:
```ts
import { ActivityLogInterceptor } from '@tscrm/activity-log';
```
```ts
  app.useGlobalInterceptors(new ActivityLogInterceptor('jobs'));
```

`apps/finance-service/src/main.ts`:
```ts
import { ActivityLogInterceptor } from '@tscrm/activity-log';
```
```ts
  app.useGlobalInterceptors(new ActivityLogInterceptor('finance'));
```

`apps/comms-service/src/main.ts`:
```ts
import { ActivityLogInterceptor } from '@tscrm/activity-log';
```
```ts
  app.useGlobalInterceptors(new ActivityLogInterceptor('comms'));
```

`apps/analytics-service/src/main.ts`:
```ts
import { ActivityLogInterceptor } from '@tscrm/activity-log';
```
```ts
  app.useGlobalInterceptors(new ActivityLogInterceptor('analytics'));
```

`apps/inventory-service/src/main.ts`:
```ts
import { ActivityLogInterceptor } from '@tscrm/activity-log';
```
```ts
  app.useGlobalInterceptors(new ActivityLogInterceptor('inventory'));
```

- [ ] **Step 4: Add Jest moduleNameMapper entries where the service's Jest config maps other `@tscrm/*` packages to source**

Services whose `package.json` already has a `moduleNameMapper` block for `@tscrm/*` (currently `crm-service`, `finance-service`, `analytics-service` — check each file's `jest` key) need one more line so `@tscrm/activity-log` resolves to source in tests, matching how `@tscrm/queue` is already mapped in `crm-service`:

```json
      "^@tscrm/activity-log$": "<rootDir>/../../../packages/activity-log/src/index.ts"
```

(For services without an existing `moduleNameMapper` — e.g. `job-service`, `inventory-service` — skip this; they resolve packages via the normal `node_modules` symlink and don't need it.)

- [ ] **Step 5: Build the package once more so every service's symlinked `dist/` is fresh**

Run: `pnpm --filter @tscrm/activity-log build`
Expected: no errors.

- [ ] **Step 6: Build and test all six services**

Run: `pnpm --filter crm-service --filter job-service --filter finance-service --filter comms-service --filter analytics-service --filter inventory-service build`
Expected: all six build cleanly.

Run: `pnpm --filter crm-service --filter job-service --filter finance-service --filter comms-service --filter analytics-service --filter inventory-service test`
Expected: all existing test suites still pass (the interceptor is additive — it wraps every route but never changes a response, so no existing test should need updating).

- [ ] **Step 7: Manual smoke check**

With `docker compose up -d` and `pnpm dev:all` running, hit any existing endpoint (e.g. `curl http://localhost:3002/jobs -H "x-test-company-id: co-demo-001" -H "x-test-user-role: dispatcher"`) and confirm a new row appears in `comms.activity_logs` within a second or two (`pnpm --filter comms-service prisma studio`, or query directly). Confirm the original endpoint's response is unchanged.

- [ ] **Step 8: Commit**

```bash
git add apps/crm-service/src/main.ts apps/crm-service/package.json apps/job-service/src/main.ts apps/job-service/package.json apps/finance-service/src/main.ts apps/finance-service/package.json apps/comms-service/src/main.ts apps/analytics-service/src/main.ts apps/analytics-service/package.json apps/inventory-service/src/main.ts apps/inventory-service/package.json pnpm-lock.yaml
git commit -m "feat(activity-log): register ActivityLogInterceptor in every NestJS service"
```

---

## Task 11: scheduling-service (Go) — activity-log middleware

**Files:**
- Create: `apps/scheduling-service/internal/activitylog/middleware.go`
- Create: `apps/scheduling-service/internal/activitylog/middleware_test.go`
- Modify: `apps/scheduling-service/internal/config/config.go`
- Modify: `apps/scheduling-service/cmd/server/main.go`

**Interfaces:**
- Consumes: `middleware.AuthClaims`/`middleware.ClaimsKey` (existing, `internal/middleware/auth.go`).
- Produces: `activitylog.Middleware(commsServiceURL string) gin.HandlerFunc` — registered once in `main.go`, after the `auth` middleware so claims are populated.

- [ ] **Step 1: Add `CommsServiceURL` to config**

In `apps/scheduling-service/internal/config/config.go`, add a field to `Config`:

```go
	// Comms service (activity-log ingest)
	CommsServiceURL string
```

and set it in `Load()`:

```go
		CommsServiceURL:     getEnvOrDefault("COMMS_SERVICE_URL", "http://localhost:3005"),
```

- [ ] **Step 2: Write the failing test**

`apps/scheduling-service/internal/activitylog/middleware_test.go`:

```go
package activitylog

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
)

func TestMiddleware_PostsEventAfterHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	received := make(chan map[string]interface{}, 1)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body map[string]interface{}
		_ = json.NewDecoder(r.Body).Decode(&body)
		received <- body
		w.WriteHeader(http.StatusAccepted)
	}))
	defer upstream.Close()

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(middleware.ClaimsKey, middleware.AuthClaims{
			UserID: "u1", CompanyID: "co-1", Role: "dispatcher", Name: "Jane",
		})
		c.Next()
	})
	r.Use(Middleware(upstream.URL))
	r.POST("/dispatch/assign", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"jobId": "j1"})
	})

	req := httptest.NewRequest(http.MethodPost, "/dispatch/assign", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	select {
	case body := <-received:
		if body["service"] != "scheduling" {
			t.Errorf("expected service=scheduling, got %v", body["service"])
		}
		if body["companyId"] != "co-1" {
			t.Errorf("expected companyId=co-1, got %v", body["companyId"])
		}
		if body["status"] != "SUCCESS" {
			t.Errorf("expected status=SUCCESS, got %v", body["status"])
		}
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for activity-log ingest call")
	}
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd apps/scheduling-service && go test ./internal/activitylog/... -v`
Expected: FAIL — package `activitylog` / function `Middleware` does not exist.

- [ ] **Step 4: Implement the middleware**

`apps/scheduling-service/internal/activitylog/middleware.go`:

```go
package activitylog

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
)

type activityEvent struct {
	CompanyID   *string `json:"companyId"`
	Service     string  `json:"service"`
	Method      string  `json:"method"`
	Path        string  `json:"path"`
	ActorUserID *string `json:"actorUserId"`
	ActorName   *string `json:"actorName"`
	ActorRole   *string `json:"actorRole"`
	Action      string  `json:"action"`
	Description string  `json:"description"`
	Status      string  `json:"status"`
	StatusCode  int     `json:"statusCode"`
	DurationMs  int64   `json:"durationMs"`
}

// Middleware logs every request this Gin service handles to comms-service's
// activity-log ingest endpoint. Fire-and-forget over HTTP with a short
// timeout — a slow or unreachable comms-service must never slow down or
// fail a real scheduling request. Register AFTER the auth middleware so
// claims (company/user/role) are already on the Gin context.
func Middleware(commsServiceURL string) gin.HandlerFunc {
	client := &http.Client{Timeout: 3 * time.Second}

	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		// Everything read off `c` must happen HERE, synchronously — Gin
		// returns *gin.Context to a sync.Pool the instant this middleware
		// function returns, so reading it from inside a goroutine spawned
		// below would race the pool reclaiming/reusing it for the next
		// request. Build the full event first, THEN hand only plain values
		// to the goroutine that does the (slow, fire-and-forget) HTTP call.
		event := activityEvent{
			Service:     "scheduling",
			Method:      c.Request.Method,
			Path:        c.FullPath(),
			Action:      "http.request",
			Description: c.Request.Method + " " + c.FullPath(),
			Status:      statusToLabel(c.Writer.Status()),
			StatusCode:  c.Writer.Status(),
			DurationMs:  time.Since(start).Milliseconds(),
		}
		if claimsVal, ok := c.Get(middleware.ClaimsKey); ok {
			claims := claimsVal.(middleware.AuthClaims)
			if claims.CompanyID != "" {
				event.CompanyID = &claims.CompanyID
			}
			if claims.UserID != "" {
				event.ActorUserID = &claims.UserID
			}
			if claims.Name != "" {
				event.ActorName = &claims.Name
			}
			if claims.Role != "" {
				event.ActorRole = &claims.Role
			}
		}

		go postEvent(client, commsServiceURL, event)
	}
}

func postEvent(client *http.Client, commsServiceURL string, event activityEvent) {
	body, err := json.Marshal(event)
	if err != nil {
		return
	}
	req, err := http.NewRequest(http.MethodPost, commsServiceURL+"/activity-log/ingest", bytes.NewReader(body))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err == nil {
		resp.Body.Close()
	}
}

func statusToLabel(statusCode int) string {
	if statusCode >= 400 {
		return "FAILURE"
	}
	return "SUCCESS"
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/scheduling-service && go test ./internal/activitylog/... -v`
Expected: PASS (`TestMiddleware_PostsEventAfterHandler`)

- [ ] **Step 6: Register the middleware in main.go**

In `apps/scheduling-service/cmd/server/main.go`, add the import:

```go
	"github.com/tscrm/scheduling-service/internal/activitylog"
```

and register it right after the `auth` middleware is defined, before routes are declared:

```go
	auth := middleware.JWTMiddleware(cfg.Auth0Domain, cfg.Auth0Audience)
	r.Use(activitylog.Middleware(cfg.CommsServiceURL))
```

(This makes it apply to every route including `/ws` and `/health` — cheap enough given it's fire-and-forget, and keeps the registration to one line rather than repeating it per route group.)

- [ ] **Step 7: Build and run the full Go test suite**

Run: `cd apps/scheduling-service && go build ./... && go test ./...`
Expected: build succeeds, all tests (existing + new) pass.

- [ ] **Step 8: Commit**

```bash
git add apps/scheduling-service/internal/activitylog apps/scheduling-service/internal/config/config.go apps/scheduling-service/cmd/server/main.go
git commit -m "feat(activity-log): add Gin middleware posting events to comms-service ingest"
```

---

## Task 12: admin-dashboard — activity log API + socket hook

**Files:**
- Create: `apps/admin-dashboard/src/pages/system-activity/activityLogApi.ts`
- Create: `apps/admin-dashboard/src/pages/system-activity/useActivitySocket.ts`

**Interfaces:**
- Consumes: existing `apiClient`/fetch helper pattern (check `apps/admin-dashboard/src/lib/api.ts` or the pattern used by `templatesApi.ts` for the exact base client and `tscrm_token` header), `useAuth()` (`AuthContext`), `io` from `socket.io-client` (already a dependency — comms-service's chat feature uses it; confirm in `apps/admin-dashboard/package.json`).
- Produces: `useActivityLog(filters)` (paginated React Query hook), `useActivityCompanies()`, `useActivitySocket(onEvent, filters)` (live-feed hook) — consumed by Task 13's page.

- [ ] **Step 1: Implement the REST hooks**

Matches the existing conventions in `apps/admin-dashboard/src/pages/projects/templatesApi.ts` (default-export `api` axios instance, already carrying the `tscrm_token` bearer header) and `apps/admin-dashboard/src/hooks/useSocket.ts` (`VITE_WS_URL` env var, `/chat` namespace pattern reused here for `/activity`).

`apps/admin-dashboard/src/pages/system-activity/activityLogApi.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

export interface ActivityLogEntry {
  id: string
  companyId: string | null
  companyName: string
  service: string
  method: string
  path: string
  actorUserId: string | null
  actorName: string | null
  actorRole: string | null
  action: string
  description: string
  status: 'SUCCESS' | 'FAILURE'
  statusCode: number
  durationMs: number
  requestSummary?: Record<string, unknown>
  responseSummary?: Record<string, unknown>
  errorMessage?: string
  createdAt: string
}

export interface ActivityLogFilters {
  companyId?: string
  service?: string
  action?: string
  status?: 'SUCCESS' | 'FAILURE'
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface ActivityLogPage {
  items: ActivityLogEntry[]
  total: number
  page: number
  limit: number
}

export function useActivityLog(filters: ActivityLogFilters) {
  return useQuery<ActivityLogPage>({
    queryKey: ['activity-log', filters],
    queryFn: async () => {
      const res = await api.get('/comms/activity-log', { params: filters })
      return res.data
    },
    staleTime: 15_000,
  })
}

export interface ActivityCompany {
  companyId: string
  companyName: string
}

export function useActivityCompanies() {
  return useQuery<ActivityCompany[]>({
    queryKey: ['activity-log-companies'],
    queryFn: async () => {
      const res = await api.get('/comms/activity-log/companies')
      return res.data
    },
    staleTime: 60_000,
  })
}
```

- [ ] **Step 2: Implement the live socket hook**

`apps/admin-dashboard/src/pages/system-activity/useActivitySocket.ts`:

```ts
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../../contexts/AuthContext'
import type { ActivityLogEntry } from './activityLogApi'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3005'

/**
 * Connects to comms-service's /activity Socket.IO namespace and calls
 * onEvent for every activity:new push. The namespace itself rejects any
 * non-super_admin connection (ActivityGateway.handleConnection), so this
 * hook is safe to mount only from the super_admin-gated SystemActivity page.
 * Mirrors useSocket.ts's /chat connection pattern (JWT when present, dev-
 * bypass query params otherwise).
 */
export function useActivitySocket(onEvent: (entry: ActivityLogEntry) => void, companyId?: string) {
  const { token, user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!user) return

    const socket = io(`${WS_URL}/activity`, {
      transports: ['websocket', 'polling'],
      ...(token
        ? { auth: { token } }
        : {
            query: {
              companyId: user.companyId,
              userId: user.id,
              userName: user.name,
              userRole: user.role,
            },
          }),
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })
    socketRef.current = socket

    socket.on('activity:new', (entry: ActivityLogEntry) => onEventRef.current(entry))

    return () => {
      socket.disconnect()
    }
  }, [user])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !companyId) return
    socket.emit('watch_company', { companyId })
    return () => {
      socket.emit('unwatch_company', { companyId })
    }
  }, [companyId])
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add apps/admin-dashboard/src/pages/system-activity/activityLogApi.ts apps/admin-dashboard/src/pages/system-activity/useActivitySocket.ts
git commit -m "feat(activity-log): add admin-dashboard activity log API and live socket hook"
```

---

## Task 13: admin-dashboard — System Activity page, route, and super_admin-gated nav

**Files:**
- Create: `apps/admin-dashboard/src/pages/system-activity/SystemActivity.tsx`
- Modify: `apps/admin-dashboard/src/App.tsx`
- Modify: `apps/admin-dashboard/src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `useActivityLog`, `useActivityCompanies` (Task 12), `useActivitySocket` (Task 12), `useAuth()` (existing `AuthContext`).
- Produces: route `/system-activity`, nav item — nothing further consumes these (leaf page).

- [ ] **Step 1: Build the page component**

`apps/admin-dashboard/src/pages/system-activity/SystemActivity.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { Activity, Pause, Play } from 'lucide-react'
import { useActivityLog, useActivityCompanies, type ActivityLogEntry, type ActivityLogFilters } from './activityLogApi'
import { useActivitySocket } from './useActivitySocket'

const h1: React.CSSProperties = { fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: 0 }
const sub: React.CSSProperties = { fontSize: 13, color: '#94A3B8', marginTop: 4 }

export default function SystemActivity() {
  const [filters, setFilters] = useState<ActivityLogFilters>({ companyId: 'all', page: 1, limit: 50 })
  const [live, setLive] = useState(true)
  const [liveEntries, setLiveEntries] = useState<ActivityLogEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const companiesQ = useActivityCompanies()
  const historyQ = useActivityLog(filters)

  useActivitySocket(
    (entry) => {
      if (!live) return
      setLiveEntries((prev) => [entry, ...prev].slice(0, 200))
    },
    filters.companyId !== 'all' ? filters.companyId : undefined,
  )

  const rows = useMemo(() => {
    const historical = historyQ.data?.items ?? []
    const seen = new Set(liveEntries.map((e) => e.id))
    return [...liveEntries, ...historical.filter((e) => !seen.has(e.id))]
  }, [liveEntries, historyQ.data])

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={h1}><Activity size={20} style={{ verticalAlign: -3, marginRight: 8 }} />System Activity</h1>
          <p style={sub}>Every API call, every tenant, live. Super admin only.</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => { setLive((v) => !v); if (live) setLiveEntries([]) }}
        >
          {live ? <Pause size={13} /> : <Play size={13} />} {live ? 'Live' : 'Paused'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select
          className="select"
          value={filters.companyId ?? 'all'}
          onChange={(e) => setFilters((f) => ({ ...f, companyId: e.target.value, page: 1 }))}
        >
          <option value="all">All tenants</option>
          {(companiesQ.data ?? []).map((c) => (
            <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
          ))}
        </select>
        <select
          className="select"
          value={filters.service ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, service: e.target.value || undefined, page: 1 }))}
        >
          <option value="">All services</option>
          {['crm', 'jobs', 'scheduling', 'finance', 'comms', 'analytics', 'inventory', 'churn'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="select"
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as any, page: 1 }))}
        >
          <option value="">All statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {rows.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>
            {historyQ.isLoading ? 'Loading…' : 'No activity yet.'}
          </div>
        ) : (
          rows.map((entry) => (
            <div
              key={entry.id}
              onClick={() => setExpandedId((id) => (id === entry.id ? null : entry.id))}
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--border)',
                borderLeft: entry.status === 'FAILURE' ? '3px solid var(--red, #ef4444)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
                <span style={{ color: 'var(--t4)', fontVariantNumeric: 'tabular-nums', minWidth: 70 }}>
                  {new Date(entry.createdAt).toLocaleTimeString()}
                </span>
                <span style={{
                  padding: '1px 7px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                  background: 'var(--bg-hover)', color: 'var(--t2)',
                }}>{entry.companyName}</span>
                <span style={{ color: 'var(--t3)' }}>{entry.actorName ?? 'System'} ({entry.actorRole ?? '—'})</span>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: entry.status === 'SUCCESS' ? 'var(--green, #22c55e)' : 'var(--red, #ef4444)',
                }} />
                <span style={{ color: 'var(--t1)', fontWeight: 500 }}>{entry.description}</span>
              </div>
              {expandedId === entry.id && (
                <div style={{ fontSize: 11.5, color: 'var(--t3)', paddingLeft: 80, fontFamily: 'monospace' }}>
                  {entry.method} {entry.path} → {entry.statusCode} ({entry.durationMs}ms)
                  {entry.errorMessage && <div style={{ color: 'var(--red, #ef4444)', marginTop: 4 }}>{entry.errorMessage}</div>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {historyQ.data && historyQ.data.total > (filters.page ?? 1) * (filters.limit ?? 50) && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
        >
          Load more history
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add the route, gated to super_admin**

In `apps/admin-dashboard/src/App.tsx`, add the lazy import near the other lazy pages:

```ts
const SystemActivity = lazy(() => import('./pages/system-activity/SystemActivity'))
```

and add to `ROUTE_LOADERS`:

```ts
  '/system-activity': () => import('./pages/system-activity/SystemActivity'),
```

The component that renders `<Routes>` currently calls `const { isAuthenticated, isLoading } = useAuth()` — add `user` to that same destructure:

```ts
  const { isAuthenticated, isLoading, user } = useAuth()
```

and add the route itself — gated inline so a non-super_admin hitting the URL directly gets redirected, not a broken page:

```tsx
              <Route
                path="/system-activity"
                element={user?.role === 'super_admin' ? <SystemActivity /> : <Navigate to="/" replace />}
              />
```

- [ ] **Step 3: Add the gated nav item**

In `apps/admin-dashboard/src/components/Sidebar.tsx`, import the `Activity` icon:

```ts
    LayoutDashboard, Users, Wrench, CalendarDays,
    DollarSign, MessageSquare, BarChart3, Settings,
    Menu, X, LogOut, Shield, Package, Megaphone, Upload, FileSignature, FolderKanban,
    ChevronLeft, Plus, Activity,
```

and add a conditional final section to the `NAV` array, right after the `Workspace` group:

```ts
        ...(authUser?.role === 'super_admin' ? [{
            label: 'System',
            items: [
                { icon: Activity, label: 'System Activity', path: '/system-activity' },
            ],
        }] : []),
```

- [ ] **Step 4: Build**

Run: `pnpm --filter admin-dashboard build`
Expected: no TypeScript errors.

- [ ] **Step 5: Manual verification**

With `pnpm dev:all` running: log in as a `super_admin` test user (`x-test-user-role: super_admin` bypass header, or a seeded super_admin account) and confirm "System Activity" appears in the sidebar under a new "System" section, the page loads with historical entries, and triggering an action in another tab (e.g. creating a job) appears in the live feed within ~1-2 seconds without a manual refresh. Log in as a `company_admin` and confirm the nav item is absent and `/system-activity` redirects to `/`.

- [ ] **Step 6: Commit**

```bash
git add apps/admin-dashboard/src/pages/system-activity/SystemActivity.tsx apps/admin-dashboard/src/App.tsx apps/admin-dashboard/src/components/Sidebar.tsx
git commit -m "feat(activity-log): add super_admin-gated System Activity dashboard page"
```

---

## Final verification

- [ ] Run the full repo build and test suite: `pnpm build && pnpm test`
- [ ] Confirm `pnpm --filter @tscrm/activity-log test`, `pnpm --filter comms-service test`, and `cd apps/scheduling-service && go test ./...` are all green in isolation.
- [ ] Re-read `docs/superpowers/specs/2026-08-15-super-admin-activity-monitoring-design.md` end to end and confirm every section (data model, capture, ingestion, real-time delivery, query API + UI, RBAC, testing) has a corresponding task above.
