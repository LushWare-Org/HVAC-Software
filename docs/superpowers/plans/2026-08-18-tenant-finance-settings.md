# Tenant Finance Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give tenants a Settings > Finance tab to manage a tenant-editable currency list, named tax-rate presets, and named payment-terms presets — the configuration foundation that Sub-project B will later wire into Quote/Invoice/Customer/Job/Payment forms.

**Architecture:** One new column (`Company.enabledCurrencies`) and two new tables (`TaxRatePreset`, `PaymentTermsPreset`) in crm-service's `crm` schema, applied via the repo's raw-SQL migration runner (`scripts/apply-migrations.mjs`) and mirrored in `schema.prisma` for the generated client. CRUD lives in the existing `company` module (`CompanyController`/`CompanyService`), guarded the same way every other company-wide mutation already is (`JwtAuthGuard` + `RolesGuard` + `@Roles(...)`). The admin-dashboard gets a new "Finance" Settings tab consuming three new hook pairs in `useSettings.ts`.

**Tech Stack:** NestJS 10 + Prisma (crm-service), raw-SQL migration runner (`scripts/apply-migrations.mjs`), React 19 + TanStack Query (admin-dashboard), Jest for backend tests.

**Spec:** `docs/superpowers/specs/2026-08-18-tenant-finance-settings-design.md`

## Global Constraints

- Currency list is built from a static ISO 4217 reference set (code/name/symbol) — no custom currency creation.
- No exchange-rate conversion anywhere — currencies are display labels only.
- Exactly one `TaxRatePreset` and one `PaymentTermsPreset` per company may have `isDefault: true`; that row must also be `isActive: true`. Deactivating/deleting the current default is rejected (409) until another preset is promoted first.
- `Company.currency` must always be a member of `Company.enabledCurrencies`; `enabledCurrencies` must never be empty.
- Mutating endpoints (`PATCH /crm/company/currencies`, all tax-rate/payment-terms writes) require `Role.SUPER_ADMIN` or `Role.COMPANY_ADMIN`. Read endpoints are open to any authenticated staff role.
- No changes to Customer, Job, Quote, Invoice, Payment, or RecurringSchedule schemas/forms in this plan — that is Sub-project B.
- Money/rate encoding matches the codebase convention already in finance-service: `taxRate`/`rate` as a decimal fraction (`0.15` = 15%), stored `Decimal(5,4)`.

---

### Task 1: Shared types for finance settings

**Files:**
- Create: `packages/types/src/finance-settings.ts`
- Modify: `packages/types/src/index.ts` (add `export * from './finance-settings';`)

**Interfaces:**
- Produces: `CurrencySettings { enabled: string[]; default: string }`, `TaxRatePreset { id, companyId, name, rate: number, isDefault: boolean, isActive: boolean, sortOrder: number, createdAt: string, updatedAt: string }`, `PaymentTermsPreset { id, companyId, name, days: number, isDefault: boolean, isActive: boolean, sortOrder: number, createdAt: string, updatedAt: string }` — every later task (crm-service DTOs, admin-dashboard hooks) imports these from `@tscrm/types`.

- [ ] **Step 1: Create the types file**

```ts
// packages/types/src/finance-settings.ts

/** Tenant's selectable currencies + which one is the default. GET/PATCH /crm/company/currencies. */
export interface CurrencySettings {
  /** ISO 4217 codes this tenant can pick from anywhere a currency is selected. */
  enabled: string[];
  /** Must be a member of `enabled`. */
  default: string;
}

/** A tenant-managed, named tax rate. GET/POST/PATCH/DELETE /crm/company/tax-rates. */
export interface TaxRatePreset {
  id: string;
  companyId: string;
  name: string;
  /** Decimal fraction, e.g. 0.15 for 15%. */
  rate: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** A tenant-managed, named payment-terms option. GET/POST/PATCH/DELETE /crm/company/payment-terms. */
export interface PaymentTermsPreset {
  id: string;
  companyId: string;
  name: string;
  /** Days from issue date until due, e.g. 0 = "Due on Receipt", 30 = "Net 30". */
  days: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Export it from the package index**

In `packages/types/src/index.ts`, alongside the existing `export * from './company-settings';` line, add:

```ts
export * from './finance-settings';
```

- [ ] **Step 3: Build the package**

Run: `pnpm --filter @tscrm/types build`
Expected: compiles cleanly, `packages/types/dist/finance-settings.js` and `.d.ts` exist.

- [ ] **Step 4: Commit**

```bash
git add packages/types/src/finance-settings.ts packages/types/src/index.ts packages/types/dist
git commit -m "feat(types): add CurrencySettings, TaxRatePreset, PaymentTermsPreset shared types"
```

---

### Task 2: Prisma schema + migration for crm-service

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma` (Company model + two new models)
- Modify: `scripts/apply-migrations.mjs` (append one new migration entry)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: Prisma Client types `Company.enabledCurrencies: string[]`, `PrismaClient.taxRatePreset`, `PrismaClient.paymentTermsPreset` with fields matching `TaxRatePreset`/`PaymentTermsPreset` from Task 1 (id, companyId, name, rate|days, isDefault, isActive, sortOrder, createdAt, updatedAt) — Tasks 3-5 call these directly.

- [ ] **Step 1: Add `enabledCurrencies` to the `Company` model and the two new models**

In `apps/crm-service/prisma/schema.prisma`, inside `model Company { ... }`, add the new column next to the existing `currency` field:

```prisma
  currency    String   @default("USD")
  enabledCurrencies String[] @default(["USD"])
  timezone    String   @default("America/New_York")
```

And add two relation fields to `Company`, near the other relation lists (e.g. next to `bookings`):

```prisma
  taxRatePresets      TaxRatePreset[]
  paymentTermsPresets PaymentTermsPreset[]
```

Then add the two new models anywhere after `Company` in the file (e.g. right after the `Company` model closes):

```prisma
// ---- Tenant-managed tax rate presets (Settings > Finance) ----
model TaxRatePreset {
  id          String   @id @default(uuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String
  rate        Decimal  @db.Decimal(5, 4)
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([companyId, isActive])
  @@map("tax_rate_presets")
}

// ---- Tenant-managed payment terms presets (Settings > Finance) ----
model PaymentTermsPreset {
  id          String   @id @default(uuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String
  days        Int
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([companyId, isActive])
  @@map("payment_terms_presets")
}
```

- [ ] **Step 2: Append the migration entry**

In `scripts/apply-migrations.mjs`, find the `migrations` array (the `{ schema: 'crm', name: '20260815000000_add_project_template_status', ... }` entry is the most recent `crm` one) and add a new entry immediately before the closing `];` of the array:

```js
  {
    schema: 'crm',
    name: '20260818000000_add_tenant_finance_settings',
    sql: `
ALTER TABLE "crm"."companies" ADD COLUMN IF NOT EXISTS "enabledCurrencies" TEXT[] NOT NULL DEFAULT ARRAY['USD'];
UPDATE "crm"."companies" SET "enabledCurrencies" = ARRAY[currency] WHERE NOT (currency = ANY("enabledCurrencies"));

CREATE TABLE IF NOT EXISTS "crm"."tax_rate_presets" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rate" DECIMAL(5,4) NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tax_rate_presets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "tax_rate_presets_companyId_isActive_idx" ON "crm"."tax_rate_presets"("companyId", "isActive");

CREATE TABLE IF NOT EXISTS "crm"."payment_terms_presets" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "days" INTEGER NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payment_terms_presets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "payment_terms_presets_companyId_isActive_idx" ON "crm"."payment_terms_presets"("companyId", "isActive");

INSERT INTO "crm"."tax_rate_presets" ("id", "companyId", "name", "rate", "isDefault", "isActive", "updatedAt")
SELECT gen_random_uuid()::text, "id", 'No Tax', 0, true, true, NOW()
FROM "crm"."companies" c
WHERE NOT EXISTS (SELECT 1 FROM "crm"."tax_rate_presets" p WHERE p."companyId" = c."id");

INSERT INTO "crm"."payment_terms_presets" ("id", "companyId", "name", "days", "isDefault", "isActive", "updatedAt")
SELECT gen_random_uuid()::text, "id", 'Net 30', 30, true, true, NOW()
FROM "crm"."companies" c
WHERE NOT EXISTS (SELECT 1 FROM "crm"."payment_terms_presets" p WHERE p."companyId" = c."id");
    `.trim(),
  },
```

