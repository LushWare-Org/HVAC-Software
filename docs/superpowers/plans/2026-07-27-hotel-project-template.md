# Hotel Project Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `HOTEL` project template — a freeform, self-nesting tree of zones/rooms/custom areas (no per-area owner), with bulk room creation and the existing equipment photo/AI-scan flow reused per area.

**Architecture:** A new self-referencing `ProjectArea` table (parentAreaId, kind, label) replaces `House`'s role for this template only. `Equipment` gains a second optional parent pointer (`areaId`, alongside the existing `houseId`), and `Equipment.customerId` becomes nullable — Hotel areas have no owner, and a project's own customer is already optional, so area equipment may have no associated customer at all. Same layering as Housing Scheme: crm-service gets a new module (service + two controllers), admin-dashboard gets a new API file + tab component, `PROJECT_TEMPLATES`/`PROJECT_TEMPLATE_META` grow a third entry.

**Tech Stack:** NestJS + Prisma + Postgres (`crm` schema), React 19 + TanStack Query + `lucide-react`, `scripts/apply-migrations.mjs` (not `prisma migrate dev` — this DB requires the manual-migration-script pattern).

## Global Constraints

- Every query/mutation filters by `companyId` — multi-tenancy is non-negotiable in this repo.
- Migrations go through `scripts/apply-migrations.mjs`, appended to the `migrations` array, schema `'crm'` — never `prisma migrate dev` (this database has prior drift that makes it want to reset the schema).
- `templateType` is validated against the code-level registry in `project-templates.ts`, not a DB enum.
- Money/decimal conventions, `clampPagination`, and RBAC role lists (`STAFF_WRITE = [SUPER_ADMIN, COMPANY_ADMIN, OFFICE_MANAGER, DISPATCHER]`) follow the exact patterns already used in `houses.controller.ts`/`houses.service.ts`.
- No customer-portal exposure for areas, no issue-report model for areas, no drag-to-reorder/bulk-reparent — all explicitly out of scope per the spec.

---

## File Structure

**Backend (`apps/crm-service`):**
- `scripts/apply-migrations.mjs` — new migration entry (modify, repo root)
- `apps/crm-service/prisma/schema.prisma` — `ProjectArea` model, `Equipment.areaId` + nullable `customerId`, `Project` doc-comment (modify)
- `apps/crm-service/src/projects/project-templates.ts` — add `'HOTEL'` (modify)
- `apps/crm-service/src/project-areas/project-areas.service.ts` (create)
- `apps/crm-service/src/project-areas/project-areas.service.spec.ts` (create)
- `apps/crm-service/src/project-areas/project-areas.controller.ts` (create)
- `apps/crm-service/src/project-areas/project-areas.controller.spec.ts` (create)
- `apps/crm-service/src/project-areas/project-areas.module.ts` (create)
- `apps/crm-service/src/app.module.ts` — register `ProjectAreasModule` (modify)
- `apps/crm-service/src/equipment/equipment.service.ts` — `findByArea`, `createForArea`, `resyncProjectAreaEquipmentOwner` (modify)
- `apps/crm-service/src/equipment/equipment.service.spec.ts` (modify, if present — else new spec assertions added to `project-areas.service.spec.ts` instead, per below)
- `apps/crm-service/src/projects/projects.service.ts` — resync hook on customerId change, area/equipment rollup in `decorate()` (modify)
- `apps/crm-service/src/projects/projects.module.ts` — import `EquipmentModule` (modify)

**Frontend (`apps/admin-dashboard`):**
- `apps/admin-dashboard/src/pages/projects/areasApi.ts` (create)
- `apps/admin-dashboard/src/pages/projects/projectsApi.ts` — `ProjectTemplateType`/`PROJECT_TEMPLATE_META` gain `HOTEL` (modify)
- `apps/admin-dashboard/src/pages/projects/ProjectEditorModal.tsx` — icon branch (modify)
- `apps/admin-dashboard/src/pages/projects/ProjectDetail.tsx` — tab wiring (modify)
- `apps/admin-dashboard/src/pages/projects/AreasTab.tsx` (create)

---

### Task 1: Migration — `project_areas` table, `equipment.area_id`, nullable `equipment.customerId`

**Files:**
- Modify: `scripts/apply-migrations.mjs` (append before the closing `];` of the `migrations` array, ~line 503)

**Interfaces:**
- Produces: table `crm.project_areas` (columns: `id`, `companyId`, `projectId`, `parentAreaId`, `kind`, `label`, `notes`, `tags`, `sortOrder`, `createdAt`, `updatedAt`); `crm.equipment.area_id` (nullable FK → `project_areas.id`); `crm.equipment.customerId` becomes nullable.

- [ ] **Step 1: Add the migration entry**

Insert this block immediately before the file's closing `];` (after the `20260723020000_rename_document_template_layout_to_rows` entry):

```js
  // ── CRM: Hotel project template — freeform ProjectArea tree
  //    (spec: docs/superpowers/specs/2026-07-27-hotel-project-template-design.md) ──
  {
    schema: 'crm',
    name: '20260727000000_add_hotel_project_areas',
    sql: `
CREATE TABLE IF NOT EXISTS "crm"."project_areas" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "projectId" UUID NOT NULL,
  "parentAreaId" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'CUSTOM',
  "label" TEXT NOT NULL,
  "notes" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "project_areas_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_areas_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "crm"."projects"("id") ON DELETE CASCADE,
  CONSTRAINT "project_areas_parentAreaId_fkey" FOREIGN KEY ("parentAreaId")
    REFERENCES "crm"."project_areas"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "project_areas_projectId_idx" ON "crm"."project_areas"("projectId");
CREATE INDEX IF NOT EXISTS "project_areas_parentAreaId_idx" ON "crm"."project_areas"("parentAreaId");
CREATE INDEX IF NOT EXISTS "project_areas_companyId_idx" ON "crm"."project_areas"("companyId");

ALTER TABLE "crm"."equipment"
  ADD COLUMN IF NOT EXISTS "area_id" TEXT,
  ADD CONSTRAINT "equipment_areaId_fkey" FOREIGN KEY ("area_id")
    REFERENCES "crm"."project_areas"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "equipment_areaId_idx" ON "crm"."equipment"("area_id");

-- Hotel areas have no owner, and a project's own customer is already optional
-- (see 20260722000000_optional_customer_and_equipment_scan) — equipment on a
-- Hotel area may have no associated customer at all.
ALTER TABLE "crm"."equipment" ALTER COLUMN "customerId" DROP NOT NULL;
    `.trim(),
  },
```

- [ ] **Step 2: Run the migration**

Run: `node scripts/apply-migrations.mjs`
Expected: `[apply] 20260727000000_add_hotel_project_areas …` then `[ok] 20260727000000_add_hotel_project_areas` under `=== Schema: crm ===`. Confirm no earlier schema (e.g. `marketing`, `finance`) reports a failure.

- [ ] **Step 3: Commit**

```bash
git add scripts/apply-migrations.mjs
git commit -m "feat(crm): add project_areas table + equipment.area_id + nullable equipment.customerId"
```

---

