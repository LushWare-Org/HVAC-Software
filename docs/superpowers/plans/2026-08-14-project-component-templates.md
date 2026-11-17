# Generic Project Component Templates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `Project.templateType` (`STANDARD | HOUSING_SCHEME`) + `House` model with admin-authored `ProjectTemplate`s (reusable, company-scoped, define named component types) and generic `ProjectComponent` instances, migrating the 27 existing production houses across 5 live Housing Scheme projects with zero data loss.

**Architecture:** New `crm-service` modules `project-templates` (template CRUD) and `project-components` (replaces `houses`, same shape — flat list, owner-optional, equipment/issue-report children). `Project` gains `templateId` + a frozen `componentTypesSnapshot` copied at creation (template edits never retroactively change existing projects) + `componentCustomerSettings` (per-project override of which component types can carry an owner, bounded by the template's own `customerAssignable` ceiling). Every cross-service `houseId` column (`job-service.Job`, `finance-service.Quote/Invoice`, `crm-service.ServiceAgreement`) is renamed to `componentId`, ids preserved end-to-end.

**Tech Stack:** NestJS + Prisma (crm-service, job-service, finance-service), raw SQL migrations via `scripts/apply-migrations.mjs` (not `prisma migrate dev` — this repo's `crm` schema has drift that makes `migrate dev` want to reset it), React 19 + TanStack Query (admin-dashboard, customer-portal).

## Global Constraints

- Multi-tenancy: every new query/table filtered by `companyId` — no exceptions.
- Migrations applied via `scripts/apply-migrations.mjs` only (array of `{schema, name, sql}`, idempotent, tracked in `_prisma_migrations` per schema) — never `prisma migrate dev` against this database.
- Money/Decimal conventions, pagination (`clampPagination`), RBAC role guards (`STAFF_WRITE = [SUPER_ADMIN, COMPANY_ADMIN, OFFICE_MANAGER, DISPATCHER]`) follow the exact patterns already used in `houses.controller.ts`/`houses.service.ts` — read those files before writing the new ones, they are the canonical reference for every new file in this plan.
- Real production data must survive: 27 `House` rows (all owned), 5 `HOUSING_SCHEME` projects, 5 `Equipment` rows linked to houses. The migration task has a hard verification gate — it must fail loudly, not proceed silently, if row counts don't match expectations.
- `pnpm` only. `apps/crm-service`/`job-service`/`finance-service`: `pnpm --filter <service> test`, `pnpm --filter <service> type-check`. `apps/admin-dashboard`/`customer-portal`: no test runner, verify via `pnpm --filter <app> build` (runs `tsc -b`).
- Do not commit anything — this repo's standing rule is nothing gets committed unless the user explicitly says so, and never with a Claude co-author trailer.

---

### Task 1: Prisma schema — new models + Project fields (crm-service)

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma`

**Interfaces:**
- Produces: `ProjectTemplate` model, `ProjectComponent` model, `Project.templateId`/`componentTypesSnapshot`/`componentCustomerSettings` fields, `ComponentIssueReport` model (renamed from `HouseIssueReport`) — every later crm-service task depends on these Prisma Client types existing.

- [ ] **Step 1: Add the new models next to the existing `House`/`HouseIssueReport` block**

```prisma
// ─── Generic project component templates (spec: docs/superpowers/specs/2026-08-14-project-component-templates-design.md) ──

model ProjectTemplate {
  id             String    @id @default(uuid())
  companyId      String
  name           String
  description    String?
  componentTypes Json      // [{ key: string, label: string, icon?: string, customerAssignable: boolean }]
  isBuiltIn      Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([companyId])
  @@map("project_templates")
}

// Replaces House. Flat — no self-reference. componentTypeKey references a key
// inside the owning Project's componentTypesSnapshot (validated in the service
// layer, not a DB FK, since componentTypesSnapshot is JSON).
model ProjectComponent {
  id               String    @id @default(uuid())
  companyId        String
  projectId        String    @db.Uuid
  project          Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  componentTypeKey String
  label            String
  ownerCustomerId  String?
  owner            Customer? @relation("ProjectComponentOwner", fields: [ownerCustomerId], references: [id], onDelete: SetNull)
  tags             String[]  @default([])
  notes            String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  equipment    Equipment[]
  issueReports ComponentIssueReport[]

  @@index([companyId, projectId])
  @@index([ownerCustomerId])
  @@map("project_components")
}

// Renamed from HouseIssueReport. Same shape, componentId replaces houseId.
model ComponentIssueReport {
  id                    String    @id @default(uuid())
  companyId             String
  componentId           String
  component             ProjectComponent @relation(fields: [componentId], references: [id], onDelete: Cascade)
  equipmentId           String?
  equipment             Equipment? @relation(fields: [equipmentId], references: [id], onDelete: SetNull)
  reportedByCustomerId  String
  reportedBy            Customer  @relation(fields: [reportedByCustomerId], references: [id])
  errorCode             String?
  description           String?
  status                String    @default("OPEN")
  resolvedNote          String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([companyId, componentId])
  @@index([reportedByCustomerId])
  @@map("component_issue_reports")
}
```

- [ ] **Step 2: Extend `Project` with the new fields + relation, keep `House`/`HouseIssueReport` models untouched for now (removed in Task 9 after data migration is verified)**

```prisma
model Project {
  // ...existing fields...
  templateId                String?
  componentTypesSnapshot    Json?
  componentCustomerSettings Json?

  components ProjectComponent[]
  // existing: rosterDays, houses (kept until Task 9)
}
```

- [ ] **Step 3: Update `Equipment` — add `componentId`, keep `houseId` until Task 9**

```prisma
model Equipment {
  // ...existing fields...
  componentId String?
  component   ProjectComponent? @relation(fields: [componentId], references: [id], onDelete: SetNull)
  issueReports2 ComponentIssueReport[] // temp name to avoid clashing with existing HouseIssueReport relation; renamed in Task 9 cleanup
}
```

- [ ] **Step 4: Generate the client and confirm it compiles**

Run: `cd apps/crm-service && npx prisma generate`
Expected: `Generated Prisma Client` with no errors, `ProjectTemplate`/`ProjectComponent`/`ComponentIssueReport` types available from `@prisma/client`.

- [ ] **Step 5: Run existing test suite to confirm nothing broke from the schema addition alone**

Run: `pnpm --filter crm-service test`
Expected: same pass count as before this change (additive schema change, no behavior touched yet).

---

### Task 2: Migration SQL — new tables + Housing Scheme data migration (with verification gate)

**Files:**
- Modify: `scripts/apply-migrations.mjs`

**Interfaces:**
- Consumes: nothing (raw SQL against the live `crm` schema).
- Produces: `crm.project_templates`, `crm.project_components`, `crm.component_issue_reports` tables; `crm.projects.templateId`/`componentTypesSnapshot`/`componentCustomerSettings` columns; `crm.equipment.componentId` column; every existing house/owner/equipment relationship reproduced under the new tables with **ids reused**.

- [ ] **Step 1: Add the schema-DDL migration entry** (append to the `migrations` array, before the `Main` section)

```js
  // ─── Generic project component templates (spec: docs/superpowers/specs/2026-08-14-project-component-templates-design.md) ──
  {
    schema: 'crm',
    name: '20260814000000_add_project_component_templates',
    sql: `
CREATE TABLE IF NOT EXISTS "crm"."project_templates" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "componentTypes" JSONB NOT NULL,
  "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "project_templates_companyId_idx" ON "crm"."project_templates"("companyId");

ALTER TABLE "crm"."projects"
  ADD COLUMN IF NOT EXISTS "templateId" TEXT,
  ADD COLUMN IF NOT EXISTS "componentTypesSnapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "componentCustomerSettings" JSONB;

CREATE TABLE IF NOT EXISTS "crm"."project_components" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "projectId" UUID NOT NULL,
  "componentTypeKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "ownerCustomerId" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "project_components_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_components_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "crm"."projects"("id") ON DELETE CASCADE,
  CONSTRAINT "project_components_ownerCustomerId_fkey" FOREIGN KEY ("ownerCustomerId")
    REFERENCES "crm"."customers"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "project_components_projectId_idx" ON "crm"."project_components"("companyId", "projectId");
CREATE INDEX IF NOT EXISTS "project_components_ownerCustomerId_idx" ON "crm"."project_components"("ownerCustomerId");

CREATE TABLE IF NOT EXISTS "crm"."component_issue_reports" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "componentId" TEXT NOT NULL,
  "equipmentId" TEXT,
  "reportedByCustomerId" TEXT NOT NULL,
  "errorCode" TEXT,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "resolvedNote" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "component_issue_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "component_issue_reports_componentId_fkey" FOREIGN KEY ("componentId")
    REFERENCES "crm"."project_components"("id") ON DELETE CASCADE,
  CONSTRAINT "component_issue_reports_equipmentId_fkey" FOREIGN KEY ("equipmentId")
    REFERENCES "crm"."equipment"("id") ON DELETE SET NULL,
  CONSTRAINT "component_issue_reports_reportedByCustomerId_fkey" FOREIGN KEY ("reportedByCustomerId")
    REFERENCES "crm"."customers"("id")
);
CREATE INDEX IF NOT EXISTS "component_issue_reports_componentId_idx" ON "crm"."component_issue_reports"("companyId", "componentId");

ALTER TABLE "crm"."equipment" ADD COLUMN IF NOT EXISTS "componentId" TEXT;
CREATE INDEX IF NOT EXISTS "equipment_componentId_idx" ON "crm"."equipment"("componentId");
    `.trim(),
  },
```

- [ ] **Step 2: Add the data-migration entry, appended immediately after Step 1's entry — ids reused, houses table left in place (dropped in Task 9)**

```js
  {
    schema: 'crm',
    name: '20260814000001_migrate_housing_scheme_to_components',
    sql: `
-- One built-in "Housing Scheme" template per company that has ≥1 HOUSING_SCHEME project.
INSERT INTO "crm"."project_templates" ("id", "companyId", "name", "description", "componentTypes", "isBuiltIn")
SELECT gen_random_uuid()::text, "companyId", 'Housing Scheme',
       'Independently-owned houses under one project.',
       '[{"key":"house","label":"House","customerAssignable":true}]'::jsonb,
       true
FROM (SELECT DISTINCT "companyId" FROM "crm"."projects" WHERE "templateType" = 'HOUSING_SCHEME') t;

-- Point every HOUSING_SCHEME project at its company's new template + snapshot.
UPDATE "crm"."projects" p
SET "templateId" = pt."id",
    "componentTypesSnapshot" = pt."componentTypes",
    "componentCustomerSettings" = '{"house": true}'::jsonb
FROM "crm"."project_templates" pt
WHERE p."templateType" = 'HOUSING_SCHEME'
  AND pt."companyId" = p."companyId"
  AND pt."isBuiltIn" = true
  AND pt."name" = 'Housing Scheme';

-- Reuse the SAME id for every migrated house so every FK pointing at it
-- (equipment, issue reports, jobs, quotes, invoices, agreements) keeps working.
INSERT INTO "crm"."project_components"
  ("id", "companyId", "projectId", "componentTypeKey", "label", "ownerCustomerId", "tags", "notes", "createdAt", "updatedAt")
SELECT "id", "companyId", "projectId", 'house', "label", "ownerCustomerId", "tags", "notes", "createdAt", "updatedAt"
FROM "crm"."houses";

-- Repoint equipment at the (same-id) component row.
UPDATE "crm"."equipment" SET "componentId" = "houseId" WHERE "houseId" IS NOT NULL;

-- Migrate issue reports (new table, same ids, componentId = old houseId value).
INSERT INTO "crm"."component_issue_reports"
  ("id", "companyId", "componentId", "equipmentId", "reportedByCustomerId", "errorCode", "description", "status", "resolvedNote", "createdAt", "updatedAt")
SELECT "id", "companyId", "houseId", "equipmentId", "reportedByCustomerId", "errorCode", "description", "status", "resolvedNote", "createdAt", "updatedAt"
FROM "crm"."house_issue_reports";
    `.trim(),
  },
```

- [ ] **Step 3: Write and run a standalone verification script (not part of the migration array — a one-off check, deleted after use)**

Create a scratch file `scripts/verify-component-migration.mjs`:

```js
import pg from 'pg';
const { Client } = pg;
const c = new Client({
  connectionString: 'postgresql://postgres.piezmopzxbuksjuuwwyw:<DB_PASSWORD>@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=crm',
});
await c.connect();

const houses = (await c.query('SELECT count(*) FROM crm.houses')).rows[0].count;
const components = (await c.query(`SELECT count(*) FROM crm.project_components WHERE "componentTypeKey" = 'house'`)).rows[0].count;
const equipLinked = (await c.query('SELECT count(*) FROM crm.equipment WHERE "componentId" IS NOT NULL')).rows[0].count;
const equipOldLinked = (await c.query('SELECT count(*) FROM crm.equipment WHERE "houseId" IS NOT NULL')).rows[0].count;
const projectsWithTemplate = (await c.query(`SELECT count(*) FROM crm.projects WHERE "templateType" = 'HOUSING_SCHEME' AND "templateId" IS NOT NULL`)).rows[0].count;
const housingSchemeProjects = (await c.query(`SELECT count(*) FROM crm.projects WHERE "templateType" = 'HOUSING_SCHEME'`)).rows[0].count;

console.log({ houses, components, equipLinked, equipOldLinked, projectsWithTemplate, housingSchemeProjects });

if (houses !== components) throw new Error(`MISMATCH: ${houses} houses but ${components} components`);
if (equipLinked !== equipOldLinked) throw new Error(`MISMATCH: ${equipOldLinked} equipment had houseId but only ${equipLinked} got componentId`);
if (projectsWithTemplate !== housingSchemeProjects) throw new Error(`MISMATCH: ${housingSchemeProjects} HOUSING_SCHEME projects but only ${projectsWithTemplate} got a templateId`);

console.log('OK — migration verified.');
await c.end();
```

Run: `node scripts/apply-migrations.mjs && node scripts/verify-component-migration.mjs`
Expected: `{ houses: 27, components: 27, equipLinked: 5, equipOldLinked: 5, projectsWithTemplate: 5, housingSchemeProjects: 5 }` then `OK — migration verified.` If any number mismatches, the script throws and the migration must be investigated before continuing — do not proceed to Task 3 on a failed verification.

- [ ] **Step 4: Delete the scratch verification script** (it served its one-time purpose; the counts it checked are now historical fact, not a regression test — ongoing coverage comes from Task 3's automated dry-run test)

Run: `rm scripts/verify-component-migration.mjs`

---

### Task 3: Cross-service `houseId` → `componentId` columns (job-service, finance-service, crm-service ServiceAgreement)

**Files:**
- Modify: `apps/job-service/prisma/schema.prisma`, `scripts/apply-migrations.mjs` (job schema entry)
- Modify: `apps/finance-service/prisma/schema.prisma`, `scripts/apply-migrations.mjs` (finance schema entry)
- Modify: `apps/crm-service/prisma/schema.prisma` (`ServiceAgreement.houseId`)

**Interfaces:**
- Produces: `Job.componentId`, `Quote.componentId`, `Invoice.componentId`, `ServiceAgreement.componentId` — all backfilled from the existing `houseId` value (ids unchanged from Task 2, so this is a pure copy, not a lookup).

- [ ] **Step 1: Add migration entries — additive column + backfill, old `houseId` column kept until Task 9**

```js
// job schema
{
  schema: 'jobs',
  name: '20260814000000_add_job_component_id',
  sql: `
ALTER TABLE "jobs"."jobs" ADD COLUMN IF NOT EXISTS "componentId" TEXT;
UPDATE "jobs"."jobs" SET "componentId" = "houseId" WHERE "houseId" IS NOT NULL AND "componentId" IS NULL;
CREATE INDEX IF NOT EXISTS "jobs_componentId_idx" ON "jobs"."jobs"("componentId");
  `.trim(),
},
```

```js
// finance schema
{
  schema: 'finance',
  name: '20260814000000_add_quote_invoice_component_id',
  sql: `
ALTER TABLE "finance"."Quote" ADD COLUMN IF NOT EXISTS "componentId" TEXT;
UPDATE "finance"."Quote" SET "componentId" = "houseId" WHERE "houseId" IS NOT NULL AND "componentId" IS NULL;
CREATE INDEX IF NOT EXISTS "quote_componentId_idx" ON "finance"."Quote"("componentId");

ALTER TABLE "finance"."Invoice" ADD COLUMN IF NOT EXISTS "componentId" TEXT;
UPDATE "finance"."Invoice" SET "componentId" = "houseId" WHERE "houseId" IS NOT NULL AND "componentId" IS NULL;
CREATE INDEX IF NOT EXISTS "invoice_componentId_idx" ON "finance"."Invoice"("componentId");
  `.trim(),
},
```

```js
// crm schema — append to the same migration array as Task 2
{
  schema: 'crm',
  name: '20260814000002_add_agreement_component_id',
  sql: `
ALTER TABLE "crm"."service_agreements" ADD COLUMN IF NOT EXISTS "componentId" TEXT;
UPDATE "crm"."service_agreements" SET "componentId" = "houseId" WHERE "houseId" IS NOT NULL AND "componentId" IS NULL;
CREATE INDEX IF NOT EXISTS "service_agreements_componentId_idx" ON "crm"."service_agreements"("componentId");
  `.trim(),
},
```

- [ ] **Step 2: Add matching fields to each service's `schema.prisma`** (`job.componentId String?`, `Quote.componentId`/`Invoice.componentId String?`, `ServiceAgreement.componentId String?` — plain nullable strings, no FK across service boundaries, same convention the existing `houseId` columns already use)

- [ ] **Step 3: Run the migration and regenerate each service's Prisma Client**

Run: `node scripts/apply-migrations.mjs && cd apps/job-service && npx prisma generate && cd ../finance-service && npx prisma generate && cd ../crm-service && npx prisma generate`
Expected: all three complete with `Generated Prisma Client`, no errors.

- [ ] **Step 4: Spot-check the backfill on the real data**

Run: `node -e "const {Client}=require('pg'); (async()=>{const c=new Client({connectionString:'postgresql://postgres.piezmopzxbuksjuuwwyw:<DB_PASSWORD>@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=jobs'}); await c.connect(); const r = await c.query('SELECT count(*) FROM jobs.jobs WHERE \"houseId\" IS NOT NULL AND \"componentId\" = \"houseId\"'); console.log(r.rows[0]); await c.end();})()"`
Expected: count matches however many jobs currently have a `houseId` set (confirms the copy worked; exact number depends on live data, just confirm `componentId = houseId` for all non-null rows, no mismatches).

---

### Task 4: `project-templates` module (crm-service)

**Files:**
- Create: `apps/crm-service/src/project-templates/project-templates.controller.ts`
- Create: `apps/crm-service/src/project-templates/project-templates.service.ts`
- Create: `apps/crm-service/src/project-templates/project-templates.module.ts`
- Test: `apps/crm-service/src/project-templates/project-templates.service.spec.ts`
- Modify: `apps/crm-service/src/app.module.ts` (register `ProjectTemplatesModule`)

**Interfaces:**
- Produces: `ProjectTemplatesService.list(companyId)`, `.create(companyId, input)`, `.findOne(companyId, id)`, `.update(companyId, id, input)`, `.remove(companyId, id)` — consumed by Task 7 (`projects.service.ts`) and the frontend.
- `ComponentTypeInput = { key: string; label: string; icon?: string; customerAssignable: boolean }`.

- [ ] **Step 1: Write the failing service test for key-uniqueness validation**

```ts
// project-templates.service.spec.ts
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProjectTemplatesService } from './project-templates.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  projectTemplate: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  project: { count: jest.fn() },
};