- [ ] **Step 3: Apply the migration**

Run: `node scripts/apply-migrations.mjs`
Expected: `[apply] 20260818000000_add_tenant_finance_settings …` then `[ok]` under `=== Schema: crm ===`.

- [ ] **Step 4: Regenerate the Prisma client**

Run: `pnpm --filter crm-service prisma:generate`
Expected: completes with no errors; `apps/crm-service/src/prisma/generated` now types `taxRatePreset`/`paymentTermsPreset` on the client and `enabledCurrencies` on `Company`.

- [ ] **Step 5: Verify the backfill**

Run: `pnpm --filter crm-service exec node -e "const {PrismaClient}=require('./src/prisma/generated');const p=new PrismaClient();(async()=>{const co=await p.company.findMany({select:{id:true,currency:true,enabledCurrencies:true}});const tr=await p.taxRatePreset.count();const pt=await p.paymentTermsPreset.count();console.log(co);console.log('tax presets:',tr,'terms presets:',pt);await p.\$disconnect();})();"`
Expected: every company's `currency` appears inside its own `enabledCurrencies` array; `tax presets`/`terms presets` counts are each ≥ the number of companies.

- [ ] **Step 6: Commit**

```bash
git add apps/crm-service/prisma/schema.prisma scripts/apply-migrations.mjs apps/crm-service/src/prisma/generated
git commit -m "feat(crm-service): add enabledCurrencies column + TaxRatePreset/PaymentTermsPreset tables"
```

---

### Task 3: CompanyService — currency settings methods

**Files:**
- Modify: `apps/crm-service/src/company/company.service.ts`
- Modify: `apps/crm-service/src/company/company.service.spec.ts`

**Interfaces:**
- Consumes: `CurrencySettings` from `@tscrm/types` (Task 1); `this.prisma.company` (Prisma Client, Task 2).
- Produces: `CompanyService.getCurrencies(companyId: string): Promise<CurrencySettings>` and `CompanyService.updateCurrencies(companyId: string, data: CurrencySettings): Promise<CurrencySettings>` — Task 6 (controller) calls these by exact name.

- [ ] **Step 1: Write the failing tests**

Append to `apps/crm-service/src/company/company.service.spec.ts` (add `company.update` and `company.findUnique` mock support already exists via `prismaMock.company`; extend the mock object at the top of the file first):

```ts
// add to the prismaMock object at the top of the file, inside `company: { ... }`
    update: jest.fn(),
```

Then add a new `describe` block at the bottom of the file:

```ts
describe('CompanyService currencies', () => {
  let service: CompanyService;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.tableExists.mockResolvedValue(true);
    prismaMock.columnExists.mockResolvedValue(true);
    service = new CompanyService(prismaMock as never);
  });

  it('getCurrencies returns enabled list + default', async () => {
    prismaMock.company.findUnique.mockResolvedValue({ currency: 'USD', enabledCurrencies: ['USD', 'LKR'] });
    const result = await service.getCurrencies('co-1');
    expect(result).toEqual({ enabled: ['USD', 'LKR'], default: 'USD' });
  });

  it('getCurrencies throws NotFound for unknown company', async () => {
    prismaMock.company.findUnique.mockResolvedValue(null);
    await expect(service.getCurrencies('nope')).rejects.toThrow(NotFoundException);
  });

  it('updateCurrencies rejects when enabled list is empty', async () => {
    await expect(
      service.updateCurrencies('co-1', { enabled: [], default: 'USD' }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.company.update).not.toHaveBeenCalled();
  });

  it('updateCurrencies rejects when default is not in enabled list', async () => {
    await expect(
      service.updateCurrencies('co-1', { enabled: ['USD'], default: 'LKR' }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.company.update).not.toHaveBeenCalled();
  });

  it('updateCurrencies saves and returns the new settings', async () => {
    prismaMock.company.update.mockResolvedValue({ currency: 'LKR', enabledCurrencies: ['USD', 'LKR'] });
    const result = await service.updateCurrencies('co-1', { enabled: ['USD', 'LKR'], default: 'LKR' });
    expect(prismaMock.company.update).toHaveBeenCalledWith({
      where: { id: 'co-1' },
      data: { currency: 'LKR', enabledCurrencies: ['USD', 'LKR'] },
      select: { currency: true, enabledCurrencies: true },
    });
    expect(result).toEqual({ enabled: ['USD', 'LKR'], default: 'LKR' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter crm-service test -- company.service`
Expected: FAIL — `service.getCurrencies is not a function` / `service.updateCurrencies is not a function`.

- [ ] **Step 3: Implement the methods**

In `apps/crm-service/src/company/company.service.ts`, add the import and two methods. First add to the top imports:

```ts
import { CompanySettings, CurrencySettings } from '@tscrm/types';
```

Then add these two methods to the `CompanyService` class (e.g. right after `getSettings`):

```ts
  async getCurrencies(companyId: string): Promise<CurrencySettings> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { currency: true, enabledCurrencies: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    return { enabled: company.enabledCurrencies, default: company.currency };
  }

  async updateCurrencies(companyId: string, data: CurrencySettings): Promise<CurrencySettings> {
    if (!data.enabled || data.enabled.length === 0) {
      throw new BadRequestException('enabledCurrencies cannot be empty');
    }
    if (!data.enabled.includes(data.default)) {
      throw new BadRequestException('default currency must be one of the enabled currencies');
    }

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: { currency: data.default, enabledCurrencies: data.enabled },
      select: { currency: true, enabledCurrencies: true },
    });
    return { enabled: updated.enabledCurrencies, default: updated.currency };
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter crm-service test -- company.service`
Expected: PASS — all `CompanyService currencies` tests green, plus the pre-existing `CompanyService settings` tests still green.

- [ ] **Step 5: Commit**

```bash
git add apps/crm-service/src/company/company.service.ts apps/crm-service/src/company/company.service.spec.ts
git commit -m "feat(crm-service): add CompanyService.getCurrencies/updateCurrencies"
```

---

### Task 4: CompanyService — tax rate preset CRUD

**Files:**
- Modify: `apps/crm-service/src/company/company.service.ts`
- Modify: `apps/crm-service/src/company/company.service.spec.ts`
- Create: `apps/crm-service/src/company/dto/tax-rate-preset.dto.ts`

**Interfaces:**
- Consumes: `TaxRatePreset` from `@tscrm/types` (Task 1); `this.prisma.taxRatePreset` (Task 2).
- Produces: `CompanyService.listTaxRates(companyId): Promise<TaxRatePreset[]>`, `.createTaxRate(companyId, dto: CreateTaxRatePresetDto): Promise<TaxRatePreset>`, `.updateTaxRate(companyId, id, dto: UpdateTaxRatePresetDto): Promise<TaxRatePreset>`, `.deleteTaxRate(companyId, id): Promise<void>` — Task 6 controller calls these by exact name; DTO class names `CreateTaxRatePresetDto`/`UpdateTaxRatePresetDto` are imported by Task 6.

- [ ] **Step 1: Create the DTOs**

```ts
// apps/crm-service/src/company/dto/tax-rate-preset.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateTaxRatePresetDto {
  @ApiProperty({ example: 'VAT 15%' })
  @IsString()
  @MaxLength(60)
  name!: string;

  @ApiProperty({ example: 0.15, description: 'Decimal fraction, e.g. 0.15 for 15%' })
  @IsNumber()
  @Min(0)
  @Max(1)
  rate!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateTaxRatePresetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(1) rate?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
}
```

- [ ] **Step 2: Write the failing tests**

Add to `apps/crm-service/src/company/company.service.spec.ts`, extend `prismaMock` at the top with a new `taxRatePreset` client stub:

```ts
// add alongside the `company: { ... }` block in prismaMock
  taxRatePreset: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((fn: any) => fn(prismaMock)),
```

Then add:

```ts
describe('CompanyService tax rates', () => {
  let service: CompanyService;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock));
    service = new CompanyService(prismaMock as never);
  });

  it('listTaxRates returns presets ordered by sortOrder', async () => {
    prismaMock.taxRatePreset.findMany.mockResolvedValue([{ id: 't1', sortOrder: 0 }]);
    const result = await service.listTaxRates('co-1');
    expect(prismaMock.taxRatePreset.findMany).toHaveBeenCalledWith({
      where: { companyId: 'co-1' },
      orderBy: { sortOrder: 'asc' },
    });
    expect(result).toEqual([{ id: 't1', sortOrder: 0 }]);
  });

  it('createTaxRate unsets the prior default when isDefault:true', async () => {
    prismaMock.taxRatePreset.create.mockResolvedValue({ id: 't2', isDefault: true });
    await service.createTaxRate('co-1', { name: 'VAT 15%', rate: 0.15, isDefault: true });
    expect(prismaMock.taxRatePreset.updateMany).toHaveBeenCalledWith({
      where: { companyId: 'co-1', isDefault: true },
      data: { isDefault: false },
    });
    expect(prismaMock.taxRatePreset.create).toHaveBeenCalledWith({
      data: { companyId: 'co-1', name: 'VAT 15%', rate: 0.15, isDefault: true },
    });
  });

  it('createTaxRate does not touch other defaults when isDefault is falsy', async () => {
    prismaMock.taxRatePreset.create.mockResolvedValue({ id: 't3', isDefault: false });
    await service.createTaxRate('co-1', { name: 'No Tax', rate: 0 });
    expect(prismaMock.taxRatePreset.updateMany).not.toHaveBeenCalled();
  });

  it('updateTaxRate rejects deactivating the current default', async () => {
    prismaMock.taxRatePreset.findUnique.mockResolvedValue({ id: 't1', companyId: 'co-1', isDefault: true });
    await expect(
      service.updateTaxRate('co-1', 't1', { isActive: false }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.taxRatePreset.update).not.toHaveBeenCalled();
  });

  it('updateTaxRate rejects unsetting isDefault with no replacement', async () => {
    prismaMock.taxRatePreset.findUnique.mockResolvedValue({ id: 't1', companyId: 'co-1', isDefault: true });
    await expect(
      service.updateTaxRate('co-1', 't1', { isDefault: false }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateTaxRate promotes a new default and unsets the old one', async () => {
    prismaMock.taxRatePreset.findUnique.mockResolvedValue({ id: 't2', companyId: 'co-1', isDefault: false });
    prismaMock.taxRatePreset.update.mockResolvedValue({ id: 't2', isDefault: true });
    await service.updateTaxRate('co-1', 't2', { isDefault: true });
    expect(prismaMock.taxRatePreset.updateMany).toHaveBeenCalledWith({
      where: { companyId: 'co-1', isDefault: true },
      data: { isDefault: false },
    });
    expect(prismaMock.taxRatePreset.update).toHaveBeenCalledWith({
      where: { id: 't2' },
      data: { isDefault: true },
    });
  });

  it('updateTaxRate throws NotFound for a preset outside the caller company', async () => {
    prismaMock.taxRatePreset.findUnique.mockResolvedValue({ id: 't1', companyId: 'co-OTHER', isDefault: false });
    await expect(
      service.updateTaxRate('co-1', 't1', { name: 'x' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deleteTaxRate rejects deleting the current default', async () => {
    prismaMock.taxRatePreset.findUnique.mockResolvedValue({ id: 't1', companyId: 'co-1', isDefault: true });
    await expect(service.deleteTaxRate('co-1', 't1')).rejects.toThrow(BadRequestException);
    expect(prismaMock.taxRatePreset.delete).not.toHaveBeenCalled();
  });

  it('deleteTaxRate deletes a non-default preset', async () => {
    prismaMock.taxRatePreset.findUnique.mockResolvedValue({ id: 't2', companyId: 'co-1', isDefault: false });
    await service.deleteTaxRate('co-1', 't2');
    expect(prismaMock.taxRatePreset.delete).toHaveBeenCalledWith({ where: { id: 't2' } });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter crm-service test -- company.service`
Expected: FAIL — `service.listTaxRates is not a function` (and siblings).

- [ ] **Step 4: Implement the methods**

Add to the top imports of `company.service.ts`:

```ts
import { TaxRatePreset } from '@tscrm/types';
import { CreateTaxRatePresetDto, UpdateTaxRatePresetDto } from './dto/tax-rate-preset.dto';
```

Add these methods to `CompanyService`:

```ts
  async listTaxRates(companyId: string): Promise<TaxRatePreset[]> {
    const rows = await this.prisma.taxRatePreset.findMany({
      where: { companyId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows as unknown as TaxRatePreset[];
  }

  async createTaxRate(companyId: string, dto: CreateTaxRatePresetDto): Promise<TaxRatePreset> {
    if (dto.isDefault) {
      await this.prisma.taxRatePreset.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }
    const created = await this.prisma.taxRatePreset.create({
      data: { companyId, name: dto.name, rate: dto.rate, isDefault: !!dto.isDefault },
    });
    return created as unknown as TaxRatePreset;
  }

  private async findTaxRateOrThrow(companyId: string, id: string) {
    const preset = await this.prisma.taxRatePreset.findUnique({ where: { id } });
    if (!preset || preset.companyId !== companyId) {
      throw new NotFoundException('Tax rate preset not found');
    }
    return preset;
  }

  async updateTaxRate(companyId: string, id: string, dto: UpdateTaxRatePresetDto): Promise<TaxRatePreset> {
    const existing = await this.findTaxRateOrThrow(companyId, id);

    if (existing.isDefault && (dto.isActive === false || dto.isDefault === false)) {
      throw new BadRequestException(
        'Cannot deactivate or unset the default tax rate — set another preset as default first',
      );
    }

    if (dto.isDefault === true) {
      await this.prisma.taxRatePreset.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.taxRatePreset.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.rate !== undefined ? { rate: dto.rate } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
    return updated as unknown as TaxRatePreset;
  }

  async deleteTaxRate(companyId: string, id: string): Promise<void> {
    const existing = await this.findTaxRateOrThrow(companyId, id);
    if (existing.isDefault) {
      throw new BadRequestException(
        'Cannot delete the default tax rate — set another preset as default first',
      );
    }
    await this.prisma.taxRatePreset.delete({ where: { id } });
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter crm-service test -- company.service`
Expected: PASS — all `CompanyService tax rates` tests green.

- [ ] **Step 6: Commit**

```bash
git add apps/crm-service/src/company/company.service.ts apps/crm-service/src/company/company.service.spec.ts apps/crm-service/src/company/dto/tax-rate-preset.dto.ts
git commit -m "feat(crm-service): add tax rate preset CRUD with single-default enforcement"
```

---

### Task 5: CompanyService — payment terms preset CRUD

**Files:**
- Modify: `apps/crm-service/src/company/company.service.ts`
- Modify: `apps/crm-service/src/company/company.service.spec.ts`
- Create: `apps/crm-service/src/company/dto/payment-terms-preset.dto.ts`

**Interfaces:**
- Consumes: `PaymentTermsPreset` from `@tscrm/types` (Task 1); `this.prisma.paymentTermsPreset` (Task 2).
- Produces: `CompanyService.listPaymentTerms(companyId): Promise<PaymentTermsPreset[]>`, `.createPaymentTerms(companyId, dto: CreatePaymentTermsPresetDto): Promise<PaymentTermsPreset>`, `.updatePaymentTerms(companyId, id, dto: UpdatePaymentTermsPresetDto): Promise<PaymentTermsPreset>`, `.deletePaymentTerms(companyId, id): Promise<void>` — Task 6 controller calls these by exact name.

This task mirrors Task 4 exactly, with `days: number` (0-365) replacing `rate: number` (0-1).

- [ ] **Step 1: Create the DTOs**

```ts
// apps/crm-service/src/company/dto/payment-terms-preset.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreatePaymentTermsPresetDto {
  @ApiProperty({ example: 'Net 30' })
  @IsString()
  @MaxLength(60)
  name!: string;

  @ApiProperty({ example: 30, description: 'Days from issue date until due; 0 = Due on Receipt' })
  @IsInt()
  @Min(0)
  @Max(365)
  days!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePaymentTermsPresetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(365) days?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
}
```

- [ ] **Step 2: Write the failing tests**