### Task 2: Prisma schema — `ProjectArea` model, `Equipment.areaId`, nullable `Equipment.customerId`

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma` (Equipment model ~line 411-446, Project model comment ~line 812, new model after `House`/`HouseIssueReport` ~line 899)

**Interfaces:**
- Consumes: table shapes from Task 1.
- Produces: `PrismaClient.projectArea` (all CRUD methods), `Equipment.areaId`/`Equipment.area` relation, `Equipment.customerId: string | null`.

- [ ] **Step 1: Make `Equipment.customerId` optional and add the `areaId` relation**

In `apps/crm-service/prisma/schema.prisma`, replace:

```prisma
model Equipment {
  id          String    @id @default(uuid())
  companyId   String
  customerId  String
  customer    Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  // Housing Scheme projects: which house this equipment belongs to. customerId above
  // stays required and is kept in sync with house.ownerCustomerId (denormalized mirror —
  // see House model comment) so the existing portal "My Equipment" query (by customerId)
  // keeps working unmodified.
  houseId     String?
  house       House?    @relation(fields: [houseId], references: [id], onDelete: SetNull)
```

with:

```prisma
model Equipment {
  id          String    @id @default(uuid())
  companyId   String
  // Nullable: Hotel-template areas have no owner, and a project's own customer is
  // already optional (see Project.customerId) — area equipment may have no customer
  // at all. Kept in sync with house.ownerCustomerId / project.customerId (denormalized
  // mirror) so the existing portal "My Equipment" query (by customerId) keeps working.
  customerId  String?
  customer    Customer? @relation(fields: [customerId], references: [id], onDelete: Cascade)
  // Housing Scheme: which house this equipment belongs to.
  houseId     String?
  house       House?    @relation(fields: [houseId], references: [id], onDelete: SetNull)
  // Hotel template: which zone/room/custom area this equipment belongs to.
  areaId      String?
  area        ProjectArea? @relation(fields: [areaId], references: [id], onDelete: Cascade)
```

- [ ] **Step 2: Add the `@@index([areaId])`**

In the same model, replace:

```prisma
  @@index([customerId])
  @@index([houseId])
  @@map("equipment")
```

with:

```prisma
  @@index([customerId])
  @@index([houseId])
  @@index([areaId])
  @@map("equipment")
```

- [ ] **Step 3: Update the `Project.templateType` doc comment**

Replace:

```prisma
  templateType      String    @default("STANDARD") // STANDARD | HOUSING_SCHEME
```

with:

```prisma
  templateType      String    @default("STANDARD") // STANDARD | HOUSING_SCHEME | HOTEL
```

- [ ] **Step 4: Add the `ProjectArea` model**

Add this new model directly after the `HouseIssueReport` model (after its closing `@@map("house_issue_reports")` line):

```prisma
// ─── Hotel template (spec: docs/superpowers/specs/2026-07-27-hotel-project-template-design.md) ──

// Freeform, self-nesting breakdown of a HOTEL project: zones, rooms, or any
// custom-named area ("Hallway 3F", "Pool Plant Room"). No owner concept at all —
// unlike House, which is owner-bound. kind is cosmetic (drives icon/placeholder
// copy), not a structural constraint — any kind may have children.
model ProjectArea {
  id           String       @id @default(uuid())
  companyId    String
  projectId    String       @db.Uuid
  project      Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parentAreaId String?
  parentArea   ProjectArea? @relation("AreaParent", fields: [parentAreaId], references: [id], onDelete: Cascade)
  children     ProjectArea[] @relation("AreaParent")
  kind         String       @default("CUSTOM") // ZONE | ROOM | CUSTOM
  label        String
  notes        String?
  tags         String[]     @default([])
  sortOrder    Int          @default(0)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  equipment Equipment[]

  @@index([companyId, projectId])
  @@index([parentAreaId])
  @@map("project_areas")
}
```

- [ ] **Step 5: Add the `Project.areas` back-relation**

In the `Project` model, replace:

```prisma
  rosterDays ProjectRosterDay[]
  houses     House[]
```

with:

```prisma
  rosterDays ProjectRosterDay[]
  houses     House[]
  areas      ProjectArea[]
```

- [ ] **Step 6: Regenerate the Prisma client**

Run: `pnpm --filter crm-service prisma generate`
Expected: `Generated Prisma Client` with no errors, and `apps/crm-service/src/prisma/generated/index.d.ts` now contains `ProjectArea`.

- [ ] **Step 7: Type-check**

Run: `pnpm --filter crm-service type-check`
Expected: FAILS at this point — `equipment.service.ts`'s `createForHouse` return type and any code assuming `Equipment.customerId` is a required `string` will now see it as `string | null`. That's expected; Task 5 fixes the one real call site (`createForHouse` already assigns `house.ownerCustomerId`, which is `string | null` — Prisma will accept it either way, so this specific method needs no change). Confirm the only new errors are informational (none expected) — if `pnpm --filter crm-service type-check` reports errors outside `equipment.service.ts`/`houses.service.ts`, stop and investigate before continuing; don't paper over an unrelated break.

- [ ] **Step 8: Commit**

```bash
git add apps/crm-service/prisma/schema.prisma
git commit -m "feat(crm): add ProjectArea model, Equipment.areaId, nullable Equipment.customerId"
```

---

### Task 3: `project-templates.ts` — register `HOTEL`

**Files:**
- Modify: `apps/crm-service/src/projects/project-templates.ts`

**Interfaces:**
- Produces: `PROJECT_TEMPLATES` includes `'HOTEL'`; `ProjectTemplateType` includes `'HOTEL'`.

- [ ] **Step 1: Add `HOTEL` to the registry**

Replace:

```ts
export const PROJECT_TEMPLATES = ['STANDARD', 'HOUSING_SCHEME'] as const;
```

with:

```ts
export const PROJECT_TEMPLATES = ['STANDARD', 'HOUSING_SCHEME', 'HOTEL'] as const;
```

- [ ] **Step 2: Verify the type guard picks it up**

Run: `pnpm --filter crm-service test -- project-templates`
Expected: no test file exists yet for this — this step is a no-op check; skip if the run reports "No tests found" (there is no existing spec for this file, and none is being added — `isValidTemplateType` is exercised indirectly by every other service's tests that reference template validation, e.g. `projects.service.spec.ts` and Task 4's spec).

- [ ] **Step 3: Commit**

```bash
git add apps/crm-service/src/projects/project-templates.ts
git commit -m "feat(crm): register HOTEL project template"
```

---

### Task 4: `ProjectAreasService` — CRUD, bulk room creation, safe re-parenting

**Files:**
- Create: `apps/crm-service/src/project-areas/project-areas.service.ts`
- Create: `apps/crm-service/src/project-areas/project-areas.service.spec.ts`

**Interfaces:**
- Consumes: `PrismaService` (from `../prisma/prisma.service`), `PrismaClient.projectArea`/`.equipment` (Task 2).
- Produces (used by Task 5's controller and Task 6's `ProjectsService` rollup):
  - `listForProject(companyId: string, projectId: string): Promise<DecoratedArea[]>`
  - `create(companyId: string, projectId: string, input: UpsertAreaInput): Promise<DecoratedArea>`
  - `bulkCreateRooms(companyId: string, projectId: string, input: BulkCreateRoomsInput): Promise<DecoratedArea[]>`
  - `findOne(companyId: string, id: string): Promise<DecoratedArea>`
  - `update(companyId: string, id: string, input: UpsertAreaInput): Promise<DecoratedArea>`
  - `remove(companyId: string, id: string): Promise<{ success: true; removedAreaCount: number; unlinkedEquipmentCount: number }>`
  - `previewRemove(companyId: string, id: string): Promise<{ removedAreaCount: number; unlinkedEquipmentCount: number }>`
  - `areaCountForProject(companyId: string, projectId: string): Promise<number>` (used by Task 6)
  - `equipmentCountForProject(companyId: string, projectId: string): Promise<number>` (used by Task 6)
  - `getProjectCustomerId(companyId: string, projectId: string): Promise<string | null>` (used by Task 5)
  - where `UpsertAreaInput = { parentAreaId?: string | null; kind?: string; label?: string; notes?: string | null; tags?: string[] }`, `BulkCreateRoomsInput = { parentAreaId?: string; prefix?: string; start: number; end: number; padZeros?: boolean }`, `DecoratedArea = ProjectArea & { equipmentCount: number }`.

- [ ] **Step 1: Write the failing tests**

Create `apps/crm-service/src/project-areas/project-areas.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectAreasService } from './project-areas.service';
import { PrismaService } from '../prisma/prisma.service';

const CO = 'co-1';
const PROJECT_ID = 'proj-1';
const AREA_ID = 'area-1';

function makePrisma() {
  return {
    project: { findFirst: jest.fn() },
    projectArea: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: null } }),
    },
    equipment: {
      groupBy: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  };
}

