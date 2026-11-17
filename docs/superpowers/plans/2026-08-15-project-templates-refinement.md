# Projects Template & Component UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make component types growable per-project (typed, not picked from a fixed list), add a Draft/Published lifecycle to templates, add a "Customized project" option with zero predefined types, resize/restructure the New Project modal's template picker, and make sure every job/quote/invoice/agreement visibly shows which project+component it belongs to everywhere it's seen.

**Architecture:** Extends the generic component-template system from the previous plan. `Project.componentTypesSnapshot` changes from a frozen copy to a project-owned, append-only registry; `ProjectTemplate` gains a `status` column gating the New Project picker; a new shared `ProjectComponentTag` component de-duplicates the project/component badge already implemented three times.

**Tech Stack:** NestJS + Prisma (crm-service), React 19 + TanStack Query (admin-dashboard).

**Spec:** `docs/superpowers/specs/2026-08-15-project-templates-refinement-design.md`

## Global Constraints

- Multi-tenancy: every new/changed query stays filtered by `companyId` — no exceptions.
- Migrations applied via `scripts/apply-migrations.mjs` only (this repo's established pattern for the `crm` schema — never `prisma migrate dev`).
- On-canvas page headers (text sitting directly on the page background, not inside a `.card`) use hardcoded `#F1F5F9` (title) / `#94A3B8` (subtitle) — never the themed `--t1`/`--t3` tokens, which are for text inside cards. This app's canvas is dark navy in every theme.
- `pnpm` only. Verify crm-service via `pnpm --filter crm-service test` + `pnpm --filter crm-service type-check`; verify admin-dashboard via `pnpm --filter admin-dashboard build` (no test runner in this app — `tsc -b` inside `build` is the type check).
- Do not commit anything — nothing gets committed unless the user explicitly says so, and never with a Claude co-author trailer.

---

### Task 1: `ProjectTemplate.status` — schema + migration

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma`
- Modify: `scripts/apply-migrations.mjs`

**Interfaces:**
- Produces: `ProjectTemplate.status: string` (Prisma Client field), values `'DRAFT' | 'PUBLISHED'`, consumed by Task 2.

- [ ] **Step 1: Add the column to the Prisma model**

In `apps/crm-service/prisma/schema.prisma`, find the `ProjectTemplate` model (added in the previous session's work) and add the field:

```prisma
model ProjectTemplate {
  id             String    @id @default(uuid())
  companyId      String
  name           String
  description    String?
  componentTypes Json
  isBuiltIn      Boolean   @default(false)
  status         String    @default("DRAFT")   // DRAFT | PUBLISHED — gates the New Project picker
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([companyId])
  @@index([companyId, status])
  @@map("project_templates")
}
```

- [ ] **Step 2: Add the migration entry** — append to the `migrations` array in `scripts/apply-migrations.mjs`, in the `crm` schema group (same array the previous session's `20260814*` entries live in):

```js
{
  schema: 'crm',
  name: '20260815000000_add_project_template_status',
  sql: `
ALTER TABLE "crm"."project_templates" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DRAFT';
-- Every template that already exists (including the migrated built-in "Housing
-- Scheme" template) must stay visible in the New Project picker after this ships.
UPDATE "crm"."project_templates" SET "status" = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS "project_templates_status_idx" ON "crm"."project_templates"("companyId", "status");
  `.trim(),
},
```

- [ ] **Step 3: Run the migration and regenerate the client**

Run: `node scripts/apply-migrations.mjs && cd apps/crm-service && npx prisma generate`
Expected: `[apply] 20260815000000_add_project_template_status` then `[ok]`, followed by `Generated Prisma Client` with no errors.

- [ ] **Step 4: Verify the backfill on live data**

Run: `node -e "const {Client}=require('pg'); (async()=>{const c=new Client({connectionString:'postgresql://postgres.piezmopzxbuksjuuwwyw:<DB_PASSWORD>@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=crm'}); await c.connect(); const r = await c.query('SELECT name, status FROM crm.project_templates'); console.log(r.rows); await c.end();})()"`
Expected: every existing row (including "Housing Scheme") shows `status: 'PUBLISHED'`.

---

### Task 2: `project-templates` — status field in create/update, publish gating

**Files:**
- Modify: `apps/crm-service/src/project-templates/project-templates.service.ts`
- Modify: `apps/crm-service/src/project-templates/project-templates.controller.ts`
- Modify: `apps/crm-service/src/project-templates/project-templates.service.spec.ts`

**Interfaces:**
- Consumes: `ProjectTemplate.status` (Task 1).
- Produces: `ProjectTemplatesService.create()` always sets `status: 'DRAFT'`; `.update()` accepts `status` in its input and rejects it (with everything else) on built-ins; consumed by Task 8 (New Project modal picker filtering) and Task 7 (Template Library UI).

- [ ] **Step 1: Write the failing tests** — add to `project-templates.service.spec.ts`:

```ts
it('always creates a template as DRAFT regardless of what the caller sends', async () => {
  mockPrisma.projectTemplate.create.mockResolvedValue({ id: 't-1' });
  await service.create('co-1', {
    name: 'Hotel',
    componentTypes: [{ key: 'room', label: 'Room', customerAssignable: true }],
    // @ts-expect-error — status is intentionally not part of the create() input type
    status: 'PUBLISHED',
  });
  expect(mockPrisma.projectTemplate.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ status: 'DRAFT' }),
  }));
});

it('update() persists a valid status change on a non-built-in template', async () => {
  mockPrisma.projectTemplate.findFirst.mockResolvedValue({ id: 't-1', companyId: 'co-1', isBuiltIn: false });
  mockPrisma.projectTemplate.update.mockResolvedValue({ id: 't-1', status: 'PUBLISHED' });
  await service.update('co-1', 't-1', { status: 'PUBLISHED' });
  expect(mockPrisma.projectTemplate.update).toHaveBeenCalledWith({
    where: { id: 't-1' }, data: { status: 'PUBLISHED' },
  });
});