Add to `apps/crm-service/src/company/company.service.spec.ts`, extend `prismaMock` at the top with:

```ts
// add alongside taxRatePreset in prismaMock
  paymentTermsPreset: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
```

Then add:

```ts
describe('CompanyService payment terms', () => {
  let service: CompanyService;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock));
    service = new CompanyService(prismaMock as never);
  });

  it('listPaymentTerms returns presets ordered by sortOrder', async () => {
    prismaMock.paymentTermsPreset.findMany.mockResolvedValue([{ id: 'p1', sortOrder: 0 }]);
    const result = await service.listPaymentTerms('co-1');
    expect(prismaMock.paymentTermsPreset.findMany).toHaveBeenCalledWith({
      where: { companyId: 'co-1' },
      orderBy: { sortOrder: 'asc' },
    });
    expect(result).toEqual([{ id: 'p1', sortOrder: 0 }]);
  });

  it('createPaymentTerms unsets the prior default when isDefault:true', async () => {
    prismaMock.paymentTermsPreset.create.mockResolvedValue({ id: 'p2', isDefault: true });
    await service.createPaymentTerms('co-1', { name: 'Net 15', days: 15, isDefault: true });
    expect(prismaMock.paymentTermsPreset.updateMany).toHaveBeenCalledWith({
      where: { companyId: 'co-1', isDefault: true },
      data: { isDefault: false },
    });
    expect(prismaMock.paymentTermsPreset.create).toHaveBeenCalledWith({
      data: { companyId: 'co-1', name: 'Net 15', days: 15, isDefault: true },
    });
  });

  it('updatePaymentTerms rejects deactivating the current default', async () => {
    prismaMock.paymentTermsPreset.findUnique.mockResolvedValue({ id: 'p1', companyId: 'co-1', isDefault: true });
    await expect(
      service.updatePaymentTerms('co-1', 'p1', { isActive: false }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updatePaymentTerms promotes a new default and unsets the old one', async () => {
    prismaMock.paymentTermsPreset.findUnique.mockResolvedValue({ id: 'p2', companyId: 'co-1', isDefault: false });
    prismaMock.paymentTermsPreset.update.mockResolvedValue({ id: 'p2', isDefault: true });
    await service.updatePaymentTerms('co-1', 'p2', { isDefault: true });
    expect(prismaMock.paymentTermsPreset.updateMany).toHaveBeenCalledWith({
      where: { companyId: 'co-1', isDefault: true },
      data: { isDefault: false },
    });
  });

  it('updatePaymentTerms throws NotFound for a preset outside the caller company', async () => {
    prismaMock.paymentTermsPreset.findUnique.mockResolvedValue({ id: 'p1', companyId: 'co-OTHER', isDefault: false });
    await expect(
      service.updatePaymentTerms('co-1', 'p1', { name: 'x' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletePaymentTerms rejects deleting the current default', async () => {
    prismaMock.paymentTermsPreset.findUnique.mockResolvedValue({ id: 'p1', companyId: 'co-1', isDefault: true });
    await expect(service.deletePaymentTerms('co-1', 'p1')).rejects.toThrow(BadRequestException);
  });

  it('deletePaymentTerms deletes a non-default preset', async () => {
    prismaMock.paymentTermsPreset.findUnique.mockResolvedValue({ id: 'p2', companyId: 'co-1', isDefault: false });
    await service.deletePaymentTerms('co-1', 'p2');
    expect(prismaMock.paymentTermsPreset.delete).toHaveBeenCalledWith({ where: { id: 'p2' } });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter crm-service test -- company.service`
Expected: FAIL — `service.listPaymentTerms is not a function` (and siblings).

- [ ] **Step 4: Implement the methods**

Add to the top imports of `company.service.ts`:

```ts
import { PaymentTermsPreset } from '@tscrm/types';
import { CreatePaymentTermsPresetDto, UpdatePaymentTermsPresetDto } from './dto/payment-terms-preset.dto';
```

Add these methods to `CompanyService`:

```ts
  async listPaymentTerms(companyId: string): Promise<PaymentTermsPreset[]> {
    const rows = await this.prisma.paymentTermsPreset.findMany({
      where: { companyId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows as unknown as PaymentTermsPreset[];
  }

  async createPaymentTerms(companyId: string, dto: CreatePaymentTermsPresetDto): Promise<PaymentTermsPreset> {
    if (dto.isDefault) {
      await this.prisma.paymentTermsPreset.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }
    const created = await this.prisma.paymentTermsPreset.create({
      data: { companyId, name: dto.name, days: dto.days, isDefault: !!dto.isDefault },
    });
    return created as unknown as PaymentTermsPreset;
  }

  private async findPaymentTermsOrThrow(companyId: string, id: string) {
    const preset = await this.prisma.paymentTermsPreset.findUnique({ where: { id } });
    if (!preset || preset.companyId !== companyId) {
      throw new NotFoundException('Payment terms preset not found');
    }
    return preset;
  }

  async updatePaymentTerms(companyId: string, id: string, dto: UpdatePaymentTermsPresetDto): Promise<PaymentTermsPreset> {
    const existing = await this.findPaymentTermsOrThrow(companyId, id);

    if (existing.isDefault && (dto.isActive === false || dto.isDefault === false)) {
      throw new BadRequestException(
        'Cannot deactivate or unset the default payment terms — set another preset as default first',
      );
    }

    if (dto.isDefault === true) {
      await this.prisma.paymentTermsPreset.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.paymentTermsPreset.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.days !== undefined ? { days: dto.days } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
    return updated as unknown as PaymentTermsPreset;
  }

  async deletePaymentTerms(companyId: string, id: string): Promise<void> {
    const existing = await this.findPaymentTermsOrThrow(companyId, id);
    if (existing.isDefault) {
      throw new BadRequestException(
        'Cannot delete the default payment terms — set another preset as default first',
      );
    }
    await this.prisma.paymentTermsPreset.delete({ where: { id } });
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter crm-service test -- company.service`
Expected: PASS — all `CompanyService payment terms` tests green, and the full `company.service.spec.ts` suite (currencies + tax rates + payment terms + pre-existing settings tests) passes.

- [ ] **Step 6: Commit**

```bash
git add apps/crm-service/src/company/company.service.ts apps/crm-service/src/company/company.service.spec.ts apps/crm-service/src/company/dto/payment-terms-preset.dto.ts
git commit -m "feat(crm-service): add payment terms preset CRUD with single-default enforcement"
```

---

### Task 6: CompanyController — wire up endpoints with RBAC

**Files:**
- Modify: `apps/crm-service/src/company/company.controller.ts`
- Create: `apps/crm-service/src/company/company.controller.spec.ts`

**Interfaces:**
- Consumes: every `CompanyService` method from Tasks 3-5, plus DTO classes `CreateTaxRatePresetDto`/`UpdateTaxRatePresetDto` (Task 4) and `CreatePaymentTermsPresetDto`/`UpdatePaymentTermsPresetDto` (Task 5), plus `CurrencySettings` (Task 1).
- Produces: the full route table below — no later task in this plan consumes these routes directly (Sub-project B will).

Route table (all under the existing `@Controller('company')`):

```
GET    /crm/company/currencies                any authenticated role
PATCH  /crm/company/currencies                 Role.SUPER_ADMIN, Role.COMPANY_ADMIN
GET    /crm/company/tax-rates                  any authenticated role
POST   /crm/company/tax-rates                  Role.SUPER_ADMIN, Role.COMPANY_ADMIN
PATCH  /crm/company/tax-rates/:id              Role.SUPER_ADMIN, Role.COMPANY_ADMIN
DELETE /crm/company/tax-rates/:id              Role.SUPER_ADMIN, Role.COMPANY_ADMIN
GET    /crm/company/payment-terms              any authenticated role
POST   /crm/company/payment-terms              Role.SUPER_ADMIN, Role.COMPANY_ADMIN
PATCH  /crm/company/payment-terms/:id          Role.SUPER_ADMIN, Role.COMPANY_ADMIN
DELETE /crm/company/payment-terms/:id          Role.SUPER_ADMIN, Role.COMPANY_ADMIN
```

- [ ] **Step 1: Write the failing controller test**