describe('ProjectTemplatesService', () => {
  let service: ProjectTemplatesService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [ProjectTemplatesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ProjectTemplatesService);
  });

  it('rejects duplicate component type keys within one template', async () => {
    await expect(service.create('co-1', {
      name: 'Hotel',
      componentTypes: [
        { key: 'room', label: 'Room', customerAssignable: true },
        { key: 'room', label: 'Suite', customerAssignable: true },
      ],
    })).rejects.toThrow(BadRequestException);
    expect(mockPrisma.projectTemplate.create).not.toHaveBeenCalled();
  });

  it('rejects an empty componentTypes array', async () => {
    await expect(service.create('co-1', { name: 'Empty', componentTypes: [] }))
      .rejects.toThrow(BadRequestException);
  });

  it('creates a template with valid unique keys', async () => {
    mockPrisma.projectTemplate.create.mockResolvedValue({ id: 't-1', companyId: 'co-1', name: 'Hotel' });
    await service.create('co-1', {
      name: 'Hotel',
      componentTypes: [
        { key: 'room', label: 'Room', customerAssignable: true },
        { key: 'lobby', label: 'Lobby', customerAssignable: false },
      ],
    });
    expect(mockPrisma.projectTemplate.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ companyId: 'co-1', name: 'Hotel' }),
    }));
  });

  it('blocks deleting a template that has projects referencing it', async () => {
    mockPrisma.projectTemplate.findFirst.mockResolvedValue({ id: 't-1', companyId: 'co-1' });
    mockPrisma.project.count.mockResolvedValue(2);
    await expect(service.remove('co-1', 't-1')).rejects.toThrow(BadRequestException);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter crm-service test -- project-templates.service`
Expected: FAIL — `Cannot find module './project-templates.service'`.

- [ ] **Step 3: Implement `project-templates.service.ts`**

```ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ComponentTypeInput {
  key: string;
  label: string;
  icon?: string;
  customerAssignable: boolean;
}

export interface UpsertTemplateInput {
  name?: string;
  description?: string | null;
  componentTypes?: ComponentTypeInput[];
}

function validateComponentTypes(types: ComponentTypeInput[] | undefined) {
  if (types === undefined) return;
  if (types.length === 0) throw new BadRequestException('A template needs at least one component type');
  const keys = types.map((t) => t.key);
  if (new Set(keys).size !== keys.length) {
    throw new BadRequestException('Component type keys must be unique within a template');
  }
  for (const t of types) {
    if (!t.key?.trim()) throw new BadRequestException('Every component type needs a key');
    if (!t.label?.trim()) throw new BadRequestException('Every component type needs a label');
  }
}

@Injectable()
export class ProjectTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.projectTemplate.findMany({
      where: { companyId },
      orderBy: [{ isBuiltIn: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(companyId: string, id: string) {
    const t = await this.prisma.projectTemplate.findFirst({ where: { id, companyId } });
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }

  async create(companyId: string, input: { name: string; description?: string; componentTypes: ComponentTypeInput[] }) {
    if (!input.name?.trim()) throw new BadRequestException('name is required');
    validateComponentTypes(input.componentTypes);
    return this.prisma.projectTemplate.create({
      data: {
        companyId,
        name: input.name.trim(),
        description: input.description ?? null,
        componentTypes: input.componentTypes,
      },
    });
  }

  async update(companyId: string, id: string, input: UpsertTemplateInput) {
    const existing = await this.findOne(companyId, id);
    if (existing.isBuiltIn) throw new BadRequestException('Built-in templates cannot be edited — duplicate it into a custom template instead');
    validateComponentTypes(input.componentTypes);
    const data: any = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.description !== undefined) data.description = input.description;
    if (input.componentTypes !== undefined) data.componentTypes = input.componentTypes;
    return this.prisma.projectTemplate.update({ where: { id }, data });
  }

  async remove(companyId: string, id: string) {
    const existing = await this.findOne(companyId, id);
    if (existing.isBuiltIn) throw new BadRequestException('Built-in templates cannot be deleted');
    const inUse = await this.prisma.project.count({ where: { companyId, templateId: id } });
    if (inUse > 0) throw new BadRequestException(`${inUse} project(s) use this template — cannot delete`);
    await this.prisma.projectTemplate.delete({ where: { id } });
    return { success: true };
  }
}
```

- [ ] **Step 4: Run to verify the service tests pass**

Run: `pnpm --filter crm-service test -- project-templates.service`
Expected: PASS, all 4 tests.

- [ ] **Step 5: Implement the controller** (`STAFF_WRITE` for writes, all staff roles for reads — copy the guard/decorator pattern from `houses.controller.ts` exactly)

```ts
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { IsString, IsOptional, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectTemplatesService } from './project-templates.service';

class ComponentTypeDto {
  @IsString() key!: string;
  @IsString() label!: string;
  @IsOptional() @IsString() icon?: string;
  @IsBoolean() customerAssignable!: boolean;
}

class UpsertTemplateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ComponentTypeDto)
  componentTypes?: ComponentTypeDto[];
}

const STAFF_WRITE = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER];

@ApiTags('Project Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('project-templates')
export class ProjectTemplatesController {
  constructor(private readonly templates: ProjectTemplatesService) {}

  @Get()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: "List the company's project templates" })
  list(@CurrentUser() user: AuthUser) {
    return this.templates.list(user.companyId);
  }

  @Post()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Create a project template' })
  create(@CurrentUser() user: AuthUser, @Body() dto: UpsertTemplateDto & { name: string; componentTypes: ComponentTypeDto[] }) {
    return this.templates.create(user.companyId, dto);
  }

  @Get(':id')
  @Roles(...STAFF_WRITE)
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.templates.findOne(user.companyId, id);
  }

  @Patch(':id')
  @Roles(...STAFF_WRITE)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpsertTemplateDto) {
    return this.templates.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(...STAFF_WRITE)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.templates.remove(user.companyId, id);
  }
}
```

- [ ] **Step 6: Wire the module** (`project-templates.module.ts` mirroring `houses.module.ts`'s shape: imports `LocalAuthModule`, declares the controller + service, exports the service) and register it in `apps/crm-service/src/app.module.ts`'s `imports` array.

- [ ] **Step 7: Run full crm-service test suite**

Run: `pnpm --filter crm-service test`
Expected: all pass, count increased by the 4 new tests.

---

### Task 5: `project-components` module (crm-service) — replaces `houses` module

**Files:**
- Create: `apps/crm-service/src/project-components/project-components.controller.ts`
- Create: `apps/crm-service/src/project-components/project-components.service.ts`
- Create: `apps/crm-service/src/project-components/project-components.module.ts`
- Test: `apps/crm-service/src/project-components/project-components.service.spec.ts`
- Modify: `apps/crm-service/src/app.module.ts` (register `ProjectComponentsModule`)

**Interfaces:**
- Consumes: `ProjectTemplatesService` is NOT needed here — the owning `Project.componentTypesSnapshot`/`componentCustomerSettings` (from Task 1/7) is the source of truth for what's valid on THIS project.
- Produces: `ProjectComponentsService.{listForProject, create, findOne, update, remove, assignOwner, generateOwnerAccount, mine, listMyIssues, listIssuesForComponent, createIssue, updateIssueStatus, openIssuesForCompany}` — same method names as `HousesService` had, `house`→`component` renamed, consumed by the controller and by Task 6's equipment wiring.

- [ ] **Step 1: Write the failing service tests for the two new validation rules this design adds beyond what `HousesService` had** (type-must-exist-on-project, owner-requires-assignable-type)

```ts
// project-components.service.spec.ts
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectComponentsService } from './project-components.service';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentService } from '../equipment/equipment.service';
import { AuthService } from '../auth/auth.service';

