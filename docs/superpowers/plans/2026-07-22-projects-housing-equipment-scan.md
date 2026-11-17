# Projects/Housing Scheme UX + Equipment Photo AI Scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a project's customer optional (settable later), let a house's owner be set at creation time, and add an equipment photo upload that triggers a background AI (OpenAI `gpt-4o` vision) scan to suggest nameplate fields and a structured error-code list for the admin to review.

**Architecture:** All changes live in `apps/crm-service` (Prisma schema + NestJS controllers/services) and `apps/admin-dashboard` (TanStack Query hooks + React modals). The new AI scan is a fire-and-forget background call from `EquipmentService.uploadImage`, backed by a new `EquipmentScanService` wrapping the OpenAI SDK (already used elsewhere in this monorepo, in `chat-service`). Migrations are applied via the repo's existing `scripts/apply-migrations.mjs` script (raw SQL over `pg`), never `prisma migrate dev` — that command wants to reset the `crm` schema because of pre-existing drift.

**Tech Stack:** NestJS 10, Prisma 5 (Postgres, schema `crm`), `openai` npm package v4, `@aws-sdk/client-s3` (existing `StorageService`), React 19 + TanStack Query, `class-validator`.

## Global Constraints

- Every table/query stays scoped by `companyId` — never trust a bare `:id` param without a company-scoped lookup first.
- Money/date conventions, `clampPagination`, and all other repo-wide conventions in `CLAUDE.md` apply; none of this work touches money.
- `@Post()` routes default to HTTP 201; use `@HttpCode(HttpStatus.OK)` only where the plan explicitly says so.
- Do **not** run `prisma migrate dev` against the `crm` schema — apply schema changes only via `scripts/apply-migrations.mjs`, and keep `schema.prisma` in sync for `prisma generate` / documentation purposes.
- Do not commit anything unless explicitly told to — the user must say so first.
- Roles for all new staff-only endpoints: `Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER` (matches `STAFF_WRITE` in `houses.controller.ts` / `projects.controller.ts`).

---

## File Structure

**Backend (`apps/crm-service/src`)**
- Modify: `prisma/schema.prisma` — `Project.customerId` nullable; `Equipment` gains image/scan columns + `errorCodes` relation; new `EquipmentErrorCode` model.
- Modify: `../../../scripts/apply-migrations.mjs` — one new migration entry (crm schema) with all the SQL for this plan.
- Modify: `projects/projects.controller.ts` — `CreateProjectDto.customerId` optional, `UpdateProjectDto` gains `customerId`.
- Modify: `projects/projects.service.ts` — `create()`/`update()`/`decorate()` handle a nullable `customerId`.
- Modify: `houses/houses.controller.ts` — `UpsertHouseDto` gains `ownerCustomerId`.
- Modify: `houses/houses.service.ts` — `create()` accepts and validates `ownerCustomerId`.
- Modify: `equipment/equipment.service.ts` — `uploadImage`, `addErrorCode`, `removeErrorCode`, `listErrorCodes`, `attachErrorCodes`; `findByHouse`/`findByCustomer` return `errorCodes`.
- Create: `equipment/equipment-scan.service.ts` — OpenAI vision call, fire-and-forget-safe.
- Modify: `equipment/equipment.controller.ts` — new `EquipmentItemController` (`/equipment/:id/image`, `/equipment/:id/error-codes`, `/equipment/:id/error-codes/:codeId`).
- Modify: `equipment/equipment.module.ts` — register `EquipmentScanService`, `EquipmentItemController`, import `StorageModule`.
- Modify: `package.json` (crm-service) — add `openai` dependency.
- Test: `projects/projects.service.spec.ts`, `houses/houses.service.spec.ts`, `equipment/equipment.service.spec.ts` (new), `equipment/equipment-scan.service.spec.ts` (new).

**Frontend (`apps/admin-dashboard/src`)**
- Modify: `pages/projects/projectsApi.ts` — `Project.customerId`/`customerName` nullable.
- Modify: `pages/projects/ProjectEditorModal.tsx` — customer optional at creation.
- Modify: `pages/projects/ProjectDetail.tsx` — "Add customer" inline picker in the header when `customerId` is null.
- Modify: `pages/projects/housesApi.ts` — `UpsertHouseInput.ownerCustomerId`; `HouseEquipment` gains image/scan/errorCodes fields; new upload/error-code mutation hooks; `useHouseEquipment` polls while scanning.
- Modify: `pages/projects/HousesTab.tsx` — `AddHouseModal` gets an optional owner picker; `EquipmentDetailModal` gets the Photo section + suggestion review + error-code list.

---

### Task 1: Backend — Project customer becomes optional

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma:651` (`Project.customerId`)
- Modify: `apps/crm-service/src/projects/projects.controller.ts:13-31` (`CreateProjectDto`), `:33-48` (`UpdateProjectDto`)
- Modify: `apps/crm-service/src/projects/projects.service.ts:92-128` (`create`), `:130-147` (`update`), `:314-324` (`decorate`)
- Modify: `scripts/apply-migrations.mjs`
- Test: `apps/crm-service/src/projects/projects.service.spec.ts`

**Interfaces:**
- Produces: `ProjectsService.create(companyId, input: UpsertProjectInput)` now accepts `input.customerId` as `undefined`. `ProjectsService.update(companyId, id, input)` now accepts and persists `input.customerId` (a non-empty string only — no "clear to null" support).

- [ ] **Step 1: Write the failing tests**

Add to `apps/crm-service/src/projects/projects.service.spec.ts` (after the existing `'create rejects a customer from another company'` test):

```typescript
  it('create allows a missing customerId (project created without a customer)', async () => {
    prisma.project.create.mockResolvedValue({ id: 'p1', companyId: CO, customerId: null, name: 'Tower' });
    const result = await service.create(CO, { name: 'Tower' });
    expect(prisma.customer.findFirst).not.toHaveBeenCalled();
    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ customerId: null }) }),
    );
    expect(result.customerId).toBeNull();
  });

  it('update sets customerId when provided and validates it belongs to the company', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: 'p1', companyId: CO });
    prisma.customer.findFirst.mockResolvedValue(null);
    await expect(
      service.update(CO, 'p1', { customerId: 'cust-other' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('update persists a valid customerId', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: 'p1', companyId: CO });
    prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1' });
    prisma.project.update.mockResolvedValue({ id: 'p1', companyId: CO, customerId: 'cust-1' });
    await service.update(CO, 'p1', { customerId: 'cust-1' });
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: expect.objectContaining({ customerId: 'cust-1' }),
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter crm-service test -- projects.service.spec.ts`
Expected: FAIL — `create allows a missing customerId` fails because `create()` currently throws `BadRequestException('customerId is required')`; `update sets customerId` fails because `update()` silently drops `customerId` (not in the copied-field list) and never validates it.

- [ ] **Step 3: Update the Prisma schema**

In `apps/crm-service/prisma/schema.prisma`, change line 651:

```prisma
  customerId        String
```
to:
```prisma
  customerId        String?
```

- [ ] **Step 4: Add the migration SQL**

In `scripts/apply-migrations.mjs`, add a new entry to the `migrations` array (after the `20260713000000_add_house_equipment_link` entry, before the closing `];`):

```javascript
  // ── CRM: optional project customer + house owner-at-creation + equipment photo/AI scan
  //    (spec: docs/superpowers/specs/2026-07-22-projects-housing-equipment-scan-design.md) ──
  {
    schema: 'crm',
    name: '20260722000000_optional_customer_and_equipment_scan',
    sql: `
ALTER TABLE "crm"."projects" ALTER COLUMN "customerId" DROP NOT NULL;

ALTER TABLE "crm"."equipment"
  ADD COLUMN IF NOT EXISTS "image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "image_scan_status" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "image_scan_result" JSONB,
  ADD COLUMN IF NOT EXISTS "image_scan_error" TEXT;

CREATE TABLE IF NOT EXISTS "crm"."equipment_error_codes" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "meaning" TEXT,
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "equipment_error_codes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "equipment_error_codes_equipmentId_fkey" FOREIGN KEY ("equipmentId")
    REFERENCES "crm"."equipment"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "equipment_error_codes_equipmentId_idx" ON "crm"."equipment_error_codes"("equipmentId");
CREATE INDEX IF NOT EXISTS "equipment_error_codes_companyId_idx" ON "crm"."equipment_error_codes"("companyId");
    `.trim(),
  },
```

(This single migration covers Tasks 1, 3, 5, 6, 7 — it's one SQL script, run once. Later tasks reference it but don't add another entry.)

- [ ] **Step 5: Update `CreateProjectDto` / `UpdateProjectDto`**

In `apps/crm-service/src/projects/projects.controller.ts`, change line 14:

```typescript
  @IsString() customerId!: string;
```
to:
```typescript
  @IsOptional() @IsString() customerId?: string;
```

And add to `UpdateProjectDto` (after line 34, `name` field):

```typescript
  @IsOptional() @IsString() customerId?: string;
```

- [ ] **Step 6: Update `ProjectsService.create()`**

In `apps/crm-service/src/projects/projects.service.ts`, replace lines 92-105:

```typescript
  async create(companyId: string, input: UpsertProjectInput) {
    if (!input.customerId) throw new BadRequestException('customerId is required');
    if (!input.name?.trim()) throw new BadRequestException('name is required');
    this.validateStatus(input.status);
    this.validateWorkingDays(input.workingDays);
    if (input.templateType !== undefined && !isValidTemplateType(input.templateType)) {
      throw new BadRequestException(`templateType must be one of ${PROJECT_TEMPLATES.join(', ')}`);
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: input.customerId, companyId },
      select: { id: true },
    });
    if (!customer) throw new BadRequestException('Customer not found in this company');