```ts
// apps/crm-service/src/company/company.controller.spec.ts
import { ForbiddenException } from '@nestjs/common';
import { CompanyController } from './company.controller';

const serviceMock = {
  getCurrencies: jest.fn(),
  updateCurrencies: jest.fn(),
  listTaxRates: jest.fn(),
  createTaxRate: jest.fn(),
  updateTaxRate: jest.fn(),
  deleteTaxRate: jest.fn(),
  listPaymentTerms: jest.fn(),
  createPaymentTerms: jest.fn(),
  updatePaymentTerms: jest.fn(),
  deletePaymentTerms: jest.fn(),
};

const adminUser = { companyId: 'co-1', role: 'company_admin' } as never;
const techUser = { companyId: 'co-1', role: 'technician' } as never;

describe('CompanyController finance settings routes', () => {
  let controller: CompanyController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CompanyController(serviceMock as never);
  });

  it('getCurrencies delegates to the service', async () => {
    serviceMock.getCurrencies.mockResolvedValue({ enabled: ['USD'], default: 'USD' });
    const result = await controller.getCurrencies(adminUser);
    expect(serviceMock.getCurrencies).toHaveBeenCalledWith('co-1');
    expect(result).toEqual({ enabled: ['USD'], default: 'USD' });
  });

  it('updateCurrencies delegates to the service', async () => {
    await controller.updateCurrencies(adminUser, { enabled: ['USD', 'LKR'], default: 'LKR' });
    expect(serviceMock.updateCurrencies).toHaveBeenCalledWith('co-1', { enabled: ['USD', 'LKR'], default: 'LKR' });
  });

  it('createTaxRate delegates to the service', async () => {
    await controller.createTaxRate(adminUser, { name: 'VAT 15%', rate: 0.15 });
    expect(serviceMock.createTaxRate).toHaveBeenCalledWith('co-1', { name: 'VAT 15%', rate: 0.15 });
  });

  it('deleteTaxRate delegates to the service', async () => {
    await controller.deleteTaxRate(adminUser, 't1');
    expect(serviceMock.deleteTaxRate).toHaveBeenCalledWith('co-1', 't1');
  });

  it('createPaymentTerms delegates to the service', async () => {
    await controller.createPaymentTerms(adminUser, { name: 'Net 15', days: 15 });
    expect(serviceMock.createPaymentTerms).toHaveBeenCalledWith('co-1', { name: 'Net 15', days: 15 });
  });

  it('deletePaymentTerms delegates to the service', async () => {
    await controller.deletePaymentTerms(adminUser, 'p1');
    expect(serviceMock.deletePaymentTerms).toHaveBeenCalledWith('co-1', 'p1');
  });
});
```

