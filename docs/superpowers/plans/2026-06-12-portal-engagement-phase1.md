# Customer Portal Engagement — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the three Phase-1 portal stickiness features from `docs/CUSTOMER_PORTAL_ENGAGEMENT_ANALYSIS.md`: Service Report in My Jobs (S8), Equipment + filter/consumable tracking with reminder automation (S1+S2a), and the branded announcement banner (S3).

**Architecture:** S8 is portal-frontend-only (the `GET /jobs/jobs/:id` payload already contains work orders, task completions, line items, signature). S1 adds an `EquipmentConsumable` child model + CRUD in crm-service, a portal My Equipment page, and a `filter-replacement-due` template wired into the existing comms-service equipment-automation cron. S3 adds a `CompanyAnnouncement` model + CRUD in crm-service, an admin editor in Settings, and a portal banner.

**Tech Stack:** NestJS 10 + Prisma (crm-service), NestJS 11 (comms-service), React 19 + TanStack Query (customer-portal, admin-dashboard), Jest + ts-jest.

**Conventions that bind every task:**
- `pnpm` only. No git commits (user commits manually) — each task ends with a verification step instead.
- Every new endpoint reachable by `role=CUSTOMER` must verify `user.customerId` matches the resource owner.
- All new tables carry `companyId`; all queries filter on it.
- Migrations: write SQL into `scripts/supabase-dashboard-migration.sql` (idempotent) AND a Prisma migration folder; apply via `node scripts/apply-migrations.mjs` or Supabase dashboard (user decision at execution time).
- Status enums UPPER_SNAKE_CASE. Money irrelevant here except line items: Prisma Decimal serializes as string — wrap `Number()` before arithmetic.

---

## Task 1 (S8): Service Report tab in portal JobDetailModal

**Files:**
- Modify: `apps/customer-portal/src/types/api.ts` (add WorkOrder/TaskCompletion/LineItem types to `Job`)
- Modify: `apps/customer-portal/src/pages/jobs/JobDetailModal.tsx` (new `report` tab)

Backend needs nothing: `JobsService.findOne` (apps/job-service/src/jobs/jobs.service.ts:145) already includes `workOrders { lineItems, taskCompletions }` + `statusHistory`, and the controller's CUSTOMER ownership check exists (jobs.controller.ts:95).

- [ ] **Step 1.1: Extend portal Job types**

In `apps/customer-portal/src/types/api.ts`, add (near the existing `Job` interface):

```ts
export interface WorkOrderTaskCompletion {
  id: string
  taskId: string
  taskDescription?: string
  completed: boolean
  completedAt?: string
  notes?: string
  photoUrl?: string
}

export interface WorkOrderLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: string | number   // Prisma Decimal → string in JSON
  total?: string | number
}

export interface WorkOrder {
  id: string
  workOrderNumber: string
  technicianName: string
  status: string
  checkinAt?: string
  checkoutAt?: string
  signatureUrl?: string
  technicianNotes?: string
  lineItems: WorkOrderLineItem[]
  taskCompletions: WorkOrderTaskCompletion[]
}
```

and add to the existing `Job` interface: `workOrders?: WorkOrder[]`.

(Field names must match the Prisma models in `apps/job-service/prisma/schema.prisma:310` — verify `WorkOrderTaskCompletion`/`WorkOrderLineItem` column names against the schema before writing; adjust the interface to the actual columns, e.g. if the line-item price column is `unitPriceCents` or `price`, mirror it.)

- [ ] **Step 1.2: Add the `report` tab**

In `JobDetailModal.tsx`:
1. Extend `type TabType = 'overview' | 'schedule' | 'documents' | 'notes' | 'chat'` with `| 'report'`.
2. The modal already calls `useMyJob(job.id)` — use that result (`detail`) as the data source.
3. Add a tab button labeled "Service Report" (icon: `ClipboardCheck` from lucide) — render it only when `detail?.workOrders?.length > 0 && ['COMPLETED','INVOICED','PAID'].includes(detail.status)`.
4. Tab content, per work order:

```tsx
{activeTab === 'report' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {(detail?.workOrders ?? []).map((wo) => (
      <div key={wo.id} className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong>{wo.workOrderNumber}</strong>
          <span>{wo.technicianName}</span>
        </div>
        {(wo.checkinAt || wo.checkoutAt) && (
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
            {fmtDateTime(wo.checkinAt)} → {fmtDateTime(wo.checkoutAt)}
          </div>
        )}
        {wo.taskCompletions.length > 0 && (
          <>
            <div style={{ fontWeight: 600, fontSize: 13, margin: '8px 0' }}>Work performed</div>
            {wo.taskCompletions.map((t) => (
              <div key={t.id} style={{ fontSize: 13, padding: '4px 0' }}>
                {t.completed ? '✅' : '⬜'} {t.taskDescription ?? t.taskId}
                {t.notes && <div style={{ color: '#6B7280', marginLeft: 22 }}>{t.notes}</div>}
              </div>
            ))}
          </>
        )}
        {wo.lineItems.length > 0 && (
          <>
            <div style={{ fontWeight: 600, fontSize: 13, margin: '8px 0' }}>Parts &amp; materials</div>
            {wo.lineItems.map((li) => (
              <div key={li.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
                <span>{li.description} × {li.quantity}</span>
                <span>${(Number(li.unitPrice) * li.quantity).toFixed(2)}</span>
              </div>
            ))}
          </>
        )}
        {wo.technicianNotes && (
          <>
            <div style={{ fontWeight: 600, fontSize: 13, margin: '8px 0' }}>Technician notes</div>
            <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{wo.technicianNotes}</div>
          </>
        )}
        {wo.signatureUrl && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Customer signature</div>
            <img src={wo.signatureUrl} alt="Signature" style={{ maxHeight: 80 }} />
          </div>
        )}
      </div>
    ))}
  </div>
)}
```