const mockPrisma = {
  project: { findFirst: jest.fn() },
  projectComponent: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
  customer: { findFirst: jest.fn(), findMany: jest.fn() },
  equipment: { groupBy: jest.fn() },
  componentIssueReport: { groupBy: jest.fn() },
};
const mockEquipment = { resyncComponentEquipmentOwner: jest.fn() };
const mockAuth = { provisionHouseOwnerAccount: jest.fn() };

describe('ProjectComponentsService', () => {
  let service: ProjectComponentsService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProjectComponentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EquipmentService, useValue: mockEquipment },
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compile();
    service = module.get(ProjectComponentsService);
  });

  it('rejects a component whose type is not on the project template snapshot', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
      componentCustomerSettings: { room: true },
    });
    await expect(service.create('co-1', 'p-1', { componentTypeKey: 'pool', label: 'Pool' }))
      .rejects.toThrow(BadRequestException);
  });

  it('rejects an owner on a component whose type is not customer-assignable for this project', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'pool', label: 'Pool', customerAssignable: false }],
      componentCustomerSettings: { pool: false },
    });
    await expect(service.create('co-1', 'p-1', { componentTypeKey: 'pool', label: 'Pool Deck', ownerCustomerId: 'cust-1' }))
      .rejects.toThrow(BadRequestException);
  });

  it('rejects an owner when the template allows it but this project turned it off', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
      componentCustomerSettings: { room: false }, // project-level override, off
    });
    await expect(service.create('co-1', 'p-1', { componentTypeKey: 'room', label: 'Room 1', ownerCustomerId: 'cust-1' }))
      .rejects.toThrow(BadRequestException);
  });

  it('creates a component with a valid type and no owner', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
      componentCustomerSettings: { room: true },
    });
    mockPrisma.projectComponent.create.mockResolvedValue({ id: 'c-1', componentTypeKey: 'room', label: 'Room 1', ownerCustomerId: null });
    mockPrisma.equipment.groupBy.mockResolvedValue([]);
    mockPrisma.componentIssueReport.groupBy.mockResolvedValue([]);
    const result = await service.create('co-1', 'p-1', { componentTypeKey: 'room', label: 'Room 1' });
    expect(result.id).toBe('c-1');
  });

  it('404s when the project does not exist in this company', async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null);
    await expect(service.create('co-1', 'missing', { componentTypeKey: 'room', label: 'X' }))
      .rejects.toThrow(NotFoundException);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter crm-service test -- project-components.service`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `project-components.service.ts`** — direct rename of `houses.service.ts` (read it in full first, it is the reference implementation) with these behavioral changes:
  - `assertProjectIsHousingScheme` → `assertComponentType(companyId, projectId, componentTypeKey)`: loads the project, 404s if missing, `BadRequestException` if `componentTypesSnapshot` is null/empty or doesn't contain a type with that key, returns `{ project, componentType }`.
  - `create`/`update`: when `ownerCustomerId` is provided, additionally check `project.componentCustomerSettings?.[componentTypeKey] === true` (template eligibility already implied by the type existing in the snapshot at all — but the snapshot's own `customerAssignable` must ALSO be true, since a project can only narrow the template's ceiling, never widen it) — reject with `BadRequestException` if either the type's own `customerAssignable` is `false` or the project's `componentCustomerSettings[key]` is `false`.
  - `prisma.house` → `prisma.projectComponent`, `prisma.houseIssueReport` → `prisma.componentIssueReport`, `houseId` → `componentId` throughout.
  - `decorate()`: `equipment.groupBy({ by: ['componentId'], ... })` instead of `houseId`.
  - `generateOwnerAccount`: still calls `this.auth.provisionHouseOwnerAccount(...)` unchanged — that method is already generic (keyed by `customerId` only, the name is legacy) — do not rename it, just call it as-is.
  - `EquipmentService.resyncHouseEquipmentOwner` → `resyncComponentEquipmentOwner` (implemented in Task 6).

- [ ] **Step 4: Run to verify the tests pass**

Run: `pnpm --filter crm-service test -- project-components.service`
Expected: PASS, all 5 tests.

- [ ] **Step 5: Implement the controller** — direct rename of `houses.controller.ts` (`ProjectHousesController` → `ProjectComponentsController` at `projects/:projectId/components`, `HousesController` → `ComponentsController` at `components`), `UpsertHouseDto` gains `componentTypeKey: string` (required on create, `@IsString()`, not optional — every component must declare its type), all other DTOs/routes renamed mechanically (`:id/equipment`, `:id/issues`, `:id/owner`, `:id/generate-account`, `mine`, `mine/issues`, `issues/open`).

- [ ] **Step 6: Wire the module** (`project-components.module.ts`, imports `EquipmentModule` + `LocalAuthModule`, mirrors `houses.module.ts`) and register in `app.module.ts`, **remove** `HousesModule` from `app.module.ts`'s imports (kept as dead code on disk until Task 9, but not loaded).

- [ ] **Step 7: Run full crm-service test suite**

Run: `pnpm --filter crm-service test`
Expected: all pass.

---

### Task 6: Equipment service — `houseId` → `componentId` methods

**Files:**
- Modify: `apps/crm-service/src/equipment/equipment.service.ts`
- Modify: `apps/crm-service/src/equipment/equipment.controller.ts`
- Test: `apps/crm-service/src/equipment/equipment.service.spec.ts`

**Interfaces:**
- Produces: `EquipmentService.findByComponent(companyId, componentId)`, `.createForComponent(companyId, componentId, dto)`, `.resyncComponentEquipmentOwner(companyId, componentId, customerId)` — replacing `findByHouse`/`createForHouse`/`resyncHouseEquipmentOwner`, consumed by Task 5's `ProjectComponentsService` and `ProjectComponentsController`.

- [ ] **Step 1: Update the existing test file** — find every `findByHouse`/`createForHouse`/`resyncHouseEquipmentOwner`/`houseId` occurrence in `equipment.service.spec.ts` and rename to the `Component` equivalents, keeping the same assertions (this is a rename of existing passing tests, not new behavior — the equipment scan/photo/error-code logic from the 2026-07-22 design is completely untouched).

- [ ] **Step 2: Run to verify the renamed tests fail** (method doesn't exist yet)

Run: `pnpm --filter crm-service test -- equipment.service`
Expected: FAIL — `findByComponent is not a function` (or similar).

- [ ] **Step 3: Rename the three methods in `equipment.service.ts`**, body unchanged except `houseId`/`house` → `componentId`/`component`, `prisma.house.findFirst` → `prisma.projectComponent.findFirst`:

```ts
async findByComponent(companyId: string, componentId: string) {
  const items = await this.prisma.equipment.findMany({ where: { companyId, componentId } });
  return this.attachErrorCodes(items);
}