```

with:

```typescript
  async create(companyId: string, input: UpsertProjectInput) {
    if (!input.name?.trim()) throw new BadRequestException('name is required');
    this.validateStatus(input.status);
    this.validateWorkingDays(input.workingDays);
    if (input.templateType !== undefined && !isValidTemplateType(input.templateType)) {
      throw new BadRequestException(`templateType must be one of ${PROJECT_TEMPLATES.join(', ')}`);
    }

    if (input.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: input.customerId, companyId },
        select: { id: true },
      });
      if (!customer) throw new BadRequestException('Customer not found in this company');
    }
```

Then change line 110 (`customerId: input.customerId,`) to:

```typescript
        customerId: input.customerId ?? null,
```

- [ ] **Step 7: Update `ProjectsService.update()`**

In `apps/crm-service/src/projects/projects.service.ts`, replace the `update` method body (lines 130-147):

```typescript
  async update(companyId: string, id: string, input: UpsertProjectInput) {
    await this.assertExists(companyId, id);
    this.validateStatus(input.status);
    this.validateWorkingDays(input.workingDays);

    if (input.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: input.customerId, companyId },
        select: { id: true },
      });
      if (!customer) throw new BadRequestException('Customer not found in this company');
    }

    const data: any = {};
    for (const key of [
      'customerId', 'name', 'description', 'category', 'status', 'budget', 'requiredHeadcount',
      'siteAddress', 'latitude', 'longitude', 'workingDays', 'baseTeamUserIds', 'notes',
    ] as const) {
      if (input[key] !== undefined) data[key] = input[key];
    }
    if (input.startDate !== undefined) data.startDate = input.startDate ? new Date(input.startDate) : null;
    if (input.targetEndDate !== undefined) data.targetEndDate = input.targetEndDate ? new Date(input.targetEndDate) : null;
    if (typeof data.name === 'string') data.name = data.name.trim();

    return this.prisma.project.update({ where: { id }, data });
  }