Match the modal's existing tab-button markup exactly (copy an existing tab button and change label/key). Reuse `fmtDateTime` already defined in the file.

- [ ] **Step 1.3: Verify**

Run: `pnpm --filter customer-portal build`
Expected: `tsc -b` + vite build pass with no errors.

Manual check (execution time): portal → My Jobs → a COMPLETED job → Service Report tab shows work order detail. Confirm a customer-owned job renders and the tab is absent for PENDING jobs.

---

## Task 2 (S1): `EquipmentConsumable` Prisma model + migration

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma` (model + relation)
- Create: `apps/crm-service/prisma/migrations/20260612090000_add_equipment_consumables/migration.sql`
- Modify: `scripts/supabase-dashboard-migration.sql` (append idempotent copy)

- [ ] **Step 2.1: Add the model**

In `schema.prisma`, append after `model Equipment` (line ~354), and add `consumables EquipmentConsumable[]` inside `model Equipment`:

```prisma
model EquipmentConsumable {
  id             String    @id @default(uuid())
  companyId      String
  equipmentId    String
  equipment      Equipment @relation(fields: [equipmentId], references: [id], onDelete: Cascade)
  kind           String    @default("FILTER") // FILTER | UV_BULB | PAD | OTHER
  partNumber     String?                      // "X6673"
  description    String?                      // "Healthy Climate HCF20-11"
  sizeSpec       String?                      // "20x25x5"
  rating         String?                      // "MERV 11"
  intervalDays   Int       @default(90)
  lastReplacedAt DateTime?
  purchaseUrl    String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([equipmentId])
  @@index([companyId])
  @@map("equipment_consumables")
}
```

`nextDueAt` is computed in the service (`lastReplacedAt ?? equipment.installDate` + `intervalDays`), not stored.

- [ ] **Step 2.2: Write the migration SQL**

`apps/crm-service/prisma/migrations/20260612090000_add_equipment_consumables/migration.sql`:

```sql
CREATE TABLE IF NOT EXISTS "crm"."equipment_consumables" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'FILTER',
  "partNumber" TEXT,
  "description" TEXT,
  "sizeSpec" TEXT,
  "rating" TEXT,
  "intervalDays" INTEGER NOT NULL DEFAULT 90,
  "lastReplacedAt" TIMESTAMP(3),
  "purchaseUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "equipment_consumables_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "equipment_consumables_equipmentId_fkey" FOREIGN KEY ("equipmentId")
    REFERENCES "crm"."equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "equipment_consumables_equipmentId_idx" ON "crm"."equipment_consumables"("equipmentId");
CREATE INDEX IF NOT EXISTS "equipment_consumables_companyId_idx" ON "crm"."equipment_consumables"("companyId");
```

Append the same block (verbatim, it's idempotent) to `scripts/supabase-dashboard-migration.sql` under a `-- 2026-06-12 portal engagement phase 1` comment.

- [ ] **Step 2.3: Regenerate client + verify**

Run: `pnpm --filter crm-service exec prisma generate`
Expected: "Generated Prisma Client".
Run: `pnpm --filter crm-service type-check`
Expected: clean.
Apply migration (execution-time choice): `node scripts/apply-migrations.mjs` or Supabase SQL editor.

---

## Task 3 (S1): ConsumablesService + tests + controller routes

**Files:**
- Create: `apps/crm-service/src/equipment/consumables.service.ts`
- Create: `apps/crm-service/src/equipment/consumables.service.spec.ts`
- Modify: `apps/crm-service/src/equipment/equipment.controller.ts` (consumable routes + fix findAll customer-scoping gap)
- Modify: `apps/crm-service/src/equipment/equipment.module.ts` (provider)

- [ ] **Step 3.1: Write the failing tests**

`consumables.service.spec.ts`:

```ts
import { NotFoundException } from '@nestjs/common'
import { ConsumablesService } from './consumables.service'

function prismaMock(over: any = {}) {
  return {
    equipment: { findFirst: jest.fn().mockResolvedValue(over.equipment ?? { id: 'eq-1', companyId: 'co-1', customerId: 'cust-1', installDate: new Date('2026-01-01') }) },
    equipmentConsumable: {
      findMany: jest.fn().mockResolvedValue(over.consumables ?? []),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'c-1', ...data })),
      findFirst: jest.fn().mockResolvedValue(over.consumable ?? null),
      update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'c-1', ...data })),
      delete: jest.fn().mockResolvedValue({}),
    },
  } as any
}