describe('ProjectAreasService', () => {
  let service: ProjectAreasService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();
    const mod = await Test.createTestingModule({
      providers: [ProjectAreasService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = mod.get(ProjectAreasService);
  });

  describe('create', () => {
    it('rejects a project that is not HOTEL', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, templateType: 'STANDARD' });
      await expect(service.create(CO, PROJECT_ID, { label: 'Room 101' })).rejects.toThrow(BadRequestException);
    });

    it('rejects a missing label', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, templateType: 'HOTEL' });
      await expect(service.create(CO, PROJECT_ID, { label: '  ' })).rejects.toThrow(BadRequestException);
    });

    it('rejects a parentAreaId belonging to a different project', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, templateType: 'HOTEL' });
      prisma.projectArea.findFirst.mockResolvedValue(null); // parent lookup scoped to this project misses
      await expect(
        service.create(CO, PROJECT_ID, { label: 'Room 101', parentAreaId: 'other-project-area' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a top-level area with sortOrder appended after existing siblings', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, templateType: 'HOTEL' });
      prisma.projectArea.aggregate.mockResolvedValue({ _max: { sortOrder: 4 } });
      prisma.projectArea.create.mockResolvedValue({ id: AREA_ID, companyId: CO, projectId: PROJECT_ID, parentAreaId: null, kind: 'ZONE', label: 'Zone A', sortOrder: 5 });
      const result = await service.create(CO, PROJECT_ID, { label: 'Zone A', kind: 'ZONE' });
      expect(prisma.projectArea.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ sortOrder: 5, parentAreaId: null }) }),
      );
      expect(result.equipmentCount).toBe(0);
    });
  });

  describe('bulkCreateRooms', () => {
    beforeEach(() => {
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, templateType: 'HOTEL' });
    });

    it('rejects end < start', async () => {
      await expect(
        service.bulkCreateRooms(CO, PROJECT_ID, { prefix: 'Room ', start: 120, end: 101 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a range larger than 500 rooms', async () => {
      await expect(
        service.bulkCreateRooms(CO, PROJECT_ID, { prefix: 'Room ', start: 1, end: 502 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates one ROOM area per number in the range with the given prefix', async () => {
      prisma.projectArea.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
      prisma.projectArea.findMany.mockResolvedValue(
        Array.from({ length: 3 }, (_, i) => ({ id: `room-${i}`, label: `Room ${101 + i}`, kind: 'ROOM' })),
      );
      const result = await service.bulkCreateRooms(CO, PROJECT_ID, { prefix: 'Room ', start: 101, end: 103 });
      expect(prisma.projectArea.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ label: 'Room 101', kind: 'ROOM', companyId: CO, projectId: PROJECT_ID }),
            expect.objectContaining({ label: 'Room 102' }),
            expect.objectContaining({ label: 'Room 103' }),
          ]),
        }),
      );
      expect(result).toHaveLength(3);
    });

    it('zero-pads room numbers when padZeros is set', async () => {
      prisma.projectArea.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
      prisma.projectArea.findMany.mockResolvedValue([]);
      await service.bulkCreateRooms(CO, PROJECT_ID, { prefix: 'Room ', start: 1, end: 3, padZeros: true });
      expect(prisma.projectArea.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([expect.objectContaining({ label: 'Room 001' })]),
        }),
      );
    });
  });

  describe('update — re-parent cycle protection', () => {
    it('rejects setting parentAreaId to the area itself', async () => {
      prisma.projectArea.findFirst.mockResolvedValueOnce({ id: AREA_ID, companyId: CO, projectId: PROJECT_ID });
      await expect(service.update(CO, AREA_ID, { parentAreaId: AREA_ID })).rejects.toThrow(BadRequestException);
    });

    it('rejects setting parentAreaId to one of its own descendants', async () => {
      // area-1 -> area-2 (child) -> area-3 (grandchild). Re-parenting area-1 under area-3 is a cycle.
      prisma.projectArea.findFirst.mockResolvedValueOnce({ id: AREA_ID, companyId: CO, projectId: PROJECT_ID });
      prisma.projectArea.findMany.mockResolvedValueOnce([
        { id: AREA_ID, parentAreaId: null },
        { id: 'area-2', parentAreaId: AREA_ID },
        { id: 'area-3', parentAreaId: 'area-2' },
      ]);
      await expect(service.update(CO, AREA_ID, { parentAreaId: 'area-3' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException for an unknown id', async () => {
      prisma.projectArea.findFirst.mockResolvedValue(null);
      await expect(service.remove(CO, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('counts descendants and equipment before deleting', async () => {
      prisma.projectArea.findFirst.mockResolvedValue({ id: AREA_ID, companyId: CO, projectId: PROJECT_ID });
      prisma.projectArea.findMany.mockResolvedValueOnce([
        { id: AREA_ID, parentAreaId: null },
        { id: 'area-2', parentAreaId: AREA_ID },
      ]);
      prisma.equipment.count.mockResolvedValue(3);
      const result = await service.remove(CO, AREA_ID);
      expect(result).toEqual({ success: true, removedAreaCount: 2, unlinkedEquipmentCount: 3 });
      expect(prisma.projectArea.delete).toHaveBeenCalledWith({ where: { id: AREA_ID } });
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter crm-service test -- project-areas.service`
Expected: FAIL — `Cannot find module './project-areas.service'`.

- [ ] **Step 3: Write the implementation**

Create `apps/crm-service/src/project-areas/project-areas.service.ts`:

```ts
/**
 * ProjectAreasService — the "areas" sub-entity for HOTEL template projects.
 * Spec: docs/superpowers/specs/2026-07-27-hotel-project-template-design.md
 *
 * A self-nesting tree (parentAreaId) with no owner concept — Hotel areas differ from
 * House in exactly that respect. kind ('ZONE' | 'ROOM' | 'CUSTOM') is cosmetic only.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const AREA_KINDS = ['ZONE', 'ROOM', 'CUSTOM'];
const MAX_BULK_ROOMS = 500;

export interface UpsertAreaInput {
  parentAreaId?: string | null;
  kind?: string;
  label?: string;
  notes?: string | null;
  tags?: string[];
}

export interface BulkCreateRoomsInput {
  parentAreaId?: string;
  prefix?: string;
  start: number;
  end: number;
  padZeros?: boolean;
}

@Injectable()
export class ProjectAreasService {
  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async listForProject(companyId: string, projectId: string) {
    await this.assertProjectIsHotel(companyId, projectId);
    const areas = await this.prisma.projectArea.findMany({
      where: { companyId, projectId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: 2000,
    });
    return this.decorate(companyId, areas);
  }

  async create(companyId: string, projectId: string, input: UpsertAreaInput) {
    await this.assertProjectIsHotel(companyId, projectId);
    if (!input.label?.trim()) throw new BadRequestException('label is required');
    const kind = this.validateKind(input.kind);

    let parentAreaId: string | null = null;
    if (input.parentAreaId) {
      await this.assertAreaInProject(companyId, projectId, input.parentAreaId);
      parentAreaId = input.parentAreaId;
    }

    const sortOrder = await this.nextSortOrder(companyId, projectId, parentAreaId);
    const area = await this.prisma.projectArea.create({
      data: {
        companyId,
        projectId,
        parentAreaId,
        kind,
        label: input.label.trim(),
        notes: input.notes ?? null,
        tags: input.tags ?? [],
        sortOrder,
      },
    });
    const [decorated] = await this.decorate(companyId, [area]);
    return decorated;
  }

  async bulkCreateRooms(companyId: string, projectId: string, input: BulkCreateRoomsInput) {
    await this.assertProjectIsHotel(companyId, projectId);
    if (!Number.isInteger(input.start) || !Number.isInteger(input.end)) {
      throw new BadRequestException('start and end must be integers');
    }
    if (input.end < input.start) throw new BadRequestException('end must be >= start');
    if (input.end - input.start + 1 > MAX_BULK_ROOMS) {
      throw new BadRequestException(`Cannot create more than ${MAX_BULK_ROOMS} rooms in one call`);
    }

    let parentAreaId: string | null = null;
    if (input.parentAreaId) {
      await this.assertAreaInProject(companyId, projectId, input.parentAreaId);
      parentAreaId = input.parentAreaId;
    }

    const prefix = input.prefix ?? '';
    const width = input.padZeros ? String(input.end).length : 0;
    const baseSortOrder = await this.nextSortOrder(companyId, projectId, parentAreaId);

    const labels: string[] = [];
    for (let n = input.start; n <= input.end; n++) {
      labels.push(`${prefix}${String(n).padStart(width, '0')}`);
    }

    await this.prisma.projectArea.createMany({
      data: labels.map((label, i) => ({
        companyId,
        projectId,
        parentAreaId,
        kind: 'ROOM',
        label,
        tags: [] as string[],
        sortOrder: baseSortOrder + i,
      })),
    });

    const created = await this.prisma.projectArea.findMany({
      where: { companyId, projectId, parentAreaId, label: { in: labels } },
      orderBy: { sortOrder: 'asc' },
    });
    return this.decorate(companyId, created);
  }

  async findOne(companyId: string, id: string) {
    const area = await this.getOrThrow(companyId, id);
    const [decorated] = await this.decorate(companyId, [area]);
    return decorated;
  }

  async update(companyId: string, id: string, input: UpsertAreaInput) {
    const area = await this.getOrThrow(companyId, id);
    const data: any = {};
    if (input.label !== undefined) {
      if (!input.label.trim()) throw new BadRequestException('label cannot be empty');
      data.label = input.label.trim();
    }
    if (input.kind !== undefined) data.kind = this.validateKind(input.kind);
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.tags !== undefined) data.tags = input.tags;

    if (input.parentAreaId !== undefined) {
      if (input.parentAreaId === id) {
        throw new BadRequestException('An area cannot be its own parent');
      }
      if (input.parentAreaId) {
        await this.assertAreaInProject(companyId, area.projectId, input.parentAreaId);
        await this.assertNoCycle(companyId, area.projectId, id, input.parentAreaId);
      }
      data.parentAreaId = input.parentAreaId ?? null;
    }

    const updated = await this.prisma.projectArea.update({ where: { id }, data });
    const [decorated] = await this.decorate(companyId, [updated]);
    return decorated;
  }

  async previewRemove(companyId: string, id: string) {
    await this.getOrThrow(companyId, id);
    return this.countRemoval(companyId, id);
  }

  async remove(companyId: string, id: string) {
    const area = await this.getOrThrow(companyId, id);
    const counts = await this.countRemoval(companyId, area.id);
    await this.prisma.projectArea.delete({ where: { id } });
    return { success: true as const, ...counts };
  }

  // ── Rollups (used by ProjectsService.decorate for HOTEL project cards) ────

  async areaCountForProject(companyId: string, projectId: string) {
    return this.prisma.projectArea.count({ where: { companyId, projectId } });
  }

  async equipmentCountForProject(companyId: string, projectId: string) {
    return this.prisma.equipment.count({ where: { companyId, area: { projectId } } });
  }

  async getProjectCustomerId(companyId: string, projectId: string): Promise<string | null> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { customerId: true },
    });
    return project?.customerId ?? null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private validateKind(kind: string | undefined): string {
    const k = kind ?? 'CUSTOM';
    if (!AREA_KINDS.includes(k)) throw new BadRequestException(`kind must be one of ${AREA_KINDS.join(', ')}`);
    return k;
  }

  private async nextSortOrder(companyId: string, projectId: string, parentAreaId: string | null) {
    const agg = await this.prisma.projectArea.aggregate({
      where: { companyId, projectId, parentAreaId },
      _max: { sortOrder: true },
    });
    return (agg._max.sortOrder ?? -1) + 1;
  }

  private async getOrThrow(companyId: string, id: string) {
    const area = await this.prisma.projectArea.findFirst({ where: { id, companyId } });
    if (!area) throw new NotFoundException('Area not found');
    return area;
  }

  private async assertAreaInProject(companyId: string, projectId: string, areaId: string) {
    const area = await this.prisma.projectArea.findFirst({ where: { id: areaId, companyId, projectId } });
    if (!area) throw new BadRequestException('parentAreaId does not belong to this project');
    return area;
  }

  private async assertProjectIsHotel(companyId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, companyId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.templateType !== 'HOTEL') {
      throw new BadRequestException('Areas can only be added to a Hotel project');
    }
    return project;
  }

  /**
   * A hotel's area tree is small enough (hundreds, not tens of thousands of rows)
   * to load whole and walk in memory — simpler and less error-prone than a
   * recursive SQL CTE, and consistent with how this codebase already prefers
   * batched in-memory joins over recursive queries (see HousesService.decorate).
   */
  private async assertNoCycle(companyId: string, projectId: string, movingId: string, newParentId: string) {
    const all = await this.prisma.projectArea.findMany({
      where: { companyId, projectId },
      select: { id: true, parentAreaId: true },
    });
    const byId = new Map(all.map((a) => [a.id, a.parentAreaId]));
    let cursor: string | null = newParentId;
    const seen = new Set<string>();
    while (cursor) {
      if (cursor === movingId) {
        throw new BadRequestException('Cannot move an area under one of its own descendants');
      }
      if (seen.has(cursor)) break; // defensive: pre-existing cycle, stop rather than loop forever
      seen.add(cursor);
      cursor = byId.get(cursor) ?? null;
    }
  }

  private async countRemoval(companyId: string, id: string) {
    const all = await this.prisma.projectArea.findMany({
      where: { companyId, projectId: (await this.getOrThrow(companyId, id)).projectId },
      select: { id: true, parentAreaId: true },
    });
    const childrenOf = new Map<string, string[]>();
    for (const a of all) {
      if (!a.parentAreaId) continue;
      if (!childrenOf.has(a.parentAreaId)) childrenOf.set(a.parentAreaId, []);
      childrenOf.get(a.parentAreaId)!.push(a.id);
    }
    const descendantIds: string[] = [];
    const stack = [...(childrenOf.get(id) ?? [])];
    while (stack.length) {
      const next = stack.pop()!;
      descendantIds.push(next);
      stack.push(...(childrenOf.get(next) ?? []));
    }
    const allIds = [id, ...descendantIds];
    const unlinkedEquipmentCount = await this.prisma.equipment.count({
      where: { companyId, areaId: { in: allIds } },
    });
    return { removedAreaCount: descendantIds.length, unlinkedEquipmentCount };
  }

  /** Attach equipmentCount so tree rows render without extra round-trips. */
  private async decorate(companyId: string, areas: any[]) {
    if (areas.length === 0) return [];
    const areaIds = areas.map((a) => a.id);
    const counts = await this.prisma.equipment.groupBy({
      by: ['areaId'],
      where: { companyId, areaId: { in: areaIds } },
      _count: { _all: true },
    });
    const countByArea = new Map(counts.map((c) => [c.areaId, c._count._all]));
    return areas.map((a) => ({ ...a, equipmentCount: countByArea.get(a.id) ?? 0 }));
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter crm-service test -- project-areas.service`
Expected: PASS (all `describe` blocks green).

- [ ] **Step 5: Commit**

```bash
git add apps/crm-service/src/project-areas/project-areas.service.ts apps/crm-service/src/project-areas/project-areas.service.spec.ts
git commit -m "feat(crm): add ProjectAreasService (CRUD, bulk rooms, cycle-safe re-parent)"
```

---

### Task 5: Equipment reuse — `findByArea`/`createForArea`/`resyncProjectAreaEquipmentOwner`

**Files:**
- Modify: `apps/crm-service/src/equipment/equipment.service.ts`
- Modify (or create if absent — check first): `apps/crm-service/src/equipment/equipment.service.spec.ts`

**Interfaces:**
- Consumes: `ProjectAreasService.getProjectCustomerId` is NOT used here — `createForArea` reads the project's `customerId` directly via `this.prisma.projectArea.findFirst({ include: { project } })` to avoid a cross-service dependency in `EquipmentService` (it already has none on `ProjectAreasService`, and adding one would create `EquipmentModule` ⇄ `ProjectAreasModule` coupling neither needs otherwise).
- Produces (used by Task 6's controller wiring):
  - `findByArea(companyId: string, areaId: string): Promise<any[]>`
  - `createForArea(companyId: string, areaId: string, data: EquipmentPatch): Promise<Equipment>`
  - `resyncProjectAreaEquipmentOwner(companyId: string, projectId: string, customerId: string | null): Promise<void>` (used by Task 6's `ProjectsService.update`)

- [ ] **Step 1: Check for an existing spec file**

Run: `ls apps/crm-service/src/equipment/equipment.service.spec.ts 2>/dev/null || echo "none"`
If `none`, skip straight to Step 3 (write implementation) and add the tests as a **new** file in Step 2 instead of modifying one. If it exists, add the tests from Step 2 into it (matching its existing `describe('EquipmentService', ...)` block and mock-prisma factory).

- [ ] **Step 2: Write the failing tests**

Add to `apps/crm-service/src/equipment/equipment.service.spec.ts` (creating it with this exact `Test.createTestingModule` setup if it doesn't exist — mirror `houses.service.spec.ts`'s mock-prisma pattern):

```ts
import { Test } from '@nestjs/testing';
import { EquipmentService } from './equipment.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EquipmentScanService } from './equipment-scan.service';

const CO = 'co-1';
const PROJECT_ID = 'proj-1';
const AREA_ID = 'area-1';

function makePrisma() {
  return {
    projectArea: { findFirst: jest.fn() },
    equipment: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    equipmentErrorCode: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('EquipmentService — Hotel areas', () => {
  let service: EquipmentService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();
    const mod = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: {} },
        { provide: EquipmentScanService, useValue: {} },
      ],
    }).compile();
    service = mod.get(EquipmentService);
  });

  describe('createForArea', () => {
    it('sets customerId from the project when the project has a customer', async () => {
      prisma.projectArea.findFirst.mockResolvedValue({
        id: AREA_ID, companyId: CO, project: { customerId: 'cust-1' },
      });
      prisma.equipment.create.mockResolvedValue({ id: 'eq-1' });
      await service.createForArea(CO, AREA_ID, { type: 'AC Unit' });
      expect(prisma.equipment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ areaId: AREA_ID, customerId: 'cust-1' }) }),
      );
    });

    it('allows a null customerId when the project has no customer yet', async () => {
      prisma.projectArea.findFirst.mockResolvedValue({
        id: AREA_ID, companyId: CO, project: { customerId: null },
      });
      prisma.equipment.create.mockResolvedValue({ id: 'eq-1' });
      await service.createForArea(CO, AREA_ID, { type: 'AC Unit' });
      expect(prisma.equipment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ areaId: AREA_ID, customerId: null }) }),
      );
    });
  });

  describe('resyncProjectAreaEquipmentOwner', () => {
    it('updates customerId on every equipment row across the project\'s areas', async () => {
      await service.resyncProjectAreaEquipmentOwner(CO, PROJECT_ID, 'cust-2');
      expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
        where: { companyId: CO, area: { projectId: PROJECT_ID } },
        data: { customerId: 'cust-2' },
      });
    });
  });
});
```

- [ ] **Step 2b: Run the tests to verify they fail**

Run: `pnpm --filter crm-service test -- equipment.service`
Expected: FAIL — `service.createForArea is not a function`.

- [ ] **Step 3: Implement `findByArea`/`createForArea`/`resyncProjectAreaEquipmentOwner`**

In `apps/crm-service/src/equipment/equipment.service.ts`, add directly after the existing `findByHouse` method:

```ts
  async findByArea(companyId: string, areaId: string) {
    const items = await this.prisma.equipment.findMany({
      where: { companyId, areaId },
      orderBy: { createdAt: 'desc' },
    });
    return this.attachErrorCodes(companyId, items);
  }

  /**
   * Add equipment to a ProjectArea (Hotel template). Unlike createForHouse, there is
   * no owner gate — Hotel areas have no owner concept. customerId is derived from the
   * project's own (optional) customer, and may be null if the project has none yet.
   */
  async createForArea(
    companyId: string,
    areaId: string,
    data: {
      type?: string; brand?: string; model?: string; serialNo?: string;
      installDate?: string; warrantyEnd?: string; notes?: string;
    },
  ) {
    const area = await this.prisma.projectArea.findFirst({
      where: { id: areaId, companyId },
      include: { project: { select: { customerId: true } } },
    });
    if (!area) throw new NotFoundException('Area not found');
    return this.prisma.equipment.create({
      data: {
        companyId,
        customerId: area.project.customerId ?? null,
        areaId,
        type: data.type ?? 'AC Unit',
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
   * Re-point customerId on every piece of equipment across a Hotel project's areas
   * when the project's own customer is set/changed. Mirrors resyncHouseEquipmentOwner.
   */
  async resyncProjectAreaEquipmentOwner(companyId: string, projectId: string, customerId: string | null) {
    await this.prisma.equipment.updateMany({
      where: { companyId, area: { projectId } },
      data: { customerId },
    });
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter crm-service test -- equipment.service`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/crm-service/src/equipment/equipment.service.ts apps/crm-service/src/equipment/equipment.service.spec.ts
git commit -m "feat(crm): equipment support for Hotel ProjectArea (no owner gate)"
```

---

### Task 6: Controllers + module — `project-areas.controller.ts`, `project-areas.module.ts`, app wiring

**Files:**
- Create: `apps/crm-service/src/project-areas/project-areas.controller.ts`
- Create: `apps/crm-service/src/project-areas/project-areas.controller.spec.ts`
- Create: `apps/crm-service/src/project-areas/project-areas.module.ts`
- Modify: `apps/crm-service/src/app.module.ts`

**Interfaces:**
- Consumes: `ProjectAreasService` (Task 4), `EquipmentService.findByArea`/`createForArea` (Task 5).
- Produces: routes `GET/POST /projects/:projectId/areas`, `POST /projects/:projectId/areas/bulk`, `GET/PATCH/DELETE /areas/:id`, `GET/POST /areas/:id/equipment`, `PATCH /areas/:id/equipment/:equipmentId`.

- [ ] **Step 1: Write the failing RBAC test**

Create `apps/crm-service/src/project-areas/project-areas.controller.spec.ts`:

```ts
import { ROLES_KEY } from '@tscrm/auth-client';
import { Role } from '@tscrm/types';
import { AreasController } from './project-areas.controller';

describe('AreasController RBAC', () => {
  it('every route is staff-only (no customer role — Hotel areas have no portal exposure)', () => {
    for (const method of ['findOne', 'update', 'remove', 'listEquipment', 'addEquipment', 'updateEquipment'] as const) {
      const roles = Reflect.getMetadata(ROLES_KEY, AreasController.prototype[method]);
      expect(roles).toEqual(expect.arrayContaining([Role.COMPANY_ADMIN]));
      expect(roles).not.toContain(Role.CUSTOMER);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter crm-service test -- project-areas.controller`
Expected: FAIL — `Cannot find module './project-areas.controller'`.

- [ ] **Step 3: Write the controllers**

Create `apps/crm-service/src/project-areas/project-areas.controller.ts`:

```ts
import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { IsString, IsOptional, IsArray, IsIn, IsInt, Min, Max } from 'class-validator';
import { ProjectAreasService } from './project-areas.service';
import { EquipmentService } from '../equipment/equipment.service';

class UpsertAreaDto {
  @IsOptional() @IsString() parentAreaId?: string;
  @IsOptional() @IsIn(['ZONE', 'ROOM', 'CUSTOM']) kind?: string;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() tags?: string[];
}

class BulkCreateRoomsDto {
  @IsOptional() @IsString() parentAreaId?: string;
  @IsOptional() @IsString() prefix?: string;
  @IsInt() @Min(0) start!: number;
  @IsInt() @Max(999999) end!: number;
  @IsOptional() padZeros?: boolean;
}

class AreaEquipmentDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() serialNo?: string;
  @IsOptional() @IsString() installDate?: string;
  @IsOptional() @IsString() warrantyEnd?: string;
  @IsOptional() @IsString() notes?: string;
}

const STAFF_WRITE = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER];

// ── Nested under a project: list/create/bulk-create areas for a Hotel project ──
@ApiTags('Project Areas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/areas')
export class ProjectAreasController {
  constructor(private readonly areas: ProjectAreasService) {}

  @Get()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'List all areas for a Hotel project (flat — client assembles the tree)' })
  list(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.areas.listForProject(user.companyId, projectId);
  }

  @Post()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Add a single zone/room/custom area to a Hotel project' })
  create(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string, @Body() dto: UpsertAreaDto) {
    return this.areas.create(user.companyId, projectId, dto);
  }

  @Post('bulk')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Create a numbered run of rooms in one call (e.g. Room 101..120)' })
  bulk(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string, @Body() dto: BulkCreateRoomsDto) {
    return this.areas.bulkCreateRooms(user.companyId, projectId, dto);
  }
}

// ── Everything else: area detail, equipment (no portal routes — no owner concept) ──
@ApiTags('Project Areas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('areas')
export class AreasController {
  constructor(
    private readonly areas: ProjectAreasService,
    private readonly equipmentService: EquipmentService,
  ) {}

  @Get(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Area detail (equipment count)' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.areas.findOne(user.companyId, id);
  }

  @Patch(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Update an area (label/kind/notes/tags, or re-parent via parentAreaId)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpsertAreaDto) {
    return this.areas.update(user.companyId, id, dto);
  }

  @Get(':id/remove-preview')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Preview how many descendant areas + equipment a delete would remove' })
  removePreview(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.areas.previewRemove(user.companyId, id);
  }

  @Delete(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Remove an area (cascades to descendant areas and their equipment)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.areas.remove(user.companyId, id);
  }

  // ── Equipment (scoped to this area) ─────────────────────────────────────

  @Get(':id/equipment')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'List equipment for an area' })
  listEquipment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.equipmentService.findByArea(user.companyId, id);
  }

  @Post(':id/equipment')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Add equipment to an area — no owner required' })
  addEquipment(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AreaEquipmentDto) {
    return this.equipmentService.createForArea(user.companyId, id, dto);
  }

  @Patch(':id/equipment/:equipmentId')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: "Update an area's equipment item (typically applying an AI scan suggestion)" })
  updateEquipment(
    @CurrentUser() user: AuthUser,
    @Param('equipmentId') equipmentId: string,
    @Body() dto: AreaEquipmentDto,
  ) {
    return this.equipmentService.update(user.companyId, equipmentId, dto);
  }
}
```

- [ ] **Step 4: Write the module**

Create `apps/crm-service/src/project-areas/project-areas.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ProjectAreasController, AreasController } from './project-areas.controller';
import { ProjectAreasService } from './project-areas.service';
import { EquipmentModule } from '../equipment/equipment.module';

@Module({
  imports: [EquipmentModule],
  controllers: [ProjectAreasController, AreasController],
  providers: [ProjectAreasService],
  exports: [ProjectAreasService],
})
export class ProjectAreasModule {}
```

- [ ] **Step 5: Register the module**

In `apps/crm-service/src/app.module.ts`, find the line `import { HousesModule } from './houses/houses.module';` and add directly after it:

```ts
import { ProjectAreasModule } from './project-areas/project-areas.module';
```

Then find `HousesModule,` in the `imports: [...]` array and add directly after it:

```ts
    ProjectAreasModule,
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm --filter crm-service test -- project-areas.controller`
Expected: PASS.

- [ ] **Step 7: Full backend test suite + build**

Run: `pnpm --filter crm-service test && pnpm --filter crm-service build`
Expected: all suites green (including the pre-existing `houses.*`, `equipment.*`, `projects.*` specs — this task must not regress them), build succeeds with no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add apps/crm-service/src/project-areas/project-areas.controller.ts apps/crm-service/src/project-areas/project-areas.controller.spec.ts apps/crm-service/src/project-areas/project-areas.module.ts apps/crm-service/src/app.module.ts
git commit -m "feat(crm): wire ProjectAreas controllers + module into app"
```

---

### Task 7: `ProjectsService` — resync hook + area/equipment rollup

**Files:**
- Modify: `apps/crm-service/src/projects/projects.service.ts`
- Modify: `apps/crm-service/src/projects/projects.module.ts`
- Modify: `apps/crm-service/src/projects/projects.service.spec.ts`

**Interfaces:**
- Consumes: `EquipmentService.resyncProjectAreaEquipmentOwner` (Task 5), `PrismaClient.projectArea`/`.equipment` (Task 2).
- Produces: `ProjectsService.decorate()` output gains `areaCount`/`equipmentCount` for `HOTEL` projects (parallel to how `openIssueCount` is added elsewhere for `HOUSING_SCHEME` — that field lives in `HousesService`, not here, so this task only adds the two new Hotel fields).

- [ ] **Step 1: Write the failing test**

Find the existing `describe('update', ...)` block in `apps/crm-service/src/projects/projects.service.spec.ts` (or the file's top-level `describe`, if `update` isn't its own block — check first with `grep -n "describe" apps/crm-service/src/projects/projects.service.spec.ts`) and add:

```ts
  it('resyncs Hotel area equipment ownership when customerId changes', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, companyId: CO, templateType: 'HOTEL', customerId: null });
    prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1' });
    prisma.project.update.mockResolvedValue({ id: PROJECT_ID, templateType: 'HOTEL', customerId: 'cust-1' });
    await service.update(CO, PROJECT_ID, { customerId: 'cust-1' });
    expect(equipmentService.resyncProjectAreaEquipmentOwner).toHaveBeenCalledWith(CO, PROJECT_ID, 'cust-1');
  });

  it('does not resync for non-HOTEL projects', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, companyId: CO, templateType: 'STANDARD', customerId: null });
    prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1' });
    prisma.project.update.mockResolvedValue({ id: PROJECT_ID, templateType: 'STANDARD', customerId: 'cust-1' });
    await service.update(CO, PROJECT_ID, { customerId: 'cust-1' });
    expect(equipmentService.resyncProjectAreaEquipmentOwner).not.toHaveBeenCalled();
  });