```

- [ ] **Step 8: Update `decorate()` to handle null `customerId`**

In `apps/crm-service/src/projects/projects.service.ts`, replace lines 314-324:

```typescript
  /** Attach customerName so lists render without extra round-trips. */
  private async decorate(companyId: string, projects: any[]) {
    if (projects.length === 0) return [];
    const customerIds = [...new Set(projects.map((p) => p.customerId).filter(Boolean))] as string[];
    const customers = customerIds.length
      ? await this.prisma.customer.findMany({
          where: { companyId, id: { in: customerIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const names = new Map(customers.map((c) => [c.id, `${c.firstName} ${c.lastName}`.trim()]));
    return projects.map((p) => ({ ...p, customerName: p.customerId ? (names.get(p.customerId) ?? '—') : null }));
  }
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `pnpm --filter crm-service test -- projects.service.spec.ts`
Expected: PASS (all tests, including the three new ones)

- [ ] **Step 10: Run full crm-service test suite and type-check**

Run: `pnpm --filter crm-service test && pnpm --filter crm-service type-check`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add apps/crm-service/prisma/schema.prisma apps/crm-service/src/projects scripts/apply-migrations.mjs
git commit -m "feat(crm): make project customer optional, settable via update"
```

---

### Task 2: Frontend — Project optional customer

**Files:**
- Modify: `apps/admin-dashboard/src/pages/projects/projectsApi.ts:67-97` (`Project` interface), `:182-206` (`mapApiProject`)
- Modify: `apps/admin-dashboard/src/pages/projects/ProjectEditorModal.tsx`
- Modify: `apps/admin-dashboard/src/pages/projects/ProjectDetail.tsx`

**Interfaces:**
- Consumes: `ProjectsService.update` now accepts `customerId` (Task 1). `useCustomers` hook from `../../hooks/useCustomers` (existing, used elsewhere in this file already for `useCustomer`).
- Produces: `Project.customerId: string | null`, `Project.customerName: string | null`.

- [ ] **Step 1: Update the `Project` type and mapper**

In `apps/admin-dashboard/src/pages/projects/projectsApi.ts`, change line 70-71:

```typescript
  customerId: string
  customerName: string
```
to:
```typescript
  customerId: string | null
  customerName: string | null
```

And change line 186-187 (inside `mapApiProject`):

```typescript
    customerId: raw.customerId,
    customerName: raw.customerName ?? '—',
```
to:
```typescript
    customerId: raw.customerId ?? null,
    customerName: raw.customerName ?? null,
```

- [ ] **Step 2: Relax validation in `ProjectEditorModal`**

In `apps/admin-dashboard/src/pages/projects/ProjectEditorModal.tsx`, change line 90:

```typescript
  const valid = form.name.trim() && (project ? true : !!form.customerId)
```
to:
```typescript
  const valid = !!form.name.trim()
```

Change the label at line 165 from `<label style={lbl}>Customer *</label>` to `<label style={lbl}>Customer</label>`, and after the closing `</select>` at line 178 (still inside the `!project` branch, before the closing `</>`), add:

```tsx
                  <p style={{ fontSize: 10.5, color: 'var(--t4)', margin: '6px 0 0' }}>
                    Optional — you can add a customer later from the project page.
                  </p>
```

For the edit-mode branch (line 167, `project ? (...)`), the disabled input currently reads `value={project.customerName}` — update to handle `null`:

```tsx
                <input style={{ ...inp, opacity: 0.7 }} value={project.customerName ?? 'No customer assigned'} disabled />
```

- [ ] **Step 3: Add the "Add customer" affordance to `ProjectDetail`'s header**

In `apps/admin-dashboard/src/pages/projects/ProjectDetail.tsx`, add `useCustomers` to the import on line 18:

```typescript
import { useCustomer, useCustomers } from '../../hooks/useCustomers'
```

Replace line 114:

```tsx
            <span>{project.customerName}</span>
```

with:

```tsx
            {project.customerName ? (
              <span>{project.customerName}</span>
            ) : (
              <ProjectCustomerPicker project={project} />
            )}
```

Add a new component after the `ProjectDetail` function's closing brace (after line 194, before the `// ── Overview ──` comment on line 196):

```tsx
// ── Add customer (header, when a project has none) ──────────────────────────
function ProjectCustomerPicker({ project }: { project: Project }) {
  const updateProject = useUpdateProject()
  const [picking, setPicking] = useState(false)
  const [search, setSearch] = useState('')
  const customersQ = useCustomers({ limit: 20, search: search || undefined })
  const { showSuccess, showError } = useToast()

  const pick = async (c: { id: string; firstName: string; lastName: string }) => {
    try {
      await updateProject.mutateAsync({ id: project.id, customerId: c.id })
      showSuccess(`${project.name} is now linked to ${c.firstName} ${c.lastName}.`.trim(), 'Customer added')
      setPicking(false)
      setSearch('')
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Could not set this customer', 'Add customer failed')
    }
  }

  if (!picking) {
    return (
      <button
        onClick={() => setPicking(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5,
          color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', padding: 0,
        }}
      >
        <UserPlus size={12} /> No customer assigned — Add customer
      </button>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        autoFocus
        placeholder="Search customers…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          fontSize: 12.5, padding: '4px 8px', borderRadius: 6,
          border: '1px solid var(--bd)', background: 'var(--bg-input, var(--bg-card))',
          color: 'var(--t1)', fontFamily: 'inherit', width: 220,
        }}
      />
      <div style={{
        position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 260, maxHeight: 200, overflowY: 'auto',
        background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 8, padding: 6, zIndex: 20,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}>
        {customersQ.isLoading ? (
          <div style={{ padding: 6, fontSize: 12, color: 'var(--t4)' }}>Searching…</div>
        ) : (customersQ.data?.data ?? []).length === 0 ? (
          <div style={{ padding: 6, fontSize: 12, color: 'var(--t4)' }}>No matching customers.</div>
        ) : (customersQ.data?.data ?? []).map((c: any) => (
          <button key={c.id} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
            onClick={() => pick(c)}>
            {c.firstName} {c.lastName}{c.companyName ? ` — ${c.companyName}` : ''}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => { setPicking(false); setSearch('') }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
```

`UserPlus` is already imported in `ProjectDetail.tsx` (line 14). `useToast` is already imported (line 17).

- [ ] **Step 4: Type-check and build**

Run: `pnpm --filter admin-dashboard build`
Expected: PASS (no TypeScript errors)

- [ ] **Step 5: Commit**

```bash
git add apps/admin-dashboard/src/pages/projects/projectsApi.ts apps/admin-dashboard/src/pages/projects/ProjectEditorModal.tsx apps/admin-dashboard/src/pages/projects/ProjectDetail.tsx
git commit -m "feat(admin): make project customer optional in the UI, add later from project header"
```

---

### Task 3: Backend — House owner optional at creation

**Files:**
- Modify: `apps/crm-service/src/houses/houses.controller.ts:12-17` (`UpsertHouseDto`)
- Modify: `apps/crm-service/src/houses/houses.service.ts:17-22` (`UpsertHouseInput`), `:44-60` (`create`)
- Test: `apps/crm-service/src/houses/houses.service.spec.ts`

**Interfaces:**
- Produces: `HousesService.create(companyId, projectId, input: UpsertHouseInput)` where `UpsertHouseInput` gains `ownerCustomerId?: string`.

- [ ] **Step 1: Write the failing test**

Add to `apps/crm-service/src/houses/houses.service.spec.ts`, inside the `describe('create', ...)` block (after the `'creates a house with no owner required'` test):

```typescript
    it('sets the owner at creation when ownerCustomerId is provided and valid', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, companyId: CO, templateType: 'HOUSING_SCHEME' });
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1' });
      prisma.house.create.mockResolvedValue({
        id: HOUSE_ID, companyId: CO, projectId: PROJECT_ID, label: 'House 1',
        ownerCustomerId: 'cust-1', tags: [], address: null, notes: null,
      });

      await service.create(CO, PROJECT_ID, { label: 'House 1', ownerCustomerId: 'cust-1' });

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({ where: { id: 'cust-1', companyId: CO } });
      expect(prisma.house.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ ownerCustomerId: 'cust-1' }) }),
      );
    });

    it('rejects an ownerCustomerId from another company at creation', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, companyId: CO, templateType: 'HOUSING_SCHEME' });
      prisma.customer.findFirst.mockResolvedValue(null);
      await expect(
        service.create(CO, PROJECT_ID, { label: 'House 1', ownerCustomerId: 'cust-other' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.house.create).not.toHaveBeenCalled();
    });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter crm-service test -- houses.service.spec.ts`
Expected: FAIL — `create()` doesn't read `ownerCustomerId` at all today, so `prisma.house.create` is called without it and `prisma.customer.findFirst` is never invoked.

- [ ] **Step 3: Update `UpsertHouseDto`**

In `apps/crm-service/src/houses/houses.controller.ts`, add to `UpsertHouseDto` (after line 16, `notes`):

```typescript
  @IsOptional() @IsString() ownerCustomerId?: string;
```

- [ ] **Step 4: Update `UpsertHouseInput` and `HousesService.create()`**

In `apps/crm-service/src/houses/houses.service.ts`, change the `UpsertHouseInput` interface (lines 17-22):

```typescript
export interface UpsertHouseInput {
  label?: string;
  address?: string | null;
  tags?: string[];
  notes?: string | null;
  ownerCustomerId?: string;
}
```

Replace the `create` method (lines 44-60):

```typescript
  async create(companyId: string, projectId: string, input: UpsertHouseInput) {
    await this.assertProjectIsHousingScheme(companyId, projectId);
    if (!input.label?.trim()) throw new BadRequestException('label is required');

    if (input.ownerCustomerId) {
      const customer = await this.prisma.customer.findFirst({ where: { id: input.ownerCustomerId, companyId } });
      if (!customer) throw new BadRequestException('Customer not found in this company');
    }

    const house = await this.prisma.house.create({
      data: {
        companyId,
        projectId,
        label: input.label.trim(),
        address: input.address ?? null,
        tags: input.tags ?? [],
        notes: input.notes ?? null,
        ownerCustomerId: input.ownerCustomerId ?? null,
      },
    });
    const [decorated] = await this.decorate(companyId, [house]);
    return decorated;
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter crm-service test -- houses.service.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/crm-service/src/houses
git commit -m "feat(crm): allow setting a house's owner at creation time"
```

---

### Task 4: Frontend — House owner picker in "Add house"

**Files:**
- Modify: `apps/admin-dashboard/src/pages/projects/housesApi.ts:209-224` (`UpsertHouseInput`, `useCreateHouse`)
- Modify: `apps/admin-dashboard/src/pages/projects/HousesTab.tsx:182-236` (`AddHouseModal`)

**Interfaces:**
- Consumes: `HousesService.create` (Task 3) accepting `ownerCustomerId`. `useCustomers` from `../../hooks/useCustomers` (already imported in this file, line 12).

- [ ] **Step 1: Add `ownerCustomerId` to `UpsertHouseInput`**

In `apps/admin-dashboard/src/pages/projects/housesApi.ts`, change lines 209-214:

```typescript
export interface UpsertHouseInput {
  label?: string
  address?: string
  tags?: string[]
  notes?: string
  ownerCustomerId?: string
}
```

- [ ] **Step 2: Add the owner picker to `AddHouseModal`**

In `apps/admin-dashboard/src/pages/projects/HousesTab.tsx`, replace the `AddHouseModal` function (lines 182-236):

```tsx
function AddHouseModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const createHouse = useCreateHouse(projectId)
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [error, setError] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [owner, setOwner] = useState<{ id: string; firstName: string; lastName: string } | null>(null)
  const [pickingOwner, setPickingOwner] = useState(false)
  const ownerCustomersQ = useCustomers({ limit: 20, search: ownerSearch || undefined })

  const save = async () => {
    if (!label.trim()) { setError('Give this house a name or unit number.'); return }
    try {
      await createHouse.mutateAsync({
        label: label.trim(),
        address: address.trim() || undefined,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        ownerCustomerId: owner?.id,
      })
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not add this house')
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card anim-fade-up" role="dialog" aria-modal="true" aria-label="Add house" style={{ width: 420, maxWidth: '100%', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="card-header">
          <div className="card-title">Add a house</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={lbl}>House / unit *</label>
            <input style={inp} value={label} placeholder="House 12, Lot 4B, Unit 201…" onChange={e => setLabel(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={lbl}>Address</label>
            <input style={inp} value={address} placeholder="Optional — street address or plot number" onChange={e => setAddress(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Tags</label>
            <input style={inp} value={tagsInput} placeholder="Comma-separated, e.g. Phase 1, Corner unit" onChange={e => setTagsInput(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Owner</label>
            {owner ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 9, border: '1px solid var(--bd)', background: 'var(--bg-card-2)' }}>
                <span style={{ fontSize: 12.5, color: 'var(--t1)' }}>{owner.firstName} {owner.lastName}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setOwner(null)}>Remove</button>
              </div>
            ) : pickingOwner ? (
              <div>
                <input style={{ ...inp, marginBottom: 6 }} value={ownerSearch} placeholder="Search customers…" autoFocus
                  onChange={e => setOwnerSearch(e.target.value)} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                  {ownerCustomersQ.isLoading ? (
                    <span style={{ fontSize: 12, color: 'var(--t4)' }}>Searching…</span>
                  ) : (ownerCustomersQ.data?.data ?? []).length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--t4)' }}>No matching customers.</span>
                  ) : (ownerCustomersQ.data?.data ?? []).map((c: any) => (
                    <button key={c.id} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}
                      onClick={() => { setOwner(c); setPickingOwner(false); setOwnerSearch('') }}>
                      {c.firstName} {c.lastName}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => setPickingOwner(true)}>Assign an owner now</button>
            )}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: 0 }}>
            {owner ? 'You can change the owner or add equipment after creating the house.' : 'Optional — you can assign an owner and add equipment after creating the house.'}
          </p>
          {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={createHouse.isPending}>
            {createHouse.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Add house
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
```

Add `useCustomers` to the existing import from `../../hooks/useCustomers` at line 12 (currently `import { useCustomers, useCustomer } from '../../hooks/useCustomers'` — already imports both, no change needed there).

- [ ] **Step 3: Type-check and build**

Run: `pnpm --filter admin-dashboard build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/admin-dashboard/src/pages/projects/housesApi.ts apps/admin-dashboard/src/pages/projects/HousesTab.tsx
git commit -m "feat(admin): optional owner picker when adding a house"
```

---

### Task 5: Backend — Equipment schema, dependency, and module wiring

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma` (`Equipment` model, new `EquipmentErrorCode` model)
- Modify: `apps/crm-service/package.json`
- Modify: `apps/crm-service/src/equipment/equipment.module.ts`

**Interfaces:**
- Produces: Prisma models `Equipment.imageUrl/imageScanStatus/imageScanResult/imageScanError/errorCodes` and `EquipmentErrorCode` — consumed by Task 6/7's services.

- [ ] **Step 1: Update the Prisma schema**

In `apps/crm-service/prisma/schema.prisma`, inside `model Equipment { ... }` (currently lines 408-437), add these fields after `manualUrl` (line 432) and before the closing `@@index` lines:

```prisma
  imageUrl        String?   @map("image_url")
  imageScanStatus String    @default("NONE") @map("image_scan_status") // NONE | SCANNING | DONE | FAILED
  imageScanResult Json?     @map("image_scan_result")
  imageScanError  String?   @map("image_scan_error")
  errorCodes      EquipmentErrorCode[]
```

Add a new model directly after `model Equipment { ... }` closes (after line 437):

```prisma
model EquipmentErrorCode {
  id          String    @id @default(uuid())
  companyId   String
  equipmentId String
  equipment   Equipment @relation(fields: [equipmentId], references: [id], onDelete: Cascade)
  code        String
  meaning     String?
  source      String    @default("MANUAL") // MANUAL | AI_SCAN
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([equipmentId])
  @@index([companyId])
  @@map("equipment_error_codes")
}
```

Run: `pnpm --filter crm-service exec prisma generate`
Expected: succeeds, regenerates the Prisma Client with the new fields/model (this does **not** touch the database — it only regenerates the TypeScript client from `schema.prisma`).

- [ ] **Step 2: Add the `openai` dependency**

In `apps/crm-service/package.json`, add to `"dependencies"` (alphabetical position, after `"nodemailer"`):

```json
    "openai": "^4.47.0",
```

Run: `pnpm install`
Expected: lockfile updates, `openai` resolves into `apps/crm-service/node_modules` (or the workspace root, per pnpm's hoisting).

- [ ] **Step 3: Wire `StorageModule` into `EquipmentModule`**

In `apps/crm-service/src/equipment/equipment.module.ts`, replace the file:

```typescript
import { Module } from '@nestjs/common';
import { EquipmentController, EquipmentItemController } from './equipment.controller';
import { EquipmentAutomationController } from './equipment-automation.controller';
import { EquipmentService } from './equipment.service';
import { EquipmentScanService } from './equipment-scan.service';
import { ConsumablesService } from './consumables.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [EquipmentController, EquipmentItemController, EquipmentAutomationController],
  providers: [EquipmentService, EquipmentScanService, ConsumablesService],
  exports: [EquipmentService, ConsumablesService],
})
export class EquipmentModule {}
```

(`EquipmentItemController` and `EquipmentScanService` don't exist yet — created in Tasks 6-7. This file won't compile until then, which is fine; the next two tasks complete it. Don't run a full build after this step alone.)

- [ ] **Step 4: Commit**

```bash
git add apps/crm-service/prisma/schema.prisma apps/crm-service/package.json apps/crm-service/src/equipment/equipment.module.ts pnpm-lock.yaml
git commit -m "chore(crm): add equipment image/scan schema and openai dependency"
```

---

### Task 6: Backend — `EquipmentScanService` (OpenAI vision call)

**Files:**
- Create: `apps/crm-service/src/equipment/equipment-scan.service.ts`
- Test: `apps/crm-service/src/equipment/equipment-scan.service.spec.ts`

**Interfaces:**
- Produces: `EquipmentScanService.scanAndStore(companyId: string, equipmentId: string, imageUrl: string): Promise<void>` — always resolves (internal try/catch), writes `imageScanStatus`/`imageScanResult`/`imageScanError` onto the `Equipment` row itself. Consumed by `EquipmentService.uploadImage` in Task 7.

- [ ] **Step 1: Write the failing test**

Create `apps/crm-service/src/equipment/equipment-scan.service.spec.ts`:

```typescript
const createMock = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: createMock } },
  }));
});