describe('ConsumablesService', () => {
  it('create scopes the equipment lookup by companyId', async () => {
    const prisma = prismaMock()
    const svc = new ConsumablesService(prisma)
    await svc.create('co-1', 'eq-1', { kind: 'FILTER', partNumber: 'X6673', intervalDays: 90 })
    expect(prisma.equipment.findFirst.mock.calls[0][0].where).toEqual({ id: 'eq-1', companyId: 'co-1' })
    expect(prisma.equipmentConsumable.create.mock.calls[0][0].data.companyId).toBe('co-1')
  })

  it('create throws NotFound for equipment outside the company', async () => {
    const prisma = prismaMock({ equipment: null })
    const svc = new ConsumablesService(prisma)
    await expect(svc.create('co-2', 'eq-1', {})).rejects.toBeInstanceOf(NotFoundException)
  })

  it('computes nextDueAt from lastReplacedAt + intervalDays', () => {
    const svc = new ConsumablesService(prismaMock())
    const due = svc.computeNextDue({ lastReplacedAt: new Date('2026-06-01'), intervalDays: 90 } as any, null)
    expect(due?.toISOString().slice(0, 10)).toBe('2026-08-30')
  })

  it('falls back to equipment installDate when never replaced', () => {
    const svc = new ConsumablesService(prismaMock())
    const due = svc.computeNextDue({ lastReplacedAt: null, intervalDays: 90 } as any, new Date('2026-01-01'))
    expect(due?.toISOString().slice(0, 10)).toBe('2026-04-01')
  })

  it('markReplaced sets lastReplacedAt and is company-scoped', async () => {
    const prisma = prismaMock({ consumable: { id: 'c-1', companyId: 'co-1' } })
    const svc = new ConsumablesService(prisma)
    await svc.markReplaced('co-1', 'c-1')
    expect(prisma.equipmentConsumable.findFirst.mock.calls[0][0].where).toEqual({ id: 'c-1', companyId: 'co-1' })
    expect(prisma.equipmentConsumable.update.mock.calls[0][0].data.lastReplacedAt).toBeInstanceOf(Date)
  })

  it('listForCustomer returns consumables with nextDueAt + dueInDays attached', async () => {
    const prisma = prismaMock({
      consumables: [{ id: 'c-1', intervalDays: 90, lastReplacedAt: new Date('2026-06-01'), equipment: { installDate: null } }],
    })
    const svc = new ConsumablesService(prisma)
    const out = await svc.listForEquipment('co-1', 'eq-1')
    expect(out[0].nextDueAt).toBeDefined()
    expect(typeof out[0].dueInDays).toBe('number')
  })
})
```

- [ ] **Step 3.2: Run tests, confirm they fail**

Run: `pnpm --filter crm-service test -- --testPathPattern='consumables'`
Expected: FAIL — `Cannot find module './consumables.service'`.

- [ ] **Step 3.3: Implement the service**

`consumables.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface ConsumableDto {
  kind?: string
  partNumber?: string
  description?: string
  sizeSpec?: string
  rating?: string
  intervalDays?: number
  lastReplacedAt?: string
  purchaseUrl?: string
}

@Injectable()
export class ConsumablesService {
  constructor(private readonly prisma: PrismaService) {}

  computeNextDue(c: { lastReplacedAt: Date | null; intervalDays: number }, installDate: Date | null): Date | null {
    const anchor = c.lastReplacedAt ?? installDate
    if (!anchor) return null
    return new Date(anchor.getTime() + c.intervalDays * 86_400_000)
  }

  private withDue<T extends { lastReplacedAt: Date | null; intervalDays: number; equipment?: { installDate: Date | null } }>(c: T) {
    const nextDueAt = this.computeNextDue(c, c.equipment?.installDate ?? null)
    const dueInDays = nextDueAt ? Math.ceil((nextDueAt.getTime() - Date.now()) / 86_400_000) : null
    const { equipment: _omit, ...rest } = c as any
    return { ...rest, nextDueAt, dueInDays }
  }

  private async assertEquipment(companyId: string, equipmentId: string) {
    const eq = await this.prisma.equipment.findFirst({ where: { id: equipmentId, companyId } })
    if (!eq) throw new NotFoundException(`Equipment ${equipmentId} not found`)
    return eq
  }