async createForComponent(companyId: string, componentId: string, dto: CreateEquipmentDto) {
  const component = await this.prisma.projectComponent.findFirst({ where: { id: componentId, companyId } });
  if (!component) throw new NotFoundException('Component not found');
  return this.prisma.equipment.create({
    data: { companyId, componentId, customerId: component.ownerCustomerId, ...dto },
  });
}

async resyncComponentEquipmentOwner(companyId: string, componentId: string, customerId: string) {
  await this.prisma.equipment.updateMany({
    where: { companyId, componentId },
    data: { customerId },
  });
}
```

(Read the actual current bodies in `equipment.service.ts` first — the above is the shape, not a verbatim replacement; preserve every existing line of logic those three methods already have, e.g. photo/scan field initialization, only the `house`→`component` naming changes.)

- [ ] **Step 4: Run to verify tests pass**

Run: `pnpm --filter crm-service test -- equipment.service`
Expected: PASS.

- [ ] **Step 5: Rename the corresponding calls in `equipment.controller.ts`** (`findByHouse` → `findByComponent` call sites — though note per Task 5 Step 5, the actual HTTP routes live on `ProjectComponentsController` now, not here; check whether `equipment.controller.ts` has its own house-scoped routes vs. is purely called-into by `houses.controller.ts` — if the latter, this step is a no-op beyond the method rename already covered by Task 5).

- [ ] **Step 6: Full crm-service suite**

Run: `pnpm --filter crm-service test`
Expected: all pass.

---

### Task 7: `projects.service.ts` / `projects.controller.ts` — template support + customer-settings endpoint

**Files:**
- Modify: `apps/crm-service/src/projects/projects.service.ts`
- Modify: `apps/crm-service/src/projects/projects.controller.ts`
- Modify: `apps/crm-service/src/projects/project-templates.ts` (keep or retire — see Step 1)
- Test: `apps/crm-service/src/projects/projects.service.spec.ts`

**Interfaces:**
- Consumes: `ProjectTemplatesService.findOne` (Task 4).
- Produces: `ProjectsService.create()` accepts `templateId?: string`; new `ProjectsService.updateCustomerSettings(companyId, projectId, settings)`; `decorate()` returns `componentCount` instead of the Housing-Scheme-only `openIssueCount` special-case.

- [ ] **Step 1: Retire `project-templates.ts`'s hardcoded registry.** `isValidTemplateType`/`PROJECT_TEMPLATES`/`templateType` validation is removed from `create()` — a project's structure now comes from an optional `templateId` looked up against `ProjectTemplatesService`, not a fixed string enum. Delete `apps/crm-service/src/projects/project-templates.ts` and its import in `projects.service.ts`.

- [ ] **Step 2: Write the failing test for template-based creation**

```ts
// add to projects.service.spec.ts, alongside existing tests
it('snapshots the template componentTypes and defaults customerCustomerSettings from them', async () => {
  mockPrisma.projectTemplate.findFirst.mockResolvedValue({
    id: 'tpl-1', companyId: 'co-1',
    componentTypes: [
      { key: 'room', label: 'Room', customerAssignable: true },
      { key: 'pool', label: 'Pool', customerAssignable: false },
    ],
  });
  mockPrisma.project.create.mockResolvedValue({ id: 'p-1' });

  await service.create('co-1', { name: 'Grand Hotel', templateId: 'tpl-1' });

  expect(mockPrisma.project.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({
      templateId: 'tpl-1',
      componentTypesSnapshot: [
        { key: 'room', label: 'Room', customerAssignable: true },
        { key: 'pool', label: 'Pool', customerAssignable: false },
      ],
      componentCustomerSettings: { room: true, pool: false },
    }),
  }));
});

