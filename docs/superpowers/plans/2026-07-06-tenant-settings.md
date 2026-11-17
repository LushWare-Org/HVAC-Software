# Tenant Settings & Multi-Tenant Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-tenant currency, timezone, and feature flags (onlinePayments/sms) across the CRM, with full currency-aware money display, portal tenant branding, and a KASE/Orrix onboarding seed script.

**Architecture:** Settings live as three new columns on `crm.companies` (`currency`, `timezone`, `features` JSONB), exposed by one new endpoint `GET /crm/company/settings`. Sibling NestJS services (finance, comms) read settings via a small cached HTTP client with an all-enabled failure default. Frontends load settings once post-login into a module-level formatter state so ~60+ hardcoded `$` call sites become one `formatMoney()`.

**Tech Stack:** NestJS + Prisma (crm/finance/comms), React 19 + Vite (admin-dashboard, customer-portal), `Intl.NumberFormat`/`Intl.DateTimeFormat`, Jest, tsx for the seed script.

**Spec:** `docs/superpowers/specs/2026-07-06-tenant-settings-design.md`

## Global Constraints

- **NO git commits** — the user commits manually. Skip every commit step.
- **pnpm only** (preinstall rejects npm/yarn).
- **NEVER run `prisma migrate dev` on crm-service** — it detects drift and offers to RESET the crm schema on shared Supabase. Apply DDL via manual psql (dockerized `postgres:16-alpine`), then `prisma generate` only.
- Feature-flag semantics: **missing key = enabled** (`features: {}` ⇒ everything on). Flag keys this pass: `onlinePayments`, `sms`.
- Defaults everywhere: `currency: "USD"`, `timezone: "America/New_York"`, `features: {}`.
- Money stays plain decimals in the DB; this is display-only. `Prisma.Decimal` serializes as **string** — always `Number()` before math.
- Settings are **seed-only**: `PATCH /crm/company` must reject `currency`/`timezone`/`features` with 400.
- Cross-service settings reads fail open: on error return `{ currency: "USD", timezone: "America/New_York", features: {} }` and log a warning.
- After each task: relevant `pnpm --filter <svc> test` and/or `pnpm --filter <app> build` must pass before the task is complete.

## File Structure (all paths relative to repo root)