  async listForEquipment(companyId: string, equipmentId: string) {
    const rows = await this.prisma.equipmentConsumable.findMany({
      where: { equipmentId, companyId },
      include: { equipment: { select: { installDate: true } } },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map((r) => this.withDue(r))
  }

  async create(companyId: string, equipmentId: string, dto: ConsumableDto) {
    await this.assertEquipment(companyId, equipmentId)
    return this.prisma.equipmentConsumable.create({
      data: {
        companyId,
        equipmentId,
        kind: dto.kind ?? 'FILTER',
        partNumber: dto.partNumber,
        description: dto.description,
        sizeSpec: dto.sizeSpec,
        rating: dto.rating,
        intervalDays: dto.intervalDays ?? 90,
        lastReplacedAt: dto.lastReplacedAt ? new Date(dto.lastReplacedAt) : null,
        purchaseUrl: dto.purchaseUrl,
      },
    })
  }

  private async assertOwned(companyId: string, id: string) {
    const row = await this.prisma.equipmentConsumable.findFirst({ where: { id, companyId } })
    if (!row) throw new NotFoundException(`Consumable ${id} not found`)
    return row
  }

  async update(companyId: string, id: string, dto: ConsumableDto) {
    await this.assertOwned(companyId, id)
    return this.prisma.equipmentConsumable.update({
      where: { id },
      data: {
        ...(dto.kind !== undefined && { kind: dto.kind }),
        ...(dto.partNumber !== undefined && { partNumber: dto.partNumber }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sizeSpec !== undefined && { sizeSpec: dto.sizeSpec }),
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.intervalDays !== undefined && { intervalDays: dto.intervalDays }),
        ...(dto.lastReplacedAt !== undefined && { lastReplacedAt: dto.lastReplacedAt ? new Date(dto.lastReplacedAt) : null }),
        ...(dto.purchaseUrl !== undefined && { purchaseUrl: dto.purchaseUrl }),
      },
    })
  }

  async markReplaced(companyId: string, id: string) {
    await this.assertOwned(companyId, id)
    return this.prisma.equipmentConsumable.update({ where: { id }, data: { lastReplacedAt: new Date() } })
  }

  async remove(companyId: string, id: string) {
    await this.assertOwned(companyId, id)
    await this.prisma.equipmentConsumable.delete({ where: { id } })
  }
}
```

- [ ] **Step 3.4: Controller routes + ownership fix**

In `equipment.controller.ts`:

1. **Fix the existing gap** — `findAll` (line 45) currently lets a CUSTOMER read any customer's equipment. Add:

```ts
  @Get()
  @ApiOperation({ summary: 'List equipment for a customer' })
  findAll(@CurrentUser() user: AuthUser, @Param('customerId') customerId: string) {
    if (user.role === Role.CUSTOMER && user.customerId !== customerId) {
      throw new ForbiddenException('You can only view your own equipment');
    }
    return this.equipmentService.findByCustomer(user.companyId, customerId);
  }
```

2. Add a DTO + consumable routes (same guard pattern as the other routes — `user.role === Role.CUSTOMER && user.customerId !== customerId → Forbidden`):

```ts
class ConsumableBodyDto {
  @IsOptional() @IsString() kind?: string;
  @IsOptional() @IsString() partNumber?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() sizeSpec?: string;
  @IsOptional() @IsString() rating?: string;
  @IsOptional() @IsInt() @Min(1) @Max(3650) intervalDays?: number;
  @IsOptional() @IsString() lastReplacedAt?: string;
  @IsOptional() @IsUrl({ require_tld: false }) purchaseUrl?: string;
}
```

(import `IsInt, Min, Max, IsUrl` from class-validator)

```ts
  // ── Consumables (filters etc.) ──────────────────────────────────────────────

  @Get(':equipmentId/consumables')
  @ApiOperation({ summary: 'List consumables (filters) for an equipment item' })
  listConsumables(
    @CurrentUser() user: AuthUser,
    @Param('customerId') customerId: string,
    @Param('equipmentId') equipmentId: string,
  ) {
    if (user.role === Role.CUSTOMER && user.customerId !== customerId) {
      throw new ForbiddenException('You can only view your own equipment');
    }
    return this.consumablesService.listForEquipment(user.companyId, equipmentId);
  }

  @Post(':equipmentId/consumables')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Add a consumable to an equipment item (staff only)' })
  createConsumable(
    @CurrentUser() user: AuthUser,
    @Param('equipmentId') equipmentId: string,
    @Body() dto: ConsumableBodyDto,
  ) {
    return this.consumablesService.create(user.companyId, equipmentId, dto);
  }

  @Patch(':equipmentId/consumables/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  updateConsumable(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ConsumableBodyDto,
  ) {
    return this.consumablesService.update(user.companyId, id, dto);
  }

  @Post(':equipmentId/consumables/:id/replaced')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a consumable replaced today (customer-allowed)' })
  markReplaced(
    @CurrentUser() user: AuthUser,
    @Param('customerId') customerId: string,
    @Param('id') id: string,
  ) {
    if (user.role === Role.CUSTOMER && user.customerId !== customerId) {
      throw new ForbiddenException('You can only manage your own equipment');
    }
    return this.consumablesService.markReplaced(user.companyId, id);
  }