it('update() rejects a status change on a built-in template, same as other fields', async () => {
  mockPrisma.projectTemplate.findFirst.mockResolvedValue({ id: 't-1', companyId: 'co-1', isBuiltIn: true });
  await expect(service.update('co-1', 't-1', { status: 'PUBLISHED' })).rejects.toThrow(BadRequestException);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter crm-service test -- project-templates.service`
Expected: the two new non-rejection assertions FAIL (status not yet wired); the built-in rejection test passes already (existing guard covers any field change).

- [ ] **Step 3: Implement in `project-templates.service.ts`**

In `create()`, the `data` object passed to `prisma.projectTemplate.create` gets one more hardcoded field:

```ts
return this.prisma.projectTemplate.create({
  data: {
    companyId,
    name: input.name.trim(),
    description: input.description ?? null,
    componentTypes: input.componentTypes as any,
    status: 'DRAFT', // never accepted from the caller — a template can't be published before it exists to review
  },
});
```

In `UpsertTemplateInput`, add `status?: string`. In `update()`, extend the existing built-in guard's scope (it already blocks the whole method for `isBuiltIn` templates — no change needed there beyond adding the field to `data`):

```ts
export interface UpsertTemplateInput {
  name?: string;
  description?: string | null;
  componentTypes?: ComponentTypeInput[];
  status?: string;
}
```

```ts
async update(companyId: string, id: string, input: UpsertTemplateInput) {
  const existing = await this.findOne(companyId, id);
  if (existing.isBuiltIn) {
    throw new BadRequestException('Built-in templates cannot be edited — duplicate it into a custom template instead');
  }
  validateComponentTypes(input.componentTypes);
  if (input.status !== undefined && !['DRAFT', 'PUBLISHED'].includes(input.status)) {
    throw new BadRequestException("status must be 'DRAFT' or 'PUBLISHED'");
  }
  const data: any = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) data.description = input.description;
  if (input.componentTypes !== undefined) data.componentTypes = input.componentTypes;
  if (input.status !== undefined) data.status = input.status;
  return this.prisma.projectTemplate.update({ where: { id }, data });
}
```

- [ ] **Step 4: Run to verify tests pass**

Run: `pnpm --filter crm-service test -- project-templates.service`
Expected: PASS, all tests including the 3 new ones.

- [ ] **Step 5: Add `status` to the controller DTO** — in `project-templates.controller.ts`:

```ts
class UpdateTemplateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ComponentTypeDto)
  componentTypes?: ComponentTypeDto[];
  @IsOptional() @IsIn(['DRAFT', 'PUBLISHED']) status?: string;
}
```

Add `IsIn` to the existing `class-validator` import line at the top of the file.

- [ ] **Step 6: Run full crm-service suite**

Run: `pnpm --filter crm-service test`
Expected: all pass (baseline was 339 before this task; expect 342).

---

### Task 3: `projects` — `freeform` flag ("Customized project")

**Files:**
- Modify: `apps/crm-service/src/projects/projects.service.ts`
- Modify: `apps/crm-service/src/projects/projects.controller.ts`
- Modify: `apps/crm-service/src/projects/projects.service.spec.ts`

**Interfaces:**
- Produces: `ProjectsService.create()` accepts `freeform?: boolean` on `UpsertProjectInput`; when true (and no `templateId`), sets `componentTypesSnapshot: []`, `componentCustomerSettings: {}`. Consumed by Task 9 (New Project modal).

- [ ] **Step 1: Write the failing tests** — add to `projects.service.spec.ts`'s `describe('template-based creation', ...)` block:

```ts
it('freeform: true creates a project with an empty (non-null) component type registry', async () => {
  prisma.project.create.mockResolvedValue({ id: 'p-3' });
  await service.create(CO, { name: 'Boutique Build', freeform: true } as any);
  expect(prisma.projectTemplate.findFirst).not.toHaveBeenCalled();
  expect(prisma.project.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({
      templateId: null, componentTypesSnapshot: [], componentCustomerSettings: {},
    }),
  }));
});