| File | Responsibility |
|---|---|
| `packages/types/src/company-settings.ts` (create) | `CompanySettings` interface + `isFeatureEnabled()` |
| `apps/crm-service/prisma/schema.prisma` (modify) | 3 new Company fields |
| `apps/crm-service/src/company/company.controller.ts` (modify) | `GET /company/settings` route |
| `apps/crm-service/src/company/company.service.ts` (modify) | `getSettings()`, settings-key rejection in `update()` |
| `apps/finance-service/src/company-settings/company-settings.client.ts` (create) | cached HTTP settings client |
| `apps/comms-service/src/company-settings/company-settings.client.ts` (create) | same client (comms copy — services don't share app code) |
| `apps/finance-service/src/invoices/invoices.service.ts` (modify) | 403 gate on payment-intent |
| `apps/finance-service/src/pdf/*` templates (modify) | currency + timezone in PDFs |
| `apps/comms-service/src/notifications/notifications.service.ts` (modify) | SMS skip |
| `apps/comms-service/src/enroute/enroute.service.ts` (modify) | timezone in ETA copy |
| `apps/customer-portal/src/contexts/CompanyContext.tsx` (create) | settings fetch + provider |
| `apps/customer-portal/src/lib/format.ts` (create) | `formatMoney`, `formatDateTz`, `setActiveCompanyFormat` |
| `apps/admin-dashboard/src/lib/format.ts` (modify) | currency-aware `formatMoney` + wrappers |
| `apps/admin-dashboard/src/hooks/useCompanySettings.ts` (create) | settings query + formatter init |
| `scripts/seed-tenant.ts` (create) | tenant onboarding |

---

### Task 1: Shared types — `CompanySettings` + `isFeatureEnabled`

**Files:**
- Create: `packages/types/src/company-settings.ts`
- Modify: `packages/types/src/index.ts` (add export)
- Test: `packages/types/src/company-settings.spec.ts` — **check first**: if `packages/types` has no jest setup (`ls packages/types/jest.config*` / no `test` script in its package.json), put the tests in `apps/crm-service/src/company/company-settings.util.spec.ts` importing from `@tscrm/types` instead, and skip adding test infra to the package.

**Interfaces:**
- Produces: `interface CompanySettings { id: string; name: string; logoUrl: string | null; currency: string; timezone: string; features: Record<string, unknown> }`, `function isFeatureEnabled(features: unknown, key: string): boolean`, `const DEFAULT_COMPANY_SETTINGS: Omit<CompanySettings, 'id' | 'name' | 'logoUrl'>`.

- [ ] **Step 1: Write the failing tests**

```ts
import { isFeatureEnabled, DEFAULT_COMPANY_SETTINGS } from '@tscrm/types';

describe('isFeatureEnabled', () => {
  it('missing key means enabled', () => {
    expect(isFeatureEnabled({}, 'onlinePayments')).toBe(true);
  });
  it('explicit false disables', () => {
    expect(isFeatureEnabled({ sms: false }, 'sms')).toBe(false);
  });
  it('explicit true enables', () => {
    expect(isFeatureEnabled({ sms: true }, 'sms')).toBe(true);
  });
  it('non-object features fails open', () => {
    expect(isFeatureEnabled(null, 'sms')).toBe(true);
    expect(isFeatureEnabled('garbage', 'sms')).toBe(true);
    expect(isFeatureEnabled(42, 'sms')).toBe(true);
  });
  it('non-boolean value fails open', () => {
    expect(isFeatureEnabled({ sms: 'no' }, 'sms')).toBe(true);
  });
});

describe('DEFAULT_COMPANY_SETTINGS', () => {
  it('is USD / America/New_York / empty features', () => {
    expect(DEFAULT_COMPANY_SETTINGS).toEqual({
      currency: 'USD',
      timezone: 'America/New_York',
      features: {},
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter crm-service test -- company-settings` (or the types-package equivalent)
Expected: FAIL — `isFeatureEnabled` is not exported.

- [ ] **Step 3: Implement**

`packages/types/src/company-settings.ts`:

```ts
/** Per-tenant settings exposed by GET /crm/company/settings. */
export interface CompanySettings {
  id: string;
  name: string;
  logoUrl: string | null;
  /** ISO 4217, e.g. "USD" | "LKR". */
  currency: string;
  /** IANA zone, e.g. "Asia/Colombo". */
  timezone: string;
  /** Capability flags. Missing key = enabled. */
  features: Record<string, unknown>;
}

export const DEFAULT_COMPANY_SETTINGS: Omit<CompanySettings, 'id' | 'name' | 'logoUrl'> = {
  currency: 'USD',
  timezone: 'America/New_York',
  features: {},
};

/**
 * Missing key = enabled; only an explicit boolean false disables.
 * Fails open on malformed input so a bad row never dark-ships a feature off.
 */
export function isFeatureEnabled(features: unknown, key: string): boolean {
  if (features === null || typeof features !== 'object') return true;
  return (features as Record<string, unknown>)[key] !== false;
}
```

Add to `packages/types/src/index.ts`:

```ts
export * from './company-settings';
```

- [ ] **Step 4: Build the package and run the tests**

Run: `pnpm --filter @tscrm/types build && pnpm --filter crm-service test -- company-settings`
Expected: PASS (all 6). Note: consuming services need the package rebuilt — Turbo `^build` handles it on their next build.

---

### Task 2: crm-service — DB columns, Prisma fields, `GET /company/settings`, PATCH rejection

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma` (Company model, after `logoUrl`)
- Modify: `apps/crm-service/src/company/company.service.ts`
- Modify: `apps/crm-service/src/company/company.controller.ts`
- Test: `apps/crm-service/src/company/company.service.spec.ts` (create if absent)

**Interfaces:**
- Consumes: `CompanySettings`, `DEFAULT_COMPANY_SETTINGS` from `@tscrm/types` (Task 1).
- Produces: `GET /crm/company/settings` → `CompanySettings` JSON (any authenticated role incl. customer; company from JWT). `CompanyService.getSettings(companyId: string): Promise<CompanySettings>`. `CompanyService.update()` throws `BadRequestException` when body contains `currency`, `timezone`, or `features`.

- [ ] **Step 1: Apply DDL manually (NOT prisma migrate)**

Get the direct (session-mode) URL from `apps/crm-service/.env` (`CRM_DIRECT_DATABASE_URL`), then:

```bash
docker run --rm postgres:16-alpine psql "<CRM_DIRECT_DATABASE_URL>" -c '
ALTER TABLE crm.companies
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT '"'"'USD'"'"',
  ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT '"'"'America/New_York'"'"',
  ADD COLUMN IF NOT EXISTS "features" JSONB NOT NULL DEFAULT '"'"'{}'"'"';'
```

Expected output: `ALTER TABLE`. Verify: `... -c '\d crm.companies'` shows the three columns.

- [ ] **Step 2: Add fields to Prisma schema and regenerate**

In `model Company`, after `logoUrl String?`:

```prisma
  currency    String   @default("USD")
  timezone    String   @default("America/New_York")
  features    Json     @default("{}")
```

Run: `cd apps/crm-service && npx prisma generate`
Expected: `Generated Prisma Client`.

- [ ] **Step 3: Write failing service tests**

Follow the existing spec style in `apps/crm-service/src` (mock PrismaService as a plain object). Test file:

```ts
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompanyService } from './company.service';

const prismaMock = {
  company: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('CompanyService settings', () => {
  let service: CompanyService;
  beforeEach(() => {
    jest.clearAllMocks();
    // Match the real constructor signature — check company.service.ts;
    // if it takes only PrismaService this is:
    service = new CompanyService(prismaMock as never);
  });

  it('getSettings returns settings shape', async () => {
    prismaMock.company.findUnique.mockResolvedValue({
      id: 'co-1', name: 'KASE Engineering', logoUrl: null,
      currency: 'LKR', timezone: 'Asia/Colombo',
      features: { onlinePayments: false, sms: false },
    });
    const s = await service.getSettings('co-1');
    expect(s).toEqual({
      id: 'co-1', name: 'KASE Engineering', logoUrl: null,
      currency: 'LKR', timezone: 'Asia/Colombo',
      features: { onlinePayments: false, sms: false },
    });
  });

  it('getSettings throws NotFound for unknown company', async () => {
    prismaMock.company.findUnique.mockResolvedValue(null);
    await expect(service.getSettings('nope')).rejects.toThrow(NotFoundException);
  });

  it('update rejects settings keys with 400', async () => {
    await expect(
      service.update('co-1', { currency: 'LKR' } as never),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update('co-1', { features: {} } as never),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update('co-1', { timezone: 'Asia/Colombo' } as never),
    ).rejects.toThrow(BadRequestException);
  });
});
```

- [ ] **Step 4: Run to verify failure**

Run: `pnpm --filter crm-service test -- company.service`
Expected: FAIL — `getSettings` does not exist.

- [ ] **Step 5: Implement service**

In `company.service.ts` (adapt imports to existing file):

```ts
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompanySettings } from '@tscrm/types';