import { EquipmentScanService } from './equipment-scan.service';

function makePrisma() {
  return {
    equipment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  };
}

describe('EquipmentScanService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: EquipmentScanService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new EquipmentScanService(prisma as any);
    createMock.mockReset();
  });

  it('parses a successful scan and stores DONE with the result', async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        brand: 'Carrier', model: '58STA', serialNo: '1234ABC',
        errorCodes: [{ code: 'E4', meaning: 'Igniter failure' }],
      }) } }],
    });

    await service.scanAndStore('co-1', 'eq-1', 'https://example.com/photo.jpg');

    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'eq-1', companyId: 'co-1' },
      data: {
        imageScanStatus: 'DONE',
        imageScanResult: {
          brand: 'Carrier', model: '58STA', serialNo: '1234ABC',
          errorCodes: [{ code: 'E4', meaning: 'Igniter failure' }],
        },
        imageScanError: null,
      },
    });
  });

  it('defaults missing fields to null/empty when the model omits them', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: '{}' } }] });

    await service.scanAndStore('co-1', 'eq-1', 'https://example.com/photo.jpg');

    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'eq-1', companyId: 'co-1' },
      data: {
        imageScanStatus: 'DONE',
        imageScanResult: { brand: null, model: null, serialNo: null, errorCodes: [] },
        imageScanError: null,
      },
    });
  });

  it('marks FAILED and never throws when the OpenAI call rejects', async () => {
    createMock.mockRejectedValue(new Error('rate limited'));

    await expect(service.scanAndStore('co-1', 'eq-1', 'https://example.com/photo.jpg')).resolves.toBeUndefined();

    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'eq-1', companyId: 'co-1' },
      data: { imageScanStatus: 'FAILED', imageScanError: 'rate limited' },
    });
  });

  it('marks FAILED when the response content is not valid JSON', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: 'not json' } }] });

    await service.scanAndStore('co-1', 'eq-1', 'https://example.com/photo.jpg');

    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'eq-1', companyId: 'co-1' },
      data: expect.objectContaining({ imageScanStatus: 'FAILED' }),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter crm-service test -- equipment-scan.service.spec.ts`
Expected: FAIL with "Cannot find module './equipment-scan.service'"

- [ ] **Step 3: Write the implementation**

Create `apps/crm-service/src/equipment/equipment-scan.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

export interface EquipmentScanResult {
  brand: string | null;
  model: string | null;
  serialNo: string | null;
  errorCodes: { code: string; meaning: string }[];
}

const SCAN_PROMPT = `You are analyzing a photo of HVAC/mechanical/electrical equipment taken by a field technician or CRM admin. The photo may show a nameplate/data sticker (brand, model, serial number) and/or a fault/error code table printed on or near the unit.

Extract whatever is clearly legible. Respond with ONLY a JSON object of this exact shape:
{"brand": string|null, "model": string|null, "serialNo": string|null, "errorCodes": [{"code": string, "meaning": string}]}

If no nameplate is visible, set brand/model/serialNo to null. If no error code table is visible, return an empty errorCodes array. Never invent values that are not actually legible in the photo.`;

/**
 * Fire-and-forget scan runner — scanAndStore() always resolves (internal try/catch)
 * so callers can invoke it without awaiting and without risking an unhandled rejection.
 */
@Injectable()
export class EquipmentScanService {
  private readonly logger = new Logger(EquipmentScanService.name);
  private readonly client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private readonly model = process.env.OPENAI_MODEL_EQUIPMENT_SCAN ?? 'gpt-4o';

  constructor(private readonly prisma: PrismaService) {}

  async scanAndStore(companyId: string, equipmentId: string, imageUrl: string): Promise<void> {
    try {
      const result = await this.scan(imageUrl);
      await this.prisma.equipment.updateMany({
        where: { id: equipmentId, companyId },
        data: { imageScanStatus: 'DONE', imageScanResult: result as any, imageScanError: null },
      });
    } catch (err) {
      const message = (err as Error).message?.slice(0, 500) ?? 'Scan failed';
      this.logger.warn(`Equipment scan failed for ${equipmentId}: ${message}`);
      await this.prisma.equipment.updateMany({
        where: { id: equipmentId, companyId },
        data: { imageScanStatus: 'FAILED', imageScanError: message },
      });
    }
  }

  private async scan(imageUrl: string): Promise<EquipmentScanResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: SCAN_PROMPT },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    } as any);

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    return {
      brand: parsed.brand ?? null,
      model: parsed.model ?? null,
      serialNo: parsed.serialNo ?? null,
      errorCodes: Array.isArray(parsed.errorCodes)
        ? parsed.errorCodes
            .filter((e: any) => e && typeof e.code === 'string')
            .map((e: any) => ({ code: String(e.code), meaning: String(e.meaning ?? '') }))
        : [],
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter crm-service test -- equipment-scan.service.spec.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/crm-service/src/equipment/equipment-scan.service.ts apps/crm-service/src/equipment/equipment-scan.service.spec.ts
git commit -m "feat(crm): add EquipmentScanService — OpenAI vision extraction for equipment photos"
```

---

### Task 7: Backend — Image upload + error-code endpoints

**Files:**
- Modify: `apps/crm-service/src/equipment/equipment.service.ts`
- Modify: `apps/crm-service/src/equipment/equipment.controller.ts` (add `EquipmentItemController`)
- Test: `apps/crm-service/src/equipment/equipment.service.spec.ts` (new)

**Interfaces:**
- Consumes: `EquipmentScanService.scanAndStore` (Task 6), `StorageService.putPublicObject` (existing, `storage/storage.service.ts`).
- Produces: `EquipmentService.uploadImage(companyId, id, file)`, `.addErrorCode(companyId, equipmentId, data)`, `.removeErrorCode(companyId, id)`, `.listErrorCodes(companyId, equipmentId)`. `findByHouse`/`findByCustomer` responses now include `errorCodes: EquipmentErrorCode[]`. New routes `POST /equipment/:id/image`, `POST /equipment/:id/error-codes`, `DELETE /equipment/:id/error-codes/:codeId`.

- [ ] **Step 1: Write the failing tests**

Create `apps/crm-service/src/equipment/equipment.service.spec.ts`:

```typescript
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EquipmentService } from './equipment.service';

function makePrisma() {
  return {
    equipment: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    equipmentErrorCode: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };
}

function makeStorage() {
  return { putPublicObject: jest.fn().mockResolvedValue('https://cdn.example.com/equipment/co-1/eq-1-abc.jpg') };
}

function makeScan() {
  return { scanAndStore: jest.fn().mockResolvedValue(undefined) };
}