it('rejects freeform: true combined with a templateId', async () => {
  await expect(service.create(CO, { name: 'X', freeform: true, templateId: 'tpl-1' } as any))
    .rejects.toThrow(BadRequestException);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter crm-service test -- projects.service`
Expected: FAIL — `freeform` not yet accepted, both new tests fail.

- [ ] **Step 3: Implement in `projects.service.ts`**

Add `freeform?: boolean;` to `UpsertProjectInput`. In `create()`, right before the existing `templateFields` block:

```ts
if (input.freeform && input.templateId) {
  throw new BadRequestException('A project cannot be both freeform and template-based');
}
```

Replace the `templateFields` initialization and the `if (input.templateId)` block with:

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
} else if (input.freeform) {
  // "Customized project" — zero predefined types, but componentTypesSnapshot is
  // non-null so the Components tab shows and grows entirely ad hoc (see
  // ProjectComponentsService.resolveOrRegisterType, Task 5).
  templateFields = { templateId: null, componentTypesSnapshot: [], componentCustomerSettings: {} };
}
```

- [ ] **Step 4: Run to verify tests pass**

Run: `pnpm --filter crm-service test -- projects.service`
Expected: PASS, all tests including the 2 new ones (baseline 18 → 20 for this file).

- [ ] **Step 5: Add `freeform` to `CreateProjectDto`** in `projects.controller.ts`:

```ts
class CreateProjectDto {
  // ...existing fields...
  @IsOptional() @IsBoolean() freeform?: boolean;
}
```

`IsBoolean` should already be imported (used elsewhere in this file's DTOs — check the existing `class-validator` import line and add it if missing).

- [ ] **Step 6: Run full crm-service suite**

Run: `pnpm --filter crm-service test`
Expected: all pass.

---

### Task 4: `project-components` — growable type registry (`resolveOrRegisterType`)

**Files:**
- Modify: `apps/crm-service/src/project-components/project-components.service.ts`
- Modify: `apps/crm-service/src/project-components/project-components.controller.ts`
- Modify: `apps/crm-service/src/project-components/project-components.service.spec.ts`

**Interfaces:**
- Consumes: `Project.componentTypesSnapshot`/`componentCustomerSettings` (Task 1-3).
- Produces: `ProjectComponentsService.create()` accepts `{ typeLabel: string; typeAssignable?: boolean; label: string; ... }` instead of `componentTypeKey` directly. New private method `resolveOrRegisterType(project, typeLabel, typeAssignable)` returns the resolved `key`, appending a new type to the project when needed. Consumed by Task 10 (Add Component modal).

- [ ] **Step 1: Write the failing tests** — add to `project-components.service.spec.ts`:

```ts
it('resolves an existing type case-insensitively and ignores a passed typeAssignable', async () => {
  prisma.project.findFirst.mockResolvedValue({
    id: 'p-1', companyId: 'co-1',
    componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
    componentCustomerSettings: { room: true },
  });
  prisma.projectComponent.create.mockResolvedValue({ id: 'c-1', componentTypeKey: 'room', label: 'Room 5', ownerCustomerId: null });
  await service.create('co-1', 'p-1', { typeLabel: 'room', typeAssignable: false, label: 'Room 5' } as any);
  expect(prisma.project.update).not.toHaveBeenCalled(); // no new type registered
  expect(prisma.projectComponent.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ componentTypeKey: 'room' }),
  }));
});

it('registers a brand-new type on the project and uses it for the new component', async () => {
  prisma.project.findFirst.mockResolvedValue({
    id: 'p-1', companyId: 'co-1',
    componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
    componentCustomerSettings: { room: true },
  });
  prisma.project.update.mockResolvedValue({});
  prisma.projectComponent.create.mockResolvedValue({ id: 'c-2', componentTypeKey: 'pool_deck', label: 'Pool Deck', ownerCustomerId: null });
  await service.create('co-1', 'p-1', { typeLabel: 'Pool Deck', typeAssignable: false, label: 'Pool Deck' } as any);
  expect(prisma.project.update).toHaveBeenCalledWith({
    where: { id: 'p-1' },
    data: {
      componentTypesSnapshot: [
        { key: 'room', label: 'Room', customerAssignable: true },
        { key: 'pool_deck', label: 'Pool Deck', customerAssignable: false },
      ],
      componentCustomerSettings: { room: true, pool_deck: false },
    },
  });
  expect(prisma.projectComponent.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ componentTypeKey: 'pool_deck' }),
  }));
});

it('new type defaults typeAssignable to true when omitted', async () => {
  prisma.project.findFirst.mockResolvedValue({
    id: 'p-1', companyId: 'co-1', componentTypesSnapshot: [], componentCustomerSettings: {},
  });
  prisma.project.update.mockResolvedValue({});
  prisma.projectComponent.create.mockResolvedValue({ id: 'c-3', componentTypeKey: 'lobby', label: 'Lobby' });
  await service.create('co-1', 'p-1', { typeLabel: 'Lobby', label: 'Lobby' } as any);
  expect(prisma.project.update).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({
      componentTypesSnapshot: [{ key: 'lobby', label: 'Lobby', customerAssignable: true }],
    }),
  }));
});

it('slugify collision within one project gets a numeric suffix', async () => {
  prisma.project.findFirst.mockResolvedValue({
    id: 'p-1', companyId: 'co-1',
    componentTypesSnapshot: [{ key: 'room_1', label: 'Room #1', customerAssignable: true }],
    componentCustomerSettings: { room_1: true },
  });
  prisma.project.update.mockResolvedValue({});
  prisma.projectComponent.create.mockResolvedValue({ id: 'c-4', componentTypeKey: 'room_1-2', label: 'Room-1' });
  await service.create('co-1', 'p-1', { typeLabel: 'Room-1', label: 'Room-1' } as any);
  expect(prisma.project.update).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({
      componentTypesSnapshot: [
        { key: 'room_1', label: 'Room #1', customerAssignable: true },
        { key: 'room_1-2', label: 'Room-1', customerAssignable: true },
      ],
    }),
  }));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter crm-service test -- project-components.service`
Expected: FAIL — `create()` doesn't accept `typeLabel` yet, still expects `componentTypeKey`.

- [ ] **Step 3: Implement in `project-components.service.ts`**

Add a `slugify` helper at the top of the file (same shape as the one already used client-side in `TemplatesPage.tsx`):

```ts
function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
```

Add the resolver method (private, on the class) — replaces the earlier `assertComponentType` as the entry point `create()` calls first:

```ts
/**
 * Resolves typeLabel against the project's own componentTypesSnapshot
 * case-insensitively. A match returns the existing type unchanged (typeAssignable
 * is ignored — an existing type's ceiling isn't redefined by typing it again).
 * No match appends a new type (key derived from typeLabel, suffixed on collision)
 * and persists it onto the project before the component itself is created.
 */
private async resolveOrRegisterType(
  companyId: string,
  project: any,
  typeLabel: string,
  typeAssignable: boolean | undefined,
): Promise<{ key: string; label: string; customerAssignable: boolean }> {
  const snapshot = (project.componentTypesSnapshot as Array<{ key: string; label: string; customerAssignable: boolean }> | null) ?? [];
  const existing = snapshot.find((t) => t.label.toLowerCase() === typeLabel.trim().toLowerCase());
  if (existing) return existing;

  if (project.componentTypesSnapshot == null) {
    throw new BadRequestException('This project has no component template — components cannot be added');
  }

  let key = slugify(typeLabel);
  const existingKeys = new Set(snapshot.map((t) => t.key));
  let suffix = 2;
  while (existingKeys.has(key)) {
    key = `${slugify(typeLabel)}-${suffix}`;
    suffix++;
  }

  const newType = { key, label: typeLabel.trim(), customerAssignable: typeAssignable ?? true };
  const updatedSnapshot = [...snapshot, newType];
  const updatedSettings = { ...((project.componentCustomerSettings as object) ?? {}), [key]: newType.customerAssignable };

  await this.prisma.project.update({
    where: { id: project.id },
    data: { componentTypesSnapshot: updatedSnapshot, componentCustomerSettings: updatedSettings },
  });

  return newType;
}
```

Update `create()`'s signature and body (`UpsertComponentInput` gains `typeLabel: string; typeAssignable?: boolean` replacing the direct `componentTypeKey` on the create path — `update()` and its own `componentTypeKey` usage elsewhere are untouched):

```ts
async create(
  companyId: string,
  projectId: string,
  input: { typeLabel: string; typeAssignable?: boolean; label: string; ownerCustomerId?: string; tags?: string[]; notes?: string },
) {
  const project = await this.getProjectOrThrow(companyId, projectId);
  if (!input.label?.trim()) throw new BadRequestException('label is required');
  if (!input.typeLabel?.trim()) throw new BadRequestException('typeLabel is required');

  const componentType = await this.resolveOrRegisterType(companyId, project, input.typeLabel, input.typeAssignable);

  if (input.ownerCustomerId) {
    this.assertOwnerAllowed(project, componentType);
    const customer = await this.prisma.customer.findFirst({ where: { id: input.ownerCustomerId, companyId } });
    if (!customer) throw new BadRequestException('Customer not found in this company');
  }

  const component = await this.prisma.projectComponent.create({
    data: {
      companyId,
      projectId,
      componentTypeKey: componentType.key,
      label: input.label.trim(),
      tags: input.tags ?? [],
      notes: input.notes ?? null,
      ownerCustomerId: input.ownerCustomerId ?? null,
    },
  });
  const [decorated] = await this.decorate(companyId, [component]);
  return decorated;
}
```

`getProjectOrThrow`, `assertOwnerAllowed`, `decorate` are the existing private helpers from the previous session's implementation — unchanged. The old `assertComponentType` private method is now dead code (superseded by `resolveOrRegisterType`, which is a strict superset) — delete it.

- [ ] **Step 4: Run to verify tests pass**

Run: `pnpm --filter crm-service test -- project-components.service`
Expected: PASS, all tests including the 4 new ones (baseline 9 → 13; note the 3 old tests asserting a rejection for an unknown `componentTypeKey` are now obsolete — replace them with the "new type gets registered" tests above rather than keeping both).

- [ ] **Step 5: Update the controller DTO** — in `project-components.controller.ts`, `UpsertComponentDto`:

```ts
class UpsertComponentDto {
  @IsOptional() @IsString() typeLabel?: string;
  @IsOptional() @IsBoolean() typeAssignable?: boolean;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() ownerCustomerId?: string;
}
```

Add `IsBoolean` to the file's `class-validator` import line. The `create()` controller method's type signature changes from `UpsertComponentDto & { componentTypeKey: string; label: string }` to `UpsertComponentDto & { typeLabel: string; label: string }`.

- [ ] **Step 6: Run full crm-service suite**

Run: `pnpm --filter crm-service test`
Expected: all pass.

---

### Task 5: Frontend data layer — `templatesApi.ts` status + `projectsApi.ts` freeform + `componentsApi.ts` typeLabel

**Files:**
- Modify: `apps/admin-dashboard/src/pages/projects/templatesApi.ts`
- Modify: `apps/admin-dashboard/src/pages/projects/projectsApi.ts`
- Modify: `apps/admin-dashboard/src/pages/projects/componentsApi.ts`

**Interfaces:**
- Produces: `ProjectTemplate.status`, `UpsertProjectInput.freeform`, `useCreateComponent`'s mutation input shape `{ typeLabel, typeAssignable?, label, ownerCustomerId?, tags?, notes? }`. Consumed by Tasks 7-10.

- [ ] **Step 1: `templatesApi.ts`** — add `status` to the `ProjectTemplate` interface and `mapTemplate`:

```ts
export interface ProjectTemplate {
  id: string
  companyId: string
  name: string
  description?: string | null
  componentTypes: ComponentTypeMeta[]
  isBuiltIn: boolean
  status: 'DRAFT' | 'PUBLISHED'
  createdAt: string
}
```

```ts
function mapTemplate(raw: any): ProjectTemplate {
  return {
    id: raw.id,
    companyId: raw.companyId,
    name: raw.name,
    description: raw.description ?? null,
    componentTypes: raw.componentTypes ?? [],
    isBuiltIn: !!raw.isBuiltIn,
    status: (raw.status as 'DRAFT' | 'PUBLISHED') ?? 'DRAFT',
    createdAt: raw.createdAt,
  }
}
```

Add a dedicated mutation (thin wrapper over the existing `useUpdateTemplate`, but a named, discoverable action for the UI):

```ts
export function useSetTemplateStatus() {
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'DRAFT' | 'PUBLISHED' }) =>
      mapTemplate((await api.patch(`/crm/project-templates/${id}`, { status })).data),
    onSuccess: invalidateTemplates,
  })
}
```

- [ ] **Step 2: `projectsApi.ts`** — add `freeform?: boolean` to `UpsertProjectInput`:

```ts
export interface UpsertProjectInput {
  customerId?: string
  name?: string
  description?: string
  category?: string
  templateType?: ProjectTemplateType
  templateId?: string
  /** "Customized project" — no template, starts with zero component types. */
  freeform?: boolean
  status?: ProjectStatus
  // ...rest unchanged
}
```

- [ ] **Step 3: `componentsApi.ts`** — change `UpsertComponentInput` and `useCreateComponent`:

```ts
export interface UpsertComponentInput {
  typeLabel?: string
  typeAssignable?: boolean
  label?: string
  tags?: string[]
  notes?: string
  ownerCustomerId?: string
}

export function useCreateComponent(projectId: string | undefined) {
  return useMutation({
    mutationFn: async (input: UpsertComponentInput & { typeLabel: string; label: string }) => {
      const res = await api.post(`/crm/projects/${projectId}/components`, input)
      return mapComponent(res.data)
    },
    onSuccess: () => invalidateProjectComponents(projectId),
  })
}
```

(`componentTypeKey` is removed from `ProjectComponent`'s create path here — the `ProjectComponent` read-side interface, which still has `componentTypeKey: string` for already-created components, is unchanged.)

- [ ] **Step 4: Build to confirm no other call site broke yet**

Run: `pnpm --filter admin-dashboard build 2>&1 | tail -40`
Expected: errors in `ComponentsTab.tsx`'s `AddComponentModal` (still calling `useCreateComponent` with the old `componentTypeKey` shape) and `ProjectEditorModal.tsx`/`TemplatesPage.tsx` (not yet using the new fields) — these are exactly Tasks 6-10, confirm the error list matches those files and nothing else.

---

### Task 6: `TemplatesPage.tsx` — on-canvas color fix, status pill, publish/unpublish, clickable cards

**Files:**
- Modify: `apps/admin-dashboard/src/pages/projects/TemplatesPage.tsx`

**Interfaces:**
- Consumes: `ProjectTemplate.status`, `useSetTemplateStatus` (Task 5).

- [ ] **Step 1: Fix the on-canvas title/subtitle colors**

```tsx
<h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>Project Templates</h1>
```
```tsx
<p style={{ fontSize: 12.5, color: '#94A3B8', margin: '0 0 20px 46px' }}>
  Reusable structures for your projects — define the component types once, use them across any number of projects.
</p>
```

- [ ] **Step 2: Import `useSetTemplateStatus` and add a status pill + publish/unpublish button to each template card**

In the imports:

```tsx
import { useProjectTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useSetTemplateStatus, type ProjectTemplate } from './templatesApi'
```

Add `Send` (or reuse `Check`) to the `lucide-react` import for the publish icon — use `Send` for "Publish" and `EyeOff` for "Unpublish"; add both to the existing import line.

In the card's header row, next to the existing "Built-in" badge, add a status pill:

```tsx
<span style={{
  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, flexShrink: 0,
  background: t.status === 'PUBLISHED' ? 'var(--green-dim)' : 'var(--amber-dim)',
  color: t.status === 'PUBLISHED' ? 'var(--green)' : 'var(--amber)',
}}>
  {t.status === 'PUBLISHED' ? 'Published' : 'Draft'}
</span>
```

Add the mutation hook inside `TemplatesPage`:

```tsx
const setStatus = useSetTemplateStatus()
```

In the card's action row (next to Edit/Delete/Duplicate), add a publish/unpublish button for non-built-in templates:

```tsx
{!t.isBuiltIn && (
  <button
    className="btn btn-ghost btn-sm"
    onClick={() => setStatus.mutate({ id: t.id, status: t.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })}
    disabled={setStatus.isPending}
    title={t.status === 'PUBLISHED' ? 'Unpublish — hide from the New Project picker' : 'Publish — make selectable in the New Project picker'}
  >
    {t.status === 'PUBLISHED' ? <EyeOff size={12} /> : <Send size={12} />}
  </button>
)}
```

- [ ] **Step 3: Make the whole card clickable, not just the Edit button**

Change the card's outer `<div>` to open the editor on click (built-ins open the same modal, which is already read-only for them via the `isBuiltIn` guard inside `TemplateEditorModal`'s save path — no new read-only mode needed, the Save button already no-ops/is guarded server-side; but for a clear affordance, disable the Save button client-side too when `template?.isBuiltIn`):

```tsx
<div key={t.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}
  onClick={() => setEditing(t)}>
```

Stop propagation on the action-row buttons (Edit/Delete/Duplicate/Publish) so clicking them doesn't also trigger the card's own `onClick` opening a duplicate modal — each button already has its own `onClick`; wrap each with `e.stopPropagation()`:

```tsx
<button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setEditing(t) }} style={{ flex: 1 }}>Edit</button>
<button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); remove(t) }} title="Delete"><Trash2 size={12} /></button>
```

(Remove the now-redundant explicit "Edit" button text label change — keep it, just add the stopPropagation; same for the Duplicate and Publish buttons' `onClick` handlers.)

Add a light read-only affordance in `TemplateEditorModal` for built-ins — disable all inputs and hide the Save button when `template?.isBuiltIn`, replacing it with a "Built-in templates can't be edited — duplicate it into a custom template instead" note:

```tsx
const readOnly = !!template?.isBuiltIn
```

Apply `disabled={readOnly}` to the name input, description textarea, and every component-type row's label input / owner-toggle button / remove button / "Add component type" button. Replace the footer's Save button with:

```tsx
{readOnly ? (
  <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: 0, marginRight: 'auto' }}>Built-in — duplicate it to customize.</p>
) : (
  <button className="btn btn-primary btn-sm" onClick={save} disabled={!valid || saving} style={{ opacity: valid && !saving ? 1 : 0.5 }}>
    <Check size={13} /> {template ? 'Save changes' : 'Create template'}
  </button>
)}
```

- [ ] **Step 4: Build**

Run: `pnpm --filter admin-dashboard build 2>&1 | tail -40`
Expected: no errors originating from `TemplatesPage.tsx`.

---

### Task 7: `ProjectEditorModal.tsx` — sizing + three-tier picker

**Files:**
- Modify: `apps/admin-dashboard/src/pages/projects/ProjectEditorModal.tsx`

**Interfaces:**
- Consumes: `ProjectTemplate.status`, `Project.freeform` field on create payload (Task 5).

- [ ] **Step 1: Bump modal sizing**

```tsx
style={{
  width: 1140, maxWidth: '96vw', padding: 0, overflow: 'hidden',
  display: 'flex', flexDirection: 'column',
  height: 'min(920px, calc(100vh - 48px))',
}}
```

- [ ] **Step 2: Add `freeform` to local form state**

```tsx
const [form, setForm] = useState({
  // ...existing fields...
  templateId: (project?.templateId ?? undefined) as string | undefined,
  freeform: false,
})
```

- [ ] **Step 3: Filter templates to published-only and restructure the picker**

```tsx
const { data: allTemplates } = useProjectTemplates()
const publishedTemplates = (allTemplates ?? []).filter(t => t.status === 'PUBLISHED')
```

Replace the template-picker block's grid with the three-tier structure:

```tsx
{!project && (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <label style={lbl}>Project template</label>
      <Link to="/projects/templates" style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Settings2 size={11} /> Manage templates
      </Link>
    </div>

    {/* Row 1 — two fixed primary options */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: publishedTemplates.length > 0 ? 14 : 0 }}>
      <button onClick={() => setForm(f => ({ ...f, templateId: undefined, freeform: false }))} style={{
        display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', cursor: 'pointer',
        padding: '14px 16px', borderRadius: 10, fontFamily: 'inherit',
        border: `1.5px solid ${!form.templateId && !form.freeform ? 'var(--blue)' : 'var(--bd)'}`,
        background: !form.templateId && !form.freeform ? 'var(--blue-dim)' : 'var(--bg-card)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: !form.templateId && !form.freeform ? 'var(--blue)' : 'var(--t1)' }}>No template</span>
          {!form.templateId && !form.freeform && <Check size={14} style={{ color: 'var(--blue)', marginLeft: 'auto' }} />}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.4 }}>A single client with jobs, agreements, and finances. No component breakdown.</span>
      </button>

      <button onClick={() => setForm(f => ({ ...f, templateId: undefined, freeform: true }))} style={{
        display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', cursor: 'pointer',
        padding: '14px 16px', borderRadius: 10, fontFamily: 'inherit',
        border: `1.5px solid ${form.freeform ? 'var(--blue)' : 'var(--bd)'}`,
        background: form.freeform ? 'var(--blue-dim)' : 'var(--bg-card)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Layers size={14} style={{ color: form.freeform ? 'var(--blue)' : 'var(--t3)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: form.freeform ? 'var(--blue)' : 'var(--t1)' }}>Customized project</span>
          {form.freeform && <Check size={14} style={{ color: 'var(--blue)', marginLeft: 'auto' }} />}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.4 }}>Start blank and add whatever components you need as you go — rooms, zones, anything. No predefined structure.</span>
      </button>
    </div>

    {/* Divider + Row 2 — real templates, only when at least one is published */}
    {publishedTemplates.length > 0 && (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 10px' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Or start from a template</span>
          <span style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          {publishedTemplates.map(t => {
            const on = form.templateId === t.id
            return (
              <button key={t.id} onClick={() => setForm(f => ({ ...f, templateId: t.id, freeform: false }))} style={{
                display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', cursor: 'pointer',
                padding: '11px 13px', borderRadius: 10, fontFamily: 'inherit',
                border: `1px solid ${on ? 'var(--blue)' : 'var(--bd)'}`,
                background: on ? 'var(--blue-dim)' : 'var(--bg-card)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Layers size={13} style={{ color: on ? 'var(--blue)' : 'var(--t3)' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: on ? 'var(--blue)' : 'var(--t1)' }}>{t.name}</span>
                  {on && <Check size={12} style={{ color: 'var(--blue)', marginLeft: 'auto' }} />}
                </span>
                <span style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4 }}>
                  {t.description || t.componentTypes.map(c => c.label).join(', ')}
                </span>
              </button>
            )
          })}
        </div>
      </>
    )}

    {(form.templateId || form.freeform) && (
      <p style={{ fontSize: 11, color: 'var(--t4)', margin: '8px 0 0' }}>
        Can't be changed after the project is created.
      </p>
    )}
  </div>
)}
```

- [ ] **Step 4: Send `freeform` on create**

```tsx
if (project) await updateProject.mutateAsync({ id: project.id, ...payload })
else await createProject.mutateAsync({ ...payload, templateId: form.templateId, freeform: form.freeform || undefined })
```

- [ ] **Step 5: Build**

Run: `pnpm --filter admin-dashboard build 2>&1 | tail -40`
Expected: no errors originating from `ProjectEditorModal.tsx`.

---

### Task 8: `Projects.tsx` — "Templates" access point

**Files:**
- Modify: `apps/admin-dashboard/src/pages/projects/Projects.tsx`

**Interfaces:**
- Consumes: `useProjectTemplates` (existing).

- [ ] **Step 1: Add the import and a template count**

```tsx
import { useProjectTemplates } from './templatesApi'
```

Inside the `Projects` component:

```tsx
const { data: templates } = useProjectTemplates()
```

- [ ] **Step 2: Add a "Templates" button next to "New Project"**

Find the action row containing the "New Project" button (near the page header) and add, immediately before it:

```tsx
<button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects/templates')}>
  <Layers size={13} /> Templates{templates && templates.length > 0 ? ` · ${templates.length}` : ''}
</button>
```

Add `Layers` to the existing `lucide-react` import line if not already present.

- [ ] **Step 3: Build**

Run: `pnpm --filter admin-dashboard build 2>&1 | tail -40`
Expected: no errors originating from `Projects.tsx`.

---

### Task 9: `ComponentsTab.tsx` — combobox type entry in `AddComponentModal`

**Files:**
- Modify: `apps/admin-dashboard/src/pages/projects/ComponentsTab.tsx`

**Interfaces:**
- Consumes: `useCreateComponent`'s new input shape (Task 5).

- [ ] **Step 1: Replace the `<select>` with a text combobox + conditional owner-ceiling toggle**

Replace `AddComponentModal`'s type field:

```tsx
function AddComponentModal({ projectId, componentTypes, customerSettings, onClose }: {
  projectId: string; componentTypes: ComponentTypeMeta[]; customerSettings: Record<string, boolean>; onClose: () => void
}) {
  const createComponent = useCreateComponent(projectId)
  const [typeInput, setTypeInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [label, setLabel] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [newTypeAssignable, setNewTypeAssignable] = useState(true)

  const matchedType = componentTypes.find(t => t.label.toLowerCase() === typeInput.trim().toLowerCase())
  const isNewType = typeInput.trim().length > 0 && !matchedType
  const suggestions = componentTypes.filter(t =>
    typeInput.trim() && t.label.toLowerCase().includes(typeInput.trim().toLowerCase()) && t.label.toLowerCase() !== typeInput.trim().toLowerCase()
  ).slice(0, 6)

  const [owner, setOwner] = useState<PickedCustomer | null>(null)
  const ownerAllowed = matchedType
    ? isOwnerAllowed(matchedType.key, componentTypes, customerSettings)
    : newTypeAssignable

  const save = async () => {
    if (!typeInput.trim()) { setError('Give this component a type — Room, Lobby, anything.'); return }
    if (!label.trim()) { setError('Give this component a name.'); return }
    try {
      await createComponent.mutateAsync({
        typeLabel: typeInput.trim(),
        typeAssignable: isNewType ? newTypeAssignable : undefined,
        label: label.trim(),
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        notes: notes.trim() || undefined,
        ownerCustomerId: ownerAllowed ? owner?.id : undefined,
      })
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not add this component')
    }
  }
```

Replace the "Type" form field (inside the "Component details" section) with:

```tsx
<div className="form-group" style={{ position: 'relative' }}>
  <label className="form-label">Type *</label>
  <input
    className="form-input"
    placeholder="Room, Lobby, Pool Deck… type anything"
    value={typeInput}
    onChange={e => setTypeInput(e.target.value)}
    onFocus={() => setShowSuggestions(true)}
    onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
    autoFocus
  />
  {showSuggestions && suggestions.length > 0 && (
    <div style={{
      position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 10,
      background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 9,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden',
    }}>
      {suggestions.map(t => (
        <button key={t.key} type="button" onClick={() => { setTypeInput(t.label); setShowSuggestions(false) }} style={{
          display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13,
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--t1)',
        }}>
          {t.label}
        </button>
      ))}
    </div>
  )}
  {isNewType && (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--t4)' }}>New type — can it have an owner?</span>
      <button
        type="button"
        onClick={() => setNewTypeAssignable(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 7,
          border: `1px solid ${newTypeAssignable ? 'var(--green)' : 'var(--bd)'}`,
          background: newTypeAssignable ? 'var(--green-dim)' : 'var(--bg-card-2)',
          color: newTypeAssignable ? 'var(--green)' : 'var(--t4)',
          fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {newTypeAssignable ? <User size={11} /> : <UserX size={11} />}
        {newTypeAssignable ? 'Owner OK' : 'No owner'}
      </button>
    </div>
  )}
  {matchedType && (
    <p style={{ fontSize: 10.5, color: 'var(--t4)', margin: '6px 0 0' }}>
      Existing type — {matchedType.customerAssignable ? 'can have an owner' : 'never has an owner'} (set in the template/project settings).
    </p>
  )}
</div>
```

Add `UserX` to the `lucide-react` import line at the top of the file (already imports `User`).

The rest of `AddComponentModal` (owner picker section, notes/tags fields, footer) is unchanged — `ownerAllowed` already drives whether the owner-picker section renders, same as before, just now computed from either the matched existing type or the new-type toggle.

- [ ] **Step 2: Build**

Run: `pnpm --filter admin-dashboard build 2>&1 | tail -40`
Expected: no errors originating from `ComponentsTab.tsx`.

- [ ] **Step 3: Manual verification**

Open a project with a template, add a component typing an existing type's name in a different case (e.g. "room" when "Room" exists) — confirm no new-type toggle appears and the component saves with the existing type. Add another typing a brand-new name — confirm the toggle appears, toggle it to "No owner," save, and confirm the new type shows up as a filter chip with no owner picker available on it.

---

### Task 10: `ProjectComponentTag` — shared badge, wired into every job/finance surface

**Files:**
- Create: `apps/admin-dashboard/src/pages/projects/ProjectComponentTag.tsx`
- Modify: `apps/admin-dashboard/src/pages/jobs/Jobs.tsx`
- Modify: `apps/admin-dashboard/src/pages/finance/Finance.tsx`
- Modify: `apps/admin-dashboard/src/pages/agreements/Agreements.tsx`
- Modify: `apps/admin-dashboard/src/pages/jobs/JobDetailModal.tsx`
- Modify: `apps/admin-dashboard/src/pages/scheduling/BoardPlan.tsx`
- Modify: `apps/admin-dashboard/src/pages/scheduling/BoardLive.tsx`
- Modify: `apps/admin-dashboard/src/pages/dispatch/JobDetailPanel.tsx`

**Interfaces:**
- Produces: `<ProjectComponentTag projectId={string} componentId?={string} tone?={'default' | 'hero'} />`, self-resolving via `useProjectName`/`useComponent`, rendered wherever a job/quote/invoice/agreement needs to show its project+component origin.

- [ ] **Step 1: Create the shared component**

```tsx
/**
 * ProjectComponentTag — the one shared "which project / which component" badge,
 * used everywhere a job, quote, invoice, or agreement needs to show where it came
 * from: the main Jobs/Finance/Agreements pages, the job detail modal, the
 * Scheduling board, and the dispatch side panel.
 */
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Layers } from 'lucide-react'
import { useProjectName } from './projectsApi'
import { useComponent } from './componentsApi'

export default function ProjectComponentTag({ projectId, componentId, tone = 'default' }: {
  projectId: string
  componentId?: string | null
  tone?: 'default' | 'hero'
}) {
  const { data: projectName } = useProjectName(projectId)
  const { data: component } = useComponent(componentId ?? undefined)
  const navigate = useNavigate()

  const style: React.CSSProperties = tone === 'hero'
    ? {
        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700,
        padding: '2px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', color: '#fff',
        border: '1px solid rgba(255,255,255,0.28)', cursor: 'pointer',
      }
    : {
        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700,
        color: 'var(--blue)', background: 'var(--blue-dim)', padding: '1px 7px', borderRadius: 999,
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}`) }}
      title="Open project"
      style={style}
    >
      <FolderKanban size={tone === 'hero' ? 10 : 9} />
      {projectName ?? 'Project'}
      {component && (
        <>
          <span style={{ opacity: 0.6 }}>·</span>
          <Layers size={tone === 'hero' ? 10 : 9} />
          {component.label}
        </>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Refactor `Jobs.tsx`'s `JobProjectCell` to use it**

```tsx
function JobProjectCell({ job }: { job: Job }) {
  if (!job.projectId) return <span className="text-xs text-4">—</span>;
  return <ProjectComponentTag projectId={job.projectId} componentId={job.componentId} />;
}
```

Update its call site(s) to drop the now-unused `projectNameById` prop (grep the file for `<JobProjectCell` to find them — pass only `job={j}`). Add the import: `import ProjectComponentTag from '../projects/ProjectComponentTag'`. Leave `projectNameById` itself in the file if it's used elsewhere on the page (e.g. filters) — only stop threading it into this one component.

- [ ] **Step 3: Refactor `Finance.tsx`'s `DocProjectCell` the same way**

```tsx
function DocProjectCell({ projectId, componentId }: { projectId?: string; componentId?: string }) {
  if (!projectId) return <span className="text-3">—</span>
  return <ProjectComponentTag projectId={projectId} componentId={componentId} />
}
```

Add the import, update call sites to drop `projectNameById`.

- [ ] **Step 4: Refactor `Agreements.tsx`'s `AgreementProjectCell` the same way**

```tsx
function AgreementProjectCell({ agreement }: { agreement: Agreement }) {
  if (!agreement.projectId) return <span style={{ color: 'var(--t4)' }}>—</span>
  return <ProjectComponentTag projectId={agreement.projectId} componentId={agreement.componentId ?? undefined} />
}
```

Add the import, update the call site to drop `projectNameById`.

- [ ] **Step 5: `JobDetailModal.tsx`** — replace the local `JobProjectChip` function and its usage:

```tsx
{job.projectId && <ProjectComponentTag projectId={job.projectId} componentId={job.componentId} tone="hero" />}
```

Delete the local `JobProjectChip` function entirely (superseded). Add the import; the existing `useProjectName`/`FolderKanban`/`useNavigate` imports that were only used by the deleted function can be removed if nothing else in the file uses them (check with a grep for each name before removing).

- [ ] **Step 6: `BoardPlan.tsx`** — add the tag under the job title/customer line in the plan-preview table row:

```tsx
<p style={{ fontWeight: 600, color: 'var(--t1)', margin: 0, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
  {p.job.title}
  <RescheduleBadge state={p.job.rescheduleState} size="sm" />
</p>
<p style={{ fontSize: 11.5, color: 'var(--t4)', margin: '2px 0 0' }}>{p.job.customerName ?? ''} {p.job.serviceAddress ? `· ${p.job.serviceAddress}` : ''}</p>
{p.job.projectId && (
  <div style={{ marginTop: 4 }}>
    <ProjectComponentTag projectId={p.job.projectId} componentId={p.job.componentId} />
  </div>
)}
```

Add the import.

- [ ] **Step 7: `BoardLive.tsx`** — add the tag under the customer/address line in the unassigned-queue card:

```tsx
<div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{job.title}</div>
<div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 3 }}>{job.customerName ?? '—'} · {job.serviceAddress ?? job.customerAddress ?? 'No address'}</div>
{job.projectId && (
  <div style={{ marginTop: 4 }} onClick={e => e.stopPropagation()}>
    <ProjectComponentTag projectId={job.projectId} componentId={job.componentId} />
  </div>
)}
```

Note the `onClick={e => e.stopPropagation()}` on the wrapping div — the card itself has an `onClick={() => onOpenJob(...)}`, and the tag's own button already stops propagation internally, but the extra guard on the wrapper keeps this consistent with the rest of the card's click-target handling (the Smart-assign button and select dropdown already do the same). Add the import.

- [ ] **Step 8: `JobDetailPanel.tsx`** — add the tag near the customer line at the top of the panel:

```tsx
<p style={{ fontSize: 12, color: "var(--t3)", margin: 0, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
  <User size={11} />
  {job.customerName ?? "No customer"}
  {assignedTechName !== "Unassigned" && (
    <>
      <span style={{ color: "var(--bd)" }}>·</span>
      <TechAvatar
        id={technician?.id ?? assignment?.technicianId ?? job.assignedToId}
        name={assignedTechName}
        avatarUrl={technician?.avatarUrl}
        size={18}
      />
    </>
  )}
</p>
{job.projectId && (
  <div style={{ marginTop: 6 }}>
    <ProjectComponentTag projectId={job.projectId} componentId={job.componentId} />
  </div>
)}
```

Add the import (relative path `../projects/ProjectComponentTag`).

- [ ] **Step 9: Build**

Run: `pnpm --filter admin-dashboard build 2>&1 | tail -60`
Expected: no errors. If `JobDetailModal.tsx` still imports something now-unused from the deleted `JobProjectChip`, remove that import — this is the one spot worth double-checking since it's a delete, not just an add.

- [ ] **Step 10: Manual verification**

Open the Scheduling board's plan-preview and the "Unassigned now" queue, open a job in the dispatch side panel, and open the same job in the full `JobDetailModal` — confirm the project+component tag renders consistently in all four places for a job linked to a component, and is simply absent (no empty tag, no layout gap) for a job with no project.

---

## Self-Review Notes (already applied above, recorded for the executor)

- **Spec coverage**: every spec section maps to a task — growable types (Task 4, 9),
  Customized project (Task 3, 7), template status (Task 1, 2, 6), New Project modal
  sizing/restructure (Task 7), Template Library access + on-canvas fix (Task 6, 8),
  cross-page tagging (Task 10).
- **Type consistency**: `typeLabel`/`typeAssignable` used identically across the
  service (Task 4), controller DTO (Task 4), frontend mutation input (Task 5), and
  the Add Component form (Task 9) — verified matching at each handoff point.
- **Ordering**: Task 4 (backend growable-type logic) is sequenced before Task 9
  (the frontend form that depends on it) and Task 5 (frontend API layer) sits
  between them, matching the actual dependency chain.
- **Old-test replacement flagged explicitly**: Task 4 Step 4 calls out that the
  previous session's "rejects an unknown componentTypeKey" tests are now obsolete
  and should be replaced, not left dangling alongside the new behavior they contradict.