Note: this spec exercises the controller methods directly (unit-level, matching this file's sibling `company.service.spec.ts` style) rather than booting the full Nest HTTP pipeline — `RolesGuard` + `@Roles(...)` enforcement itself is a well-covered existing pattern (see `customers.controller.ts`) applied here via decorators, not custom logic, so it doesn't need a redundant integration test in this task.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter crm-service test -- company.controller`
Expected: FAIL — `controller.getCurrencies is not a function` (and siblings).

- [ ] **Step 3: Implement the controller**

Replace the full contents of `apps/crm-service/src/company/company.controller.ts`:

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { AuthUser, CurrencySettings, Role } from '@tscrm/types';
import { CompanyService } from './company.service';
import { CreateTaxRatePresetDto, UpdateTaxRatePresetDto } from './dto/tax-rate-preset.dto';
import { CreatePaymentTermsPresetDto, UpdatePaymentTermsPresetDto } from './dto/payment-terms-preset.dto';

@ApiTags('Company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get tenant settings (currency, timezone, features, branding)' })
  getSettings(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.companyService.getSettings(user.companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get current company details' })
  findOne(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.companyService.findOne(user.companyId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update company details' })
  update(
    @CurrentUser() user: AuthUser,
    @Body() body: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      website?: string;
      logoUrl?: string;
      automaticFollowupEnabled?: boolean;
    },
  ): Promise<unknown> {
    return this.companyService.update(user.companyId, body);
  }

  // ── Currencies ─────────────────────────────────────────────────────────

  @Get('currencies')
  @ApiOperation({ summary: 'Get the tenant\'s enabled currency list and default' })
  getCurrencies(@CurrentUser() user: AuthUser) {
    return this.companyService.getCurrencies(user.companyId);
  }

  @Patch('currencies')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update the tenant\'s enabled currency list and default' })
  updateCurrencies(@CurrentUser() user: AuthUser, @Body() body: CurrencySettings) {
    return this.companyService.updateCurrencies(user.companyId, body);
  }

  // ── Tax rate presets ──────────────────────────────────────────────────

  @Get('tax-rates')
  @ApiOperation({ summary: 'List the tenant\'s tax rate presets' })
  listTaxRates(@CurrentUser() user: AuthUser) {
    return this.companyService.listTaxRates(user.companyId);
  }

  @Post('tax-rates')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a tax rate preset' })
  createTaxRate(@CurrentUser() user: AuthUser, @Body() body: CreateTaxRatePresetDto) {
    return this.companyService.createTaxRate(user.companyId, body);
  }

  @Patch('tax-rates/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update a tax rate preset' })
  updateTaxRate(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateTaxRatePresetDto) {
    return this.companyService.updateTaxRate(user.companyId, id, body);
  }

  @Delete('tax-rates/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete a tax rate preset' })
  deleteTaxRate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.companyService.deleteTaxRate(user.companyId, id);
  }

  // ── Payment terms presets ────────────────────────────────────────────

  @Get('payment-terms')
  @ApiOperation({ summary: 'List the tenant\'s payment terms presets' })
  listPaymentTerms(@CurrentUser() user: AuthUser) {
    return this.companyService.listPaymentTerms(user.companyId);
  }

  @Post('payment-terms')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a payment terms preset' })
  createPaymentTerms(@CurrentUser() user: AuthUser, @Body() body: CreatePaymentTermsPresetDto) {
    return this.companyService.createPaymentTerms(user.companyId, body);
  }

  @Patch('payment-terms/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update a payment terms preset' })
  updatePaymentTerms(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdatePaymentTermsPresetDto) {
    return this.companyService.updatePaymentTerms(user.companyId, id, body);
  }

  @Delete('payment-terms/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete a payment terms preset' })
  deletePaymentTerms(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.companyService.deletePaymentTerms(user.companyId, id);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter crm-service test -- company.controller`
Expected: PASS.

- [ ] **Step 5: Full crm-service test suite + build**

Run: `pnpm --filter crm-service test`
Expected: PASS, no regressions in other suites.

Run: `pnpm --filter crm-service build`
Expected: compiles cleanly.

- [ ] **Step 6: Commit**

```bash
git add apps/crm-service/src/company/company.controller.ts apps/crm-service/src/company/company.controller.spec.ts
git commit -m "feat(crm-service): expose currency/tax-rate/payment-terms endpoints with RBAC"
```

---

### Task 7: Frontend — currency reference list + Settings hooks

**Files:**
- Create: `apps/admin-dashboard/src/lib/currencies.ts`
- Modify: `apps/admin-dashboard/src/hooks/useSettings.ts`

**Interfaces:**
- Consumes: `CurrencySettings`, `TaxRatePreset`, `PaymentTermsPreset` from `@tscrm/types` (Task 1); backend routes from Task 6.
- Produces: `ISO_CURRENCIES: { code: string; name: string; symbol: string }[]`; hooks `useCurrencies()`, `useUpdateCurrencies()`, `useTaxRates()`, `useCreateTaxRate()`, `useUpdateTaxRate()`, `useDeleteTaxRate()`, `usePaymentTerms()`, `useCreatePaymentTerms()`, `useUpdatePaymentTerms()`, `useDeletePaymentTerms()` — Tasks 8-9 (Settings.tsx UI) import all of these by exact name.

- [ ] **Step 1: Create the ISO currency reference constant**

```ts
// apps/admin-dashboard/src/lib/currencies.ts
/**
 * Static ISO 4217 reference list for the tenant currency picker (Settings > Finance).
 * Deliberately not exhaustive of all ~180 ISO codes — covers the currencies this
 * product's tenants actually operate in, plus the most common global majors.
 * Add entries here if a tenant needs a code that isn't listed.
 */
export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
}

export const ISO_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
]

export function currencyInfo(code: string): CurrencyInfo {
  return ISO_CURRENCIES.find(c => c.code === code) ?? { code, name: code, symbol: code }
}
```

- [ ] **Step 2: Add the settings hooks**

Append to `apps/admin-dashboard/src/hooks/useSettings.ts` (add the type imports to the existing top-of-file imports, then the hooks at the end of the file):

```ts
// add to the top imports
import type { CurrencySettings, TaxRatePreset, PaymentTermsPreset } from '@tscrm/types'
```

```ts
// ── Currencies ───────────────────────────────────────────────────────────

export function useCurrencies() {
  return useQuery<CurrencySettings>({
    queryKey: ['company', 'currencies'],
    queryFn: async () => {
      const res = await api.get('/crm/company/currencies')
      return res.data
    },
  })
}

export function useUpdateCurrencies() {
  return useMutation({
    mutationFn: async (data: CurrencySettings) => {
      const res = await api.patch('/crm/company/currencies', data)
      return res.data as CurrencySettings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'currencies'] })
    },
  })
}

// ── Tax rate presets ─────────────────────────────────────────────────────

export function useTaxRates() {
  return useQuery<TaxRatePreset[]>({
    queryKey: ['company', 'tax-rates'],
    queryFn: async () => {
      const res = await api.get('/crm/company/tax-rates')
      return res.data
    },
  })
}

export function useCreateTaxRate() {
  return useMutation({
    mutationFn: async (data: { name: string; rate: number; isDefault?: boolean }) => {
      const res = await api.post('/crm/company/tax-rates', data)
      return res.data as TaxRatePreset
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'tax-rates'] }),
  })
}

export function useUpdateTaxRate() {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; rate?: number; isActive?: boolean; isDefault?: boolean; sortOrder?: number }) => {
      const res = await api.patch(`/crm/company/tax-rates/${id}`, data)
      return res.data as TaxRatePreset
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'tax-rates'] }),
  })
}

export function useDeleteTaxRate() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/company/tax-rates/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'tax-rates'] }),
  })
}

// ── Payment terms presets ────────────────────────────────────────────────

export function usePaymentTerms() {
  return useQuery<PaymentTermsPreset[]>({
    queryKey: ['company', 'payment-terms'],
    queryFn: async () => {
      const res = await api.get('/crm/company/payment-terms')
      return res.data
    },
  })
}

export function useCreatePaymentTerms() {
  return useMutation({
    mutationFn: async (data: { name: string; days: number; isDefault?: boolean }) => {
      const res = await api.post('/crm/company/payment-terms', data)
      return res.data as PaymentTermsPreset
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'payment-terms'] }),
  })
}

export function useUpdatePaymentTerms() {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; days?: number; isActive?: boolean; isDefault?: boolean; sortOrder?: number }) => {
      const res = await api.patch(`/crm/company/payment-terms/${id}`, data)
      return res.data as PaymentTermsPreset
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'payment-terms'] }),
  })
}

export function useDeletePaymentTerms() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/company/payment-terms/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'payment-terms'] }),
  })
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: compiles cleanly (these hooks are unused until Tasks 8-9 wire them into UI, which is fine — TypeScript doesn't flag unused exports).

- [ ] **Step 4: Commit**

```bash
git add apps/admin-dashboard/src/lib/currencies.ts apps/admin-dashboard/src/hooks/useSettings.ts
git commit -m "feat(admin-dashboard): add currency reference list + finance settings hooks"
```

---

### Task 8: Settings.tsx — Finance tab, Currencies card

**Files:**
- Modify: `apps/admin-dashboard/src/pages/Settings.tsx`

**Interfaces:**
- Consumes: `useCurrencies`, `useUpdateCurrencies` (Task 7); `ISO_CURRENCIES`, `currencyInfo` (Task 7).
- Produces: a `finance` tab value added to the page's tab union type and a `FinanceTab` component rendering the Currencies card — Task 9 adds two more cards inside the same `FinanceTab` component.

This is the task where the UI/UX and frontend-design skills apply most directly — the currency search-combobox-with-chips is the one new interaction pattern on this page (per the spec's "Visual design pass" section). Before writing this task's code, load the `frontend-design` skill for guidance on the combobox's states (empty, searching, chip layout, default-indicator treatment) and apply it to the JSX below; the JSX here is a functional baseline to build from, not a finished design — adjust spacing/color/motion choices using the skill's guidance while keeping the structure and data flow intact.

- [ ] **Step 1: Add the "Finance" tab button and route it into the tab union**

In `apps/admin-dashboard/src/pages/Settings.tsx`, change the tab state type (near the top of the `Settings` component):

```tsx
const [tab, setTab] = useState<'profile' | 'company' | 'finance' | 'notifications' | 'appearance' | 'security' | 'templates' | 'portal' | 'ai-agents' | 'integrations'>('profile')
```

Add `Landmark` to the lucide-react import list at the top of the file (alongside the existing icon imports):

```tsx
import { User, Building2, Bell, Shield, Palette, Mail, Smartphone, Save, Check, Moon, Sun, Monitor, Lock, Loader2, AlertCircle, ClipboardList, ChevronDown, ChevronRight, Bot, Upload, RotateCcw, ArrowRight, Megaphone, Plug2, CheckCircle2, XCircle, RefreshCw, ExternalLink, Landmark, Search, Star, X as XIcon, Trash2, Plus, GripVertical } from 'lucide-react'
```

Add the tab button to the `page-tabs` bar, right after the "Company" button:

```tsx
<button className={`tab-btn ${tab === 'finance' ? 'active' : ''}`} onClick={() => setTab('finance')}>
    <Landmark size={14} /> Finance
</button>
```

Add the tab's render block right after the Company tab's closing `)}`  (before `{/* Notifications */}`):

```tsx
{tab === 'finance' && <FinanceTab />}
```

- [ ] **Step 2: Add imports for the new hooks**

Add to the top imports of `Settings.tsx`:

```tsx
import { useCurrencies, useUpdateCurrencies, useTaxRates, useCreateTaxRate, useUpdateTaxRate, useDeleteTaxRate, usePaymentTerms, useCreatePaymentTerms, useUpdatePaymentTerms, useDeletePaymentTerms } from '../hooks/useSettings'
import { ISO_CURRENCIES, currencyInfo } from '../lib/currencies'
```

- [ ] **Step 3: Add the `FinanceTab` component with the Currencies card**

Add this component at the bottom of `Settings.tsx`, after the `IntegrationsTab` function:

```tsx
function FinanceTab() {
    const { showSuccess, showError } = useToast()
    const currenciesQuery = useCurrencies()
    const updateCurrencies = useUpdateCurrencies()
    const [search, setSearch] = useState('')

    const enabled = currenciesQuery.data?.enabled ?? []
    const defaultCurrency = currenciesQuery.data?.default ?? ''

    const searchResults = search.trim()
        ? ISO_CURRENCIES.filter(c =>
            !enabled.includes(c.code) &&
            (c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
        ).slice(0, 6)
        : []

    const addCurrency = (code: string) => {
        updateCurrencies.mutate(
            { enabled: [...enabled, code], default: defaultCurrency },
            {
                onSuccess: () => { setSearch(''); showSuccess(`${code} added.`) },
                onError: () => showError('Failed to add currency.', 'Save failed'),
            },
        )
    }

    const removeCurrency = (code: string) => {
        if (code === defaultCurrency) return
        updateCurrencies.mutate(
            { enabled: enabled.filter(c => c !== code), default: defaultCurrency },
            { onError: () => showError('Failed to remove currency.', 'Save failed') },
        )
    }

    const setDefault = (code: string) => {
        updateCurrencies.mutate(
            { enabled, default: code },
            { onError: () => showError('Failed to set default currency.', 'Save failed') },
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card anim-fade-in">
                <div className="card-header">
                    <div>
                        <div className="card-title">Currencies</div>
                        <div className="card-subtitle">Choose which currencies your team can select when creating jobs, quotes, invoices, and payments</div>
                    </div>
                </div>
                <div className="card-body">
                    {currenciesQuery.isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} />
                        </div>
                    ) : (
                        <>
                            <div style={{ position: 'relative', marginBottom: 20 }}>
                                <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--t3)' }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: 34 }}
                                    placeholder="Search to add a currency (e.g. LKR, Euro)…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                {searchResults.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 10,
                                        background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 'var(--r-md)',
                                        boxShadow: 'var(--shadow-md)', overflow: 'hidden',
                                    }}>
                                        {searchResults.map(c => (
                                            <button
                                                key={c.code}
                                                onClick={() => addCurrency(c.code)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
                                                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                                                }}
                                                className="hover:bg-[var(--bg-hover)]"
                                            >
                                                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)', minWidth: 44 }}>{c.code}</span>
                                                <span style={{ fontSize: 13, color: 'var(--t3)' }}>{c.name}</span>
                                                <span style={{ marginLeft: 'auto', color: 'var(--t4)' }}>{c.symbol}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                {enabled.map(code => {
                                    const info = currencyInfo(code)
                                    const isDefault = code === defaultCurrency
                                    return (
                                        <div key={code} style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                            borderRadius: 999,
                                            background: isDefault ? 'var(--blue-glow)' : 'var(--bg-card-2)',
                                            border: `1px solid ${isDefault ? 'var(--blue)' : 'var(--bd)'}`,
                                        }}>
                                            <button
                                                onClick={() => !isDefault && setDefault(code)}
                                                title={isDefault ? 'Default currency' : 'Set as default'}
                                                style={{ display: 'flex', background: 'none', border: 'none', cursor: isDefault ? 'default' : 'pointer', padding: 0 }}
                                            >
                                                <Star size={13} fill={isDefault ? 'var(--blue)' : 'none'} style={{ color: isDefault ? 'var(--blue)' : 'var(--t4)' }} />
                                            </button>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{code}</span>
                                            <span style={{ fontSize: 12, color: 'var(--t3)' }}>{info.symbol}</span>
                                            {isDefault ? (
                                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Default</span>
                                            ) : (
                                                <button
                                                    onClick={() => removeCurrency(code)}
                                                    title="Remove"
                                                    style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--t4)' }}
                                                >
                                                    <XIcon size={13} />
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
```

- [ ] **Step 4: Type-check and manual verification**

Run: `pnpm --filter admin-dashboard build`
Expected: compiles cleanly.

Run: `pnpm dev:admin`, log in, go to Settings > Finance. Verify: existing enabled currencies render as chips with the default starred; search adds a new currency; starring a non-default chip promotes it and demotes the old default; the default chip's remove button is hidden (only the star badge shows).

- [ ] **Step 5: Commit**

```bash
git add apps/admin-dashboard/src/pages/Settings.tsx
git commit -m "feat(admin-dashboard): add Finance settings tab with currency management"
```

---

### Task 9: Settings.tsx — Finance tab, Tax Rates + Payment Terms cards

**Files:**
- Modify: `apps/admin-dashboard/src/pages/Settings.tsx`

**Interfaces:**
- Consumes: `useTaxRates`, `useCreateTaxRate`, `useUpdateTaxRate`, `useDeleteTaxRate`, `usePaymentTerms`, `useCreatePaymentTerms`, `useUpdatePaymentTerms`, `useDeletePaymentTerms` (Task 7); the `FinanceTab` component and its existing Currencies card (Task 8).
- Produces: final `FinanceTab` component with all three cards — nothing later in this plan consumes it (Sub-project B will, from Quote/Invoice forms).

- [ ] **Step 1: Add a shared inline-editable preset-list card component**

Add this component to `Settings.tsx`, right before `FinanceTab` (both `TaxRatePreset` and `PaymentTermsPreset` presets render through it, parameterized by a `valueLabel`/`valueSuffix` pair so the two cards share one implementation):

```tsx
interface PresetRow {
    id: string
    name: string
    value: number      // rate (0-1) for tax, days for terms
    isDefault: boolean
    isActive: boolean
}

function PresetListCard({
    title, subtitle, addLabel, valueLabel, valueSuffix, valueStep, toDisplay, fromDisplay,
    rows, isLoading, onCreate, onUpdate, onDelete, creating,
}: {
    title: string
    subtitle: string
    addLabel: string
    valueLabel: string
    valueSuffix: string
    valueStep: string
    toDisplay: (value: number) => number
    fromDisplay: (display: number) => number
    rows: PresetRow[]
    isLoading: boolean
    onCreate: (name: string, value: number) => void
    onUpdate: (id: string, patch: Partial<{ name: string; value: number; isActive: boolean; isDefault: boolean }>) => void
    onDelete: (id: string) => void
    creating: boolean
}) {
    const [adding, setAdding] = useState(false)
    const [newName, setNewName] = useState('')
    const [newValue, setNewValue] = useState('')

    const submitNew = () => {
        const value = fromDisplay(parseFloat(newValue) || 0)
        if (!newName.trim()) return
        onCreate(newName.trim(), value)
        setNewName('')
        setNewValue('')
        setAdding(false)
    }

    return (
        <div className="card anim-fade-in">
            <div className="card-header">
                <div>
                    <div className="card-title">{title}</div>
                    <div className="card-subtitle">{subtitle}</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setAdding(true)} disabled={adding}>
                    <Plus size={13} /> {addLabel}
                </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                        <Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} />
                    </div>
                ) : (
                    <>
                        {rows.map((row, i) => (
                            <div key={row.id} style={{
                                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
                                borderBottom: i === rows.length - 1 && !adding ? 'none' : '1px solid var(--bd)',
                                opacity: row.isActive ? 1 : 0.5,
                            }}>
                                <GripVertical size={14} style={{ color: 'var(--t4)', flexShrink: 0 }} />
                                <input
                                    className="form-input"
                                    style={{ flex: 1 }}
                                    defaultValue={row.name}
                                    onBlur={e => e.target.value !== row.name && onUpdate(row.id, { name: e.target.value })}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 110, flexShrink: 0 }}>
                                    <input
                                        type="number"
                                        step={valueStep}
                                        min={0}
                                        className="form-input"
                                        defaultValue={toDisplay(row.value)}
                                        onBlur={e => {
                                            const v = fromDisplay(parseFloat(e.target.value) || 0)
                                            if (v !== row.value) onUpdate(row.id, { value: v })
                                        }}
                                    />
                                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>{valueSuffix}</span>
                                </div>
                                <button
                                    onClick={() => !row.isDefault && onUpdate(row.id, { isDefault: true })}
                                    title={row.isDefault ? `Default ${valueLabel}` : `Set as default ${valueLabel}`}
                                    style={{ display: 'flex', background: 'none', border: 'none', cursor: row.isDefault ? 'default' : 'pointer', padding: 0, flexShrink: 0 }}
                                >
                                    <Star size={14} fill={row.isDefault ? 'var(--blue)' : 'none'} style={{ color: row.isDefault ? 'var(--blue)' : 'var(--t4)' }} />
                                </button>
                                <Toggle checked={row.isActive} onChange={() => onUpdate(row.id, { isActive: !row.isActive })} />
                                <button
                                    onClick={() => onDelete(row.id)}
                                    disabled={row.isDefault}
                                    title={row.isDefault ? 'Cannot delete the default' : 'Delete'}
                                    style={{ display: 'flex', background: 'none', border: 'none', cursor: row.isDefault ? 'not-allowed' : 'pointer', padding: 0, color: row.isDefault ? 'var(--t4)' : 'var(--red)', flexShrink: 0 }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {adding && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', background: 'var(--bg2)' }}>
                                <div style={{ width: 14, flexShrink: 0 }} />
                                <input
                                    autoFocus
                                    className="form-input"
                                    style={{ flex: 1 }}
                                    placeholder="Name"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 110, flexShrink: 0 }}>
                                    <input
                                        type="number"
                                        step={valueStep}
                                        min={0}
                                        className="form-input"
                                        placeholder="0"
                                        value={newValue}
                                        onChange={e => setNewValue(e.target.value)}
                                    />
                                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>{valueSuffix}</span>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={submitNew} disabled={creating || !newName.trim()}>
                                    <Check size={13} />
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => { setAdding(false); setNewName(''); setNewValue('') }}>
                                    <XIcon size={13} />
                                </button>
                            </div>
                        )}
                        {rows.length === 0 && !adding && (
                            <div style={{ textAlign: 'center', padding: 32, color: 'var(--t3)', fontSize: 13 }}>None yet — add one to get started.</div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
```

- [ ] **Step 2: Wire Tax Rates and Payment Terms cards into `FinanceTab`**

In the `FinanceTab` function from Task 8, add the two new hooks blocks and render the two new cards. Replace the `return (...)` at the end of `FinanceTab` with:

```tsx
    // ---- Tax rates ----
    const taxRatesQuery = useTaxRates()
    const createTaxRate = useCreateTaxRate()
    const updateTaxRate = useUpdateTaxRate()
    const deleteTaxRate = useDeleteTaxRate()

    // ---- Payment terms ----
    const paymentTermsQuery = usePaymentTerms()
    const createPaymentTerms = useCreatePaymentTerms()
    const updatePaymentTerms = useUpdatePaymentTerms()
    const deletePaymentTerms = useDeletePaymentTerms()

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card anim-fade-in">
                <div className="card-header">
                    <div>
                        <div className="card-title">Currencies</div>
                        <div className="card-subtitle">Choose which currencies your team can select when creating jobs, quotes, invoices, and payments</div>
                    </div>
                </div>
                <div className="card-body">
                    {currenciesQuery.isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} />
                        </div>
                    ) : (
                        <>
                            <div style={{ position: 'relative', marginBottom: 20 }}>
                                <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--t3)' }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: 34 }}
                                    placeholder="Search to add a currency (e.g. LKR, Euro)…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                {searchResults.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 10,
                                        background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 'var(--r-md)',
                                        boxShadow: 'var(--shadow-md)', overflow: 'hidden',
                                    }}>
                                        {searchResults.map(c => (
                                            <button
                                                key={c.code}
                                                onClick={() => addCurrency(c.code)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
                                                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                                                }}
                                                className="hover:bg-[var(--bg-hover)]"
                                            >
                                                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)', minWidth: 44 }}>{c.code}</span>
                                                <span style={{ fontSize: 13, color: 'var(--t3)' }}>{c.name}</span>
                                                <span style={{ marginLeft: 'auto', color: 'var(--t4)' }}>{c.symbol}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                {enabled.map(code => {
                                    const info = currencyInfo(code)
                                    const isDefault = code === defaultCurrency
                                    return (
                                        <div key={code} style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                            borderRadius: 999,
                                            background: isDefault ? 'var(--blue-glow)' : 'var(--bg-card-2)',
                                            border: `1px solid ${isDefault ? 'var(--blue)' : 'var(--bd)'}`,
                                        }}>
                                            <button
                                                onClick={() => !isDefault && setDefault(code)}
                                                title={isDefault ? 'Default currency' : 'Set as default'}
                                                style={{ display: 'flex', background: 'none', border: 'none', cursor: isDefault ? 'default' : 'pointer', padding: 0 }}
                                            >
                                                <Star size={13} fill={isDefault ? 'var(--blue)' : 'none'} style={{ color: isDefault ? 'var(--blue)' : 'var(--t4)' }} />
                                            </button>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{code}</span>
                                            <span style={{ fontSize: 12, color: 'var(--t3)' }}>{info.symbol}</span>
                                            {isDefault ? (
                                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Default</span>
                                            ) : (
                                                <button
                                                    onClick={() => removeCurrency(code)}
                                                    title="Remove"
                                                    style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--t4)' }}
                                                >
                                                    <XIcon size={13} />
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <PresetListCard
                title="Tax Rates"
                subtitle="Named tax presets your team can pick from on quotes and invoices"
                addLabel="Add tax rate"
                valueLabel="rate"
                valueSuffix="%"
                valueStep="0.5"
                toDisplay={v => Math.round(v * 10000) / 100}
                fromDisplay={d => Math.round(d * 100) / 10000}
                rows={(taxRatesQuery.data ?? []).map(r => ({ id: r.id, name: r.name, value: r.rate, isDefault: r.isDefault, isActive: r.isActive }))}
                isLoading={taxRatesQuery.isLoading}
                creating={createTaxRate.isPending}
                onCreate={(name, value) => createTaxRate.mutate({ name, rate: value }, {
                    onError: () => showError('Failed to add tax rate.', 'Save failed'),
                })}
                onUpdate={(id, patch) => updateTaxRate.mutate(
                    { id, name: patch.name, rate: patch.value, isActive: patch.isActive, isDefault: patch.isDefault },
                    { onError: (err: any) => showError(err?.response?.data?.message ?? 'Failed to update tax rate.', 'Save failed') },
                )}
                onDelete={id => deleteTaxRate.mutate(id, {
                    onError: (err: any) => showError(err?.response?.data?.message ?? 'Failed to delete tax rate.', 'Delete failed'),
                })}
            />

            <PresetListCard
                title="Payment Terms"
                subtitle="Named payment-terms presets your team can pick from on invoices"
                addLabel="Add payment terms"
                valueLabel="terms"
                valueSuffix="days"
                valueStep="1"
                toDisplay={v => v}
                fromDisplay={d => Math.round(d)}
                rows={(paymentTermsQuery.data ?? []).map(r => ({ id: r.id, name: r.name, value: r.days, isDefault: r.isDefault, isActive: r.isActive }))}
                isLoading={paymentTermsQuery.isLoading}
                creating={createPaymentTerms.isPending}
                onCreate={(name, value) => createPaymentTerms.mutate({ name, days: value }, {
                    onError: () => showError('Failed to add payment terms.', 'Save failed'),
                })}
                onUpdate={(id, patch) => updatePaymentTerms.mutate(
                    { id, name: patch.name, days: patch.value, isActive: patch.isActive, isDefault: patch.isDefault },
                    { onError: (err: any) => showError(err?.response?.data?.message ?? 'Failed to update payment terms.', 'Save failed') },
                )}
                onDelete={id => deletePaymentTerms.mutate(id, {
                    onError: (err: any) => showError(err?.response?.data?.message ?? 'Failed to delete payment terms.', 'Delete failed'),
                })}
            />
        </div>
    )
}
```

This replaces the entire `return (...)` block of `FinanceTab` from Task 8 (the Currencies card JSX is unchanged — Task 8's version is inlined again here so the whole function reads as one piece; delete the Task-8-only `return` and use this one).

- [ ] **Step 3: Type-check and manual verification**

Run: `pnpm --filter admin-dashboard build`
Expected: compiles cleanly.

Run: `pnpm dev:admin`, go to Settings > Finance. Verify: Tax Rates and Payment Terms cards load seeded defaults ("No Tax" / "Net 30" from the Task 2 migration backfill); adding a new preset works; editing name/value on blur persists; toggling active/inactive works; starring a row promotes it to default and demotes the old one; the default row's delete button is disabled with the correct tooltip; deactivating the default row is rejected (surface the 400 as a toast via the existing `showError` pattern — wrap each mutation's `onError` similarly to Task 8's currency mutations).

- [ ] **Step 4: Commit**

```bash
git add apps/admin-dashboard/src/pages/Settings.tsx
git commit -m "feat(admin-dashboard): add Tax Rates and Payment Terms preset cards to Finance settings"
```

---

## Self-Review Notes

- **Spec coverage:** every section of `2026-08-18-tenant-finance-settings-design.md` maps to a task — Data model → Task 2, API surface + shared types → Tasks 1/3-6, Frontend (all 3 cards + hooks) → Tasks 7-9, Testing → embedded in every backend task's steps + Task 8/9 manual verification. Migration/backfill → Task 2 Steps 2-3 with verification in Step 5.
- **Type consistency verified:** `CurrencySettings`/`TaxRatePreset`/`PaymentTermsPreset` (Task 1) are the exact shapes returned by `CompanyService` methods (Tasks 3-5), consumed unchanged by the controller (Task 6) and the frontend hooks (Task 7), and the hook names used in Tasks 8-9's JSX (`useCurrencies`, `useCreateTaxRate`, etc.) match Task 7's exports exactly.
- **`onError` toasts on preset mutations:** fixed inline in Task 9 Step 2 — every `PresetListCard` `onCreate`/`onUpdate`/`onDelete` callback now passes an explicit `onError` to `.mutate()` that surfaces the backend's 400/409 message via `showError`, matching Task 8's currency-mutation pattern.
