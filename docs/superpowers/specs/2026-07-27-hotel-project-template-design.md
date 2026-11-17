# Projects — Hotel template

Date: 2026-07-27
Status: Approved
Related: docs/superpowers/specs/2026-07-04-projects-module-design.md, docs/superpowers/specs/2026-07-22-projects-housing-equipment-scan-design.md

## Summary

A third `templateType` — `HOTEL` — alongside `STANDARD` and `HOUSING_SCHEME`. Where Housing Scheme is many independently-owned houses under one project, a Hotel is a single owner (the hotel itself, via the project's own optional customer) with an arbitrary, admin-defined breakdown of the property into zones, rooms, and any other named area ("Hallway 3F", "Pool Plant Room", "Rooftop Chiller Bay"). No per-area ownership exists. The admin builds this breakdown freeform: a zone containing rooms, a zone left empty, a standalone room with no zone, or a custom area sitting anywhere in the tree — and can bulk-create a run of rooms in one action.

## Why not reuse `House`

`House` is owner-bound (`ownerCustomerId`) and flat (no nesting) — both wrong for this case. The project's own `customerId` (already optional, per the equipment-scan design) covers "who owns this property"; individual areas never carry an owner. And a hotel's breakdown isn't a flat list — a zone can contain rooms, so the model needs to nest.

## Data model (`crm` schema)

New self-referencing table, `ProjectArea`, replacing `House`'s role for this template only (Housing Scheme keeps using `House` unchanged):

```sql
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
```

- `kind`: `'ZONE' | 'ROOM' | 'CUSTOM'` — cosmetic only (default icon + placeholder copy in the picker), does not constrain nesting. A `ROOM` can contain children if the admin wants (e.g. a suite with its own sub-areas); the UI doesn't forbid it.
- `parentAreaId` null = top-level. Deleting a parent cascades to children (and to their equipment, via `Equipment.areaId` FK cascade below) — the delete confirmation must say so explicitly.
- No owner field anywhere on this table — intentional, matches the product decision that Hotel areas have no per-unit ownership.
- `sortOrder`: manual ordering within a parent (drag-to-reorder is out of scope for v1; new areas append to the end, editable only via bulk re-numbering later if ever needed — not building that now).
- Applied via `scripts/apply-migrations.mjs` (same pattern as every migration since `20260512000000`, including the equipment-scan one), not `prisma migrate dev`. `schema.prisma` updated to match for Prisma Client generation + documentation, with a corresponding unrun file under `prisma/migrations/`.

### Equipment

`Equipment.houseId` stays as-is for Housing Scheme. Add a second, equally-optional column:

```sql
ALTER TABLE "crm"."equipment"
  ADD COLUMN IF NOT EXISTS "area_id" TEXT,
  ADD CONSTRAINT "equipment_areaId_fkey" FOREIGN KEY ("area_id")
    REFERENCES "crm"."project_areas"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "equipment_areaId_idx" ON "crm"."equipment"("area_id");
```

Exactly one of `houseId` / `areaId` is set on a given row, enforced in the service layer (not a DB constraint — consistent with how this codebase already validates cross-field invariants in the service, not via `CHECK`). Everything already built for equipment — photo upload, `gpt-4o` nameplate/error-code scan (`equipment-scan.service.ts`), `equipment_error_codes` — is untouched; it already keys off `equipmentId`, not `houseId` directly, so a second parent-pointer column is a additive, non-breaking change. `EquipmentService.findByHouse` gets a sibling `findByArea`.

No `HouseIssueReport`-equivalent for Hotel in v1 — that flow exists because Housing Scheme has a portal-visible owner per house who can self-report a fault. Hotel areas have no owning customer to log in and report anything, so this is a genuine non-goal, not an oversight.

## Backend (`apps/crm-service`)

- `project-templates.ts`: `PROJECT_TEMPLATES = ['STANDARD', 'HOUSING_SCHEME', 'HOTEL'] as const`.
- New `project-areas.controller.ts` / `project-areas.service.ts` (sibling to `houses.controller.ts`/`houses.service.ts`, same `STAFF_WRITE`-gated pattern):
  - `GET /projects/:projectId/areas` — returns the full tree for the project (flat list with `parentAreaId`; frontend assembles the tree client-side, same as any adjacency-list API).
  - `POST /projects/:projectId/areas` — `{ parentAreaId?, kind, label, notes?, tags? }`, single area.
  - `POST /projects/:projectId/areas/bulk` — `{ parentAreaId?, kind: 'ROOM', prefix, start, end, padZeros? }` (e.g. `prefix: 'Room '`, `start: 101`, `end: 120` → 20 rows labeled "Room 101".."Room 120"). Caps at 500 per call (guards against a typo like `end: 100000`); validated with `@Max(500)` on `end - start`.
  - `PATCH /projects/:projectId/areas/:id` — label/notes/tags/kind/parentAreaId (re-parenting one area at a time; no bulk move in v1).
  - `DELETE /projects/:projectId/areas/:id` — cascades per the FK; controller returns the count of removed descendant areas + unlinked equipment so the frontend can show "This will also remove 4 sub-areas and 2 equipment records" before the user confirms.
  - Validate `projectId` belongs to the caller's company and (for create/patch) that any given `parentAreaId` belongs to the same project — same ownership-check pattern as `houses.service.ts`.
- `equipment.controller.ts` / `equipment.service.ts`: mirror the existing `houseId`-based create/list methods with `areaId` equivalents. `uploadImage`/`scanAndStore`/error-code endpoints are unchanged — they operate on `equipmentId` regardless of which parent it belongs to.
- `projects.service.ts` `decorate()`: for `HOTEL` projects, roll up `areaCount` and `equipmentCount` the same way Housing Scheme rolls up `openIssueCount` (one batched query, not N+1).

## Frontend (`apps/admin-dashboard`)

- `projectsApi.ts`: `ProjectTemplateType` gains `'HOTEL'`. `PROJECT_TEMPLATE_META.HOTEL = { label: 'Hotel', description: 'A property broken into zones, rooms, or any custom area — each with its own equipment.' }`. New `areasApi.ts` (sibling to `housesApi.ts`): `ProjectArea` type, `useProjectAreas`, `useCreateArea`, `useBulkCreateRooms`, `useUpdateArea`, `useDeleteArea`, plus `useAreaEquipment`/`useUploadEquipmentImage` etc. reusing the same hooks shape as `housesApi.ts`'s equipment hooks (parameterized by `areaId` instead of `houseId`).
- `ProjectEditorModal.tsx`: template picker's `Object.keys(PROJECT_TEMPLATE_META)` loop automatically renders the third card — only change needed is an icon branch, `key === 'HOTEL' && <Building2 size={13} .../>`, next to the existing `HOUSING_SCHEME` one. Grid goes from `1fr 1fr` (2 cards) to a 3-card layout — switch to `repeat(auto-fit, minmax(140px, 1fr))` so it doesn't look lopsided with an odd card count in the future either.
- `ProjectDetail.tsx`: tabs array gets a third conditional entry — `project.templateType === 'HOTEL' ? [{ key: 'areas', label: 'Areas', icon: Building2 }] : []` (alongside, not instead of, the existing `HOUSING_SCHEME` branch — they're mutually exclusive since `templateType` is a single value, so both conditions can live side by side safely). No `HouseIssuesAlert`-equivalent banner (no issue-report model for Hotel).
- New `AreasTab.tsx` (sibling to `HousesTab.tsx`):
  - Renders the adjacency list as an expandable tree (indent per depth, expand/collapse per node with children) instead of `HousesTab`'s flat list.
  - Each node row: label, kind icon, equipment count badge, and a row-level menu with "Add child area", "Add rooms (bulk)", "Edit", "Delete".
  - "Add area" (top-level, in the tab header) and "Add child area" (per-row) open the same small modal: label, kind selector (Zone / Room / Custom — free-text label always required regardless of kind), optional notes/tags. Kind is a hint for the icon/placeholder, not a hard type.
  - "Add rooms (bulk)" opens a modal: prefix text (default "Room "), start number, end number, optional zero-padding toggle, target parent (pre-filled from context if launched from a row's menu, otherwise a parent picker defaulting to top-level) — calls the bulk endpoint, shows a progress/result toast ("20 rooms added").
  - Clicking a node opens the same `EquipmentDetailModal`-style panel already built for Housing Scheme (photo upload, AI-scan suggestion panel, error-codes list) — reused as-is, just wired to `areaId` instead of `houseId`.
  - No owner picker anywhere in this tab.
- Deep-link support mirrored from Houses: `?area=<id>` opens the tab with that node expanded and its detail panel open.

## Addendum (found during planning)

`Equipment.customerId` is currently `NOT NULL` in the database. That conflicts with this design: Hotel areas have no owner, and a project's own customer is already optional, so an area's equipment can legitimately have no associated customer at all. Resolution: `Equipment.customerId` becomes nullable (migration + Prisma schema change alongside the `ProjectArea` table), and `createForArea` derives it from the project's own `customerId` (null if the project has none yet) — the same denormalization pattern `House` already uses for `ownerCustomerId`, just without the "must assign first" gate, since Hotel has no gate to enforce. A `resyncProjectAreaEquipmentOwner` mirrors `resyncHouseEquipmentOwner`, firing when a Hotel project's customer is set/changed after the fact.

## Out of scope (v1)

- Drag-to-reorder / bulk re-parent multiple areas at once — single re-parent via `PATCH` only.
- Any customer-portal exposure for areas — no owner exists at the area level, so there's no "my room" view; only the project's own optional customer (the hotel's contact) sees the rollup counts on the project page, same visibility as `STANDARD`.
- An issue-report / fault-reporting flow for areas — no owning customer to submit one; if guest-reported issues become a real need later, revisit as its own follow-up design rather than forcing it into this one.
- Occupancy status (vacant/occupied/out-of-service) per room and PM-cadence/service-due tracking — both came up in earlier discussion as plausible hotel-specific value-adds, but the user's latest direction was explicitly about the freeform area hierarchy + bulk room creation; these are deferred to a future design, not part of this one.