describe('EquipmentService — image upload', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let storage: ReturnType<typeof makeStorage>;
  let scan: ReturnType<typeof makeScan>;
  let service: EquipmentService;

  beforeEach(() => {
    prisma = makePrisma();
    storage = makeStorage();
    scan = makeScan();
    service = new EquipmentService(prisma as any, storage as any, scan as any);
  });

  it('rejects an upload for equipment outside the company', async () => {
    prisma.equipment.findFirst.mockResolvedValue(null);
    await expect(
      service.uploadImage('co-1', 'eq-1', { buffer: Buffer.from('x'), mimetype: 'image/jpeg', size: 100 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a non-image mimetype', async () => {
    prisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', companyId: 'co-1' });
    await expect(
      service.uploadImage('co-1', 'eq-1', { buffer: Buffer.from('x'), mimetype: 'application/pdf', size: 100 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a file over the size limit', async () => {
    prisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', companyId: 'co-1' });
    await expect(
      service.uploadImage('co-1', 'eq-1', { buffer: Buffer.from('x'), mimetype: 'image/jpeg', size: 6 * 1024 * 1024 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('uploads, sets status SCANNING, and fires the scan without awaiting it', async () => {
    prisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', companyId: 'co-1' });
    prisma.equipment.update.mockResolvedValue({ id: 'eq-1', companyId: 'co-1', imageScanStatus: 'SCANNING' });

    const result = await service.uploadImage('co-1', 'eq-1', { buffer: Buffer.from('x'), mimetype: 'image/jpeg', size: 100 });

    expect(storage.putPublicObject).toHaveBeenCalled();
    expect(prisma.equipment.update).toHaveBeenCalledWith({
      where: { id: 'eq-1' },
      data: expect.objectContaining({
        imageUrl: 'https://cdn.example.com/equipment/co-1/eq-1-abc.jpg',
        imageScanStatus: 'SCANNING',
        imageScanError: null,
      }),
    });
    expect(scan.scanAndStore).toHaveBeenCalledWith('co-1', 'eq-1', 'https://cdn.example.com/equipment/co-1/eq-1-abc.jpg');
    expect(result.imageScanStatus).toBe('SCANNING');
  });
});

describe('EquipmentService — error codes', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: EquipmentService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new EquipmentService(prisma as any, makeStorage() as any, makeScan() as any);
  });

  it('addErrorCode 404s for equipment outside the company', async () => {
    prisma.equipment.findFirst.mockResolvedValue(null);
    await expect(service.addErrorCode('co-1', 'eq-1', { code: 'E4' })).rejects.toThrow(NotFoundException);
  });

  it('addErrorCode requires a non-empty code', async () => {
    prisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', companyId: 'co-1' });
    await expect(service.addErrorCode('co-1', 'eq-1', { code: '  ' })).rejects.toThrow(BadRequestException);
  });

  it('addErrorCode defaults source to MANUAL', async () => {
    prisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', companyId: 'co-1' });
    prisma.equipmentErrorCode.create.mockResolvedValue({ id: 'c-1' });
    await service.addErrorCode('co-1', 'eq-1', { code: 'E4', meaning: 'Igniter failure' });
    expect(prisma.equipmentErrorCode.create).toHaveBeenCalledWith({
      data: { companyId: 'co-1', equipmentId: 'eq-1', code: 'E4', meaning: 'Igniter failure', source: 'MANUAL' },
    });
  });

  it('addErrorCode accepts source AI_SCAN when passed explicitly', async () => {
    prisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', companyId: 'co-1' });
    prisma.equipmentErrorCode.create.mockResolvedValue({ id: 'c-1' });
    await service.addErrorCode('co-1', 'eq-1', { code: 'E4', source: 'AI_SCAN' });
    expect(prisma.equipmentErrorCode.create).toHaveBeenCalledWith({
      data: { companyId: 'co-1', equipmentId: 'eq-1', code: 'E4', meaning: null, source: 'AI_SCAN' },
    });
  });

  it('removeErrorCode 404s for a code outside the company', async () => {
    prisma.equipmentErrorCode.findFirst.mockResolvedValue(null);
    await expect(service.removeErrorCode('co-1', 'c-1')).rejects.toThrow(NotFoundException);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter crm-service test -- equipment.service.spec.ts`
Expected: FAIL — `EquipmentService` constructor currently takes only `PrismaService`; `uploadImage`/`addErrorCode`/`removeErrorCode` don't exist yet.

- [ ] **Step 3: Update `EquipmentService`**

In `apps/crm-service/src/equipment/equipment.service.ts`, replace the full file:

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EquipmentScanService } from './equipment-scan.service';

@Injectable()
export class EquipmentService {
  private static readonly IMAGE_MIMES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  private static readonly IMAGE_MAX_BYTES = 5 * 1024 * 1024;

  constructor(
    private prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly scan: EquipmentScanService,
  ) {}

  async findByCustomer(companyId: string, customerId: string) {
    const items = await this.prisma.equipment.findMany({
      where: { companyId, customerId },
      orderBy: { createdAt: 'desc' },
    });
    return this.attachErrorCodes(companyId, items);
  }

  async findByHouse(companyId: string, houseId: string) {
    const items = await this.prisma.equipment.findMany({
      where: { companyId, houseId },
      orderBy: { createdAt: 'desc' },
    });
    return this.attachErrorCodes(companyId, items);
  }

  /**
   * Add equipment to a House (Housing Scheme template). Requires the house to
   * already have an owner assigned — customerId is derived from house.ownerCustomerId
   * and kept required/non-null, avoiding a nullable-customerId migration. See
   * docs/superpowers/specs/2026-07-13-project-templates-housing-scheme-design.md.
   */
  async createForHouse(
    companyId: string,
    houseId: string,
    data: {
      type?: string; brand?: string; model?: string; serialNo?: string;
      installDate?: string; warrantyEnd?: string; notes?: string;
    },
  ) {
    const house = await this.prisma.house.findFirst({ where: { id: houseId, companyId } });
    if (!house) throw new NotFoundException('House not found');
    if (!house.ownerCustomerId) {
      throw new BadRequestException('Assign an owner to this house before adding equipment');
    }
    return this.prisma.equipment.create({
      data: {
        companyId,
        customerId: house.ownerCustomerId,
        houseId,
        type: data.type ?? 'Thermostat',
        brand: data.brand,
        model: data.model,
        serialNo: data.serialNo,
        installDate: data.installDate ? new Date(data.installDate) : undefined,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : undefined,
        notes: data.notes,
      },
    });
  }

  /**
   * Re-point customerId on all of a house's equipment when its owner changes.
   * House.ownerCustomerId is authoritative; Equipment.customerId is a denormalized
   * mirror kept in sync here so the portal's "My Equipment" (queried by customerId)
   * never shows a house's equipment to the wrong owner.
   */
  async resyncHouseEquipmentOwner(companyId: string, houseId: string, customerId: string) {
    await this.prisma.equipment.updateMany({
      where: { companyId, houseId },
      data: { customerId },
    });
  }

  async create(
    companyId: string,
    customerId: string,
    data: {
      type?: string;
      brand?: string;
      model?: string;
      serialNo?: string;
      installDate?: string;
      warrantyEnd?: string;
      notes?: string;
      manualUrl?: string;
    },
  ) {
    return this.prisma.equipment.create({
      data: {
        companyId,
        customerId,
        type: data.type ?? 'Boiler',
        brand: data.brand,
        model: data.model,
        serialNo: data.serialNo,
        installDate: data.installDate ? new Date(data.installDate) : undefined,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : undefined,
        notes: data.notes,
        manualUrl: data.manualUrl,
      },
    });
  }

  async update(
    companyId: string,
    id: string,
    data: {
      type?: string;
      brand?: string;
      model?: string;
      serialNo?: string;
      installDate?: string;
      warrantyEnd?: string;
      notes?: string;
      manualUrl?: string;
    },
  ) {
    const eq = await this.prisma.equipment.findFirst({ where: { id, companyId } });
    if (!eq) throw new NotFoundException('Equipment not found');
    return this.prisma.equipment.update({
      where: { id },
      data: {
        ...data,
        installDate: data.installDate ? new Date(data.installDate) : undefined,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : undefined,
      },
    });
  }

  async remove(companyId: string, id: string) {
    const eq = await this.prisma.equipment.findFirst({ where: { id, companyId } });
    if (!eq) throw new NotFoundException('Equipment not found');
    await this.prisma.equipment.delete({ where: { id } });
  }

  /**
   * Returns all equipment with their customer joined, for automation scanning.
   * Filters: active customers only, equipment with installDate or warrantyEnd set.
   * Called by comms-service marketing automation worker.
   */
  async findAutomationCandidates(companyId: string) {
    return this.prisma.equipment.findMany({
      where: {
        companyId,
        customer: { isActive: true },
        OR: [
          { installDate: { not: null } },
          { warrantyEnd: { not: null } },
          { consumables: { some: {} } },
        ],
      },
      include: {
        consumables: true,
        customer: {
          select: {
            id: true,
            companyId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            mobile: true,
            zipCode: true,
            state: true,
            isActive: true,
          },
        },
      },
    });
  }

  /** Bulk replace all equipment for a customer */
  async replaceForCustomer(
    companyId: string,
    customerId: string,
    items: Array<{
      id?: string;
      type?: string;
      brand?: string;
      model?: string;
      serialNo?: string;
      installDate?: string;
      warrantyEnd?: string;
      notes?: string;
      manualUrl?: string;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.equipment.deleteMany({ where: { companyId, customerId } });
      if (items.length === 0) return [];
      await tx.equipment.createMany({
        data: items.map((eq) => ({
          companyId,
          customerId,
          type: eq.type ?? 'Boiler',
          brand: eq.brand,
          model: eq.model,
          serialNo: eq.serialNo,
          installDate: eq.installDate ? new Date(eq.installDate) : null,
          warrantyEnd: eq.warrantyEnd ? new Date(eq.warrantyEnd) : null,
          notes: eq.notes,
          manualUrl: eq.manualUrl,
        })),
      });
      return tx.equipment.findMany({
        where: { companyId, customerId },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  // ── Photo upload + AI scan ─────────────────────────────────────────────────

  /** Upload/replace an equipment photo, then fire (not await) a background AI scan. */
  async uploadImage(companyId: string, id: string, file: { buffer: Buffer; mimetype: string; size: number }) {
    const eq = await this.prisma.equipment.findFirst({ where: { id, companyId } });
    if (!eq) throw new NotFoundException('Equipment not found');

    const ext = EquipmentService.IMAGE_MIMES[file.mimetype];
    if (!ext) throw new BadRequestException('Photo must be a JPEG, PNG or WebP image');
    if (file.size > EquipmentService.IMAGE_MAX_BYTES) {
      throw new BadRequestException('Photo is too large — maximum size is 5 MB');
    }

    const key = `equipment/${companyId}/${id}-${randomUUID()}.${ext}`;
    const imageUrl = await this.storage.putPublicObject(key, file.buffer, file.mimetype);

    const updated = await this.prisma.equipment.update({
      where: { id },
      data: { imageUrl, imageScanStatus: 'SCANNING', imageScanResult: undefined, imageScanError: null },
    });

    void this.scan.scanAndStore(companyId, id, imageUrl);

    return updated;
  }

  // ── Error codes ───────────────────────────────────────────────────────────

  async listErrorCodes(companyId: string, equipmentId: string) {
    return this.prisma.equipmentErrorCode.findMany({
      where: { companyId, equipmentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addErrorCode(
    companyId: string,
    equipmentId: string,
    data: { code: string; meaning?: string; source?: 'AI_SCAN' | 'MANUAL' },
  ) {
    const eq = await this.prisma.equipment.findFirst({ where: { id: equipmentId, companyId } });
    if (!eq) throw new NotFoundException('Equipment not found');
    if (!data.code?.trim()) throw new BadRequestException('code is required');
    return this.prisma.equipmentErrorCode.create({
      data: {
        companyId,
        equipmentId,
        code: data.code.trim(),
        meaning: data.meaning?.trim() || null,
        source: data.source === 'AI_SCAN' ? 'AI_SCAN' : 'MANUAL',
      },
    });
  }

  async removeErrorCode(companyId: string, id: string) {
    const row = await this.prisma.equipmentErrorCode.findFirst({ where: { id, companyId } });
    if (!row) throw new NotFoundException('Error code not found');
    await this.prisma.equipmentErrorCode.delete({ where: { id } });
  }

  private async attachErrorCodes(companyId: string, items: any[]) {
    if (items.length === 0) return items;
    const ids = items.map((i) => i.id);
    const codes = await this.prisma.equipmentErrorCode.findMany({
      where: { companyId, equipmentId: { in: ids } },
      orderBy: { createdAt: 'asc' },
    });
    const byEquipment = new Map<string, any[]>();
    for (const c of codes) {
      if (!byEquipment.has(c.equipmentId)) byEquipment.set(c.equipmentId, []);
      byEquipment.get(c.equipmentId)!.push(c);
    }
    return items.map((i) => ({ ...i, errorCodes: byEquipment.get(i.id) ?? [] }));
  }
}
```

- [ ] **Step 4: Add `EquipmentItemController` to the controller file**

In `apps/crm-service/src/equipment/equipment.controller.ts`, update the imports at the top (replace lines 1-11):

```typescript
import {
  Controller, Get, Post, Put, Patch, Delete, Param, Body,
  UseGuards, UseInterceptors, UploadedFile, HttpCode, HttpStatus,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { EquipmentService } from './equipment.service';
import { ConsumablesService } from './consumables.service';
import { IsString, IsOptional, IsArray, IsIn, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
```

Add a new DTO after `ConsumableBodyDto` (after line 48):

```typescript
class AddErrorCodeDto {
  @IsString() code!: string;
  @IsOptional() @IsString() meaning?: string;
  @IsOptional() @IsIn(['AI_SCAN', 'MANUAL']) source?: 'AI_SCAN' | 'MANUAL';
}

const STAFF_WRITE = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER];
```

Append a new controller at the end of the file (after the closing `}` of `EquipmentController`):

```typescript
// ── Equipment photo + AI scan + error codes (id-scoped, not customer-nested) ──
@ApiTags('Equipment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('equipment')
export class EquipmentItemController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post(':id/image')
  @Roles(...STAFF_WRITE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload/replace an equipment photo — triggers a background AI scan' })
  uploadImage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No photo uploaded');
    return this.equipmentService.uploadImage(user.companyId, id, file);
  }

  @Post(':id/error-codes')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Add an error code entry (manual, or approved from an AI suggestion)' })
  addErrorCode(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddErrorCodeDto,
  ) {
    return this.equipmentService.addErrorCode(user.companyId, id, dto);
  }

  @Delete(':id/error-codes/:codeId')
  @Roles(...STAFF_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an error code entry' })
  removeErrorCode(@CurrentUser() user: AuthUser, @Param('codeId') codeId: string) {
    return this.equipmentService.removeErrorCode(user.companyId, codeId);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter crm-service test -- equipment.service.spec.ts`
Expected: PASS (all 9 tests)

- [ ] **Step 6: Run the full crm-service suite and type-check**

Run: `pnpm --filter crm-service test && pnpm --filter crm-service type-check`
Expected: PASS — this also validates `equipment.module.ts` from Task 5 now compiles (both new symbols exist).

- [ ] **Step 7: Commit**

```bash
git add apps/crm-service/src/equipment
git commit -m "feat(crm): equipment photo upload + AI scan trigger + structured error codes"
```

---

### Task 8: Apply the migration to the dev database

**Files:** none (operational step)

- [ ] **Step 1: Run the migration script**

Run: `node scripts/apply-migrations.mjs`
Expected output includes:
```
=== Schema: crm ===
  [apply] 20260722000000_optional_customer_and_equipment_scan …
  [ok]    20260722000000_optional_customer_and_equipment_scan
```
(Earlier migrations should print `[skip] ... (already applied)`.)

- [ ] **Step 2: Verify the columns exist**

Run: `pnpm --filter crm-service exec prisma studio` is one way, but for a scriptable check, run:
```bash
node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres.piezmopzxbuksjuuwwyw:<DB_PASSWORD>@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=crm', ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const r1 = await c.query(\"SELECT column_name FROM information_schema.columns WHERE table_schema='crm' AND table_name='equipment' AND column_name LIKE 'image%'\");
  console.log('equipment image columns:', r1.rows.map(r => r.column_name));
  const r2 = await c.query(\"SELECT is_nullable FROM information_schema.columns WHERE table_schema='crm' AND table_name='projects' AND column_name='customerId'\");
  console.log('projects.customerId nullable:', r2.rows[0]?.is_nullable);
  const r3 = await c.query(\"SELECT to_regclass('crm.equipment_error_codes') as t\");
  console.log('equipment_error_codes table exists:', !!r3.rows[0]?.t);
  await c.end();
});
"
```
Expected: `equipment image columns: [ 'image_url', 'image_scan_status', 'image_scan_result', 'image_scan_error' ]`, `projects.customerId nullable: YES`, `equipment_error_codes table exists: true`

- [ ] **Step 3: Restart crm-service and confirm it boots cleanly**

Run: `pnpm --filter crm-service dev` (in a background/separate terminal), watch the startup log.
Expected: no Prisma schema-mismatch errors, service listens on port 3001.

(No commit — this task only touches the live database, not the repo.)

---

### Task 9: Frontend — housesApi.ts additions for photo + error codes

**Files:**
- Modify: `apps/admin-dashboard/src/pages/projects/housesApi.ts`

**Interfaces:**
- Consumes: `POST /crm/equipment/:id/image`, `POST /crm/equipment/:id/error-codes`, `DELETE /crm/equipment/:id/error-codes/:codeId` (Task 7).
- Produces: `HouseEquipment` gains `imageUrl`, `imageScanStatus`, `imageScanResult`, `imageScanError`, `errorCodes`. New hooks `useUploadEquipmentImage(houseId)`, `useAddErrorCode(houseId)`, `useDeleteErrorCode(houseId)`. `useHouseEquipment` polls while any item is `SCANNING`.

- [ ] **Step 1: Extend the `HouseEquipment` type and add supporting types**

In `apps/admin-dashboard/src/pages/projects/housesApi.ts`, replace lines 37-48:

```typescript
export type ImageScanStatus = 'NONE' | 'SCANNING' | 'DONE' | 'FAILED'

export interface EquipmentScanResult {
  brand: string | null
  model: string | null
  serialNo: string | null
  errorCodes: { code: string; meaning: string }[]
}

export interface EquipmentErrorCode {
  id: string
  code: string
  meaning?: string | null
  source: 'AI_SCAN' | 'MANUAL'
  createdAt: string
}

export interface HouseEquipment {
  id: string
  houseId: string
  customerId: string
  type: string
  brand?: string | null
  model?: string | null
  serialNo?: string | null
  installDate?: string | null
  warrantyEnd?: string | null
  notes?: string | null
  imageUrl?: string | null
  imageScanStatus: ImageScanStatus
  imageScanResult?: EquipmentScanResult | null
  imageScanError?: string | null
  errorCodes: EquipmentErrorCode[]
}
```

- [ ] **Step 2: Poll `useHouseEquipment` while any item is scanning**

Replace the `useHouseEquipment` function (lines 111-118):

```typescript
export function useHouseEquipment(houseId: string | undefined) {
  return useQuery<HouseEquipment[]>({
    queryKey: ['houses', houseId, 'equipment'],
    queryFn: async () => (await api.get(`/crm/houses/${houseId}/equipment`)).data ?? [],
    enabled: !!houseId,
    staleTime: 15 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data as HouseEquipment[] | undefined
      return data?.some(e => e.imageScanStatus === 'SCANNING') ? 3000 : false
    },
  })
}
```

- [ ] **Step 3: Add the upload/error-code mutation hooks**

Add after `useAddHouseEquipment` (after line 288, before `useUpdateIssueStatus`):

```typescript
export function useUploadEquipmentImage(houseId: string) {
  return useMutation({
    mutationFn: async ({ equipmentId, file }: { equipmentId: string; file: File }) => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post(`/crm/equipment/${equipmentId}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data as HouseEquipment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses', houseId, 'equipment'] })
    },
  })
}

export function useAddErrorCode(houseId: string) {
  return useMutation({
    mutationFn: async ({ equipmentId, code, meaning, source }: { equipmentId: string; code: string; meaning?: string; source?: 'AI_SCAN' | 'MANUAL' }) =>
      (await api.post(`/crm/equipment/${equipmentId}/error-codes`, { code, meaning, source })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses', houseId, 'equipment'] })
    },
  })
}

export function useDeleteErrorCode(houseId: string) {
  return useMutation({
    mutationFn: async ({ equipmentId, codeId }: { equipmentId: string; codeId: string }) =>
      (await api.delete(`/crm/equipment/${equipmentId}/error-codes/${codeId}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses', houseId, 'equipment'] })
    },
  })
}
```

- [ ] **Step 4: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: PASS (existing consumers of `HouseEquipment`/`useHouseEquipment` in `HousesTab.tsx` still compile since all new fields are additive; `imageScanStatus` is required but only read, not constructed, by existing code)

- [ ] **Step 5: Commit**

```bash
git add apps/admin-dashboard/src/pages/projects/housesApi.ts
git commit -m "feat(admin): equipment photo upload + error-code hooks, poll while scanning"
```

---

### Task 10: Frontend — Equipment photo UI, scan review, error-code list

**Files:**
- Modify: `apps/admin-dashboard/src/pages/projects/HousesTab.tsx` (`EquipmentDetailModal`, plus its call site in `EquipmentSection`)

**Interfaces:**
- Consumes: `useUploadEquipmentImage`, `useAddErrorCode`, `useDeleteErrorCode` (Task 9), `useUpdateHouse`... actually equipment update uses a new small inline PATCH via `api` directly (there is no `useUpdateHouseEquipment` hook yet — add one alongside, scoped to this task since it's only needed by the "Apply" button).

- [ ] **Step 1: Add an equipment-update hook**

In `apps/admin-dashboard/src/pages/projects/housesApi.ts`, add after `useUploadEquipmentImage` (from Task 9):

```typescript
export function useUpdateHouseEquipment(houseId: string) {
  return useMutation({
    mutationFn: async ({ equipmentId, ...patch }: { equipmentId: string; brand?: string; model?: string; serialNo?: string }) =>
      (await api.patch(`/crm/houses/${houseId}/equipment/${equipmentId}`, patch)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses', houseId, 'equipment'] })
    },
  })
}
```

This calls `PATCH /crm/houses/:id/equipment/:equipmentId` — **that route does not exist yet on the backend.** Add it now:

In `apps/crm-service/src/houses/houses.controller.ts`, add to `HousesController` (after the `addEquipment` method, before the `// ── Issue reports ──` comment):

```typescript
  @Patch(':id/equipment/:equipmentId')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: "Update a house's equipment item (brand/model/serial, typically applying an AI scan suggestion)" })
  async updateEquipment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('equipmentId') equipmentId: string,
    @Body() dto: HouseEquipmentDto,
  ) {
    await this.assertReadAccess(user, id);
    return this.equipmentService.update(user.companyId, equipmentId, dto);
  }
```

`HouseEquipmentDto` and `this.assertReadAccess` already exist in this controller (lines 34-42, 203-205) — `EquipmentService.update` already exists (used by the customer-scoped controller). No further backend change needed.

Write a quick regression test for it in `apps/crm-service/src/houses/houses.controller.spec.ts` — check the existing file first:

Run: `cat apps/crm-service/src/houses/houses.controller.spec.ts`

Add a test matching that file's existing style (guard-focused, since `HousesController` specs check RBAC wiring, not business logic — business logic for `update` is already covered by `EquipmentService`'s own tests). Confirm the new route requires `STAFF_WRITE` roles the same way `addEquipment` does, following whatever pattern the existing 28-line file uses (it's short — read it first, then add one test mirroring its existing assertions for the new route).

Run: `pnpm --filter crm-service test -- houses.controller.spec.ts`
Expected: PASS

Commit this backend addition on its own:
```bash
git add apps/crm-service/src/houses/houses.controller.ts apps/crm-service/src/houses/houses.controller.spec.ts apps/admin-dashboard/src/pages/projects/housesApi.ts
git commit -m "feat: PATCH house equipment endpoint + frontend hook (for applying AI scan suggestions)"
```

- [ ] **Step 2: Build the Photo + scan-review + error-codes UI**

In `apps/admin-dashboard/src/pages/projects/HousesTab.tsx`, update the imports at the top: add `ImageIcon, RefreshCw, Sparkles` to the `lucide-react` import (line 8-11), and add the new hooks to the `housesApi` import (lines 14-20):

```typescript
import {
  useHouses, useHouse, useCreateHouse, useUpdateHouse, useAssignOwner,
  useGenerateOwnerAccount, useHouseEquipment, useAddHouseEquipment, useHouseIssues,
  useUpdateIssueStatus, useHouseServiceLog, invalidateHouseServiceLog, prefetchHouseDetail,
  useUploadEquipmentImage, useAddErrorCode, useDeleteErrorCode, useUpdateHouseEquipment,
  ACCOUNT_STATUS_META, ISSUE_STATUS_META,
  type House, type HouseAccountStatus, type IssueStatus, type HouseEquipment, type HouseIssueReport,
} from './housesApi'
```

Replace `EquipmentDetailModal` (lines 625-676) with a version that takes `houseId` and includes the photo/scan/error-code UI:

```tsx
function EquipmentDetailModal({ houseId, equipment, onClose, onServiceVisit }: {
  houseId: string
  equipment: HouseEquipment
  onClose: () => void
  onServiceVisit: () => void
}) {
  const uploadImage = useUploadEquipmentImage(houseId)
  const updateEquipment = useUpdateHouseEquipment(houseId)
  const addErrorCode = useAddErrorCode(houseId)
  const deleteErrorCode = useDeleteErrorCode(houseId)
  const { showError } = useToast()
  const [manualCode, setManualCode] = useState('')
  const [manualMeaning, setManualMeaning] = useState('')

  const rows: [string, string | null | undefined][] = [
    ['Brand', equipment.brand],
    ['Model', equipment.model],
    ['Serial number', equipment.serialNo],
    ['Install date', equipment.installDate ? fmtDate(equipment.installDate) : null],
    ['Warranty end', equipment.warrantyEnd ? fmtDate(equipment.warrantyEnd) : null],
  ]

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    uploadImage.mutate({ equipmentId: equipment.id, file }, {
      onError: (err: any) => showError(err?.response?.data?.message ?? 'Could not upload this photo', 'Upload failed'),
    })
  }

  const suggestion = equipment.imageScanStatus === 'DONE' ? equipment.imageScanResult : null
  const hasNameplateSuggestion = !!(suggestion?.brand || suggestion?.model || suggestion?.serialNo)
  const applySuggestedField = (field: 'brand' | 'model' | 'serialNo', value: string) => {
    updateEquipment.mutate({ equipmentId: equipment.id, [field]: value })
  }
  const applyAllSuggested = () => {
    if (!suggestion) return
    updateEquipment.mutate({
      equipmentId: equipment.id,
      ...(suggestion.brand ? { brand: suggestion.brand } : {}),
      ...(suggestion.model ? { model: suggestion.model } : {}),
      ...(suggestion.serialNo ? { serialNo: suggestion.serialNo } : {}),
    })
  }

  const [addedSuggestedCodes, setAddedSuggestedCodes] = useState<Set<string>>(new Set())
  const addSuggestedCode = (code: string, meaning: string) => {
    addErrorCode.mutate({ equipmentId: equipment.id, code, meaning, source: 'AI_SCAN' }, {
      onSuccess: () => setAddedSuggestedCodes(s => new Set(s).add(code)),
    })
  }
  const addManualCode = () => {
    if (!manualCode.trim()) return
    addErrorCode.mutate(
      { equipmentId: equipment.id, code: manualCode.trim(), meaning: manualMeaning.trim() || undefined, source: 'MANUAL' },
      { onSuccess: () => { setManualCode(''); setManualMeaning('') } },
    )
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1002, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card anim-fade-up" role="dialog" aria-modal="true" aria-label={equipment.type}
        style={{ width: 460, maxWidth: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 48px)' }}
        onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wind size={15} style={{ color: 'var(--blue)' }} />
            </span>
            <div className="card-title">{equipment.type}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>
        <div className="card-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rows.filter(([, v]) => v).length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: '0 0 8px' }}>No further details recorded for this unit.</p>
          ) : rows.map(([label, value]) => value && (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', fontSize: 13, borderTop: '1px solid var(--bd)' }}>
              <span style={{ color: 'var(--t3)' }}>{label}</span>
              <span style={{ color: 'var(--t1)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
            </div>
          ))}
          {equipment.notes && (
            <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--bd)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Notes</p>
              <p style={{ fontSize: 12.5, color: 'var(--t2)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{equipment.notes}</p>
            </div>
          )}

          {/* Photo */}
          <div style={{ marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ImageIcon size={12} /> Photo
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {equipment.imageUrl ? (
                <img src={equipment.imageUrl} alt={equipment.type} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--bd)' }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--bg-card-2)', border: '1px dashed var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={18} style={{ color: 'var(--t4)' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {equipment.imageScanStatus === 'SCANNING' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--blue)' }}>
                    <Loader2 size={12} className="animate-spin" /> Scanning photo…
                  </span>
                )}
                {equipment.imageScanStatus === 'DONE' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--green)' }}>
                    <Check size={12} /> Scanned
                  </span>
                )}
                {equipment.imageScanStatus === 'FAILED' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--red)' }}>
                    <AlertTriangle size={12} /> Scan failed{equipment.imageScanError ? ` — ${equipment.imageScanError}` : ''}
                  </span>
                )}
                <label className="btn btn-secondary btn-sm" style={{ cursor: uploadImage.isPending ? 'default' : 'pointer', opacity: uploadImage.isPending ? 0.6 : 1, width: 'fit-content' }}>
                  {uploadImage.isPending ? <Loader2 size={12} className="animate-spin" /> : equipment.imageUrl ? <RefreshCw size={12} /> : <ImageIcon size={12} />}
                  {equipment.imageUrl ? ' Replace / retry' : ' Upload photo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickFile} disabled={uploadImage.isPending} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>

          {/* AI suggestion — nameplate */}
          {hasNameplateSuggestion && (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 9, background: 'var(--blue-dim)', border: '1px solid var(--blue)' }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--blue)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={12} /> Suggested from photo
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(['brand', 'model', 'serialNo'] as const).map(field => suggestion?.[field] && (
                  <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--t1)' }}>
                      {field === 'serialNo' ? 'Serial' : field[0].toUpperCase() + field.slice(1)}: <strong>{suggestion[field]}</strong>
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={() => applySuggestedField(field, suggestion[field] as string)} disabled={updateEquipment.isPending}>
                      Apply
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={applyAllSuggested} disabled={updateEquipment.isPending}>
                {updateEquipment.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Apply all
              </button>
            </div>
          )}

          {/* AI suggestion — error codes not yet added */}
          {suggestion && suggestion.errorCodes.filter(c => !addedSuggestedCodes.has(c.code) && !equipment.errorCodes.some(e => e.code === c.code)).length > 0 && (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 9, background: 'var(--blue-dim)', border: '1px solid var(--blue)' }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--blue)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={12} /> Detected error codes
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suggestion.errorCodes
                  .filter(c => !addedSuggestedCodes.has(c.code) && !equipment.errorCodes.some(e => e.code === c.code))
                  .map(c => (
                    <div key={c.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--t1)' }}><strong>{c.code}</strong>{c.meaning ? ` — ${c.meaning}` : ''}</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => addSuggestedCode(c.code, c.meaning)} disabled={addErrorCode.isPending}>
                        Add
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Persisted error codes */}
          <div style={{ marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Error codes</p>
            {equipment.errorCodes.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--t4)', margin: '0 0 10px' }}>No error codes recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {equipment.errorCodes.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--t1)' }}>
                      <strong>{c.code}</strong>{c.meaning ? ` — ${c.meaning}` : ''}
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: c.source === 'AI_SCAN' ? 'var(--blue)' : 'var(--t4)' }}>
                        {c.source === 'AI_SCAN' ? 'AI' : 'Manual'}
                      </span>
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteErrorCode.mutate({ equipmentId: equipment.id, codeId: c.id })} disabled={deleteErrorCode.isPending}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <input style={{ ...inp, flex: '0 0 90px' }} value={manualCode} placeholder="Code" onChange={e => setManualCode(e.target.value)} />
              <input style={inp} value={manualMeaning} placeholder="Meaning (optional)" onChange={e => setManualMeaning(e.target.value)} />
              <button className="btn btn-secondary btn-sm" onClick={addManualCode} disabled={!manualCode.trim() || addErrorCode.isPending}>
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-primary btn-sm" onClick={onServiceVisit}>
            <Wrench size={12} /> New service visit
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
```

Update the call site in `EquipmentSection` (around line 543-549) to pass `houseId`:

```tsx
      {viewing && (
        <EquipmentDetailModal
          houseId={house.id}
          equipment={viewing}
          onClose={() => setViewing(null)}
          onServiceVisit={() => { setVisitFor({ id: viewing.id }); setViewing(null) }}
        />
      )}
```

Note: `viewing` is set from the `equipment` array in `EquipmentSection`'s state, which comes from `useHouseEquipment` — since that hook now polls while `SCANNING`, `viewing` needs to stay in sync with fresh query data rather than a stale snapshot. Update `EquipmentSection`'s `viewing` state handling: change `const [viewing, setViewing] = useState<HouseEquipment | null>(null)` usage so the modal always renders the latest object from the `equipment` array by id, not the captured closure value. Replace:

```tsx
  const [viewing, setViewing] = useState<HouseEquipment | null>(null)
```
with:
```tsx
  const [viewingId, setViewingId] = useState<string | null>(null)
  const viewing = equipment.find(e => e.id === viewingId) ?? null
```

And update the two call sites that reference `setViewing`/`viewing` in this component: `onClick={() => setViewing(eq)}` → `onClick={() => setViewingId(eq.id)}`, and `onClose={() => setViewing(null)}` → `onClose={() => setViewingId(null)}`.

- [ ] **Step 3: Build and manually verify**

Run: `pnpm --filter admin-dashboard build`
Expected: PASS

Then start the app (`pnpm dev:admin` plus backends via `pnpm dev`), open a Housing Scheme project → Houses tab → a house with an owner → Equipment tab → Add equipment → open its detail modal → upload a photo → confirm the status pill goes Scanning → Scanned (or Failed, if `OPENAI_API_KEY` isn't set in local `.env` — check `.env` for a real key before testing this step, since the free/no-key case predictably yields `FAILED` and that's expected, not a bug).

- [ ] **Step 4: Commit**

```bash
git add apps/admin-dashboard/src/pages/projects/HousesTab.tsx apps/admin-dashboard/src/pages/projects/housesApi.ts
git commit -m "feat(admin): equipment photo upload UI, AI scan suggestion review, error-code list"
```

---

## Self-Review Notes

- **Spec coverage:** §1 (project optional customer) → Tasks 1-2. §2 (house owner at creation) → Tasks 3-4. §3 (equipment photo/scan/error codes) → Tasks 5-10. Migration application → Task 8. All covered.
- **Deviation from spec (intentional, called out for the record):** the spec's §3 mentions a dedicated `S3_BUCKET_EQUIPMENT`/`tscrm-equipment` bucket; the plan instead reuses the existing avatars bucket (`StorageService` is a single-bucket-per-instance singleton keyed off one env var) with an `equipment/` key prefix, since `StorageService` has no multi-bucket support today and adding one is out of scope for this feature. Functionally equivalent (public-read, same upload/delete API).
- **Type consistency check:** `EquipmentScanResult` shape (`brand/model/serialNo/errorCodes`) is identical across `equipment-scan.service.ts` (backend), `equipment.service.spec.ts` test expectations, and `housesApi.ts` (frontend) — verified field names match exactly (`serialNo`, not `serial`).
- **HouseEquipmentDto reuse:** Task 10's new `PATCH /houses/:id/equipment/:equipmentId` route reuses the existing `HouseEquipmentDto` from `houses.controller.ts` (already has `type/brand/model/serialNo/installDate/warrantyEnd/notes`, all optional) — no new DTO needed there.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-22-projects-housing-equipment-scan.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