const SETTINGS_KEYS = ['currency', 'timezone', 'features'] as const;

// inside CompanyService:
async getSettings(companyId: string): Promise<CompanySettings> {
  const company = await this.prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, logoUrl: true, currency: true, timezone: true, features: true },
  });
  if (!company) throw new NotFoundException('Company not found');
  return {
    ...company,
    features: (company.features ?? {}) as Record<string, unknown>,
  };
}
```

At the very top of the existing `update()` method body:

```ts
const blocked = SETTINGS_KEYS.filter((k) => k in (body as Record<string, unknown>));
if (blocked.length > 0) {
  throw new BadRequestException(
    `Settings keys [${blocked.join(', ')}] are managed by the platform and cannot be updated here`,
  );
}
```

- [ ] **Step 6: Add controller route**

In `company.controller.ts`, add ABOVE the existing `@Get()` (specific route before generic is harmless here but keeps convention; the important thing is `@Get('settings')` must not be shadowed — since the other route is bare `@Get()`, order is safe either way):

```ts
@Get('settings')
@ApiOperation({ summary: 'Get tenant settings (currency, timezone, features, branding)' })
getSettings(@CurrentUser() user: AuthUser): Promise<unknown> {
  return this.companyService.getSettings(user.companyId);
}
```

No role restriction — `JwtAuthGuard` at class level already requires auth; customers may read it.

- [ ] **Step 7: Run tests + build**

Run: `pnpm --filter crm-service test -- company.service && pnpm --filter crm-service build`
Expected: PASS + clean build.

- [ ] **Step 8: Live smoke (dev bypass)**

With dev crm-service running (`pnpm --filter crm-service dev` if not already):

```bash
curl -s http://localhost:3001/company/settings \
  -H 'x-test-company-id: co-demo-001' -H 'x-test-user-id: user-admin-001' \
  -H 'x-test-user-role: company_admin' -H 'x-test-user-email: a@b.c' | head -c 400
```

Expected: JSON with `"currency":"USD","timezone":"America/New_York","features":{}`.

---

### Task 3: Settings HTTP client (finance-service + comms-service)

**Files:**
- Create: `apps/finance-service/src/company-settings/company-settings.client.ts`
- Create: `apps/finance-service/src/company-settings/company-settings.module.ts`
- Create: `apps/comms-service/src/company-settings/company-settings.client.ts` (identical content)
- Create: `apps/comms-service/src/company-settings/company-settings.module.ts`
- Modify: `apps/finance-service/src/app.module.ts`, `apps/comms-service/src/app.module.ts` (import module)
- Test: `apps/finance-service/src/company-settings/company-settings.client.spec.ts` and same for comms

**Interfaces:**
- Consumes: `GET {CRM_SERVICE_URL}/company/settings` (Task 2), `CompanySettings`/`DEFAULT_COMPANY_SETTINGS` from `@tscrm/types`.
- Produces: `@Injectable() CompanySettingsClient` with `getSettings(companyId: string): Promise<CompanySettings>` — 5-min in-memory cache per companyId, fail-open default.

**Auth note:** follow the exact header pattern used in `apps/comms-service/src/enroute/enroute.service.ts` (its `fetchTechProfile` / crm `fetch` call) — dev bypass headers when `BYPASS_AUTH`, `SERVICE_JWT`/system-token otherwise. Copy that block verbatim rather than inventing a new one. The request must act as the target company: set `x-test-company-id: <companyId>` (bypass mode) or mint the token for that company (prod mode).

- [ ] **Step 1: Write failing client tests** (finance copy shown; comms identical)

```ts
import { CompanySettingsClient } from './company-settings.client';