  @Delete(':equipmentId/consumables/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeConsumable(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.consumablesService.remove(user.companyId, id);
  }
```

Constructor becomes:
```ts
constructor(
  private readonly equipmentService: EquipmentService,
  private readonly consumablesService: ConsumablesService,
) {}
```

3. In `equipment.module.ts`, add `ConsumablesService` to `providers` (and `exports` — Task 5's CRM automation endpoint needs it).

- [ ] **Step 3.5: Run tests + type-check**

Run: `pnpm --filter crm-service test -- --testPathPattern='consumables'`
Expected: 6 tests PASS.
Run: `pnpm --filter crm-service test` (full suite — no regressions) and `pnpm --filter crm-service type-check`
Expected: all PASS / clean.

---

## Task 4 (S1): Portal "My Equipment" page

**Files:**
- Create: `apps/customer-portal/src/hooks/useMyEquipment.ts`
- Create: `apps/customer-portal/src/pages/Equipment.tsx`
- Modify: `apps/customer-portal/src/components/Sidebar.tsx` (nav item)
- Modify: `apps/customer-portal/src/App.tsx` (route)
- Modify: `apps/customer-portal/src/types/api.ts` (Equipment + Consumable types)

- [ ] **Step 4.1: Types**

In `types/api.ts`:

```ts
export interface EquipmentConsumable {
  id: string
  kind: string
  partNumber?: string
  description?: string
  sizeSpec?: string
  rating?: string
  intervalDays: number
  lastReplacedAt?: string
  purchaseUrl?: string
  nextDueAt?: string
  dueInDays?: number | null
}

export interface CustomerEquipment {
  id: string
  type: string
  brand?: string
  model?: string
  serialNo?: string
  installDate?: string
  warrantyEnd?: string
  notes?: string
}
```

- [ ] **Step 4.2: Hook**

`useMyEquipment.ts` (follows `useMyIot.ts` conventions — `api` from `../lib/api`, customerId from auth):

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { CustomerEquipment, EquipmentConsumable } from '../types/api'

export function useMyEquipment() {
  const { user } = useAuth()
  const customerId = user?.customerId
  return useQuery<CustomerEquipment[]>({
    queryKey: ['my-equipment', customerId],
    queryFn: async () => (await api.get(`/crm/customers/${customerId}/equipment`)).data,
    enabled: !!customerId,
  })
}

export function useEquipmentConsumables(equipmentId: string | undefined) {
  const { user } = useAuth()
  const customerId = user?.customerId
  return useQuery<EquipmentConsumable[]>({
    queryKey: ['my-consumables', equipmentId],
    queryFn: async () =>
      (await api.get(`/crm/customers/${customerId}/equipment/${equipmentId}/consumables`)).data,
    enabled: !!customerId && !!equipmentId,
  })
}

export function useMarkConsumableReplaced(equipmentId: string) {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (consumableId: string) =>
      (await api.post(`/crm/customers/${user?.customerId}/equipment/${equipmentId}/consumables/${consumableId}/replaced`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-consumables', equipmentId] }),
  })
}
```

(Verify at execution time whether `AuthContext.user` exposes `customerId` — `useMyIot.ts` resolves the customer id somehow; copy its exact mechanism.)

- [ ] **Step 4.3: Page**

`Equipment.tsx` — card per equipment item using the portal's existing `card`/`badge-*` CSS classes (copy structural markup from `Devices.tsx`): header `{brand} {type}` + model/serial; install + warranty dates; consumables list with part number, size/rating, due badge (`badge-red` overdue / `badge-amber` ≤14 days / `badge-green` otherwise), "Mark replaced" button (calls `useMarkConsumableReplaced`, disabled while pending), and "Buy replacement" anchor (`target="_blank" rel="noopener noreferrer"`) when `purchaseUrl` set. Empty state: wrench icon + "No equipment on file — your contractor adds your system details after a visit."

- [ ] **Step 4.4: Route + nav**

`App.tsx`: add lazy route `/equipment` following the existing lazy-page pattern. `Sidebar.tsx`: add `{ icon: Fan, label: 'My Equipment', path: '/equipment', badge: 0 }` after My Devices (import `Fan` from lucide-react).

- [ ] **Step 4.5: Verify**

Run: `pnpm --filter customer-portal build`
Expected: clean. Manual at execution time: seed a consumable via curl with dev-bypass headers, view page, mark replaced, confirm badge updates and a foreign customerId in the URL returns 403.

---

## Task 5 (S1): `filter-replacement-due` reminder template in comms-service

**Files:**
- Modify: `apps/comms-service/src/marketing/automation/equipment-templates.ts` (new key + template)
- Modify: `apps/comms-service/src/marketing/automation/equipment-automation.service.ts` (resolve from consumables)
- Modify: `apps/crm-service/src/equipment/equipment-automation.controller.ts` (include consumables in candidates payload)
- Test: `apps/comms-service/src/marketing/automation/equipment-automation.service.spec.ts` (extend)

- [ ] **Step 5.1: Extend the CRM candidates payload**

In crm-service `equipment-automation.controller.ts`, the automation-candidates endpoint returns equipment with customer info. Add `consumables: true` to its Prisma include (or call `ConsumablesService.listForEquipment` per row if the endpooint uses the service layer — match whichever it does today; read the file first). Each candidate gains `consumables: [{ id, kind, partNumber, sizeSpec, rating, intervalDays, lastReplacedAt }]`.

- [ ] **Step 5.2: Add the template**

In `equipment-templates.ts`:
- Extend the union: `| 'filter-replacement-due'`.
- Extend `TemplateVars` with `filterSpec?: string` (e.g. `"X6673 20x25x5 MERV 11"`).
- Add to `EQUIPMENT_TEMPLATES`:

```ts
  'filter-replacement-due': {
    key: 'filter-replacement-due',
    channel: 'BOTH',

    smsBody: ({ customerName, equipmentType, filterSpec, trackedLink }) =>
      `Hi ${customerName}, the filter on your ${equipmentType}${filterSpec ? ` (${filterSpec})` : ''} is due for replacement. A fresh filter protects your system and your air quality. Order or book here: ${trackedLink} Reply STOP to opt out.`,

    emailSubject: ({ equipmentType }) =>
      `Your ${equipmentType} filter is due for replacement`,

    emailBody: ({ customerName, equipmentType, brand, filterSpec, trackedLink, unsubLink, companyName }) =>
      buildEmail(
        `Time to replace your ${equipmentType} filter`,
        `
        <p>Hi ${customerName},</p>
        <p>The air filter on your <strong>${brand} ${equipmentType}</strong> is due for replacement.</p>
        ${filterSpec ? `<p>Your system takes: <strong>${filterSpec}</strong></p>` : ''}
        <p>A clogged filter makes your system work harder, raises energy bills, and degrades indoor
        air quality. Swapping it takes two minutes.</p>
        `,
        'Get My Replacement Filter',
        trackedLink,
        unsubLink,
        companyName,
      ),
  },
```

- [ ] **Step 5.3: Write failing resolver tests**

Append to `equipment-automation.service.spec.ts` (reuse its existing fixture helpers — read the top of the file for the equipment factory and `resolve` helper, then follow them):

```ts
  describe('filter-replacement-due', () => {
    it('triggers when a consumable is due (lastReplacedAt + intervalDays <= today)', () => {
      const eq = makeEq({
        consumables: [{ id: 'c-1', kind: 'FILTER', partNumber: 'X6673', sizeSpec: '20x25x5', rating: 'MERV 11', intervalDays: 90, lastReplacedAt: daysAgo(91) }],
      });
      expect(resolve(service, eq)).toBe('filter-replacement-due');
    });

    it('does not trigger when the filter is not yet due', () => {
      const eq = makeEq({
        consumables: [{ id: 'c-1', kind: 'FILTER', intervalDays: 90, lastReplacedAt: daysAgo(30) }],
      });
      expect(resolve(service, eq)).not.toBe('filter-replacement-due');
    });

    it('warranty template still outranks filter when both fire', () => {
      const eq = makeEq({
        warrantyEnd: daysFromNow(10),
        consumables: [{ id: 'c-1', kind: 'FILTER', intervalDays: 90, lastReplacedAt: daysAgo(91) }],
      });
      expect(resolve(service, eq)).toBe('warranty-expiry-30d');
    });
  });
```

(`makeEq`/`daysAgo`/`daysFromNow` — use the spec file's existing equivalents; create thin wrappers only if absent.)

Run: `pnpm --filter comms-service test -- --testPathPattern='equipment-automation'`
Expected: new tests FAIL (resolver doesn't know consumables yet).

- [ ] **Step 5.4: Implement resolver + dispatch vars**

In `equipment-automation.service.ts`:
- Extend `EquipmentWithCustomer` type with `consumables?: Array<{ id: string; kind: string; partNumber?: string | null; sizeSpec?: string | null; rating?: string | null; intervalDays: number; lastReplacedAt?: string | Date | null }>`.
- In `resolveTemplate` (line ~80), after the warranty and replacement checks but **before** tune-up (priority: warranty > replacement > **filter** > tune-up):

```ts
    const dueFilter = (eq.consumables ?? []).find((c) => {
      const anchor = c.lastReplacedAt ? new Date(c.lastReplacedAt) : (eq.installDate ? new Date(eq.installDate) : null);
      if (!anchor) return false;
      const dueAt = new Date(anchor.getTime() + c.intervalDays * 86_400_000);
      return dueAt <= today;
    });
    if (dueFilter) return 'filter-replacement-due';
```

- In `dispatchAutomation`, build `filterSpec` for the vars: `[c.partNumber, c.sizeSpec, c.rating].filter(Boolean).join(' ')` from the same due consumable (factor the find into a small private `findDueConsumable(eq, today)` so resolve + dispatch share it). Idempotency: the existing `automationTemplate = 'filter-replacement-due:<equipmentId>'` + 90-day window mechanism applies unchanged — for a 90-day filter interval this naturally limits to one reminder per cycle. For shorter intervals pass `Math.min(90, c.intervalDays)` as the `wasRecentlySent` window if the existing signature allows; otherwise keep 90 and note it.

- [ ] **Step 5.5: Run tests**

Run: `pnpm --filter comms-service test -- --testPathPattern='equipment'`
Expected: existing + new tests all PASS.
Run: `pnpm --filter comms-service type-check` and `pnpm --filter crm-service type-check`
Expected: clean.

---

## Task 6 (S3): `CompanyAnnouncement` model + module in crm-service

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma`
- Create: `apps/crm-service/prisma/migrations/20260612091000_add_company_announcements/migration.sql` (+ append to `scripts/supabase-dashboard-migration.sql`)
- Create: `apps/crm-service/src/announcements/announcements.service.ts`
- Create: `apps/crm-service/src/announcements/announcements.controller.ts`
- Create: `apps/crm-service/src/announcements/announcements.module.ts`
- Create: `apps/crm-service/src/announcements/announcements.service.spec.ts`
- Modify: `apps/crm-service/src/app.module.ts` (import module)

- [ ] **Step 6.1: Model + migration**

```prisma
model CompanyAnnouncement {
  id          String    @id @default(uuid())
  companyId   String
  title       String
  body        String?
  linkUrl     String?
  linkLabel   String?
  accentColor String    @default("#1a73e8")
  isActive    Boolean   @default(true)
  activeFrom  DateTime?
  activeTo    DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([companyId, isActive])
  @@map("company_announcements")
}
```

Migration SQL (same dual-write as Task 2):

```sql
CREATE TABLE IF NOT EXISTS "crm"."company_announcements" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "linkUrl" TEXT,
  "linkLabel" TEXT,
  "accentColor" TEXT NOT NULL DEFAULT '#1a73e8',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "activeFrom" TIMESTAMP(3),
  "activeTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_announcements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "company_announcements_companyId_isActive_idx"
  ON "crm"."company_announcements"("companyId", "isActive");
```

Run `pnpm --filter crm-service exec prisma generate` after.

- [ ] **Step 6.2: Failing tests**

`announcements.service.spec.ts`:

```ts
import { AnnouncementsService } from './announcements.service'

function prismaMock(rows: any[] = []) {
  return {
    companyAnnouncement: {
      findMany: jest.fn().mockResolvedValue(rows),
      findFirst: jest.fn().mockResolvedValue(rows[0] ?? null),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'a-1', ...data })),
      update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'a-1', ...data })),
      delete: jest.fn().mockResolvedValue({}),
    },
  } as any
}