```

Then, in the same file's setup (`beforeEach`/`makeXService` helpers — check the existing pattern with `grep -n "TestingModule\|providers:" apps/crm-service/src/projects/projects.service.spec.ts`), add an `EquipmentService` mock provider:

```ts
const equipmentService = { resyncProjectAreaEquipmentOwner: jest.fn().mockResolvedValue(undefined) };
```

and register it in the `Test.createTestingModule({ providers: [...] })` call alongside the existing `PrismaService` mock:

```ts
        { provide: EquipmentService, useValue: equipmentService },
```

(Add `import { EquipmentService } from '../equipment/equipment.service';` at the top of the spec file.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter crm-service test -- projects.service`
Expected: FAIL — `Nest can't resolve dependencies of ProjectsService` (no `EquipmentService` provider yet) or a constructor-arity error, since `ProjectsService` doesn't take it as a constructor argument yet.

- [ ] **Step 3: Inject `EquipmentService` and add the resync hook**

In `apps/crm-service/src/projects/projects.service.ts`, add the import:

```ts
import { EquipmentService } from '../equipment/equipment.service';
```

Find the `ProjectsService` class's constructor (likely `constructor(private readonly prisma: PrismaService) {}` — confirm with `grep -n "constructor" apps/crm-service/src/projects/projects.service.ts`) and change it to:

```ts
  constructor(
    private readonly prisma: PrismaService,
    private readonly equipmentService: EquipmentService,
  ) {}
```

In the `update()` method, after the existing customer-validation block and before `return this.prisma.project.update(...)`, capture the pre-update project (needed to detect a HOTEL project whose `customerId` actually changed) and fire the resync after the update:

```ts
  async update(companyId: string, id: string, input: UpsertProjectInput) {
    const existing = await this.assertExists(companyId, id);
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

    const updated = await this.prisma.project.update({ where: { id }, data });

    if (existing.templateType === 'HOTEL' && input.customerId !== undefined && input.customerId !== existing.customerId) {
      await this.equipmentService.resyncProjectAreaEquipmentOwner(companyId, id, input.customerId ?? null);
    }

    return updated;
  }
```

Note: `assertExists` must already return the project row (not just check existence) for `existing.templateType`/`existing.customerId` to be readable — confirm with `grep -n "assertExists" apps/crm-service/src/projects/projects.service.ts`. If it currently only throws and returns `void`, change its return type to return the fetched project (it already does a `findFirst` internally to check existence — just `return` that result instead of discarding it), and update its one other call site in this file to still work with a return value it may ignore.

- [ ] **Step 4: Import `EquipmentModule` in `ProjectsModule`**

In `apps/crm-service/src/projects/projects.module.ts`, replace:

```ts
import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

with:

```ts
import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { EquipmentModule } from '../equipment/equipment.module';

@Module({
  imports: [EquipmentModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter crm-service test -- projects.service`
Expected: PASS.

- [ ] **Step 6: Add `areaCount`/`equipmentCount` to the project list rollup**

Find `ProjectsService`'s `decorate()` (or equivalent list-mapping method — confirm name with `grep -n "async decorate\|customerName: p.customerId" apps/crm-service/src/projects/projects.service.ts`, referenced earlier at line ~334). Inject `ProjectAreasService` is unnecessary — this is a light rollup better done inline via two `groupBy`s (consistent with `HousesService.decorate`'s batching), not a cross-service call. Add, in the same method, alongside the existing `customerIds`/`names` batching:

```ts
    const hotelProjectIds = projects.filter((p) => p.templateType === 'HOTEL').map((p) => p.id);
    const [areaCounts, equipmentCounts] = hotelProjectIds.length
      ? await Promise.all([
          this.prisma.projectArea.groupBy({
            by: ['projectId'], where: { companyId, projectId: { in: hotelProjectIds } }, _count: { _all: true },
          }),
          this.prisma.equipment.groupBy({
            by: ['areaId'],
            where: { companyId, area: { projectId: { in: hotelProjectIds } } },
            _count: { _all: true },
          }),
        ])
      : [[], []];
    const areaCountByProject = new Map(areaCounts.map((c: any) => [c.projectId, c._count._all]));
    // equipment groupBy is by areaId, not projectId — sum per project via the area list already fetched above is
    // unnecessary complexity for a card rollup; a second groupBy keyed through the relation filter's projectId
    // isn't supported by Prisma groupBy directly, so count equipment per project with a plain count() per id instead:
    const equipmentCountByProject = new Map<string, number>();
    for (const projectId of hotelProjectIds) {
      const count = await this.prisma.equipment.count({ where: { companyId, area: { projectId } } });
      equipmentCountByProject.set(projectId, count);
    }
```

Then extend the `return projects.map(...)` line to spread these in:

```ts
    return projects.map((p) => ({
      ...p,
      customerName: p.customerId ? (names.get(p.customerId) ?? '—') : null,
      areaCount: p.templateType === 'HOTEL' ? (areaCountByProject.get(p.id) ?? 0) : undefined,
      equipmentCount: p.templateType === 'HOTEL' ? (equipmentCountByProject.get(p.id) ?? 0) : undefined,
    }));
```

(The `equipmentCounts` variable computed via `groupBy` above is unused by the final per-project count method — remove that first `equipmentCounts`/`Promise.all` block and keep only the `areaCounts` groupBy plus the per-project `equipment.count` loop, to avoid dead code. Rewrite Step 6's block as:)

```ts
    const hotelProjectIds = projects.filter((p) => p.templateType === 'HOTEL').map((p) => p.id);
    const areaCounts = hotelProjectIds.length
      ? await this.prisma.projectArea.groupBy({
          by: ['projectId'], where: { companyId, projectId: { in: hotelProjectIds } }, _count: { _all: true },
        })
      : [];
    const areaCountByProject = new Map(areaCounts.map((c: any) => [c.projectId, c._count._all]));
    const equipmentCountByProject = new Map<string, number>();
    for (const projectId of hotelProjectIds) {
      equipmentCountByProject.set(
        projectId,
        await this.prisma.equipment.count({ where: { companyId, area: { projectId } } }),
      );
    }
```

- [ ] **Step 7: Run the full test suite**

Run: `pnpm --filter crm-service test`
Expected: PASS, no regressions.

- [ ] **Step 8: Commit**

```bash
git add apps/crm-service/src/projects/projects.service.ts apps/crm-service/src/projects/projects.module.ts apps/crm-service/src/projects/projects.service.spec.ts
git commit -m "feat(crm): resync Hotel area equipment owner on project customer change + area/equipment rollup"
```

---

### Task 8: Frontend data layer — `areasApi.ts`

**Files:**
- Create: `apps/admin-dashboard/src/pages/projects/areasApi.ts`

**Interfaces:**
- Consumes: `api` client (`../../lib/api`), `queryClient` (`../../lib/queryClient`), same shape conventions as `housesApi.ts` (Task-irrelevant reference file, read-only).
- Produces: `ProjectArea` type, `useProjectAreas(projectId)`, `useCreateArea(projectId)`, `useBulkCreateRooms(projectId)`, `useUpdateArea(projectId)`, `useDeleteArea(projectId)`, `useAreaEquipment(areaId)`, `useAddAreaEquipment(areaId)`, `useUploadAreaEquipmentImage(areaId)`, `useAddAreaErrorCode(areaId)`, `useDeleteAreaErrorCode(areaId)`, `useUpdateAreaEquipment(areaId)` — consumed by Task 10's `AreasTab.tsx`.

- [ ] **Step 1: Write the file**

Create `apps/admin-dashboard/src/pages/projects/areasApi.ts`:

```ts
/**
 * Project Areas data layer — the "Hotel" project template's sub-entity: a freeform,
 * self-nesting tree of zones/rooms/custom areas. No owner concept (unlike House).
 * Spec: docs/superpowers/specs/2026-07-27-hotel-project-template-design.md
 */
import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '../../lib/queryClient'
import api from '../../lib/api'
import type { ImageScanStatus, EquipmentScanResult, EquipmentErrorCode } from './housesApi'

export type AreaKind = 'ZONE' | 'ROOM' | 'CUSTOM'

export interface ProjectArea {
  id: string
  companyId: string
  projectId: string
  parentAreaId?: string | null
  kind: AreaKind
  label: string
  notes?: string | null
  tags: string[]
  sortOrder: number
  createdAt: string
  equipmentCount?: number
}

export interface AreaEquipment {
  id: string
  areaId: string
  customerId?: string | null
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

function mapArea(raw: any): ProjectArea {
  return {
    id: raw.id,
    companyId: raw.companyId,
    projectId: raw.projectId,
    parentAreaId: raw.parentAreaId ?? null,
    kind: raw.kind,
    label: raw.label,
    notes: raw.notes ?? null,
    tags: raw.tags ?? [],
    sortOrder: raw.sortOrder,
    createdAt: raw.createdAt,
    equipmentCount: raw.equipmentCount,
  }
}

// ── Queries ───────────────────────────────────────────────────────────────

export function useProjectAreas(projectId: string | undefined) {
  return useQuery<ProjectArea[]>({
    queryKey: ['areas', 'by-project', projectId],
    queryFn: async () => {
      const res = await api.get(`/crm/projects/${projectId}/areas`)
      return ((res.data ?? []) as any[]).map(mapArea)
    },
    enabled: !!projectId,
    staleTime: 15 * 1000,
  })
}

export function useAreaEquipment(areaId: string | undefined) {
  return useQuery<AreaEquipment[]>({
    queryKey: ['areas', areaId, 'equipment'],
    queryFn: async () => (await api.get(`/crm/areas/${areaId}/equipment`)).data ?? [],
    enabled: !!areaId,
    staleTime: 15 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data as AreaEquipment[] | undefined
      return data?.some(e => e.imageScanStatus === 'SCANNING') ? 3000 : false
    },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────

const invalidateProjectAreas = (projectId: string | undefined) => {
  if (projectId) queryClient.invalidateQueries({ queryKey: ['areas', 'by-project', projectId] })
}

export interface UpsertAreaInput {
  parentAreaId?: string
  kind?: AreaKind
  label?: string
  notes?: string
  tags?: string[]
}

export function useCreateArea(projectId: string | undefined) {
  return useMutation({
    mutationFn: async (input: UpsertAreaInput) => {
      const res = await api.post(`/crm/projects/${projectId}/areas`, input)
      return mapArea(res.data)
    },
    onSuccess: () => invalidateProjectAreas(projectId),
  })
}

export interface BulkCreateRoomsInput {
  parentAreaId?: string
  prefix?: string
  start: number
  end: number
  padZeros?: boolean
}

export function useBulkCreateRooms(projectId: string | undefined) {
  return useMutation({
    mutationFn: async (input: BulkCreateRoomsInput) => {
      const res = await api.post(`/crm/projects/${projectId}/areas/bulk`, input)
      return ((res.data ?? []) as any[]).map(mapArea)
    },
    onSuccess: () => invalidateProjectAreas(projectId),
  })
}

export function useUpdateArea(projectId: string | undefined) {
  return useMutation({
    mutationFn: async ({ id, ...input }: UpsertAreaInput & { id: string }) => {
      const res = await api.patch(`/crm/areas/${id}`, input)
      return mapArea(res.data)
    },
    onSuccess: () => invalidateProjectAreas(projectId),
  })
}

export function useDeleteAreaPreview() {
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.get(`/crm/areas/${id}/remove-preview`)).data as { removedAreaCount: number; unlinkedEquipmentCount: number },
  })
}

export function useDeleteArea(projectId: string | undefined) {
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/crm/areas/${id}`)).data,
    onSuccess: () => invalidateProjectAreas(projectId),
  })
}

export interface AddAreaEquipmentInput {
  type?: string
  brand?: string
  model?: string
  serialNo?: string
  installDate?: string
  warrantyEnd?: string
  notes?: string
}

export function useAddAreaEquipment(areaId: string) {
  return useMutation({
    mutationFn: async (input: AddAreaEquipmentInput) =>
      (await api.post(`/crm/areas/${areaId}/equipment`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId, 'equipment'] })
    },
  })
}

export function useUploadAreaEquipmentImage(areaId: string) {
  return useMutation({
    mutationFn: async ({ equipmentId, file }: { equipmentId: string; file: File }) => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post(`/crm/equipment/${equipmentId}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data as AreaEquipment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId, 'equipment'] })
    },
  })
}

