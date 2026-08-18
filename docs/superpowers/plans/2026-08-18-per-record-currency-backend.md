# Per-Record Currency Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Job, Quote, Invoice, and RecurringSchedule their own `currency` column (defaulting to the tenant's currency when not specified), make Payment report its parent Invoice's currency, make quote→invoice conversion carry currency forward automatically, and give both frontends' `formatMoney` a per-value currency override — the data/formatting foundation Sub-project B2 will wire into forms and list views.

**Architecture:** One new column each on `jobs.job`, `finance.quotes`, `finance.invoices`, `finance.recurring_schedules`, applied via the repo's raw-SQL migration runner with a cross-schema backfill from each row's owning `crm.companies.currency`. job-service gains a new cross-service call (mirroring finance-service's existing `CompanySettingsClient`) to resolve the tenant default when a caller omits `currency`; finance-service already has that client wired into `QuotesService`/`InvoicesService`. `formatMoney` in both frontends' `lib/format.ts` gains an additive `opts.currency` override with no change to existing call sites.

**Tech Stack:** NestJS 10 + Prisma (job-service, finance-service), raw-SQL migration runner (`scripts/apply-migrations.mjs`), Jest (`Test.createTestingModule` pattern in both services), React 19 (both frontends' `lib/format.ts`).

**Spec:** `docs/superpowers/specs/2026-08-18-per-record-currency-backend-design.md`

## Global Constraints

- Currency stays fully independent per document, with exactly three inheritance exceptions: Customer gets no field at all; Payment reports its Invoice's `currency` read-only (not its own column); an Invoice created via `convertToInvoice` inherits its source Quote's `currency`.
- No exchange-rate conversion anywhere — currencies are labels only.
- `currency` defaults to the tenant's current `Company.currency` when omitted on create — never a hardcoded `'USD'` fallback for a non-USD tenant.
- Backend does not validate a submitted `currency` against the tenant's `enabledCurrencies` list in this pass (that's a B2 UI-layer concern).
- `formatMoney(value)` with no `currency` option must remain byte-for-byte unchanged from its current output — this is purely additive.
- RecurringSchedule gets the schema column only; no service/DTO/UI wiring this pass (no UI exists for it today).

---

### Task 1: job-service — CrmClient gains getDefaultCurrency()

**Files:**
- Modify: `apps/job-service/src/jobs/crm.client.ts`
- Test: `apps/job-service/src/jobs/crm.client.spec.ts` (create if it doesn't already exist, otherwise extend)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `CrmClient.getDefaultCurrency(companyId: string): Promise<string>` — Task 3 calls this by exact name when a Job is created without an explicit `currency`.

- [ ] **Step 1: Check whether a spec file already exists**

Run: `ls apps/job-service/src/jobs/crm.client.spec.ts 2>&1`

If it exists, read it first and add the new `describe` block below to it, keeping its existing tests untouched. If it doesn't exist, create it fresh with the content in Step 2.

- [ ] **Step 2: Write the failing test**

```ts
// apps/job-service/src/jobs/crm.client.spec.ts (new file, or append if one already exists)
import { CrmClient } from './crm.client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CrmClient.getDefaultCurrency', () => {
  let client: CrmClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new CrmClient();
  });

  it('returns the tenant currency from crm-service settings', async () => {
    mockedAxios.get.mockResolvedValue({ data: { currency: 'LKR' } });
    const result = await client.getDefaultCurrency('co-1');
    expect(result).toBe('LKR');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/company/settings'),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('falls back to USD when the crm-service call fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network down'));
    const result = await client.getDefaultCurrency('co-1');
    expect(result).toBe('USD');
  });

  it('falls back to USD when the response has no currency field', async () => {
    mockedAxios.get.mockResolvedValue({ data: {} });
    const result = await client.getDefaultCurrency('co-1');
    expect(result).toBe('USD');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter job-service test -- crm.client`
Expected: FAIL — `client.getDefaultCurrency is not a function`.

- [ ] **Step 4: Implement the method**

In `apps/job-service/src/jobs/crm.client.ts`, add this method to the `CrmClient` class (e.g. right after `getComponentOwnerCustomerId`):

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter job-service test -- crm.client`
Expected: PASS — all 3 new tests green (plus any pre-existing tests in the file, if it already existed).

- [ ] **Step 6: Commit**

```bash
git add apps/job-service/src/jobs/crm.client.ts apps/job-service/src/jobs/crm.client.spec.ts
git commit -m "feat(job-service): add CrmClient.getDefaultCurrency for tenant currency fallback"
```

---

### Task 2: job-service — Job.currency schema + migration

**Files:**
- Modify: `apps/job-service/prisma/schema.prisma`
- Modify: `scripts/apply-migrations.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: Prisma Client field `Job.currency: string` — Task 3 reads/writes this.

- [ ] **Step 1: Add the column to the Job model**

In `apps/job-service/prisma/schema.prisma`, find `model Job { ... }` and add `currency` next to `estimatedValue`:

```prisma
  estimatedValue Decimal? @db.Decimal(10, 2)
  currency       String   @default("USD")
```

- [ ] **Step 2: Append the migration entry**

In `scripts/apply-migrations.mjs`, add a new entry to the `migrations` array, immediately before the closing `];`:

```js
  {
    schema: 'jobs',
    name: '20260818010000_add_job_currency',
    sql: `
ALTER TABLE "jobs"."job" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
UPDATE "jobs"."job" j
SET "currency" = c.currency
FROM "crm"."companies" c
WHERE j."companyId" = c.id
  AND j."currency" = 'USD'
  AND c.currency <> 'USD';
    `.trim(),
  },
```

(The `AND j."currency" = 'USD' AND c.currency <> 'USD'` guard makes this backfill idempotent and cheap on re-run — it only touches rows that still have the just-added default and whose owning company isn't USD, rather than rewriting every row unconditionally.)

- [ ] **Step 3: Apply the migration**

Run: `node scripts/apply-migrations.mjs`
Expected: `[apply] 20260818010000_add_job_currency …` then `[ok]` under `=== Schema: jobs ===`.

- [ ] **Step 4: Regenerate the Prisma client**

Run: `pnpm --filter job-service prisma:generate`
Expected: completes with no errors.

- [ ] **Step 5: Verify the backfill**

Run:
```bash
cd apps/job-service && node -e "
const {PrismaClient}=require('./src/prisma/generated');
const p=new PrismaClient();
(async()=>{
  const jobs=await p.job.groupBy({ by: ['currency'], _count: true });
  console.log(jobs);
  await p.\$disconnect();
})();
"
```
Expected: every distinct `currency` value present matches a real tenant's currency (e.g. `USD`, `LKR` — matching the companies seen in Sub-project A's verification) — no unexpected values.

- [ ] **Step 6: Commit**

```bash
git add apps/job-service/prisma/schema.prisma scripts/apply-migrations.mjs apps/job-service/src/prisma/generated
git commit -m "feat(job-service): add Job.currency column with tenant-currency backfill"
```

---

### Task 3: job-service — wire currency into create/update

**Files:**
- Modify: `apps/job-service/src/jobs/dto/create-job.dto.ts`
- Modify: `apps/job-service/src/jobs/jobs.controller.ts` (the inline `UpdateJobDto` class)
- Modify: `apps/job-service/src/jobs/jobs.service.ts`
- Modify: `apps/job-service/src/jobs/jobs.module.ts`
- Modify: `apps/job-service/src/jobs/jobs.service.spec.ts`

**Interfaces:**
- Consumes: `CrmClient.getDefaultCurrency` (Task 1); `Job.currency` (Task 2).
- Produces: `CreateJobDto.currency?: string`, `UpdateJobDto.currency?: string`, `JobsService.create`/`JobsService.update` persist `currency` — nothing in this plan consumes these further (B2 wires the frontend dropdown).

- [ ] **Step 1: Add `currency` to CreateJobDto**

In `apps/job-service/src/jobs/dto/create-job.dto.ts`, add the import and field:

```ts
// add IsString to the existing class-validator import if not already present
import {
  IsString, IsOptional, IsEnum, IsArray,
  IsDateString, IsNumber, MaxLength, IsBoolean, Length,
} from 'class-validator';
```

Add the field right after `estimatedValue`:

```ts
  @ApiPropertyOptional({ description: 'Forecasted dollar value of the job; falls back to invoice total once billed.' })
  @IsOptional() @IsNumber() estimatedValue?: number;
  @ApiPropertyOptional({ example: 'USD', description: 'ISO 4217 code; defaults to the tenant currency when omitted' })
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
```

- [ ] **Step 2: Add `currency` to UpdateJobDto**

In `apps/job-service/src/jobs/jobs.controller.ts`, add `currency?: string` to the inline `UpdateJobDto` class:

```ts
class UpdateJobDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(JobPriorityDto) priority?: JobPriorityDto;
  @IsOptional() @IsString() assignedToId?: string;
  @IsOptional() @IsString() assignedToName?: string;
  @IsOptional() @IsString() scheduledStart?: string;
  @IsOptional() @IsString() scheduledEnd?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() internalNotes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsNumber() estimatedValue?: number;
  @IsOptional() @IsString() cancellationReason?: string;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsString() componentId?: string;
  @IsOptional() @IsString() equipmentId?: string;
  @IsOptional() @IsString() currency?: string;
}
```

`currency` is deliberately absent from `CUSTOMER_PATCHABLE_FIELDS` a few lines below — customers never set a job's currency, matching that whitelist's existing minimal-by-design philosophy.

- [ ] **Step 3: Write the failing tests**

Add to `apps/job-service/src/jobs/jobs.service.spec.ts`. First, find the `describe('JobsService — create'` block (or the block testing `service.create`) and note its existing `providers` array — add `{ provide: CrmClient, useValue: mockCrmClient }` to it, and add this shared mock near the top of the file alongside the other mock declarations:

```ts
// add near the top of the file, alongside mockPrisma/mockEvents/mockCache declarations
import { CrmClient } from './crm.client';

const mockCrmClient = {
  getDefaultCurrency: jest.fn().mockResolvedValue('USD'),
  getProjectCustomerId: jest.fn(),
  getComponentOwnerCustomerId: jest.fn(),
  getComponentDetails: jest.fn(),
};
```

Then, in **every** `providers: [...]` array in the file that includes `JobsService` (there are four `describe` blocks, each with its own `TestingModule` setup — search for `JobsService,` to find all of them), add:

```ts
        { provide: CrmClient, useValue: mockCrmClient },
```

Then add these tests inside the `describe` block that covers `service.create` (find it by searching for `service.create(`):

```ts
  it('resolves currency from CrmClient when the DTO omits it', async () => {
    mockCrmClient.getDefaultCurrency.mockResolvedValue('LKR');
    mockPrisma.job.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'job-1', ...data }));
    const user = { companyId: 'co-1', userId: 'u-1', name: 'Admin', email: 'a@x.com' } as any;
    await service.create(user, { customerId: 'c1', customerName: 'C', serviceAddress: '1 St', title: 'Job' } as any);
    expect(mockCrmClient.getDefaultCurrency).toHaveBeenCalledWith('co-1');
    expect(mockPrisma.job.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currency: 'LKR' }) }),
    );
  });

  it('respects an explicit currency in the DTO without calling CrmClient', async () => {
    mockPrisma.job.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'job-1', ...data }));
    const user = { companyId: 'co-1', userId: 'u-1', name: 'Admin', email: 'a@x.com' } as any;
    await service.create(user, { customerId: 'c1', customerName: 'C', serviceAddress: '1 St', title: 'Job', currency: 'EUR' } as any);
    expect(mockCrmClient.getDefaultCurrency).not.toHaveBeenCalled();
    expect(mockPrisma.job.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currency: 'EUR' }) }),
    );
  });
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm --filter job-service test -- jobs.service`
Expected: FAIL — either a DI resolution error (`Nest can't resolve dependencies of JobsService`) if `CrmClient` isn't yet a constructor param, or an assertion failure on `currency` once it is. Both are expected failures at this point.

- [ ] **Step 5: Inject CrmClient into JobsService and resolve currency in create**

In `apps/job-service/src/jobs/jobs.service.ts`, add the import and constructor param:

```ts
import { CrmClient } from './crm.client';
```

```ts
  constructor(
    private prisma: PrismaService,
    private cache: RedisCacheService,
    private readonly events: JobEventsPublisher,
    private readonly crmClient: CrmClient,
  ) {}
```

Update the `create` method's opening lines:

```ts
  async create(user: AuthUser, dto: CreateJobDto) {
    const { customFields, currency, ...rest } = dto;
    const resolvedCurrency = currency || (await this.crmClient.getDefaultCurrency(user.companyId));

    for (let attempt = 1; attempt <= CREATE_JOB_MAX_ATTEMPTS; attempt += 1) {
      try {
        const job = await this.prisma.$transaction(async (tx) => {
          const jobNumber = await this.generateJobNumber(tx, user.companyId);

          const createdJob = await tx.job.create({
            data: {
              ...rest,
              companyId: user.companyId,
              jobNumber,
              currency: resolvedCurrency,
              priority: (rest.priority ?? 'NORMAL') as any,
```

(Only the destructure line, the new `resolvedCurrency` line, and the two added lines inside `tx.job.create`'s `data` block change — everything else in `create` stays as-is.)

- [ ] **Step 6: Add currency to the update method's accepted fields**

In `jobs.service.ts`, update the `update` method's `data` parameter type to include `currency`:

```ts
  async update(
    companyId: string,
    id: string,
    data: Partial<{
      title: string;
      description: string;
      priority: string;
      assignedToId: string;
      assignedToName: string;
      scheduledStart: string;
      scheduledEnd: string;
      notes: string;
      internalNotes: string;
      tags: string[];
      projectId: string | null;
      componentId: string | null;
      equipmentId: string | null;
      currency: string;
    }>,
  ) {
```

No other change is needed in `update` — the existing `data: { ...data, ... }` spread already forwards `currency` through to Prisma once it's part of the accepted type.

- [ ] **Step 7: Register CrmClient as a JobsService dependency**

`CrmClient` is already a provider in `apps/job-service/src/jobs/jobs.module.ts` (used by `JobsController` today) — no module change is needed; Nest's DI resolves the same provider instance into both `JobsController` and `JobsService`.

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm --filter job-service test -- jobs.service`
Expected: PASS — all tests in the file green, including the 2 new ones.

- [ ] **Step 9: Full job-service test suite + build**

Run: `pnpm --filter job-service test`
Expected: PASS, no regressions.

Run: `pnpm --filter job-service build`
Expected: compiles cleanly.

- [ ] **Step 10: Commit**

```bash
git add apps/job-service/src/jobs/dto/create-job.dto.ts apps/job-service/src/jobs/jobs.controller.ts apps/job-service/src/jobs/jobs.service.ts apps/job-service/src/jobs/jobs.service.spec.ts
git commit -m "feat(job-service): resolve and persist Job.currency on create/update"
```

---

### Task 4: finance-service — Quote/Invoice/RecurringSchedule.currency schema + migration

**Files:**
- Modify: `apps/finance-service/prisma/schema.prisma`
- Modify: `scripts/apply-migrations.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: Prisma Client fields `Quote.currency: string`, `Invoice.currency: string`, `RecurringSchedule.currency: string` — Tasks 5-8 read/write these.

- [ ] **Step 1: Add the column to Quote, Invoice, RecurringSchedule**

In `apps/finance-service/prisma/schema.prisma`:

In `model Quote { ... }`, add next to `taxRate`:
```prisma
  taxRate          Decimal     @db.Decimal(5, 4) @default(0)  // 0.0825 = 8.25%
  currency         String      @default("USD")
```

In `model Invoice { ... }`, add next to `taxRate`:
```prisma
  taxRate               Decimal       @db.Decimal(5, 4) @default(0)
  currency              String        @default("USD")
```

In `model RecurringSchedule { ... }`, add next to `taxRate`:
```prisma
  taxRate              Decimal            @db.Decimal(5, 4) @default(0)
  currency             String             @default("USD")
```

- [ ] **Step 2: Append the migration entry**

In `scripts/apply-migrations.mjs`, add a new entry immediately before the closing `];`:

```js
  {
    schema: 'finance',
    name: '20260818020000_add_finance_currency',
    sql: `
ALTER TABLE "finance"."quotes" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "finance"."invoices" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "finance"."recurring_schedules" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';

UPDATE "finance"."quotes" q
SET "currency" = c.currency
FROM "crm"."companies" c
WHERE q."companyId" = c.id
  AND q."currency" = 'USD'
  AND c.currency <> 'USD';

UPDATE "finance"."invoices" i
SET "currency" = c.currency
FROM "crm"."companies" c
WHERE i."companyId" = c.id
  AND i."currency" = 'USD'
  AND c.currency <> 'USD';

UPDATE "finance"."recurring_schedules" r
SET "currency" = c.currency
FROM "crm"."companies" c
WHERE r."companyId" = c.id
  AND r."currency" = 'USD'
  AND c.currency <> 'USD';
    `.trim(),
  },
```

- [ ] **Step 3: Apply the migration**

Run: `node scripts/apply-migrations.mjs`
Expected: `[apply] 20260818020000_add_finance_currency …` then `[ok]` under `=== Schema: finance ===`.

- [ ] **Step 4: Regenerate the Prisma client**

Run: `pnpm --filter finance-service prisma:generate`
Expected: completes with no errors.

- [ ] **Step 5: Verify the backfill**

Run:
```bash
cd apps/finance-service && node -e "
const {PrismaClient}=require('./src/prisma/generated');
const p=new PrismaClient();
(async()=>{
  console.log('quotes:', await p.quote.groupBy({ by: ['currency'], _count: true }));
  console.log('invoices:', await p.invoice.groupBy({ by: ['currency'], _count: true }));
  console.log('recurring:', await p.recurringSchedule.groupBy({ by: ['currency'], _count: true }));
  await p.\$disconnect();
})();
"
```
Expected: distinct currency values match real tenant currencies, no unexpected values.

- [ ] **Step 6: Commit**

```bash
git add apps/finance-service/prisma/schema.prisma scripts/apply-migrations.mjs apps/finance-service/src/prisma/generated
git commit -m "feat(finance-service): add currency column to Quote/Invoice/RecurringSchedule with backfill"
```

---

### Task 5: finance-service — wire currency into Quote create/update

**Files:**
- Modify: `apps/finance-service/src/quotes/dto/create-quote.dto.ts`
- Modify: `apps/finance-service/src/quotes/dto/update-quote.dto.ts`
- Modify: `apps/finance-service/src/quotes/quotes.service.ts`
- Modify: `apps/finance-service/src/quotes/quotes.service.spec.ts`

**Interfaces:**
- Consumes: `CompanySettingsClient.getSettings` (already injected into `QuotesService`); `Quote.currency` (Task 4).
- Produces: `CreateQuoteDto.currency?: string`, `UpdateQuoteDto.currency?: string`, `QuotesService.create`/`.update` persist `currency` — Task 6 relies on `Quote.currency` being a real, populated field when reading a quote for conversion.

- [ ] **Step 1: Add `currency` to CreateQuoteDto and UpdateQuoteDto**

In `apps/finance-service/src/quotes/dto/create-quote.dto.ts`, add `Length` to the class-validator import and add the field near `taxRate` (search for `taxRate?: number;` in this file):

```ts
import {
  IsString, IsOptional, IsEnum, IsNumber, IsBoolean,
  IsArray, ValidateNested, IsEmail, IsDateString, Min, MaxLength, Length,
} from 'class-validator';
```

```ts
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) taxRate?: number;
  @ApiPropertyOptional({ example: 'USD', description: 'ISO 4217 code; defaults to the tenant currency when omitted' })
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
```

In `apps/finance-service/src/quotes/dto/update-quote.dto.ts`, add `Length` to the import and add the field:

```ts
import { IsOptional, IsString, IsEnum, IsNumber, IsBoolean, IsArray, ValidateNested, Length } from 'class-validator';
```

```ts
  @ApiPropertyOptional() @IsOptional() @IsNumber() taxRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 3) currency?: string;
```

- [ ] **Step 2: Write the failing tests**

Add to `apps/finance-service/src/quotes/quotes.service.spec.ts`, inside the `describe('QuotesService', ...)` block (find the section testing `service.create` — search for `describe('create'` or similar; if no dedicated sub-`describe` exists, add a new one):

```ts
  describe('create — currency', () => {
    it('resolves currency from CompanySettingsClient when the DTO omits it', async () => {
      const settingsMock = module.get(CompanySettingsClient) as any;
      settingsMock.getSettings.mockResolvedValue({ id: COMPANY_ID, name: 'Demo', logoUrl: null, currency: 'LKR', timezone: 'Asia/Colombo', features: {} });
      mockPrisma.quote.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'q-new', ...data }));
      await service.create(COMPANY_ID, USER_ID, { customerId: 'c1', customerName: 'C', customerEmail: 'c@x.com', title: 'Q' } as any);
      expect(mockPrisma.quote.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ currency: 'LKR' }) }),
      );
    });

    it('respects an explicit currency in the DTO without calling CompanySettingsClient', async () => {
      const settingsMock = module.get(CompanySettingsClient) as any;
      mockPrisma.quote.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'q-new', ...data }));
      await service.create(COMPANY_ID, USER_ID, { customerId: 'c1', customerName: 'C', customerEmail: 'c@x.com', title: 'Q', currency: 'EUR' } as any);
      expect(settingsMock.getSettings).not.toHaveBeenCalled();
      expect(mockPrisma.quote.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ currency: 'EUR' }) }),
      );
    });
  });
```

This test references a module-scoped `module` variable holding the compiled `TestingModule` — check the existing `beforeEach` in this file: if it currently only assigns `service = module.get<QuotesService>(QuotesService);` without keeping `module` itself accessible outside the `beforeEach` closure, promote the `const module: TestingModule = ...` declaration to a `let module: TestingModule` at the `describe` block's top level (alongside `let service: QuotesService;`) and assign it (`module = await Test.createTestingModule(...)`) inside `beforeEach`, so both variables are readable from every nested `it`.

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter finance-service test -- quotes.service`
Expected: FAIL — assertion failure, `currency` not present in the `create` call's data.

- [ ] **Step 4: Resolve and persist currency in QuotesService.create**

In `apps/finance-service/src/quotes/quotes.service.ts`, update the `create` method's opening lines:

```ts
  async create(companyId: string, userId: string, dto: CreateQuoteDto) {
    const quoteNumber = await nextQuoteNumber(this.prisma, companyId);
    const { lineItems = [], taxRate = 0, discountType, discountValue, currency, ...rest } = dto;
    const resolvedCurrency = currency || (await this.companySettings.getSettings(companyId)).currency;
```

Then in the `this.prisma.quote.create({ data: { ... } })` call further down, add `currency: resolvedCurrency,` alongside the other assigned fields (e.g. right after `quoteNumber,`):

```ts
    return this.prisma.quote.create({
      data: {
        ...rest,
        companyId,
        quoteNumber,
        currency: resolvedCurrency,
        createdByUserId: userId,
```

- [ ] **Step 5: Allow currency on update**

Find `QuotesService.update` (the method handling `UpdateQuoteDto`). It already spreads validated update fields through to Prisma — since `currency` is now a field on `UpdateQuoteDto` and Prisma's `Quote` model, no code change is needed beyond what Step 1 already did, **unless** the `update` method explicitly destructures a fixed field list rather than spreading the whole DTO. Check the method's implementation: if it does `const { title, description, ... } = dto` (a fixed field list) rather than `...rest`, add `currency` to that destructured list and to the `data: { ... }` object passed to `this.prisma.quote.update`. If it already spreads unnamed fields through, no change is needed here — just verify with the next step.

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter finance-service test -- quotes.service`
Expected: PASS — all quotes.service tests green, including the 2 new ones.

- [ ] **Step 7: Commit**

```bash
git add apps/finance-service/src/quotes/dto/create-quote.dto.ts apps/finance-service/src/quotes/dto/update-quote.dto.ts apps/finance-service/src/quotes/quotes.service.ts apps/finance-service/src/quotes/quotes.service.spec.ts
git commit -m "feat(finance-service): resolve and persist Quote.currency on create/update"
```

---

### Task 6: finance-service — Invoice inherits Quote's currency on conversion

**Files:**
- Modify: `apps/finance-service/src/quotes/quotes.service.ts`
- Modify: `apps/finance-service/src/quotes/quotes.service.spec.ts`

**Interfaces:**
- Consumes: `Quote.currency` (Task 4, populated by Task 5).
- Produces: `convertToInvoice`'s created invoice carries `currency` — no later task in this plan consumes this directly, but it's the correctness guarantee the spec requires.

- [ ] **Step 1: Write the failing test**

Add to `apps/finance-service/src/quotes/quotes.service.spec.ts`, inside the `describe` block covering `convertToInvoice` (search for `convertToInvoice` to find it):

```ts
  it('convertToInvoice carries the quote currency forward, ignoring the current tenant default', async () => {
    const settingsMock = module.get(CompanySettingsClient) as any;
    // Tenant default is USD right now, but the quote itself was created in LKR —
    // the invoice must inherit LKR, proving this is inheritance, not a fresh lookup.
    settingsMock.getSettings.mockResolvedValue({ id: COMPANY_ID, name: 'Demo', logoUrl: null, currency: 'USD', timezone: 'America/New_York', features: {} });
    const quote = makeQuote({ status: QuoteStatus.ACCEPTED, currency: 'LKR' });
    mockPrisma.quote.findFirst.mockResolvedValue(quote);
    mockPrisma.invoice.findFirst.mockResolvedValue(null);
    mockPrisma.invoice.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'inv-1', ...data }));
    mockPrisma.invoice.findUniqueOrThrow.mockResolvedValue({ id: 'inv-1', currency: 'LKR' });

    await service.convertToInvoice(COMPANY_ID, QUOTE_ID, USER_ID);

    expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currency: 'LKR' }) }),
    );
  });
```

(This uses the existing `makeQuote` helper already defined at the top of the file — passing `currency: 'LKR'` as an override, which `makeQuote`'s `{ ...overrides }` spread already supports without any change to the helper itself.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter finance-service test -- quotes.service`
Expected: FAIL — `currency` missing (or `undefined`) in the `invoice.create` call's data.

- [ ] **Step 3: Add currency to the conversion**

In `apps/finance-service/src/quotes/quotes.service.ts::convertToInvoice`, find the `tx.invoice.create({ data: { ... } })` call and add `currency: quote.currency,` alongside the other fields copied from `quote`:

```ts
            const inv = await tx.invoice.create({
              data: {
                companyId,
                invoiceNumber,
                quoteId: id,
                jobId: quote.jobId,
                projectId: quote.projectId,
                houseId: quote.houseId,
                componentId: quote.componentId,
                customerId: quote.customerId,
                customerName: quote.customerName,
                customerEmail: quote.customerEmail,
                currency: quote.currency,
                subtotal: quote.subtotal,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter finance-service test -- quotes.service`
Expected: PASS.

- [ ] **Step 5: Full finance-service test suite**

Run: `pnpm --filter finance-service test`
Expected: PASS, no regressions.

- [ ] **Step 6: Commit**

```bash
git add apps/finance-service/src/quotes/quotes.service.ts apps/finance-service/src/quotes/quotes.service.spec.ts
git commit -m "feat(finance-service): invoice inherits its source quote's currency on conversion"
```

---

### Task 7: finance-service — wire currency into standalone Invoice creation

**Files:**
- Modify: `apps/finance-service/src/invoices/dto/create-invoice.dto.ts`
- Modify: `apps/finance-service/src/invoices/invoices.service.ts`
- Modify: `apps/finance-service/src/invoices/invoices.service.spec.ts`

**Interfaces:**
- Consumes: `CompanySettingsClient.getSettings` (already injected into `InvoicesService`); `Invoice.currency` (Task 4).
- Produces: `CreateInvoiceDto.currency?: string`, `InvoicesService.create` persists `currency` — Task 8 relies on `Invoice.currency` being populated when Payment reads it.

- [ ] **Step 1: Add `currency` to CreateInvoiceDto**

In `apps/finance-service/src/invoices/dto/create-invoice.dto.ts`, add `Length` to the class-validator import and add the field:

```ts
import {
  IsString, IsOptional, IsNumber, IsBoolean,
  IsArray, ValidateNested, IsEmail, IsDateString, Min, IsInt, Length,
} from 'class-validator';
```

```ts
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) taxRate?: number;
  @ApiPropertyOptional({ example: 'USD', description: 'ISO 4217 code; ignored when creating from a quote (inherits the quote\'s currency), defaults to the tenant currency otherwise' })
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
```

- [ ] **Step 2: Write the failing tests**

Add to `apps/finance-service/src/invoices/invoices.service.spec.ts` (mirror whatever test-module setup pattern the existing file already uses — `Test.createTestingModule` with `CompanySettingsClient` as a provider, matching `quotes.service.spec.ts`'s pattern):

```ts
  it('resolves currency from CompanySettingsClient when the DTO omits it', async () => {
    const settingsMock = module.get(CompanySettingsClient) as any;
    settingsMock.getSettings.mockResolvedValue({ id: COMPANY_ID, name: 'Demo', logoUrl: null, currency: 'LKR', timezone: 'Asia/Colombo', features: {} });
    mockPrisma.invoice.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'inv-new', ...data }));
    await service.create(COMPANY_ID, USER_ID, { customerId: 'c1' } as any);
    expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currency: 'LKR' }) }),
    );
  });

  it('respects an explicit currency in the DTO without calling CompanySettingsClient', async () => {
    const settingsMock = module.get(CompanySettingsClient) as any;
    mockPrisma.invoice.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'inv-new', ...data }));
    await service.create(COMPANY_ID, USER_ID, { customerId: 'c1', currency: 'EUR' } as any);
    expect(settingsMock.getSettings).not.toHaveBeenCalled();
    expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currency: 'EUR' }) }),
    );
  });
```

If `invoices.service.spec.ts`'s `beforeEach` doesn't already keep its compiled `TestingModule` in a describe-level `module` variable (the same situation as Task 5, Step 2), promote it the same way: `let module: TestingModule` at the top, assigned inside `beforeEach`.

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter finance-service test -- invoices.service`
Expected: FAIL — `currency` missing from the `create` call's data.

- [ ] **Step 4: Resolve and persist currency in InvoicesService.create**

In `apps/finance-service/src/invoices/invoices.service.ts`, update the `create` method's opening lines:

```ts
  async create(companyId: string, userId: string, dto: CreateInvoiceDto) {
    const { lineItems = [], taxRate = 0, dueDate, dueDays = 30, currency, ...rest } = dto;
    const resolvedCurrency = currency || (await this.companySettings.getSettings(companyId)).currency;
    // Default customer name/email when not provided (e.g. when creating from a quote reference)
    const customerName = rest.customerName ?? 'Unknown Customer';
    const customerEmail = rest.customerEmail ?? 'noreply@example.com';
```

Then in the `this.prisma.invoice.create({ data: { ... } })` call, add `currency: resolvedCurrency,`:

```ts
    const invoice = await this.prisma.invoice.create({
      data: {
        ...rest,
        customerName,
        customerEmail,
        companyId,
        invoiceNumber,
        currency: resolvedCurrency,
        createdByUserId: userId,
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter finance-service test -- invoices.service`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/finance-service/src/invoices/dto/create-invoice.dto.ts apps/finance-service/src/invoices/invoices.service.ts apps/finance-service/src/invoices/invoices.service.spec.ts
git commit -m "feat(finance-service): resolve and persist Invoice.currency on standalone creation"
```

---

### Task 8: finance-service — Payment reports its Invoice's currency

**Files:**
- Modify: `apps/finance-service/src/payments/payments.service.ts`
- Modify: `apps/finance-service/src/payments/payments.service.spec.ts` (create if it doesn't already exist)
- Modify: `apps/finance-service/src/invoices/invoices.service.ts`
- Modify: `apps/finance-service/src/invoices/invoices.service.spec.ts`

**Interfaces:**
- Consumes: `Invoice.currency` (Task 4, populated by Tasks 6-7).
- Produces: every Payment object returned by `PaymentsService.findAll`/`.findOne` and `InvoicesService.recordManualPayment` includes a top-level `currency: string` field — nothing later in this plan consumes it (B2's UI reads it).

- [ ] **Step 1: Check whether payments.service.spec.ts already exists**

Run: `ls apps/finance-service/src/payments/payments.service.spec.ts 2>&1`

If it exists, read it first and follow its existing mock/setup conventions for the new tests below. If it doesn't exist, create it fresh using the plain-constructor-mock pattern (matching `crm-service`'s `company.service.spec.ts` style, since `PaymentsService`'s constructor takes only `PrismaService` — no `Test.createTestingModule` ceremony needed for a single dependency):

```ts
// apps/finance-service/src/payments/payments.service.spec.ts (new file, or extend existing)
import { PaymentsService } from './payments.service';

const mockPrisma: any = {
  payment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn((args: any[]) => Promise.all(args)),
};

describe('PaymentsService — currency', () => {
  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(mockPrisma);
  });

  it('findAll includes each payment\'s invoice currency at the top level', async () => {
    mockPrisma.payment.findMany.mockResolvedValue([
      { id: 'p1', amount: 100, invoice: { invoiceNumber: 'INV-1', customerName: 'C', customerEmail: 'c@x.com', currency: 'LKR' } },
    ]);
    mockPrisma.payment.count.mockResolvedValue(1);
    const result = await service.findAll('co-1', {});
    expect(result.items[0].currency).toBe('LKR');
    expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          invoice: expect.objectContaining({ select: expect.objectContaining({ currency: true }) }),
        }),
      }),
    );
  });

  it('findOne includes the payment\'s invoice currency at the top level', async () => {
    mockPrisma.payment.findFirst.mockResolvedValue({
      id: 'p1', amount: 100,
      invoice: { invoiceNumber: 'INV-1', customerName: 'C', customerEmail: 'c@x.com', total: 100, balanceDue: 0, currency: 'EUR' },
    });
    const result = await service.findOne('co-1', 'p1');
    expect(result.currency).toBe('EUR');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter finance-service test -- payments.service`
Expected: FAIL — `result.items[0].currency` / `result.currency` is `undefined`.

- [ ] **Step 3: Add currency to the invoice select and map it onto the response**

In `apps/finance-service/src/payments/payments.service.ts`, update `findAll`:

```ts
    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              customerName: true,
              customerEmail: true,
              currency: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return {
      items: items.map((p: any) => ({ ...p, currency: p.invoice?.currency })),
      total, page, limit,
    };
```

Update `findOne`:

```ts
  async findOne(companyId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, companyId },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            customerName: true,
            customerEmail: true,
            total: true,
            balanceDue: true,
            currency: true,
          },
        },
      },
    });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return { ...payment, currency: (payment as any).invoice?.currency };
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter finance-service test -- payments.service`
Expected: PASS.

- [ ] **Step 5: Write the failing test for recordManualPayment**

Add to `apps/finance-service/src/invoices/invoices.service.spec.ts`, inside the `describe` block covering `recordManualPayment` (search for it; if none exists, add a new one):

```ts
  it('recordManualPayment attaches the invoice currency to the returned payment', async () => {
    const invoice = { id: 'inv-1', companyId: COMPANY_ID, invoiceNumber: 'INV-1', status: 'SENT', amountPaid: makeDecimal(0), total: makeDecimal(100), currency: 'LKR', customerEmail: null };
    mockPrisma.invoice.findFirst.mockResolvedValue(invoice);
    mockPrisma.payment.count.mockResolvedValue(0);
    mockPrisma.payment.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'p1', ...data }));
    mockPrisma.invoice.update.mockResolvedValue({});
    mockPrisma.$transaction.mockImplementation((args: any[]) => Promise.all(args));

    const [payment] = await service.recordManualPayment(COMPANY_ID, 'inv-1', 50, 'CARD');

    expect(payment.currency).toBe('LKR');
  });
```

(Adjust the mocked `invoice`/`makeDecimal` shape to match whatever helpers `invoices.service.spec.ts` already defines — this file likely has its own `makeInvoice`/`makeDecimal` helpers analogous to `quotes.service.spec.ts`'s; reuse those instead of hand-rolling the object if they exist, keeping `currency: 'LKR'` as the one field this test cares about.)

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm --filter finance-service test -- invoices.service`
Expected: FAIL — `payment.currency` is `undefined`.

- [ ] **Step 7: Attach currency to the returned payment**

In `apps/finance-service/src/invoices/invoices.service.ts::recordManualPayment`, change the final `return [payment];` line to:

```ts
    return [{ ...payment, currency: invoice.currency }];
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm --filter finance-service test -- invoices.service`
Expected: PASS.

- [ ] **Step 9: Full finance-service test suite + build**

Run: `pnpm --filter finance-service test`
Expected: PASS, no regressions.

Run: `pnpm --filter finance-service build`
Expected: compiles cleanly.

- [ ] **Step 10: Commit**

```bash
git add apps/finance-service/src/payments/payments.service.ts apps/finance-service/src/payments/payments.service.spec.ts apps/finance-service/src/invoices/invoices.service.ts apps/finance-service/src/invoices/invoices.service.spec.ts
git commit -m "feat(finance-service): Payment reports its parent invoice's currency"
```

---

### Task 9: both frontends — formatMoney per-value currency override

**Files:**
- Modify: `apps/admin-dashboard/src/lib/format.ts`
- Modify: `apps/customer-portal/src/lib/format.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (frontend-only, additive change).
- Produces: `formatMoney(value, opts?: { decimals?: number; currency?: string })` in both apps — Sub-project B2 calls this with `{ currency: record.currency }` at every list/detail-view call site.

- [ ] **Step 1: Update admin-dashboard's formatMoney**

In `apps/admin-dashboard/src/lib/format.ts`, replace the `formatMoney` function:

```ts
/** "$1,250.00" | "Rs 125,000.00" — tenant-currency money formatter. Pass opts.currency to format a specific record's own currency instead of the tenant default. */
export function formatMoney(
  value: number | string | null | undefined,
  opts: { decimals?: number; currency?: string } = {},
): string {
  const decimals = opts.decimals ?? 2
  const currency = opts.currency || activeCurrency
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(toNumber(value))
  } catch {
    return `$${toNumber(value).toFixed(decimals)}`
  }
}
```

(Only the `opts` type and the new `const currency = ...` line change — the try/catch body is otherwise identical to today.)

- [ ] **Step 2: Update customer-portal's formatMoney**

In `apps/customer-portal/src/lib/format.ts`, make the identical change:

```ts
/** "$1,250.00" | "Rs 125,000.00" — tenant-currency money formatter. Pass opts.currency to format a specific record's own currency instead of the tenant default. */
export function formatMoney(
  value: number | string | null | undefined,
  opts: { decimals?: number; currency?: string } = {},
): string {
  const decimals = opts.decimals ?? 2
  const currency = opts.currency || activeCurrency
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(toNumber(value))
  } catch {
    return `$${toNumber(value).toFixed(decimals)}`
  }
}
```

- [ ] **Step 3: Type-check both apps**

Run: `pnpm --filter admin-dashboard build`
Expected: compiles cleanly — every existing `formatMoney(x)` call site (no second argument) still type-checks since `opts` remains optional with the same optional-decimals shape plus one more optional field.

Run: `pnpm --filter customer-portal build`
Expected: compiles cleanly.

- [ ] **Step 4: Manual verification of the override**

Run (from repo root, using either app's dev environment, or a scratch node script against the compiled output) — the fastest check is a scratch TS file:
```bash
cd apps/admin-dashboard && npx tsx -e "
import { formatMoney, setActiveCompanyFormat } from './src/lib/format';
setActiveCompanyFormat({ currency: 'USD', timezone: 'America/New_York' });
console.log(formatMoney(100));                       // unchanged behavior
console.log(formatMoney(100, { currency: 'LKR' }));   // override
"
```
Expected: first line prints `$100.00`, second line prints `Rs 100.00` — proving the override works and the no-argument path is unchanged. (If `tsx` isn't available as a dev dependency, `ts-node` or a quick temporary `.ts` file compiled via the existing `tsc` toolchain works equally well — the point is confirming both code paths at runtime, not the specific runner.)

- [ ] **Step 5: Commit**

```bash
git add apps/admin-dashboard/src/lib/format.ts apps/customer-portal/src/lib/format.ts
git commit -m "feat(format): add per-value currency override to formatMoney in both frontends"
```

---

## Self-Review Notes

- **Spec coverage:** Data model (Job/Quote/Invoice/RecurringSchedule columns + backfill) → Tasks 2, 4. Quote→Invoice inheritance → Task 6. DTOs + tenant-default fallback → Tasks 3, 5, 7 (job-service needed a new `CrmClient.getDefaultCurrency`, Task 1, since — discovered during exploration — job-service had no existing cross-service settings client at all, unlike finance-service). Payment read-path → Task 8. `formatMoney` core → Task 9. Migration verification → embedded in Tasks 2 and 4's steps. RecurringSchedule explicitly gets schema-only treatment (Task 4 adds the column; no task adds DTO/service wiring for it, matching the spec's explicit scope boundary).
- **Type consistency verified:** every DTO field added (`CreateJobDto.currency`, `UpdateJobDto.currency`, `CreateQuoteDto.currency`, `UpdateQuoteDto.currency`, `CreateInvoiceDto.currency`) is `string | undefined`, matching the Prisma `currency: String` column type and the `resolvedCurrency` pattern (`currency || await ....getSettings(companyId)).currency` / `getDefaultCurrency(companyId)`) used consistently across Tasks 3, 5, and 7.
- **A real gap found during exploration, not assumed from the spec:** job-service has no `CompanySettingsClient`-equivalent at all (the spec's Section 3 assumed one existed, mirroring finance-service) — Task 1 builds the missing piece (`CrmClient.getDefaultCurrency`) as a prerequisite before Task 3 can resolve a job's default currency the same way finance-service resolves a quote's or invoice's.
- **Test-module ceremony flagged, not glossed over:** Tasks 3, 5, and 7 each call out the mechanical-but-real step of adding a new provider mock to every existing `TestingModule` setup that constructs the service under test (job-service's `JobsService` has four separate setups across the spec file) — skipping this would leave the plan's own new tests failing on a DI resolution error unrelated to the actual behavior being tested.