describe('AnnouncementsService', () => {
  it('getActive filters by companyId, isActive and date window', async () => {
    const prisma = prismaMock()
    const svc = new AnnouncementsService(prisma)
    await svc.getActive('co-1')
    const where = prisma.companyAnnouncement.findFirst.mock.calls[0][0].where
    expect(where.companyId).toBe('co-1')
    expect(where.isActive).toBe(true)
    expect(where.OR).toBeDefined() // activeFrom/activeTo null-or-in-window clauses
  })

  it('create stamps companyId from the caller, not the body', async () => {
    const prisma = prismaMock()
    const svc = new AnnouncementsService(prisma)
    const out = await svc.create('co-1', { title: 'Summer tune-up special', companyId: 'co-EVIL' } as any)
    expect(out.companyId).toBe('co-1')
  })

  it('update is company-scoped (foreign id → NotFound)', async () => {
    const prisma = prismaMock([])
    const svc = new AnnouncementsService(prisma)
    await expect(svc.update('co-2', 'a-1', { title: 'x' })).rejects.toThrow()
  })
})
```

Run: `pnpm --filter crm-service test -- --testPathPattern='announcements'` → FAIL (module missing).

- [ ] **Step 6.3: Implement**

`announcements.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface AnnouncementDto {
  title?: string
  body?: string
  linkUrl?: string
  linkLabel?: string
  accentColor?: string
  isActive?: boolean
  activeFrom?: string | null
  activeTo?: string | null
}

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.companyAnnouncement.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /** Newest currently-active announcement for the portal banner. */
  getActive(companyId: string) {
    const now = new Date()
    return this.prisma.companyAnnouncement.findFirst({
      where: {
        companyId,
        isActive: true,
        OR: [{ activeFrom: null }, { activeFrom: { lte: now } }],
        AND: [{ OR: [{ activeTo: null }, { activeTo: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  create(companyId: string, dto: AnnouncementDto & { title: string }) {
    return this.prisma.companyAnnouncement.create({
      data: {
        companyId, // never from the body
        title: dto.title,
        body: dto.body,
        linkUrl: dto.linkUrl,
        linkLabel: dto.linkLabel,
        accentColor: dto.accentColor ?? '#1a73e8',
        isActive: dto.isActive ?? true,
        activeFrom: dto.activeFrom ? new Date(dto.activeFrom) : null,
        activeTo: dto.activeTo ? new Date(dto.activeTo) : null,
      },
    })
  }

  private async assertOwned(companyId: string, id: string) {
    const row = await this.prisma.companyAnnouncement.findFirst({ where: { id, companyId } })
    if (!row) throw new NotFoundException(`Announcement ${id} not found`)
  }

  async update(companyId: string, id: string, dto: AnnouncementDto) {
    await this.assertOwned(companyId, id)
    return this.prisma.companyAnnouncement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl }),
        ...(dto.linkLabel !== undefined && { linkLabel: dto.linkLabel }),
        ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.activeFrom !== undefined && { activeFrom: dto.activeFrom ? new Date(dto.activeFrom) : null }),
        ...(dto.activeTo !== undefined && { activeTo: dto.activeTo ? new Date(dto.activeTo) : null }),
      },
    })
  }

  async remove(companyId: string, id: string) {
    await this.assertOwned(companyId, id)
    await this.prisma.companyAnnouncement.delete({ where: { id } })
  }
}
```

`announcements.controller.ts`:

```ts
import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client'
import { Role, AuthUser } from '@tscrm/types'
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator'
import { AnnouncementsService } from './announcements.service'

class AnnouncementBodyDto {
  @IsOptional() @IsString() @MaxLength(120) title?: string
  @IsOptional() @IsString() @MaxLength(500) body?: string
  @IsOptional() @IsString() linkUrl?: string
  @IsOptional() @IsString() @MaxLength(40) linkLabel?: string
  @IsOptional() @IsString() accentColor?: string
  @IsOptional() @IsBoolean() isActive?: boolean
  @IsOptional() @IsString() activeFrom?: string
  @IsOptional() @IsString() activeTo?: string
}

class CreateAnnouncementDto extends AnnouncementBodyDto {
  @IsString() @MaxLength(120) title!: string
}

@ApiTags('Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Active announcement for the portal banner (any authed role)' })
  getActive(@CurrentUser() user: AuthUser) {
    return this.announcements.getActive(user.companyId)
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  list(@CurrentUser() user: AuthUser) {
    return this.announcements.list(user.companyId)
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAnnouncementDto) {
    return this.announcements.create(user.companyId, dto)
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AnnouncementBodyDto) {
    return this.announcements.update(user.companyId, id, dto)
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.announcements.remove(user.companyId, id)
  }
}
```

`announcements.module.ts`:

```ts
import { Module } from '@nestjs/common'
import { AnnouncementsService } from './announcements.service'
import { AnnouncementsController } from './announcements.controller'