export function useAddAreaErrorCode(areaId: string) {
  return useMutation({
    mutationFn: async ({ equipmentId, code, meaning, source }: { equipmentId: string; code: string; meaning?: string; source?: 'AI_SCAN' | 'MANUAL' }) =>
      (await api.post(`/crm/equipment/${equipmentId}/error-codes`, { code, meaning, source })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId, 'equipment'] })
    },
  })
}

export function useDeleteAreaErrorCode(areaId: string) {
  return useMutation({
    mutationFn: async ({ equipmentId, codeId }: { equipmentId: string; codeId: string }) =>
      (await api.delete(`/crm/equipment/${equipmentId}/error-codes/${codeId}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId, 'equipment'] })
    },
  })
}

export function useUpdateAreaEquipment(areaId: string) {
  return useMutation({
    mutationFn: async ({ equipmentId, ...patch }: { equipmentId: string; brand?: string; model?: string; serialNo?: string }) =>
      (await api.patch(`/crm/areas/${areaId}/equipment/${equipmentId}`, patch)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId, 'equipment'] })
    },
  })
}

// ── Prefetch ──────────────────────────────────────────────────────────────

/** Warm a project's area list so the Areas tab renders instantly. */
export function prefetchAreasForProject(projectId: string): Promise<unknown> {
  return queryClient.prefetchQuery({
    queryKey: ['areas', 'by-project', projectId],
    queryFn: async () => {
      const res = await api.get(`/crm/projects/${projectId}/areas`)
      return ((res.data ?? []) as any[]).map(mapArea)
    },
    staleTime: 15 * 1000,
  })
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: no new TypeScript errors attributable to `areasApi.ts` (pre-existing unrelated errors, e.g. in `AiIotTab.tsx`, are a known separate issue — confirm any reported error is in that file or another pre-existing one, not in a file this task touched).

- [ ] **Step 3: Commit**

```bash
git add apps/admin-dashboard/src/pages/projects/areasApi.ts
git commit -m "feat(admin): add areasApi data layer for Hotel project template"
```

---

### Task 9: `projectsApi.ts` + `ProjectEditorModal.tsx` — register `HOTEL`

**Files:**
- Modify: `apps/admin-dashboard/src/pages/projects/projectsApi.ts`
- Modify: `apps/admin-dashboard/src/pages/projects/ProjectEditorModal.tsx`

**Interfaces:**
- Produces: `ProjectTemplateType` includes `'HOTEL'`; `PROJECT_TEMPLATE_META.HOTEL` exists; template picker renders a third card with a `Building2` icon.

- [ ] **Step 1: Update `projectsApi.ts`**

Replace:

```ts
export type ProjectTemplateType = 'STANDARD' | 'HOUSING_SCHEME'
export const PROJECT_TEMPLATE_META: Record<ProjectTemplateType, { label: string; description: string }> = {
  STANDARD: { label: 'Standard', description: 'A single client with jobs, agreements, and finances.' },
  HOUSING_SCHEME: {
    label: 'Housing Scheme',
    description: 'A development with many houses, each with its own owner, equipment, and portal access.',
  },
}
```

with:

```ts
export type ProjectTemplateType = 'STANDARD' | 'HOUSING_SCHEME' | 'HOTEL'
export const PROJECT_TEMPLATE_META: Record<ProjectTemplateType, { label: string; description: string }> = {
  STANDARD: { label: 'Standard', description: 'A single client with jobs, agreements, and finances.' },
  HOUSING_SCHEME: {
    label: 'Housing Scheme',
    description: 'A development with many houses, each with its own owner, equipment, and portal access.',
  },
  HOTEL: {
    label: 'Hotel',
    description: 'A property broken into zones, rooms, or any custom area — each with its own equipment.',
  },
}
```

Also update the `Project` interface's `areaCount`/`equipmentCount` fields to match Task 7's backend rollup — find the existing `openIssueCount?: number` field (with its "Housing Scheme only" comment) and add directly after it:

```ts
  areaCount?: number       // Hotel only: total zones/rooms/custom areas on the project
  equipmentCount?: number  // Hotel only: total equipment across all areas
```

- [ ] **Step 2: Update `ProjectEditorModal.tsx`**

Change the icon import line:

```ts
import { X, Check, MapPin, Loader2, Home } from 'lucide-react'
```

to:

```ts
import { X, Check, MapPin, Loader2, Home, Building2 } from 'lucide-react'
```

Find the template picker's icon branch:

```tsx
                  {key === 'HOUSING_SCHEME' && <Home size={13} style={{ color: on ? 'var(--blue)' : 'var(--t3)' }} />}
```

and add directly after it:

```tsx
                  {key === 'HOTEL' && <Building2 size={13} style={{ color: on ? 'var(--blue)' : 'var(--t3)' }} />}
```

Find the template picker's grid style (2-column, sized for exactly two cards):

```tsx
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
```

and change it to a layout that scales cleanly to three (or more) cards:

```tsx
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
```

Find the "locked after creation" helper copy, currently gated only on `HOUSING_SCHEME`:

```tsx
         {form.templateType === 'HOUSING_SCHEME' && (
           <p style={{ fontSize: 11, color: 'var(--t4)', margin: '6px 0 0' }}>
             Can't be changed after the project is created.
           </p>
         )}
```

and change the condition to cover both non-`STANDARD` templates (the copy is equally true for Hotel, and `templateType` is immutable after creation for every template, not just Housing Scheme):

```tsx
         {form.templateType !== 'STANDARD' && (
           <p style={{ fontSize: 11, color: 'var(--t4)', margin: '6px 0 0' }}>
             Can't be changed after the project is created.
           </p>
         )}
```

- [ ] **Step 3: Build**

Run: `pnpm --filter admin-dashboard build`
Expected: no new errors from these two files.

- [ ] **Step 4: Commit**

```bash
git add apps/admin-dashboard/src/pages/projects/projectsApi.ts apps/admin-dashboard/src/pages/projects/ProjectEditorModal.tsx
git commit -m "feat(admin): register HOTEL template in picker + areaCount/equipmentCount fields"
```

---

### Task 10: `ProjectDetail.tsx` — wire the Areas tab

**Files:**
- Modify: `apps/admin-dashboard/src/pages/projects/ProjectDetail.tsx`

**Interfaces:**
- Consumes: `AreasTab` (Task 11 — this task references it before it exists; that's fine, Task 11 creates the file this import resolves to. If executing tasks strictly in order, `pnpm --filter admin-dashboard build` in Step 3 below will fail until Task 11 lands — that's expected and acceptable since these two tasks are reviewed together; if using subagent-driven-development with per-task gating, do Task 11 first or merge these two into one review).
- Produces: `?area=<id>` deep link support, `HOTEL` tab entry.

- [ ] **Step 1: Add the import and prefetch**

Add near the top, alongside the existing `import HousesTab from './HousesTab'`:

```ts
import AreasTab from './AreasTab'
```

Add a second prefetch effect alongside the existing Houses one:

```ts
  useEffect(() => {
    if (id) import('./areasApi').then(m => m.prefetchAreasForProject(id))
  }, [id])
```

- [ ] **Step 2: Add the deep-link + tab type + tabs array entry**

Change:

```ts
type Tab = 'overview' | 'roster' | 'jobs' | 'agreements' | 'finances' | 'houses'
```

to:

```ts
type Tab = 'overview' | 'roster' | 'jobs' | 'agreements' | 'finances' | 'houses' | 'areas'
```

Change:

```ts
  const deepLinkHouseId = searchParams.get('house')
  const [tab, setTab] = useState<Tab>(deepLinkHouseId ? 'houses' : 'overview')
```

to:

```ts
  const deepLinkHouseId = searchParams.get('house')
  const deepLinkAreaId = searchParams.get('area')
  const [tab, setTab] = useState<Tab>(deepLinkHouseId ? 'houses' : deepLinkAreaId ? 'areas' : 'overview')
```

Change:

```ts
  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutList },
    ...(project.templateType === 'HOUSING_SCHEME'
      ? [{ key: 'houses' as Tab, label: 'Houses', icon: Home }]
      : []),
    { key: 'roster', label: 'Crew roster', icon: Users2 },
    { key: 'jobs', label: 'Jobs', icon: Wrench, count: project.jobs.length },
    { key: 'agreements', label: 'Agreements', icon: FileSignature, count: project.agreements.length },
    { key: 'finances', label: 'Finances', icon: Wallet },
  ]
```

to (adding the `Building2` import next to the existing `lucide-react` import line, and a `HOTEL` branch):

```ts
  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutList },
    ...(project.templateType === 'HOUSING_SCHEME'
      ? [{ key: 'houses' as Tab, label: 'Houses', icon: Home }]
      : []),
    ...(project.templateType === 'HOTEL'
      ? [{ key: 'areas' as Tab, label: 'Areas', icon: Building2, count: project.areaCount }]
      : []),
    { key: 'roster', label: 'Crew roster', icon: Users2 },
    { key: 'jobs', label: 'Jobs', icon: Wrench, count: project.jobs.length },
    { key: 'agreements', label: 'Agreements', icon: FileSignature, count: project.agreements.length },
    { key: 'finances', label: 'Finances', icon: Wallet },
  ]
```

Update the `lucide-react` import line:

```ts
  AlertTriangle, StickyNote, CalendarClock, Loader2, Link2, Unlink, UserPlus, Home, ChevronRight,
} from 'lucide-react'
```

to:

```ts
  AlertTriangle, StickyNote, CalendarClock, Loader2, Link2, Unlink, UserPlus, Home, ChevronRight, Building2,
} from 'lucide-react'
```

- [ ] **Step 3: Render the tab**

Find:

```tsx
      {tab === 'houses' && (
        <HousesTab
          projectId={project.id}
          projectName={project.name}
          initialOpenHouseId={deepLinkHouseId}
          onInitialHouseConsumed={() => setSearchParams(prev => { prev.delete('house'); return prev }, { replace: true })}
        />
      )}
