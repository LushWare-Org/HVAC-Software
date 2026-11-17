# Projects — Generic Component Templates

Date: 2026-08-14
Status: Approved (pending user review of this file)
Related: docs/superpowers/specs/2026-07-04-projects-module-design.md,
docs/superpowers/specs/2026-07-22-projects-housing-equipment-scan-design.md,
docs/superpowers/specs/2026-07-27-hotel-project-template-design.md (superseded by this design — see "Relationship to the unbuilt Hotel spec")

## Problem

Today `Project.templateType` is a hardcoded string validated against a backend code
list (`STANDARD | HOUSING_SCHEME`). `HOUSING_SCHEME` projects get a flat list of
owner-bindable `House` records. Expanding to new verticals — hotels, factories,
hospitals — under this model means adding a new hardcoded `templateType`, a new
Prisma model, and new UI per vertical, forever. A design for a third type, `HOTEL`
(self-referencing `ProjectArea` tree), was approved on 2026-07-27 but never built.

## Goal

Let admins **author their own project templates**: a template is a named, reusable
set of component types (e.g. "House," "Lobby," "Room," "Production Line"). A project
is created from a template (or none, freeform — today's `STANDARD`) and the admin
populates it with named component instances of those types. This replaces the
hardcoded template registry and the House model with one generic system, and absorbs
the never-built Hotel design without hardcoding hotels specifically.

## Core concepts

- **Project Template** — a reusable recipe, created once by an admin, scoped to
  their company. Defines a list of **component types**: a name, an icon, and whether
  that type is *eligible* to carry a customer (a capability, not a commitment).
- **Project**, on creation, optionally picks a template. It receives a **frozen
  snapshot** of that template's component types at creation time — editing the
  template afterward never retroactively changes projects already built from it,
  the same philosophy this codebase already applies to `ProjectRosterDay` overrides
  (base team edits don't rewrite already-overridden days).
- **Project Component** — the actual instances an admin adds to a project ("House
  12," "Lobby," "Room 301"), replacing `House`. **Flat list, no nesting.** Each is
  tagged with one of the project's component types and optionally owned by a
  customer, gated by two tiers (see "Customer assignment").

## Relationship to the unbuilt Hotel spec

The 2026-07-27 Hotel design (hardcoded `HOTEL` templateType + self-referencing
`ProjectArea` tree) is superseded by this design and will not be built as specified.
An admin who needs a hotel structure creates a "Hotel" template themselves with
whatever component types they want (e.g. "Room," "Lobby," "Pool Plant Room"). The
one capability the old spec had that this design deliberately omits is **nesting**
(Zone containing Rooms) — ruled out in favor of a flat list, per product decision.
Its bulk-room-creation idea ("Room 101–120 in one action") is genuinely useful but
out of scope for this design; a natural additive follow-up once the core system ships.

## Data model (`crm` schema, Prisma)

```prisma
// Reusable recipe, company-scoped. Editing this only affects projects created
// AFTER the edit — existing projects keep their frozen snapshot.
model ProjectTemplate {
  id             String    @id @default(uuid())
  companyId      String
  name           String                    // "Housing Scheme", "Boutique Hotel"
  description    String?
  componentTypes Json      // [{ key, label, icon?, customerAssignable: boolean }]
  isBuiltIn      Boolean   @default(false)  // seeded (e.g. migrated Housing Scheme) vs admin-authored
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([companyId])
  @@map("project_templates")
}
```

```prisma
model Project {
  // ...existing fields unchanged...
  templateId                String?   // null = freeform/no structure (today's STANDARD)
  componentTypesSnapshot    Json?     // frozen copy of the template's componentTypes at creation
  componentCustomerSettings Json?     // { [componentTypeKey]: boolean } — per-project override of assignability
  components ProjectComponent[]

  @@map("projects")
}
```

```prisma
// Replaces House. Flat — no self-reference, no parentComponentId.
model ProjectComponent {
  id               String    @id @default(uuid())
  companyId        String
  projectId        String
  project          Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  componentTypeKey String             // references a key in project.componentTypesSnapshot
  label            String             // "House 12", "Lobby", "Room 301"
  ownerCustomerId  String?
  owner            Customer? @relation(fields: [ownerCustomerId], references: [id], onDelete: SetNull)
  notes            String?
  tags             String[]  @default([])
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  equipment    Equipment[]
  issueReports ComponentIssueReport[]

  @@index([companyId, projectId])
  @@index([ownerCustomerId])
  @@map("project_components")
}
```

`Equipment.houseId` → renamed `Equipment.componentId`, pointing at `ProjectComponent`.
`HouseIssueReport` → renamed `ComponentIssueReport`, same shape, `houseId` →
`componentId` — the customer self-report-a-fault portal flow is unchanged, still
gated on that specific component instance having an `ownerCustomerId` set.

The old `templateType` string column is removed. `templateId` (null vs set) replaces
the STANDARD/HOUSING_SCHEME distinction — any number of templates can exist, not
just two.

### Cross-service `houseId` → `componentId` rename

Every cross-schema reference to `crm.houses` gets the same rename, ids preserved
(see Migration):

- `job-service`: `Job.houseId` → `Job.componentId`
- `finance-service`: `Quote.houseId` → `Quote.componentId`, `Invoice.houseId` →
  `Invoice.componentId`
- `crm-service`: `ServiceAgreement.houseId` → `ServiceAgreement.componentId`

## Customer assignment — two tiers

1. **Template level (capability, ceiling)**: each component type carries
   `customerAssignable: boolean`. E.g. "Room" might be `true`, "Pool Plant Room"
   `false` — never sensible to attach a customer to plant machinery, no project
   using this template can override that ceiling upward.
2. **Project level (`componentCustomerSettings`, a Project Settings section)**: for
   each component type the template allows, the admin switches it on/off for *this*
   project specifically. Two projects built from the same template can differ — one
   hotel's rooms are individually owned (condo-hotel model), another's aren't.
3. **Whole-project customer** — unchanged, `Project.customerId` stays optional
   exactly as today, independent of component-level settings. Both can be active at
   once (e.g. hotel management company as project customer, individual room owners
   as component customers).

When a component type is off at either tier, that component's owner picker does not
appear in the UI.

### What owning a component unlocks (unchanged from House)

Once a `ProjectComponent` has an `ownerCustomerId`, its detail panel unlocks
per-component Jobs / Quotes / Invoices / Agreements tabs, filtered by `componentId`
and pre-locked to that owner as the customer — exactly today's House behavior,
carried over unchanged, generalized to any component type.

## Migration of existing Housing Scheme data

Real production data exists and must be preserved exactly: **27 houses across 5 live
`HOUSING_SCHEME` projects, all 27 with an owner assigned, 5 with equipment linked.**

1. Add new tables/columns via `scripts/apply-migrations.mjs` (this repo's
   established pattern — not `prisma migrate dev`, which wants to reset the `crm`
   schema due to prior drift).
2. Seed a built-in template per company that has ≥1 `HOUSING_SCHEME` project:
   `ProjectTemplate { name: "Housing Scheme", isBuiltIn: true, componentTypes:
   [{ key: 'house', label: 'House', customerAssignable: true }] }`.
3. For each existing `HOUSING_SCHEME` project: set `templateId` to that company's
   seeded template, `componentTypesSnapshot` = the template's `componentTypes`,
   `componentCustomerSettings: { house: true }`.
4. For each existing `House` row: insert a matching `ProjectComponent` with the
   **same id reused** (so every foreign key pointing at a house id — equipment,
   issue reports, quotes, invoices, jobs, agreements — keeps working with zero
   rewriting), `componentTypeKey: 'house'`, copying `label`/`ownerCustomerId`/
   `notes`/`tags`.
5. Rename `houseId` → `componentId` on `Equipment`, `HouseIssueReport` (→
   `ComponentIssueReport`), `Job`, `Quote`, `Invoice`, `ServiceAgreement` — a column
   rename, not a data rewrite, since ids are preserved from step 4.
6. Keep the old `houses` table renamed to `houses_deprecated_20260814` for one
   deploy cycle rather than dropping it outright (this repo's convention around
   irreversible prod changes); drop in a follow-up once the new path is verified live.
7. **Hard verification gate inside the migration script itself**: assert
   `count(houses) == count(project_components WHERE componentTypeKey='house')` and
   `count(equipment WHERE componentId IS NOT NULL) == 5` (matching the pre-migration
   count) before considering the migration successful — fail loudly rather than
   silently proceed if counts don't match.

Since ids are reused end-to-end, this is a pure rename+reshape, not a rewrite —
every existing quote, invoice, job, and agreement tied to a house keeps its link
with no data loss and no re-entry needed.

## Backend APIs

**`crm-service` — new `project-templates` module** (sibling to `houses`,
`STAFF_WRITE`-gated for writes, all staff roles read):
- `GET /project-templates` — list company's templates (built-ins included)
- `POST /project-templates` — `{ name, description?, componentTypes: [{key, label,
  icon?, customerAssignable}] }` — `key` uniqueness validated within the array
- `GET /project-templates/:id`
- `PATCH /project-templates/:id` — edit name/description/componentTypes (only
  affects future projects, per the snapshot design)
- `DELETE /project-templates/:id` — 400 if any project references it, matching this
  repo's existing "soft delete only if empty" pattern (e.g. Project delete)

**`crm-service` — `projects.service.ts` changes**:
- `create()`: accepts `templateId?`. If set, validates it belongs to the company,
  copies its `componentTypes` into `componentTypesSnapshot`, initializes
  `componentCustomerSettings` by copying each type's `customerAssignable` default
  from the template — no toggle UI at creation time; the admin adjusts it
  afterward from the project's Settings section if needed.
- `PATCH /projects/:id/customer-settings` — new endpoint, body
  `{ [componentTypeKey]: boolean }`, validated against keys present in
  `componentTypesSnapshot` only.
- `decorate()`: roll up `componentCount` generically (replacing the
  Housing-Scheme-specific house/issue counts) — same batched-query pattern already
  used for `openIssueCount`.

**`crm-service` — new `project-components` module** (replacing `houses` module,
same shape):
- `GET /projects/:projectId/components` (optional `?type=` filter)
- `POST /projects/:projectId/components` — `{ componentTypeKey, label,
  ownerCustomerId?, notes?, tags? }` — rejects `ownerCustomerId` if that type isn't
  customer-assignable for this project (both tiers checked)
- `PATCH /projects/:projectId/components/:id`
- `DELETE /projects/:projectId/components/:id` — cascades to equipment/issue
  reports; response includes removed-record counts for the frontend confirmation
- `POST /projects/:projectId/components/:id/owner` — assign/change owner (same flow
  as today's `assignOwner`)

**`job-service` / `finance-service`**: `houseId` params/fields renamed to
`componentId` throughout (routes, DTOs, query filters) — mechanical rename, no new
logic, ids preserved by the migration.

**`equipment.controller.ts`**: `findByHouse` → `findByComponent`; upload/scan/
error-code endpoints unchanged (already keyed by `equipmentId`, not the parent).

## Admin UI

- **New "Templates" page** (`/projects/templates`) — company-scoped list of
  templates (built-ins badged, non-deletable, duplicable into a custom one). "New
  Template": name, description, then a repeatable row editor for component types —
  label, icon picker, "customer assignable" checkbox, add/remove rows. Replaces the
  hardcoded `PROJECT_TEMPLATE_META` object.
- **`ProjectEditorModal.tsx`**: the fixed 2-3 card template picker becomes a dynamic
  list from `GET /project-templates`, plus a "No template (freeform)" option
  matching today's STANDARD. "Manage templates" link to the Templates page.
- **`ProjectDetail.tsx`**:
  - The `HOUSING_SCHEME`-only "Houses" tab collapses into one generic
    **"Components"** tab, shown whenever `project.templateId` is set. Component
    type filter chips across the top.
  - New **"Settings"** section: per-project customer-assignment toggles (one per
    component type this project's template allows), plus the existing
    project-level customer picker.
- **New `ComponentsTab.tsx`** (replacing `HousesTab.tsx`, same structural shape):
  flat list, filterable by type, each row shows label + type icon + owner chip
  (hidden if that type has assignment off for this project) + equipment count.
  Row click opens a detail panel reusing the existing `EquipmentDetailModal`
  pattern (photo upload, AI scan, error codes), parameterized by `componentId`.
  Owner-gated sub-tabs (Jobs/Quotes/Invoices/Agreements) appear exactly as they do
  for Houses today, only when that component has an owner.
- **Customer details sidebar / Job detail modal / jobs table**: existing "House"
  chips/links become generic "Component" chips, unchanged behavior otherwise.

## Customer portal

No behavioral change beyond the rename. A customer who owns a component sees it
(and its jobs/quotes/invoices/agreements) via the same `componentId`-scoped,
`customerId`-filtered queries the House flow already uses today.

## Testing

- `crm-service`: Jest — template CRUD + key-uniqueness validation; project creation
  from a template correctly snapshots `componentTypesSnapshot`; component creation
  rejects an owner when the type isn't assignable (both template-tier and
  project-tier cases); customer-settings PATCH rejects unknown keys; cascade-delete
  counts.
- **Migration script**: dedicated dry-run mode against a scratch schema copy —
  asserts the before/after counts in the Migration section (27 houses → 27
  components, 5 equipment relinked, all 5 projects get `templateId` set) before
  ever running against the real database.
- `job-service`/`finance-service`: existing `houseId`-filter suites extended/
  renamed to `componentId`, same coverage.
- Frontends: `tsc -b` + build (no test runner in these apps, per repo convention) +
  manual verification pass on the 5 real housing-scheme projects post-migration —
  owners still resolve, equipment/jobs/quotes/invoices still linked — before
  calling it done.

## Out of scope (this design)

- Nesting/hierarchy — flat list only, per product decision.
- Drag-to-reorder component types within a template.
- Template versioning / tracking which project uses which version — snapshots make
  this a non-issue for now.
- Sharing/exporting templates across companies — stays company-private.
- Bulk component creation (e.g. "Room 101–120 in one action," from the unbuilt
  Hotel spec) — a natural additive follow-up, not required to ship this.
- Occupancy status / PM-cadence tracking per component — same call the unbuilt
  Hotel spec made, still out of scope here.