@Module({
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
```

Register `AnnouncementsModule` in `app.module.ts` imports. (PrismaService: match how other crm modules get it — global PrismaModule or per-module provider; copy the equipment module's approach.)

- [ ] **Step 6.4: Run tests**

Run: `pnpm --filter crm-service test -- --testPathPattern='announcements'` → 3 PASS.
Run: `pnpm --filter crm-service type-check` → clean.

---

## Task 7 (S3): Admin announcements editor (Settings page)

**Files:**
- Modify: `apps/admin-dashboard/src/hooks/useSettings.ts` (or create `useAnnouncements.ts` if useSettings is crowded)
- Modify: `apps/admin-dashboard/src/pages/Settings.tsx` (new "Portal Banner" section)

- [ ] **Step 7.1: Hooks** — `useAnnouncements()` (GET `/crm/announcements`), `useCreateAnnouncement()`, `useUpdateAnnouncement()`, `useDeleteAnnouncement()` — same `api` + `queryClient.invalidateQueries({ queryKey: ['announcements'] })` shape as `useDevTriggerIotAlerts` in `useIot.ts`.

- [ ] **Step 7.2: UI** — In Settings, add a "Customer Portal Banner" card: list of announcements (title, active toggle, dates), inline create/edit form (title, body, link URL + label, accent color `<input type="color">`, active from/to date inputs), delete with the existing `ConfirmModal` component (from the marketing work — check `apps/admin-dashboard/src/components/` for its import path). Live preview strip rendering the banner exactly as the portal will (Step 8.2 markup, reused).

- [ ] **Step 7.3: Verify** — `pnpm --filter admin-dashboard build` clean. Manual: create an announcement as company_admin, see it in the list.

---

## Task 8 (S3): Portal banner

**Files:**
- Create: `apps/customer-portal/src/components/AnnouncementBanner.tsx`
- Modify: `apps/customer-portal/src/pages/Dashboard.tsx` (render at top)

- [ ] **Step 8.1: Hook + component**

```tsx
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { X, Megaphone } from 'lucide-react'
import api from '../lib/api'

interface Announcement {
  id: string
  title: string
  body?: string
  linkUrl?: string
  linkLabel?: string
  accentColor: string
}

export default function AnnouncementBanner() {
  const { data } = useQuery<Announcement | null>({
    queryKey: ['active-announcement'],
    queryFn: async () => (await api.get('/crm/announcements/active')).data || null,
    staleTime: 5 * 60 * 1000,
  })
  const [dismissed, setDismissed] = useState<string | null>(
    () => sessionStorage.getItem('dismissed_announcement'),
  )

  if (!data || dismissed === data.id) return null

  return (
    <div
      className="card anim-fade-up"
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderLeft: `4px solid ${data.accentColor}`, marginBottom: 16,
      }}
    >
      <Megaphone size={18} style={{ color: data.accentColor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontSize: 14 }}>{data.title}</strong>
        {data.body && <div style={{ fontSize: 13, color: 'var(--t2, #6B7280)' }}>{data.body}</div>}
      </div>
      {data.linkUrl && (
        <a href={data.linkUrl} target="_blank" rel="noopener noreferrer"
           className="action-btn" style={{ whiteSpace: 'nowrap' }}>
          {data.linkLabel ?? 'Learn more'}
        </a>
      )}
      <button
        onClick={() => { sessionStorage.setItem('dismissed_announcement', data.id); setDismissed(data.id) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}
```

- [ ] **Step 8.2: Mount** — In `Dashboard.tsx`, render `<AnnouncementBanner />` as the first child of the page container (above the KPI cards).

- [ ] **Step 8.3: Verify** — `pnpm --filter customer-portal build` clean. Manual: create announcement in admin → appears in portal; dismiss → stays hidden for the session; deactivate in admin → gone after refetch.

---

## Task 9: Full-repo verification sweep

- [ ] Run, in order, expect all clean/passing:

```bash
pnpm --filter crm-service test
pnpm --filter comms-service test
pnpm --filter crm-service type-check
pnpm --filter comms-service type-check
pnpm --filter customer-portal build
pnpm --filter admin-dashboard build
```

- [ ] Manual smoke with dev-bypass headers (BYPASS_AUTH=true, services running locally):
  1. POST a consumable to a seeded customer's equipment → GET as that customer (x-test-user-role=customer + matching customer id) → 200; as a different customerId → 403.
  2. GET `/crm/announcements/active` as customer → returns the announcement created via admin POST.
  3. Portal UI walkthrough: Dashboard banner → My Equipment due badges → Mark replaced → My Jobs COMPLETED job → Service Report tab.
- [ ] Report results to the user; user commits.

---

## Self-review notes

- **Spec coverage:** S8 → Task 1; S1 model/CRUD/portal/admin-entry → Tasks 2–4 (admin consumable entry is folded into Task 7's pattern? No — admin enters consumables in CustomerDetailsSidebar; **gap fixed:** admin consumables entry added to Task 7 scope is wrong place — added below as Task 7b note). S2a buy-link → `purchaseUrl` (Tasks 2–4). Reminder template → Task 5. S3 → Tasks 6–8.
- **Task 7b (addendum, do with Task 7):** Admin consumables entry — in `CustomerDetailsSidebar.tsx`'s existing Equipment section, add a "Filters & consumables" sub-list per equipment row: list consumables (part number, size, rating, interval, last replaced), add/edit inline via the admin hooks (`useEquipmentConsumables(customerId, equipmentId)` + create/update/delete mutations in `apps/admin-dashboard/src/hooks/useEquipment.ts`, same endpoints as Task 3). The sidebar file is 2.3k lines — add the sub-list as a new small component file `apps/admin-dashboard/src/pages/customers/EquipmentConsumables.tsx` and import it, don't grow the monolith.
- **Type consistency:** `ConsumablesService` methods (`listForEquipment`, `create`, `update`, `markReplaced`, `remove`, `computeNextDue`) match between Tasks 3–5. `AnnouncementsService` (`list`, `getActive`, `create`, `update`, `remove`) match Tasks 6–8. Portal route `/equipment`, queryKeys `my-equipment` / `my-consumables` / `active-announcement` used consistently.
- **Placeholder scan:** Steps 1.1 and 5.1 instruct verifying actual Prisma column names / endpoint internals before writing — deliberate read-then-write, not a placeholder. No TBDs.