```

and add directly after it:

```tsx
      {tab === 'areas' && (
        <AreasTab
          projectId={project.id}
          projectName={project.name}
          initialOpenAreaId={deepLinkAreaId}
          onInitialAreaConsumed={() => setSearchParams(prev => { prev.delete('area'); return prev }, { replace: true })}
        />
      )}
```

- [ ] **Step 4: Build (expected to fail until Task 11 lands — see Interfaces note above)**

Run: `pnpm --filter admin-dashboard build`
Expected: `Cannot find module './AreasTab'` until Task 11 is complete. Do not treat this as a regression to fix in this task.

- [ ] **Step 5: Commit**

```bash
git add apps/admin-dashboard/src/pages/projects/ProjectDetail.tsx
git commit -m "feat(admin): wire Areas tab + area deep-link into ProjectDetail"
```

---

### Task 11: `AreasTab.tsx` — tree view, Add Area modal, Bulk Add Rooms modal, equipment reuse

**Files:**
- Create: `apps/admin-dashboard/src/pages/projects/AreasTab.tsx`
- Read (reference only, not modified): `apps/admin-dashboard/src/pages/projects/HousesTab.tsx`

**Interfaces:**
- Consumes: everything from Task 8 (`areasApi.ts`), `shared.tsx` (`fmtDate` etc. — check `HousesTab.tsx`'s import line for the exact export names it uses from `./shared`).
- Produces: `export default function AreasTab({ projectId, projectName, initialOpenAreaId, onInitialAreaConsumed }: { projectId: string; projectName: string; initialOpenAreaId: string | null; onInitialAreaConsumed: () => void })` — consumed by Task 10.

This task has two parts: (A) genuinely new UI (tree, Add Area modal, Bulk Add Rooms modal) written from scratch below, and (B) the equipment sub-panel, which is copied from `HousesTab.tsx`'s `EquipmentSection`/`AddEquipmentModal`/`EquipmentDetailModal` (lines 662–1034) with parameter renames — that logic (photo upload, AI-scan suggestion panel, error-codes list) is already correct and tested in production; re-deriving it from scratch would just risk introducing a subtly different bug. The rename table in Step 3 is exhaustive — every identifier that must change is listed, so this is a mechanical copy, not a judgment call.

- [ ] **Step 1: Read the reference file's equipment section**

Run: `sed -n '662,1034p' apps/admin-dashboard/src/pages/projects/HousesTab.tsx` and read the output — this is the `EquipmentSection`, `AddEquipmentModal`, and `EquipmentDetailModal` functions you'll adapt in Step 3.

- [ ] **Step 2: Write the new tree + modals (Part A)**

Create `apps/admin-dashboard/src/pages/projects/AreasTab.tsx` with this content:

```tsx
/**
 * AreasTab — the "Hotel" project template's sub-entity view: a freeform,
 * self-nesting tree of zones/rooms/custom areas. No owner concept (unlike
 * HousesTab). Spec: docs/superpowers/specs/2026-07-27-hotel-project-template-design.md
 */
import { useMemo, useState } from 'react'
import {
  Plus, ChevronRight, ChevronDown, Home, DoorOpen, Boxes, Wrench,
  Trash2, Pencil, X, Loader2, AlertTriangle,
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import {
  useProjectAreas, useCreateArea, useBulkCreateRooms, useUpdateArea,
  useDeleteArea, useDeleteAreaPreview, useAreaEquipment,
  type ProjectArea, type AreaKind,
} from './areasApi'

const KIND_META: Record<AreaKind, { label: string; icon: typeof Home }> = {
  ZONE: { label: 'Zone', icon: Boxes },
  ROOM: { label: 'Room', icon: DoorOpen },
  CUSTOM: { label: 'Area', icon: Home },
}

interface AreaNode extends ProjectArea {
  children: AreaNode[]
}

function buildTree(areas: ProjectArea[]): AreaNode[] {
  const nodes = new Map<string, AreaNode>(areas.map(a => [a.id, { ...a, children: [] }]))
  const roots: AreaNode[] = []
  for (const node of nodes.values()) {
    if (node.parentAreaId && nodes.has(node.parentAreaId)) {
      nodes.get(node.parentAreaId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

export default function AreasTab({
  projectId, projectName, initialOpenAreaId, onInitialAreaConsumed,
}: {
  projectId: string
  projectName: string
  initialOpenAreaId: string | null
  onInitialAreaConsumed: () => void
}) {
  const { data: areas = [], isLoading } = useProjectAreas(projectId)
  const tree = useMemo(() => buildTree(areas), [areas])
  const [showAddArea, setShowAddArea] = useState<{ parentAreaId?: string } | null>(null)
  const [showBulkAdd, setShowBulkAdd] = useState<{ parentAreaId?: string } | null>(null)
  const [openAreaId, setOpenAreaId] = useState<string | null>(initialOpenAreaId)

  if (isLoading) {
    return (
      <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--t3)' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Areas</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowBulkAdd({})}>
            <Plus size={13} /> Add rooms (bulk)
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddArea({})}>
            <Plus size={13} /> Add area
          </button>
        </div>
      </div>

      {tree.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--t3)', fontSize: 13 }}>
            No areas yet. Add a zone, a room, or any custom area — however this property is actually laid out.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 8 }}>
          {tree.map(node => (
            <AreaRow
              key={node.id}
              node={node}
              depth={0}
              projectId={projectId}
              onOpen={setOpenAreaId}
              onAddChild={(parentAreaId) => setShowAddArea({ parentAreaId })}
              onBulkAddChild={(parentAreaId) => setShowBulkAdd({ parentAreaId })}
            />
          ))}
        </div>
      )}

      {showAddArea && (
        <AddAreaModal
          projectId={projectId}
          parentAreaId={showAddArea.parentAreaId}
          onClose={() => setShowAddArea(null)}
        />
      )}
      {showBulkAdd && (
        <BulkAddRoomsModal
          projectId={projectId}
          parentAreaId={showBulkAdd.parentAreaId}
          onClose={() => setShowBulkAdd(null)}
        />
      )}
      {openAreaId && (
        <AreaDetailModal
          areaId={openAreaId}
          projectId={projectId}
          projectName={projectName}
          onClose={() => {
            setOpenAreaId(null)
            if (openAreaId === initialOpenAreaId) onInitialAreaConsumed()
          }}
        />
      )}
    </div>
  )
}