describe('CompanySettingsClient', () => {
  let client: CompanySettingsClient;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as never;
    client = new CompanySettingsClient();
  });

  const okBody = {
    id: 'co-1', name: 'KASE', logoUrl: null,
    currency: 'LKR', timezone: 'Asia/Colombo', features: { sms: false },
  };

  it('fetches and returns settings', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => okBody });
    const s = await client.getSettings('co-1');
    expect(s.currency).toBe('LKR');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('caches per company for subsequent calls', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => okBody });
    await client.getSettings('co-1');
    await client.getSettings('co-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails open to defaults on HTTP error', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const s = await client.getSettings('co-1');
    expect(s.currency).toBe('USD');
    expect(s.features).toEqual({});
  });

  it('fails open to defaults on network error', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const s = await client.getSettings('co-1');
    expect(s.timezone).toBe('America/New_York');
  });

  it('does not cache failures', async () => {
    fetchMock.mockRejectedValueOnce(new Error('down'));
    await client.getSettings('co-1');
    fetchMock.mockResolvedValue({ ok: true, json: async () => okBody });
    const s = await client.getSettings('co-1');
    expect(s.currency).toBe('LKR');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter finance-service test -- company-settings`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement client**

```ts
import { Injectable, Logger } from '@nestjs/common';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '@tscrm/types';

const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry { value: CompanySettings; expiresAt: number }

@Injectable()
export class CompanySettingsClient {
  private readonly logger = new Logger(CompanySettingsClient.name);
  private readonly cache = new Map<string, CacheEntry>();

  async getSettings(companyId: string): Promise<CompanySettings> {
    const hit = this.cache.get(companyId);
    if (hit && hit.expiresAt > Date.now()) return hit.value;

    try {
      const res = await fetch(`${CRM_SERVICE_URL}/company/settings`, {
        headers: this.authHeaders(companyId),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`crm responded ${res.status}`);
      const value = (await res.json()) as CompanySettings;
      this.cache.set(companyId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    } catch (err) {
      this.logger.warn(
        `settings fetch failed for ${companyId}, using defaults: ${(err as Error).message}`,
      );
      return {
        id: companyId,
        name: '',
        logoUrl: null,
        ...DEFAULT_COMPANY_SETTINGS,
      };
    }
  }

  private authHeaders(companyId: string): Record<string, string> {
    // COPY the auth block from apps/comms-service/src/enroute/enroute.service.ts
    // (bypass headers in dev, service token in prod) — acting as `companyId`.
    // Placeholder shown; replace with the project's real pattern:
    return {
      'x-test-company-id': companyId,
      'x-test-user-id': 'service-settings-client',
      'x-test-user-role': 'company_admin',
      'x-test-user-email': 'service@internal',
    };
  }
}
```

Module:

```ts
import { Module } from '@nestjs/common';
import { CompanySettingsClient } from './company-settings.client';

@Module({ providers: [CompanySettingsClient], exports: [CompanySettingsClient] })
export class CompanySettingsModule {}
```

Register `CompanySettingsModule` in each service's `app.module.ts` imports.

- [ ] **Step 4: Run tests both services**

Run: `pnpm --filter finance-service test -- company-settings && pnpm --filter comms-service test -- company-settings`
Expected: PASS (5 each).

---

### Task 4: finance-service — payment-intent 403 gate

**Files:**
- Modify: `apps/finance-service/src/invoices/invoices.service.ts` (the method behind `POST :id/payment-intent`, near line 360; it starts `const invoice = await this.findOne(companyId, id)`)
- Modify: `apps/finance-service/src/invoices/invoices.module.ts` (import `CompanySettingsModule`)
- Test: `apps/finance-service/src/invoices/invoices.service.spec.ts` (extend existing, or create following existing spec patterns)

**Interfaces:**
- Consumes: `CompanySettingsClient.getSettings(companyId)` (Task 3), `isFeatureEnabled` (Task 1).
- Produces: payment-intent creation throws `ForbiddenException('Online payments are not enabled for this company')` when `onlinePayments` is false.

- [ ] **Step 1: Write failing test**

Mock `CompanySettingsClient` in the existing spec's provider setup:

```ts
const settingsClientMock = { getSettings: jest.fn() };
// ... register in TestingModule providers or constructor args per existing spec style

it('payment-intent is forbidden when onlinePayments is off', async () => {
  settingsClientMock.getSettings.mockResolvedValue({
    id: 'co-1', name: 'KASE', logoUrl: null,
    currency: 'LKR', timezone: 'Asia/Colombo',
    features: { onlinePayments: false },
  });
  await expect(service.createPaymentIntent('co-1', 'inv-1')) // use real method name
    .rejects.toThrow(ForbiddenException);
});

it('payment-intent proceeds when features empty', async () => {
  settingsClientMock.getSettings.mockResolvedValue({
    id: 'co-1', name: 'Demo', logoUrl: null,
    currency: 'USD', timezone: 'America/New_York', features: {},
  });
  // arrange invoice + stripe mocks per existing spec fixtures, assert no Forbidden
});
```

(Adapt the method name — find it via the `@Post(':id/payment-intent')` handler in `invoices.controller.ts:105`.)

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter finance-service test -- invoices`
Expected: new tests FAIL (no gate yet).

- [ ] **Step 3: Implement gate**

Inject `CompanySettingsClient` into `InvoicesService` constructor. At the top of the payment-intent method:

```ts
const settings = await this.companySettings.getSettings(companyId);
if (!isFeatureEnabled(settings.features, 'onlinePayments')) {
  throw new ForbiddenException('Online payments are not enabled for this company');
}
```

Import `ForbiddenException` from `@nestjs/common`, `isFeatureEnabled` from `@tscrm/types`. Add `CompanySettingsModule` to `invoices.module.ts` imports.

- [ ] **Step 4: Run full finance suite**

Run: `pnpm --filter finance-service test && pnpm --filter finance-service build`
Expected: PASS, clean build.

---

### Task 5: comms-service — SMS skip + en-route timezone

**Files:**
- Modify: `apps/comms-service/src/notifications/notifications.service.ts` (`sendSms`, ~line 128)
- Modify: `apps/comms-service/src/notifications/notifications.module.ts` (import `CompanySettingsModule`)
- Modify: `apps/comms-service/src/enroute/enroute.service.ts` (time formatting + skip its SMS leg via the same flag — note its SMS goes through `NotificationsService.sendSms`, so the skip is automatic; only timezone changes here)
- Test: extend `apps/comms-service/src/notifications/notifications.service.spec.ts` and `apps/comms-service/src/enroute/enroute.service.spec.ts`

**Interfaces:**
- Consumes: `CompanySettingsClient` (Task 3), `isFeatureEnabled` (Task 1).
- Produces: `sendSms()` returns `null` (no Notification row, no queue job) when the company's `sms` flag is false, logging `[sms-disabled] companyId=<id> skipped sms to=<phone>`. En-route email/SMS times formatted in company timezone.

- [ ] **Step 1: Write failing tests**

In the notifications spec (mock settings client like other deps):

```ts
it('skips SMS entirely when sms feature is off', async () => {
  settingsClientMock.getSettings.mockResolvedValue({
    id: 'co-1', name: '', logoUrl: null,
    currency: 'LKR', timezone: 'Asia/Colombo', features: { sms: false },
  });
  const result = await service.sendSms({
    companyId: 'co-1', recipientName: 'X', recipientPhone: '+9477000000', body: 'hi',
  } as never);
  expect(result).toBeNull();
  expect(prismaMock.notification.create).not.toHaveBeenCalled();
  expect(smsQueueMock.add).not.toHaveBeenCalled();
});

it('sends SMS when features empty (default on)', async () => {
  settingsClientMock.getSettings.mockResolvedValue({
    id: 'co-1', name: '', logoUrl: null,
    currency: 'USD', timezone: 'America/New_York', features: {},
  });
  // existing happy-path assertions: notification.create called, smsQueue.add called
});
```

En-route spec addition:

```ts
it('formats ETA window in company timezone', () => {
  // formatWindow (or its successor) given 2026-07-06T04:30:00Z + Asia/Colombo
  // must render "10:00 AM" (UTC+5:30), not the UTC or US-local time.
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter comms-service test -- notifications && pnpm --filter comms-service test -- enroute`
Expected: new tests FAIL.

- [ ] **Step 3: Implement SMS skip**

Inject `CompanySettingsClient` into `NotificationsService`. At the top of `sendSms()`:

```ts
const settings = await this.companySettings.getSettings(req.companyId);
if (!isFeatureEnabled(settings.features, 'sms')) {
  this.logger.log(`[sms-disabled] companyId=${req.companyId} skipped sms to=${req.recipientPhone}`);
  return null;
}
```

Adjust the method return type to `Promise<Notification | null>` and check callers compile (`pnpm --filter comms-service build`). Callers that use the returned notification id must tolerate null — grep `sendSms(` in comms-service and guard where needed.

- [ ] **Step 4: Implement en-route timezone**

In `enroute.service.ts`, the window/time formatting currently uses server-local time. Change the formatter to accept a timezone and use it:

```ts
private formatTimeInZone(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone,
  }).format(d);
}
```

Fetch settings once per notification (`await this.companySettings.getSettings(dto.companyId)`) and pass `settings.timezone` into the existing `formatWindow`/email-HTML builders wherever times are rendered.

Then sweep other customer-facing dated emails: `grep -rn "toLocaleDateString\|toLocaleTimeString\|toLocaleString" apps/comms-service/src/templates apps/comms-service/src/email apps/comms-service/src/marketing --include="*.ts"` — every hit that renders a date/time into customer email content switches to the same `Intl.DateTimeFormat(..., { timeZone })` approach with the company timezone (add a shared `formatInZone(d, timeZone, opts)` helper in `apps/comms-service/src/templates/format.ts` if 3+ sites need it). Internal/log formatting stays as-is.

- [ ] **Step 5: Run full comms suite**

Run: `pnpm --filter comms-service test && pnpm --filter comms-service build`
Expected: all suites PASS (132+ existing tests must stay green), clean build.

---

### Task 6: finance-service — currency + timezone in PDFs

**Files:**
- Modify: the invoice/quote HTML template builders under `apps/finance-service/src/pdf/` (locate with `grep -rn "toFixed(2)\|\\$" apps/finance-service/src/pdf --include="*.ts" -l`)
- Modify: their callers to pass `currency`/`timezone` from `CompanySettingsClient`
- Test: `apps/finance-service/src/pdf/money-format.spec.ts` (create)

**Interfaces:**
- Consumes: `CompanySettingsClient` (Task 3).
- Produces: `formatMoneySrv(amount: number | string, currency: string): string` and `formatDateSrv(d: Date | string, timezone: string): string` exported from a new `apps/finance-service/src/pdf/format.ts`; all money/dates in generated PDFs go through them.

- [ ] **Step 1: Write failing tests**

```ts
import { formatMoneySrv, formatDateSrv } from './format';

describe('formatMoneySrv', () => {
  it('formats USD', () => expect(formatMoneySrv(1250, 'USD')).toBe('$1,250.00'));
  it('formats LKR', () => expect(formatMoneySrv(125000, 'LKR')).toMatch(/Rs\s?125,000\.00/));
  it('accepts Decimal-as-string', () => expect(formatMoneySrv('99.5', 'USD')).toBe('$99.50'));
  it('falls back to USD on unknown code', () => expect(formatMoneySrv(10, 'XXINVALID')).toBe('$10.00'));
});

describe('formatDateSrv', () => {
  it('renders in Asia/Colombo', () => {
    // 2026-07-05T20:00:00Z is 2026-07-06 01:30 in Colombo
    expect(formatDateSrv('2026-07-05T20:00:00Z', 'Asia/Colombo')).toContain('Jul 6, 2026');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter finance-service test -- pdf`
Expected: FAIL — `./format` not found.

- [ ] **Step 3: Implement `apps/finance-service/src/pdf/format.ts`**

```ts
export function formatMoneySrv(amount: number | string, currency: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  const safe = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol',
    }).format(safe);
  }
}

export function formatDateSrv(d: Date | string, timezone: string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: timezone,
  }).format(date);
}
```

- [ ] **Step 4: Sweep PDF templates**

In each template builder: inject/thread `settings` (fetched via `CompanySettingsClient` in the calling service method using the invoice/quote's `companyId`), replace every `` `$${x.toFixed(2)}` ``-style rendering with `formatMoneySrv(x, settings.currency)` and date renderings with `formatDateSrv(d, settings.timezone)`. Find all sites: `grep -n '\$\|toFixed\|toLocaleDateString' <template file>`. Every hit is either money (→ `formatMoneySrv`), a date (→ `formatDateSrv`), or CSS/template-literal syntax (leave).

- [ ] **Step 5: Run suite + build**

Run: `pnpm --filter finance-service test && pnpm --filter finance-service build`
Expected: PASS.

- [ ] **Step 6: Manual PDF smoke**

With dev services running, generate an invoice PDF for the demo tenant (existing endpoint used by admin "Download PDF") and eyeball `$` amounts unchanged.

---

### Task 7: customer-portal — CompanyContext + format lib

**Files:**
- Create: `apps/customer-portal/src/lib/format.ts`
- Create: `apps/customer-portal/src/contexts/CompanyContext.tsx`
- Modify: `apps/customer-portal/src/App.tsx` (or main.tsx — wherever providers nest; wrap inside AuthProvider)
- Test: build-level (`tsc -b` via `pnpm --filter customer-portal build`) — portal has no jest. Formatter correctness is covered by admin-side unit tests in Task 9 (identical implementation).

**Interfaces:**
- Consumes: `GET /crm/company/settings` (Task 2) via the existing `api` axios instance.
- Produces:
  - `setActiveCompanyFormat(opts: { currency: string; timezone: string }): void`
  - `formatMoney(value: number | string | null | undefined, opts?: { decimals?: number }): string`
  - `formatMoneyCompact(value: number | string | null | undefined): string` (chart-style `$45.3k` / `Rs 45.3k`)
  - `formatDateTz(d: string | Date, opts?: Intl.DateTimeFormatOptions): string`
  - `useCompany(): { settings: CompanySettingsView | null }` where `CompanySettingsView = { name: string; logoUrl: string | null; currency: string; timezone: string; features: Record<string, unknown> }`
  - `featureEnabled(features: Record<string, unknown> | undefined, key: string): boolean` (same fail-open logic, local copy since portal doesn't import @tscrm/types)

- [ ] **Step 1: Implement `lib/format.ts`**

```ts
// Module-level state set once by CompanyContext after login. Plain functions
// (not hooks) so PDF builders and non-component helpers can format money.
let activeCurrency = 'USD'
let activeTimezone = 'America/New_York'

export function setActiveCompanyFormat(opts: { currency: string; timezone: string }): void {
  activeCurrency = opts.currency || 'USD'
  activeTimezone = opts.timezone || 'America/New_York'
}

function toNumber(value: number | string | null | undefined): number {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
  return Number.isFinite(n) ? n : 0
}

export function formatMoney(
  value: number | string | null | undefined,
  opts: { decimals?: number } = {},
): string {
  const decimals = opts.decimals ?? 2
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: activeCurrency, currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: decimals, maximumFractionDigits: decimals,
    }).format(toNumber(value))
  } catch {
    return `$${toNumber(value).toFixed(decimals)}`
  }
}

/** "$45.3k" / "Rs 45.3k" for compact chart labels. */
export function formatMoneyCompact(value: number | string | null | undefined): string {
  const n = toNumber(value)
  const symbol = formatMoney(0, { decimals: 0 }).replace(/[\d.,\s]/g, '') || '$'
  if (Math.abs(n) < 1000) return `${symbol}${Math.round(n)}`
  if (Math.abs(n) < 1_000_000) return `${symbol}${(n / 1000).toFixed(1)}k`
  return `${symbol}${(n / 1_000_000).toFixed(1)}M`
}

export function formatDateTz(d: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    timeZone: activeTimezone,
    ...opts,
  }).format(date)
}

export function featureEnabled(features: Record<string, unknown> | undefined, key: string): boolean {
  if (!features || typeof features !== 'object') return true
  return features[key] !== false
}
```

- [ ] **Step 2: Implement `CompanyContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import api from '../lib/api'
import { setActiveCompanyFormat } from '../lib/format'
import { useAuth } from './AuthContext'

export interface CompanySettingsView {
  name: string
  logoUrl: string | null
  currency: string
  timezone: string
  features: Record<string, unknown>
}

const CompanyContext = createContext<{ settings: CompanySettingsView | null }>({ settings: null })

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [settings, setSettings] = useState<CompanySettingsView | null>(null)

  useEffect(() => {
    if (!isAuthenticated) { setSettings(null); return }
    let cancelled = false
    api.get('/crm/company/settings')
      .then((res) => {
        if (cancelled) return
        const s = res.data as CompanySettingsView
        setSettings(s)
        setActiveCompanyFormat({ currency: s.currency, timezone: s.timezone })
      })
      .catch(() => { /* keep USD defaults; page still works */ })
    return () => { cancelled = true }
  }, [isAuthenticated])

  return <CompanyContext.Provider value={{ settings }}>{children}</CompanyContext.Provider>
}

export function useCompany() {
  return useContext(CompanyContext)
}
```

Wrap it inside `AuthProvider` in the provider tree (find the tree in `App.tsx`/`main.tsx`).

- [ ] **Step 3: Build**

Run: `pnpm --filter customer-portal build`
Expected: clean `tsc -b && vite build`.

---

### Task 8: customer-portal — money sweep, branding, payments off-switch

**Files:**
- Modify: all portal files with hardcoded money (find: `grep -rnE '\$\$\{|\$\{?[a-zA-Z_.]*(total|amount|price|balance|Due|Value)' apps/customer-portal/src --include='*.tsx' --include='*.ts' | grep -viv 'css\|class'` plus `grep -rn 'toFixed(2)' apps/customer-portal/src`) — expect ~60 sites incl. `lib/serviceReportPdf.ts`
- Modify: the portal header/nav component (find: `grep -rln "HomePulse\|logo" apps/customer-portal/src/components`) and `pages/Dashboard.tsx` greeting
- Modify: `pages/invoices/Invoices.tsx`, `pages/invoices/PayInvoiceModal.tsx`, `pages/jobs/JobDetailModal.tsx` (Pay button gating)
- Test: build + manual smoke (portal has no jest)

**Interfaces:**
- Consumes: `formatMoney`, `formatMoneyCompact`, `formatDateTz`, `featureEnabled`, `useCompany` (Task 7).

- [ ] **Step 1: Money sweep**

For every grep hit that renders money, replace with `formatMoney(...)`:

```tsx
// before:
<span>${Number(invoice.total).toFixed(2)}</span>
// after:
<span>{formatMoney(invoice.total)}</span>
```

Rules: (a) template-literal money inside strings (e.g., `serviceReportPdf.ts` HTML) uses `formatMoney(x)` interpolation instead of `$${x.toFixed(2)}`; (b) non-money `$` (CSS, regex, template syntax) untouched; (c) chart/compact labels use `formatMoneyCompact`. Work file-by-file; re-run the grep at the end — remaining hits must all be justifiable non-money.

- [ ] **Step 2: Branding**

In the header component and Dashboard greeting:

```tsx
const { settings } = useCompany()
// header brand slot:
{settings?.logoUrl
  ? <img src={settings.logoUrl} alt={settings.name} className="h-7 w-auto" />
  : <span className="brand-name">HomePulse</span>}
{settings?.name && <span className="text-sm" style={{ color: 'var(--t3)' }}>{settings.name}</span>}
```

Add a small "Powered by HomePulse" line in the existing footer (or under the nav if no footer exists). Login screen untouched.

- [ ] **Step 3: Payments off-switch**

Wherever the Pay button renders (Invoices list/detail, JobDetailModal invoice section):

```tsx
const { settings } = useCompany()
const canPayOnline = featureEnabled(settings?.features, 'onlinePayments')
...
{canPayOnline
  ? <button onClick={openPayModal}>Pay now</button>
  : <p className="pay-offline-note">
      Online payment isn't available. Please pay by bank transfer or contact us —
      your invoice reference is #{invoice.invoiceNumber}.
    </p>}
```

Keep `PayInvoiceModal`'s existing Stripe-unconfigured graceful fallback for flag-on tenants.

- [ ] **Step 4: Build + smoke**

Run: `pnpm --filter customer-portal build` — clean.
Manual: portal at localhost:5174 as demo tenant — all money shows `$…` exactly as before, Pay button present, HomePulse branding (demo has no logoUrl). Re-run the money grep: no unexplained hits.

---

### Task 9: admin-dashboard — currency-aware format + sweep

**Files:**
- Modify: `apps/admin-dashboard/src/lib/format.ts`
- Create: `apps/admin-dashboard/src/hooks/useCompanySettings.ts`
- Modify: the top-level provider/App to invoke the hook once (e.g., in the authed layout component)
- Modify: all admin files with hardcoded `$` money (same grep recipe as Task 8 against `apps/admin-dashboard/src`)
- Test: `apps/admin-dashboard/src/lib/format.test.ts` **only if** admin-dashboard has a test runner — it does not (no `test` script), so validation is `tsc -b` + the identical logic already unit-tested in Task 6's server copy. Skip creating a test file.

**Interfaces:**
- Consumes: `GET /crm/company/settings` via existing admin `lib/api.ts`.
- Produces: `setActiveCompanyFormat({ currency, timezone })`, `formatMoney(value, opts?)` in admin `lib/format.ts`; `formatDollars`/`formatRevenueK`/`dollarsToK` become currency-aware wrappers (same signatures, so existing call sites keep compiling).

- [ ] **Step 1: Extend `lib/format.ts`**

Add the same module-level state + `setActiveCompanyFormat` + `formatMoney` + `formatMoneyCompact` implementations as Task 7 Step 1 (copy the code; the two apps do not share a package). Then rewrite the existing helpers as wrappers, preserving signatures and doc comments:

```ts
/** "$45,320.00" — 2-decimal money formatter (currency-aware; name kept for back-compat). */
export function formatDollars(value: number | string | null | undefined, opts: { decimals?: number } = {}): string {
  return formatMoney(value, opts)
}

/** "$45.3k" — compact money formatter for charts. */
export function formatRevenueK(dollars: number | string | null | undefined, _decimals = 1): string {
  return formatMoneyCompact(dollars)
}

// dollarsToK stays numeric/unchanged — it feeds chart axes, not labels.
```

- [ ] **Step 2: Implement `hooks/useCompanySettings.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { setActiveCompanyFormat } from '../lib/format'

export interface CompanySettingsView {
  name: string
  logoUrl: string | null
  currency: string
  timezone: string
  features: Record<string, unknown>
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await api.get('/crm/company/settings')
      const s = res.data as CompanySettingsView
      setActiveCompanyFormat({ currency: s.currency, timezone: s.timezone })
      return s
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

Call `useCompanySettings()` once in the authed shell (the component that renders Sidebar/Topbar — find it in `App.tsx`) so the formatter is primed before pages render money. (Brief first-paint in USD before the query resolves is acceptable.)

- [ ] **Step 3: Sweep admin money sites**

Same recipe as Task 8 Step 1 against `apps/admin-dashboard/src`. Sites already using `formatDollars`/`formatRevenueK` need **no change** (wrappers are now currency-aware). Replace only raw `$${…}`/`toFixed(2)` money renderings with `formatMoney(...)`.

- [ ] **Step 4: Build + smoke**

Run: `pnpm --filter admin-dashboard build` — clean.
Manual: dashboard at localhost:5173 for demo tenant — Finance page, Dashboard KPIs, Analytics charts all show `$` unchanged.

---

### Task 10: Seed script + KASE/Orrix onboarding + end-to-end verification

**Files:**
- Create: `scripts/seed-tenant.ts`
- Test: run against local/dev DB with a throwaway config first

**Interfaces:**
- Consumes: crm Prisma client (`apps/crm-service` generated client), bcrypt hashing consistent with crm auth (check `apps/crm-service/src/auth` for the hash function/rounds — reuse the same, e.g. `bcrypt.hash(pw, 10)`).

- [ ] **Step 1: Implement `scripts/seed-tenant.ts`**

```ts
/**
 * Onboard (or update settings of) a tenant. Idempotent on company email.
 * Run: pnpm tsx scripts/seed-tenant.ts <config.json>
 * Uses CRM_DIRECT_DATABASE_URL from apps/crm-service/.env (session mode).
 */
import { PrismaClient } from '../apps/crm-service/node_modules/@prisma/client'
import * as bcrypt from 'bcrypt'
import * as fs from 'fs'

interface TenantConfig {
  name: string; email: string; country: string
  currency: string; timezone: string
  features: Record<string, boolean>
  admin: { name: string; email: string; tempPassword: string }
}

async function main() {
  const configPath = process.argv[2]
  if (!configPath) throw new Error('Usage: pnpm tsx scripts/seed-tenant.ts <config.json>')
  const cfg: TenantConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.CRM_DIRECT_DATABASE_URL } },
  })

  const existing = await prisma.company.findUnique({ where: { email: cfg.email } })
  const data = {
    name: cfg.name, email: cfg.email, country: cfg.country,
    currency: cfg.currency, timezone: cfg.timezone, features: cfg.features,
  }
  const company = existing
    ? await prisma.company.update({ where: { id: existing.id }, data })
    : await prisma.company.create({ data })
  console.log(`${existing ? 'Updated' : 'Created'} company ${company.id} (${company.name})`)

  const adminExisting = await prisma.companyUser.findFirst({
    where: { companyId: company.id, email: cfg.admin.email },
  })
  if (!adminExisting) {
    const passwordHash = await bcrypt.hash(cfg.admin.tempPassword, 10)
    const admin = await prisma.companyUser.create({
      data: {
        companyId: company.id, name: cfg.admin.name, email: cfg.admin.email,
        passwordHash, role: 'company_admin', isActive: true, mustResetPassword: true,
      },
    })
    console.log(`Created admin ${admin.id} (${admin.email}) — temp password, must reset`)
  } else {
    console.log(`Admin ${cfg.admin.email} already exists — skipped`)
  }
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
```

Also create `scripts/tenants/kase.example.json` and `scripts/tenants/orrix.example.json`:

```json
{
  "name": "KASE Engineering",
  "email": "admin@kase-engineering.example",
  "country": "LK",
  "currency": "LKR",
  "timezone": "Asia/Colombo",
  "features": { "onlinePayments": false, "sms": false },
  "admin": { "name": "KASE Admin", "email": "admin@kase-engineering.example", "tempPassword": "ChangeMe!2026" }
}
```

(Orrix identical with its names; real emails/passwords supplied by the user at onboarding time — `.example` suffix keeps placeholders out of prod.)

Check `bcrypt` is already a crm-service dependency (it is — auth uses it); run the script with `CRM_DIRECT_DATABASE_URL` exported or via `env $(grep CRM_DIRECT apps/crm-service/.env) pnpm tsx ...`. Verify `mustResetPassword`/CompanyUser field names against `schema.prisma` before running.

- [ ] **Step 2: Test the script (throwaway tenant, then clean up or keep as LKR test fixture)**

```bash
cp scripts/tenants/kase.example.json /tmp/test-tenant.json  # edit email → test-lkr@example.dev
pnpm tsx scripts/seed-tenant.ts /tmp/test-tenant.json
pnpm tsx scripts/seed-tenant.ts /tmp/test-tenant.json   # idempotency: "Updated ... skipped"
```

- [ ] **Step 3: End-to-end LKR smoke (dev)**

1. Log into the portal (localhost:5174) as a customer of the test LKR tenant (create a customer via admin or bypass headers) — money shows `Rs`, no Pay button, bank-transfer note shows, header shows tenant name.
2. Admin dashboard with `x-test-company-id` of the LKR tenant — Finance page shows `Rs`.
3. `curl` finance payment-intent for an LKR-tenant invoice → 403.
4. Trigger an SMS path (or unit-verified) → comms log shows `[sms-disabled]`.
5. Demo tenant unchanged: `$`, Pay button present.

- [ ] **Step 4: Full regression**

```bash
pnpm --filter crm-service test && pnpm --filter finance-service test && pnpm --filter comms-service test
pnpm --filter crm-service build && pnpm --filter finance-service build && pnpm --filter comms-service build
pnpm --filter customer-portal build && pnpm --filter admin-dashboard build
```

Expected: everything green. Report results to the user; user commits manually.

---

## Deployment notes (post-implementation, user-triggered)

- crm/finance/comms images redeploy via existing `scripts/deploy-latest.sh` pattern (image-only deploys preserve env vars).
- finance-service Cloud Run needs `CRM_SERVICE_URL` env var if not already set (comms already has it) — `--update-env-vars`, never `--set-env-vars`.
- DDL of Task 2 Step 1 must be applied to the prod Supabase before deploying the new crm image (columns are additive + defaulted, so it's safe to run ahead of time).
- Real KASE/Orrix seed configs (real emails, temp passwords) run against prod DB at onboarding.