it('creates a freeform project with no template', async () => {
  mockPrisma.project.create.mockResolvedValue({ id: 'p-2' });
  await service.create('co-1', { name: 'One-off job' });
  expect(mockPrisma.projectTemplate.findFirst).not.toHaveBeenCalled();
  expect(mockPrisma.project.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ templateId: null, componentTypesSnapshot: null }),
  }));
});

it('rejects a templateId that does not belong to this company', async () => {
  mockPrisma.projectTemplate.findFirst.mockResolvedValue(null);
  await expect(service.create('co-1', { name: 'X', templateId: 'not-mine' }))
    .rejects.toThrow(NotFoundException);
});
```

- [ ] **Step 3: Run to verify failure**

Run: `pnpm --filter crm-service test -- projects.service`
Expected: FAIL (behavior doesn't exist yet).

- [ ] **Step 4: Implement in `projects.service.ts`'s `create()`** — after existing field assembly, before the `prisma.project.create` call:

```ts
let templateFields: { templateId: string | null; componentTypesSnapshot: any; componentCustomerSettings: any } =
  { templateId: null, componentTypesSnapshot: null, componentCustomerSettings: null };

if (input.templateId) {
  const template = await this.prisma.projectTemplate.findFirst({
    where: { id: input.templateId, companyId },
  });
  if (!template) throw new NotFoundException('Template not found');
  const types = template.componentTypes as Array<{ key: string; customerAssignable: boolean }>;
  templateFields = {
    templateId: template.id,
    componentTypesSnapshot: template.componentTypes,
    componentCustomerSettings: Object.fromEntries(types.map((t) => [t.key, t.customerAssignable])),
  };
}
```
...and spread `...templateFields` into the `data` object passed to `prisma.project.create`.

- [ ] **Step 5: Run to verify tests pass**

Run: `pnpm --filter crm-service test -- projects.service`
Expected: PASS.

- [ ] **Step 6: Add `updateCustomerSettings`** to `projects.service.ts`:

```ts
async updateCustomerSettings(companyId: string, projectId: string, settings: Record<string, boolean>) {
  const project = await this.prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) throw new NotFoundException('Project not found');
  const snapshot = (project.componentTypesSnapshot as Array<{ key: string; customerAssignable: boolean }> | null) ?? [];
  const validKeys = new Set(snapshot.map((t) => t.key));
  for (const key of Object.keys(settings)) {
    if (!validKeys.has(key)) throw new BadRequestException(`Unknown component type: ${key}`);
    const type = snapshot.find((t) => t.key === key)!;
    if (settings[key] && !type.customerAssignable) {
      throw new BadRequestException(`"${type.key}" is not customer-assignable on this project's template`);
    }
  }
  const merged = { ...(project.componentCustomerSettings as object ?? {}), ...settings };
  return this.prisma.project.update({ where: { id: projectId }, data: { componentCustomerSettings: merged } });
}
```

With a corresponding test asserting: unknown key rejected, attempting to turn ON a type the template marked `customerAssignable: false` rejected, valid partial update merges rather than replaces.

- [ ] **Step 7: Add the route to `projects.controller.ts`**

```ts
@Patch(':id/customer-settings')
@Roles(...STAFF_WRITE)
@ApiOperation({ summary: 'Turn per-component customer assignment on/off for this project (bounded by the template)' })
updateCustomerSettings(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: Record<string, boolean>) {
  return this.projects.updateCustomerSettings(user.companyId, id, dto);
}
```

- [ ] **Step 8: `decorate()`** — replace the `templateType === 'HOUSING_SCHEME'`-gated `openIssueCount` block with a generic componentCount, batched the same way:

```ts
const componentCounts = await this.prisma.projectComponent.groupBy({
  by: ['projectId'], where: { companyId, projectId: { in: projectIds } }, _count: { _all: true },
});
const componentCountByProject = new Map(componentCounts.map((c) => [c.projectId, c._count._all]));
// ...merge onto each decorated project as componentCount
```

- [ ] **Step 9: Full crm-service suite**

Run: `pnpm --filter crm-service test`
Expected: all pass.

---

### Task 8: `job-service` / `finance-service` — `houseId` param/DTO rename to `componentId`

**Files:**
- Modify: `apps/job-service/src/jobs/jobs.controller.ts`, `jobs.service.ts`, DTOs referencing `houseId`
- Modify: `apps/finance-service/src/quotes/*.ts`, `apps/finance-service/src/invoices/*.ts` referencing `houseId`
- Test: existing `*.spec.ts` files in both services that assert on `houseId` filtering

**Interfaces:**
- Produces: `?componentId=` query filters replacing `?houseId=` on `GET /jobs/jobs`, `GET /finance/quotes`, `GET /finance/invoices`; `componentId` accepted on create/update DTOs.

- [ ] **Step 1: Grep both services for every `houseId` occurrence** to get the exact list before editing:

Run: `grep -rn "houseId" apps/job-service/src apps/finance-service/src`

- [ ] **Step 2: Update the existing test files first** — rename `houseId` → `componentId` in every assertion/mock/fixture found in Step 1's grep, keeping the exact same test scenarios (filter-by-value, null handling, etc.) — this is a mechanical rename of already-passing tests.

- [ ] **Step 3: Run to verify the renamed tests fail**

Run: `pnpm --filter job-service test && pnpm --filter finance-service test`
Expected: FAIL on the renamed assertions (field doesn't exist under the new name yet).

- [ ] **Step 4: Apply the same rename to the actual source** — every DTO field, Prisma `where` clause key, and query-string param named `houseId` becomes `componentId`. No new logic, this is find-and-rename guided by Step 1's grep output.

- [ ] **Step 5: Run both suites to verify pass**

Run: `pnpm --filter job-service test && pnpm --filter finance-service test`
Expected: PASS, same counts as before Task 8 started.

- [ ] **Step 6: Type-check both services**

Run: `pnpm --filter job-service type-check && pnpm --filter finance-service type-check`
Expected: no errors.

---

### Task 9: Cleanup — remove `House`/`HouseIssueReport`, old `houses` module, drop legacy columns

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma` (remove `House`, `HouseIssueReport` models, `houseId` fields on `Equipment`/`Project`)
- Delete: `apps/crm-service/src/houses/` (entire directory — controller, service, module, specs)
- Modify: `scripts/apply-migrations.mjs` (add the drop/rename migration)
- Modify: `apps/job-service/prisma/schema.prisma`, `apps/finance-service/prisma/schema.prisma`, `apps/crm-service/prisma/schema.prisma` (remove old `houseId` fields on `Job`/`Quote`/`Invoice`/`ServiceAgreement`)

**Interfaces:**
- Consumes: Task 2's verification gate must have passed (27=27, 5=5) and this codebase must have been running on the new `project-components` path (Tasks 4-8) for at least one verified deploy cycle before this task runs — this is the irreversible step, do it last and deliberately, not as part of the same session as Task 2.

- [ ] **Step 1: Add the rename-not-drop migration** (per the design's explicit caution — keep the old data recoverable for one deploy cycle rather than a hard `DROP TABLE`):

```js
{
  schema: 'crm',
  name: '20260814000003_deprecate_houses_table',
  sql: `
ALTER TABLE "crm"."houses" RENAME TO "houses_deprecated_20260814";
ALTER TABLE "crm"."house_issue_reports" RENAME TO "house_issue_reports_deprecated_20260814";
ALTER TABLE "crm"."equipment" DROP COLUMN IF EXISTS "houseId";
ALTER TABLE "crm"."projects" DROP COLUMN IF EXISTS "templateType";
ALTER TABLE "crm"."service_agreements" DROP COLUMN IF EXISTS "houseId";
  `.trim(),
},
```

```js
// jobs schema
{ schema: 'jobs', name: '20260814000001_drop_job_house_id', sql: `ALTER TABLE "jobs"."jobs" DROP COLUMN IF EXISTS "houseId";`.trim() },
```

```js
// finance schema
{ schema: 'finance', name: '20260814000001_drop_quote_invoice_house_id', sql: `
ALTER TABLE "finance"."Quote" DROP COLUMN IF EXISTS "houseId";
ALTER TABLE "finance"."Invoice" DROP COLUMN IF EXISTS "houseId";
`.trim() },
```

- [ ] **Step 2: Remove the corresponding fields from all four `schema.prisma` files**, run `npx prisma generate` in each of `crm-service`/`job-service`/`finance-service`.

- [ ] **Step 3: Delete `apps/crm-service/src/houses/`** and its import/registration in `app.module.ts` (already removed from the `imports` array in Task 5 Step 6 — this step deletes the now-fully-dead files from disk).

- [ ] **Step 4: Run the migration and full test suites for all three services**

Run: `node scripts/apply-migrations.mjs && pnpm --filter crm-service test && pnpm --filter job-service test && pnpm --filter finance-service test`
Expected: migration applies cleanly, all suites pass.

- [ ] **Step 5: Re-run the same spot-check query style from Task 2/3 against the live data one final time** to confirm the renamed tables still hold all 27/5/5 rows and every `componentId` still resolves — this is the last chance to catch a problem before the old `houses` naming is gone from the schema entirely.

---

### Task 10: Frontend data layer — `projectsApi.ts` template types + new `templatesApi.ts`

**Files:**
- Modify: `apps/admin-dashboard/src/pages/projects/projectsApi.ts`
- Create: `apps/admin-dashboard/src/pages/projects/templatesApi.ts`

**Interfaces:**
- Produces: `ProjectTemplate` type, `useProjectTemplates()`, `useCreateTemplate()`, `useUpdateTemplate()`, `useDeleteTemplate()` (in `templatesApi.ts`); `Project.templateId: string | null`, `Project.componentTypesSnapshot: ComponentTypeMeta[] | null`, `Project.componentCustomerSettings: Record<string, boolean> | null` (in `projectsApi.ts`), `useUpdateCustomerSettings(projectId)`.

- [ ] **Step 1: Create `templatesApi.ts`** following `housesApi.ts`'s exact structure (interface, `mapX` function, query hooks, mutation hooks with `invalidateQueries`):

```ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '../../lib/queryClient'
import api from '../../lib/api'

export interface ComponentTypeMeta {
  key: string
  label: string
  icon?: string
  customerAssignable: boolean
}

export interface ProjectTemplate {
  id: string
  companyId: string
  name: string
  description?: string | null
  componentTypes: ComponentTypeMeta[]
  isBuiltIn: boolean
  createdAt: string
}

function mapTemplate(raw: any): ProjectTemplate {
  return {
    id: raw.id,
    companyId: raw.companyId,
    name: raw.name,
    description: raw.description ?? null,
    componentTypes: raw.componentTypes ?? [],
    isBuiltIn: !!raw.isBuiltIn,
    createdAt: raw.createdAt,
  }
}

export function useProjectTemplates() {
  return useQuery<ProjectTemplate[]>({
    queryKey: ['project-templates'],
    queryFn: async () => ((await api.get('/crm/project-templates')).data ?? []).map(mapTemplate),
    staleTime: 30 * 1000,
  })
}

export interface UpsertTemplateInput {
  name: string
  description?: string
  componentTypes: ComponentTypeMeta[]
}

export function useCreateTemplate() {
  return useMutation({
    mutationFn: async (input: UpsertTemplateInput) => mapTemplate((await api.post('/crm/project-templates', input)).data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-templates'] }),
  })
}

export function useUpdateTemplate() {
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<UpsertTemplateInput> & { id: string }) =>
      mapTemplate((await api.patch(`/crm/project-templates/${id}`, input)).data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-templates'] }),
  })
}

export function useDeleteTemplate() {
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/crm/project-templates/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-templates'] }),
  })
}
```

- [ ] **Step 2: In `projectsApi.ts`** — remove `ProjectTemplateType`/`PROJECT_TEMPLATE_META` (the hardcoded STANDARD/HOUSING_SCHEME union), add to the `Project` interface: `templateId: string | null`, `componentTypesSnapshot: ComponentTypeMeta[] | null`, `componentCustomerSettings: Record<string, boolean> | null`, `componentCount?: number` (replacing `openIssueCount`'s old Housing-Scheme-only role — check whether `openIssueCount` is still separately meaningful post-migration and keep it if so, since open issues are now generic too). Update `mapProject`'s raw-field reads accordingly. Add:

```ts
export function useUpdateCustomerSettings(projectId: string) {
  return useMutation({
    mutationFn: async (settings: Record<string, boolean>) =>
      (await api.patch(`/crm/projects/${projectId}/customer-settings`, settings)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', projectId] }),
  })
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: fails at this point — call sites in `ProjectEditorModal.tsx`/`HousesTab.tsx`/`ProjectDetail.tsx` still reference the removed `ProjectTemplateType`/`PROJECT_TEMPLATE_META`. This is expected; Tasks 11-13 fix those call sites. Confirm the *specific* errors are only in those three files (not a typo elsewhere) before moving on.

---

### Task 11: Frontend — `componentsApi.ts` (replaces `housesApi.ts`)

**Files:**
- Create: `apps/admin-dashboard/src/pages/projects/componentsApi.ts`
- Delete: `apps/admin-dashboard/src/pages/projects/housesApi.ts` (after Task 13 removes its last caller)

**Interfaces:**
- Produces: every hook `housesApi.ts` had, renamed `house`→`component` (`useComponents(projectId)`, `useComponent(id)`, `useComponentEquipment`, `useComponentIssues`, `useCreateComponent(projectId)`, `useUpdateComponent(projectId)`, `useDeleteComponent(projectId)`, `useAssignOwner(projectId)`, `useGenerateOwnerAccount(projectId)`, plus the equipment/error-code/issue mutation hooks) — a mechanical 1:1 rename of `housesApi.ts` (read it in full — already shown above in this plan's exploration — it is the reference implementation), with one addition: `ProjectComponent.componentTypeKey: string` on the interface and `UpsertComponentInput`, and `useComponents` filters by `?type=` when passed.

- [ ] **Step 1: Copy `housesApi.ts` to `componentsApi.ts`**, rename every `House`/`house` identifier to `Component`/`component`, every `/crm/houses` route to `/crm/components`, every `/crm/projects/:id/houses` to `/crm/projects/:id/components`, add `componentTypeKey` to the `ProjectComponent` interface and `UpsertComponentInput`. Add an optional `type?: string` param to `useComponents(projectId, type?)` appending `?type=` to the request when set.

- [ ] **Step 2: Type-check just this file's exports compile** (full app build still fails until Tasks 12-13, this step just confirms `componentsApi.ts` itself is internally consistent)

Run: `cd apps/admin-dashboard && npx tsc --noEmit -p . 2>&1 | grep componentsApi`
Expected: no output (no errors originating from `componentsApi.ts` itself).

---

### Task 12: Frontend — Template Library page + `ProjectEditorModal.tsx` dynamic picker

**Files:**
- Create: `apps/admin-dashboard/src/pages/projects/TemplatesPage.tsx`
- Modify: `apps/admin-dashboard/src/pages/projects/ProjectEditorModal.tsx`
- Modify: `apps/admin-dashboard/src/App.tsx` (route for the new page, if Projects uses top-level routing — check existing `/projects` route registration pattern first)

**Interfaces:**
- Consumes: `useProjectTemplates`, `useCreateTemplate`, `useUpdateTemplate`, `useDeleteTemplate` from Task 10.
- Produces: `/projects/templates` route rendering `TemplatesPage`.

- [ ] **Step 1: Build `TemplatesPage.tsx`** — list view (`useProjectTemplates()`) rendered as cards: name, description, built-in badge if `isBuiltIn`, component-type pill list, edit/duplicate/delete actions (delete disabled + tooltipped for built-ins, matching the backend's `isBuiltIn` rejection). "New Template" button opens a modal: name input, description textarea, a repeatable row editor for `componentTypes` (label input, "customer assignable" checkbox, remove-row button, "Add component type" button appending a blank row) — on submit, calls `useCreateTemplate().mutate({ name, description, componentTypes })`.

- [ ] **Step 2: In `ProjectEditorModal.tsx`** — remove the fixed `Object.keys(PROJECT_TEMPLATE_META)` card grid. Replace with: `useProjectTemplates()` to list the company's templates, rendered as the same card style (reuse existing card CSS/layout, just driven by the query instead of a hardcoded object), plus one static "No template (freeform)" card always first. Selecting a template sets `form.templateId`; selecting "No template" sets it to `undefined`. Add a "Manage templates" text link near the picker that navigates to `/projects/templates`. `save()`'s create payload sends `templateId: form.templateId || undefined` instead of the old `templateType`.

- [ ] **Step 3: Build**

Run: `pnpm --filter admin-dashboard build`
Expected: no errors originating from `TemplatesPage.tsx` or `ProjectEditorModal.tsx` (errors in `HousesTab.tsx`/`ProjectDetail.tsx` still expected until Task 13).

---

### Task 13: Frontend — `ComponentsTab.tsx` (replaces `HousesTab.tsx`) + `ProjectDetail.tsx` Settings section

**Files:**
- Create: `apps/admin-dashboard/src/pages/projects/ComponentsTab.tsx`
- Delete: `apps/admin-dashboard/src/pages/projects/HousesTab.tsx` (after this task's rewrite is verified)
- Modify: `apps/admin-dashboard/src/pages/projects/ProjectDetail.tsx`
- Delete: `apps/admin-dashboard/src/pages/projects/housesApi.ts` (now unreferenced)

**Interfaces:**
- Consumes: `componentsApi.ts` (Task 11), `useUpdateCustomerSettings` (Task 10).

- [ ] **Step 1: Build `ComponentsTab.tsx`** starting from `HousesTab.tsx` as the structural reference (read it in full first — 1541 lines, same visual/interaction language must carry over: card list, `EquipmentDetailModal`-style detail panel with photo upload/AI-scan/error-codes, owner-gated Jobs/Quotes/Invoices/Agreements sub-tabs, deep-link support). Changes from the reference:
  - Header row gets a component-type filter chip bar, one chip per entry in `project.componentTypesSnapshot`, plus "All."
  - "Add component" modal includes a type selector (required) sourced from `project.componentTypesSnapshot`, in addition to the existing label/address/tags/notes/optional-owner fields. The owner picker only renders if the selected type's `customerAssignable` is `true` **and** `project.componentCustomerSettings[selectedType] === true` — otherwise it's hidden entirely (not just disabled).
  - Every `useHouse*` hook call becomes the `useComponent*` equivalent from `componentsApi.ts`.
  - Row/card rendering shows the component's type label (from the snapshot) as an icon+text badge alongside the existing label/owner/equipment-count display.

- [ ] **Step 2: In `ProjectDetail.tsx`** — replace the `project.templateType === 'HOUSING_SCHEME'`-gated "Houses" tab entry with `project.templateId ? [{ key: 'components', label: 'Components', icon: LayoutGrid }] : []` rendering `ComponentsTab`. Remove the never-built `HOTEL`/`'areas'` conditional entirely (it references a tab that was never implemented — confirm via grep it has no other effect before deleting). Add a "Settings" section (either its own tab or a collapsible block in Overview — follow whichever pattern this file already uses for similar secondary sections) rendering one toggle per `project.componentTypesSnapshot` entry where `customerAssignable === true`, bound to `project.componentCustomerSettings[key]`, calling `useUpdateCustomerSettings(project.id).mutate({ [key]: newValue })` on change.

- [ ] **Step 3: Build**

Run: `pnpm --filter admin-dashboard build`
Expected: no errors in these two files. Check remaining errors — likely `ProjectJobLinkPicker.tsx`, `AddJobModal.tsx`, customer sidebar, job detail modal/table still referencing `House`/`houseId` (handled in Task 14).

- [ ] **Step 4: Delete `HousesTab.tsx` and `housesApi.ts`** once `ComponentsTab.tsx` is confirmed to be the only tab rendered for templated projects.

- [ ] **Step 5: Manual verification against the 5 real migrated projects** — open each of "Cinnamon Gardens Villas," "Homie Home Project," "Radisson Collection - Talpe," "Apartment Galle," "Lush Residencies" in the running admin-dashboard, confirm: the Components tab renders all migrated houses as "House"-typed components with their original owners, equipment counts match pre-migration, opening a component shows its equipment/jobs/quotes/invoices exactly as before.

---

### Task 14: Remaining `House`/`houseId` references — chips, pickers, customer portal

**Files:**
- Modify: `apps/admin-dashboard/src/components/ProjectJobLinkPicker.tsx`
- Modify: `apps/admin-dashboard/src/pages/jobs/AddJobModal.tsx`
- Modify: any Customer Details sidebar / Job detail modal / jobs table file rendering a "House" chip (found via grep in Step 1)
- Modify: `apps/customer-portal/src/types/api.ts`, `useMyHouse.ts` → rename to `useMyComponent.ts`, `useMyFinance.ts`, `useMyJobs.ts`, `useMyAgreements.ts`, `pages/MyHouse.tsx` → rename to `pages/MyComponent.tsx`, `pages/Agreements.tsx`, `pages/invoices/Invoices.tsx`, `pages/quotes/Quotes.tsx`, `pages/jobs/BookServiceModal.tsx`, `pages/jobs/Jobs.tsx`, `pages/Dashboard.tsx`

**Interfaces:**
- Consumes: nothing new — pure rename propagation from Tasks 8/11.

- [ ] **Step 1: Full grep across both frontends for remaining references**

Run: `grep -rln "houseId\|useHouse\|/houses\b\|HouseIssue" apps/admin-dashboard/src apps/customer-portal/src`
Expected output becomes the exact file list to work through in this task — do not rely on the file list above alone, this grep is the source of truth at execution time.

- [ ] **Step 2: For each admin-dashboard file** — rename `houseId` prop/param names to `componentId`, "House" chip labels to generic "Component" (or the resolved type label where available, e.g. render `component.componentTypeKey` capitalized as a fallback), `/crm/houses/*` API calls to `/crm/components/*` (via `componentsApi.ts`).

- [ ] **Step 3: For customer-portal** — `useMyHouse.ts` → `useMyComponent.ts` calling `GET /crm/components/mine` (still customer-scoped exactly as `/crm/houses/mine` was); `MyHouse.tsx` page → `MyComponent.tsx`, sidebar nav label "My House" → "My Property" (or keep "My House" if the customer's only component type is still literally a house — check whether the nav label should be dynamic per the component's `componentTypeKey`/label; if uncertain, keep static "My Property" as the safe generic default). Same `houseId`→`componentId` rename through `useMyFinance.ts`/`useMyJobs.ts`/`useMyAgreements.ts`/`Jobs.tsx`/`BookServiceModal.tsx`/`Invoices.tsx`/`Quotes.tsx`/`Dashboard.tsx`.

- [ ] **Step 4: Build both frontends**

Run: `pnpm --filter admin-dashboard build && pnpm --filter customer-portal build`
Expected: both succeed with zero errors.

- [ ] **Step 5: Manual smoke test** — log into the customer portal as one of the 27 migrated house owners (via dev bypass headers or a real seeded login), confirm "My Property"/component view, jobs, invoices, quotes, agreements all render exactly as they did before the migration.

---

## Self-Review Notes (already applied above, recorded for the executor)

- **Spec coverage**: every section of `2026-08-14-project-component-templates-design.md` has a corresponding task — Core concepts (Task 1/7/12), Data model (Task 1-3), Customer assignment two tiers (Task 5/7/13), Migration (Task 2/9), Backend APIs (Task 4-8), Admin UI (Task 12-14), Customer portal (Task 14), Testing (embedded per-task), Out of scope items are NOT implemented anywhere in this plan (confirmed: no nesting, no drag-reorder, no template versioning, no bulk component creation, no occupancy tracking).
- **Type consistency**: `ComponentTypeMeta`/`ComponentTypeInput`/`ComponentTypeDto` all share the same field shape (`key, label, icon?, customerAssignable`) across backend DTO (Task 4), service input type (Task 4/7), and frontend type (Task 10) — verified consistent.
- **Ordering**: Task 9 (irreversible drop) is explicitly sequenced after Tasks 4-8 (new path fully built and tested) and flagged to run as its own deliberate step, not bundled with Task 2's initial migration — this is intentional given the real production data at stake.