function AreaRow({
  node, depth, projectId, onOpen, onAddChild, onBulkAddChild,
}: {
  node: AreaNode
  depth: number
  projectId: string
  onOpen: (id: string) => void
  onAddChild: (parentAreaId: string) => void
  onBulkAddChild: (parentAreaId: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const Icon = KIND_META[node.kind].icon
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px',
          paddingLeft: 8 + depth * 20, borderRadius: 6, cursor: 'pointer',
        }}
        onClick={() => onOpen(node.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
            style={{ background: 'none', border: 'none', padding: 2, display: 'flex', color: 'var(--t3)' }}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : (
          <span style={{ width: 17 }} />
        )}
        <Icon size={13} style={{ color: 'var(--t3)' }} />
        <span style={{ fontSize: 13, color: 'var(--t1)', flex: 1 }}>{node.label}</span>
        {!!node.equipmentCount && (
          <span style={{ fontSize: 11, color: 'var(--t3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Wrench size={11} /> {node.equipmentCount}
          </span>
        )}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
          >
            ⋯
          </button>
          {menuOpen && (
            <AreaRowMenu
              node={node}
              projectId={projectId}
              onClose={() => setMenuOpen(false)}
              onAddChild={() => { onAddChild(node.id); setMenuOpen(false) }}
              onBulkAddChild={() => { onBulkAddChild(node.id); setMenuOpen(false) }}
            />
          )}
        </div>
      </div>
      {expanded && node.children.map(child => (
        <AreaRow
          key={child.id}
          node={child}
          depth={depth + 1}
          projectId={projectId}
          onOpen={onOpen}
          onAddChild={onAddChild}
          onBulkAddChild={onBulkAddChild}
        />
      ))}
    </div>
  )
}

function AreaRowMenu({
  node, projectId, onClose, onAddChild, onBulkAddChild,
}: {
  node: AreaNode
  projectId: string
  onClose: () => void
  onAddChild: () => void
  onBulkAddChild: () => void
}) {
  const { showToast } = useToast()
  const deleteArea = useDeleteArea(projectId)
  const previewDelete = useDeleteAreaPreview()
  const [confirming, setConfirming] = useState<{ removedAreaCount: number; unlinkedEquipmentCount: number } | null>(null)

  const handleDeleteClick = async () => {
    const preview = await previewDelete.mutateAsync(node.id)
    setConfirming(preview)
  }

  if (confirming) {
    return (
      <div className="card" style={{
        position: 'absolute', right: 0, top: '100%', zIndex: 20, width: 240, padding: 12,
      }}>
        <p style={{ fontSize: 12, color: 'var(--t2)', margin: '0 0 8px' }}>
          This will also remove {confirming.removedAreaCount} sub-area{confirming.removedAreaCount === 1 ? '' : 's'} and{' '}
          {confirming.unlinkedEquipmentCount} equipment record{confirming.unlinkedEquipmentCount === 1 ? '' : 's'}.
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-danger btn-sm"
            disabled={deleteArea.isPending}
            onClick={() => deleteArea.mutate(node.id, {
              onSuccess: () => { showToast('Area removed', 'success'); onClose() },
              onError: () => showToast('Failed to remove area', 'error'),
            })}
          >
            Delete
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{
      position: 'absolute', right: 0, top: '100%', zIndex: 20, width: 180, padding: 4,
    }}>
      <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={onAddChild}>
        <Plus size={12} /> Add child area
      </button>
      <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={onBulkAddChild}>
        <Plus size={12} /> Add rooms (bulk)
      </button>
      <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--red)' }} onClick={handleDeleteClick}>
        <Trash2 size={12} /> Delete
      </button>
    </div>
  )
}

function AddAreaModal({ projectId, parentAreaId, onClose }: { projectId: string; parentAreaId?: string; onClose: () => void }) {
  const { showToast } = useToast()
  const createArea = useCreateArea(projectId)
  const [kind, setKind] = useState<AreaKind>('ROOM')
  const [label, setLabel] = useState('')

  const submit = () => {
    if (!label.trim()) return
    createArea.mutate({ parentAreaId, kind, label: label.trim() }, {
      onSuccess: () => { showToast('Area added', 'success'); onClose() },
      onError: () => showToast('Failed to add area', 'error'),
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ width: 380, padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Add area</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={13} /></button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {(['ZONE', 'ROOM', 'CUSTOM'] as AreaKind[]).map(k => (
            <button
              key={k}
              className="btn btn-sm"
              style={kind === k ? { background: 'var(--blue)', color: '#fff' } : {}}
              onClick={() => setKind(k)}
            >
              {KIND_META[k].label}
            </button>
          ))}
        </div>
        <input
          className="input"
          placeholder={kind === 'CUSTOM' ? 'e.g. Hallway 3F, Pool Plant Room' : `e.g. ${kind === 'ZONE' ? 'Zone A' : 'Room 204'}`}
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{ width: '100%', marginBottom: 14 }}
          autoFocus
        />
        <button className="btn btn-primary btn-sm" disabled={!label.trim() || createArea.isPending} onClick={submit}>
          {createArea.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add
        </button>
      </div>
    </div>
  )
}

function BulkAddRoomsModal({ projectId, parentAreaId, onClose }: { projectId: string; parentAreaId?: string; onClose: () => void }) {
  const { showToast } = useToast()
  const bulkCreate = useBulkCreateRooms(projectId)
  const [prefix, setPrefix] = useState('Room ')
  const [start, setStart] = useState(101)
  const [end, setEnd] = useState(120)
  const [padZeros, setPadZeros] = useState(false)

  const count = Math.max(0, end - start + 1)
  const invalid = end < start || count > 500

  const submit = () => {
    if (invalid) return
    bulkCreate.mutate({ parentAreaId, prefix, start, end, padZeros }, {
      onSuccess: (rooms) => { showToast(`${rooms.length} rooms added`, 'success'); onClose() },
      onError: () => showToast('Failed to create rooms', 'error'),
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ width: 420, padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Add rooms (bulk)</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={13} /></button>
        </div>
        <label style={{ fontSize: 11, color: 'var(--t3)' }}>Prefix</label>
        <input className="input" value={prefix} onChange={e => setPrefix(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--t3)' }}>Start</label>
            <input type="number" className="input" value={start} onChange={e => setStart(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--t3)' }}>End</label>
            <input type="number" className="input" value={end} onChange={e => setEnd(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t2)', marginBottom: 10 }}>
          <input type="checkbox" checked={padZeros} onChange={e => setPadZeros(e.target.checked)} />
          Zero-pad numbers (e.g. 001)
        </label>
        {invalid && (
          <p style={{ fontSize: 11.5, color: 'var(--red)', display: 'flex', gap: 5, alignItems: 'center', marginBottom: 10 }}>
            <AlertTriangle size={12} /> {end < start ? 'End must be at or after start' : 'Maximum 500 rooms per bulk add'}
          </p>
        )}
        <p style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 14 }}>
          Will create {count} room{count === 1 ? '' : 's'}: {prefix}{start}{padZeros ? ` (padded to ${String(end).length} digits)` : ''} … {prefix}{end}
        </p>
        <button className="btn btn-primary btn-sm" disabled={invalid || bulkCreate.isPending} onClick={submit}>
          {bulkCreate.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add {count} rooms
        </button>
      </div>
    </div>
  )
}

function AreaDetailModal({
  areaId, projectId, projectName, onClose,
}: {
  areaId: string
  projectId: string
  projectName: string
  onClose: () => void
}) {
  const { data: area } = useProjectAreas(projectId)
  const current = area?.find(a => a.id === areaId)
  const { data: equipment = [], isLoading } = useAreaEquipment(areaId)
  const updateArea = useUpdateArea(projectId)
  const [editingLabel, setEditingLabel] = useState(false)
  const [label, setLabel] = useState(current?.label ?? '')

  if (!current) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ width: 560, maxHeight: '85vh', overflow: 'auto', padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          {editingLabel ? (
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              <input className="input" value={label} onChange={e => setLabel(e.target.value)} autoFocus style={{ flex: 1 }} />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => updateArea.mutate({ id: areaId, label }, { onSuccess: () => setEditingLabel(false) })}
              >
                Save
              </button>
            </div>
          ) : (
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {current.label}
              <button className="btn btn-secondary btn-sm" onClick={() => { setLabel(current.label); setEditingLabel(true) }}>
                <Pencil size={11} />
              </button>
            </h3>
          )}
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={13} /></button>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '0 0 16px' }}>{projectName}</p>

        <AreaEquipmentSection areaId={areaId} equipment={equipment} isLoading={isLoading} />
      </div>
    </div>
  )
}

// AreaEquipmentSection: adapted from HousesTab.tsx's EquipmentSection (lines 662-1034) — see Step 3.
```

- [ ] **Step 3: Adapt the equipment section (Part B)**

Read `apps/admin-dashboard/src/pages/projects/HousesTab.tsx` lines 662–1034 (from Step 1). Copy the three functions — `EquipmentSection`, `AddEquipmentModal`, `EquipmentDetailModal` — into `AreasTab.tsx`, replacing the placeholder comment line at the end of Step 2's content. Apply this exact rename table to every occurrence in the copied code:

| In `HousesTab.tsx` | Becomes in `AreasTab.tsx` |
|---|---|
| `EquipmentSection` (function name) | `AreaEquipmentSection` |
| `houseId` (prop/param name) | `areaId` |
| `house: House` (prop) | remove entirely — `AreaEquipmentSection`'s signature is `{ areaId, equipment, isLoading }: { areaId: string; equipment: AreaEquipment[]; isLoading: boolean }` (no `house`/`project` prop needed — Housing Scheme's version needs `house` only for the owner-gate check, which doesn't exist for Hotel) |
| `HouseEquipment` (type) | `AreaEquipment` (from `./areasApi`) |
| `useAddHouseEquipment(houseId)` | `useAddAreaEquipment(areaId)` (from `./areasApi`) |
| `useUploadEquipmentImage(houseId)` | `useUploadAreaEquipmentImage(areaId)` (from `./areasApi`) |
| `useAddErrorCode(houseId)` | `useAddAreaErrorCode(areaId)` (from `./areasApi`) |
| `useDeleteErrorCode(houseId)` | `useDeleteAreaErrorCode(areaId)` (from `./areasApi`) |
| `useUpdateHouseEquipment(houseId)` | `useUpdateAreaEquipment(areaId)` (from `./areasApi`) |
| Any `house.ownerCustomerId`-gated "assign an owner before adding equipment" check/banner | delete entirely — Hotel areas have no owner gate |
| `projectId`/`invalidateHouseServiceLog`/service-log wiring, if present in the copied range | delete — Hotel areas have no service-log tab in v1 (out of scope per spec); keep only photo upload + AI-scan suggestion panel + error-codes list |

After pasting and renaming, update `AreaEquipmentSection`'s call site in `AreaDetailModal` (already written in Step 2) to match whatever exact prop names the adapted function ends up with — it's currently called as `<AreaEquipmentSection areaId={areaId} equipment={equipment} isLoading={isLoading} />`; adjust if the adapted signature differs after applying the rename table (it shouldn't, but this row exists to catch a mismatch, not to allow one).

- [ ] **Step 4: Verify the imports at the top of the file are complete**

After Step 3's paste, check whether the copied code references anything not yet imported (e.g. `Camera`/`Upload`/`Check` icons from `lucide-react`, or `AreaEquipment`'s `ImageScanStatus`/`EquipmentScanResult` types already imported via `./areasApi` in Step 2's header). Run `pnpm --filter admin-dashboard build` and fix any `is not defined` / `Cannot find name` errors by adding the missing import — do not add new dependencies, everything needed already exists in `HousesTab.tsx`'s own import list.

- [ ] **Step 5: Build**

Run: `pnpm --filter admin-dashboard build`
Expected: succeeds (module resolution for `./AreasTab` from Task 10 now works). Confirm any remaining reported errors are the pre-existing, unrelated `AiIotTab.tsx` ones, not anything in `AreasTab.tsx`/`ProjectDetail.tsx`/`areasApi.ts`.

- [ ] **Step 6: Manual smoke test**

Run: `pnpm dev:admin` (or confirm it's already running), then in the browser:
1. Create a new project, template = Hotel.
2. Open its Areas tab. Add a Zone, add a Room under it, add a top-level Room with no zone, add a Custom area named "Pool Plant Room".
3. Use "Add rooms (bulk)" to create Room 101–110.
4. Open a room's detail panel, add an equipment item, upload a photo, confirm the scanning spinner then a result.
5. Delete the zone with the room inside it — confirm the preview shows the correct sub-area/equipment counts before deleting.

Expected: every step works with no console errors. If any step fails, stop and fix before considering this task done — this is the acceptance test for the whole feature, not just this task.

- [ ] **Step 7: Commit**

```bash
git add apps/admin-dashboard/src/pages/projects/AreasTab.tsx
git commit -m "feat(admin): add AreasTab — tree view, bulk room creation, equipment reuse"
```

---

## Self-Review Notes

- **Spec coverage:** freeform tree (Task 2/4), no owner (Task 5's no-gate `createForArea`, Task 2's nullable `customerId`), bulk room add (Task 4/6/11), custom-named components (Task 4's `kind: 'CUSTOM'` + free-text `label`), equipment/AI-scan reuse (Task 5/11), project's optional customer already existed and is only *resynced* here (Task 7) — all covered.
- **Gap found and fixed during planning:** the spec didn't address that `Equipment.customerId` is currently `NOT NULL` in the database, which conflicts with "no owner per room" + "project customer is optional" — an area's equipment could need a null customer. Resolved by making the column nullable (Task 1/2) and deriving `customerId` from the project's own customer (Task 5), consistent with how House already denormalizes `ownerCustomerId` onto its equipment. This is a real schema change beyond Hotel's own tables, so Task 1/2's migration and Prisma edits are called out explicitly rather than folded silently into "add the Hotel tables."
- **Type consistency:** `AreaKind` (`ZONE | ROOM | CUSTOM`) is defined once in `areasApi.ts` (Task 8) and reused unchanged through `AreasTab.tsx` (Task 11); `ProjectArea`/`AreaEquipment` field names match the controller's DTO field names (`parentAreaId`, `kind`, `label`, `notes`, `tags`) end to end.
