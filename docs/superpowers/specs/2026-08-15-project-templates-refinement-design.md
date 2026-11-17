# Projects — Template & Component UX Refinement

Date: 2026-08-15
Status: Approved (pending user review of this file)
Related: docs/superpowers/specs/2026-08-14-project-component-templates-design.md (the base system this refines)

## Summary

Five refinements to the generic component-template system shipped in the previous
design, closing gaps found in real use:

1. **Growable component types** — a project's component-type list is no longer frozen
   at creation; admins can type a brand-new type name when adding a component, and it
   becomes a first-class, reusable type for that project from then on.
2. **"Customized project"** — a third New Project option alongside "No template" and
   named templates: starts with zero predefined types and a Components tab, fully
   built up ad hoc.
3. **Template status (Draft/Published)** — templates start as drafts, are excluded
   from the New Project picker until explicitly published, and stay editable either way.
4. **New Project modal** — bigger, and its template picker restructured into three
   clearly separated tiers instead of one flat grid.
5. **Cross-page informative tagging** — every job/quote/invoice/agreement shows which
   project and component it belongs to, everywhere it can be seen, not just on the
   pages that already had it.

Also fixes a concrete bug: `TemplatesPage.tsx`'s on-canvas title uses the themed
`--t1` token, which is near-black in light theme printed on this app's always-dark
canvas — invisible/low-contrast. Every other top-level page hardcodes `#F1F5F9` for
on-canvas headers specifically because the canvas itself doesn't change with theme;
`TemplatesPage.tsx` is the one page that didn't follow that convention.

## 1. Data model changes (`crm` schema)

### `ProjectTemplate.status`

```sql
ALTER TABLE "crm"."project_templates" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DRAFT';
-- Backfill: every template that exists before this migration (including the
-- migrated built-in "Housing Scheme" template) must stay visible in the picker.
UPDATE "crm"."project_templates" SET "status" = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS "project_templates_status_idx" ON "crm"."project_templates"("companyId", "status");
```

`status: 'DRAFT' | 'PUBLISHED'`. New templates default to `DRAFT` (the create modal
doesn't ask — it's just the starting state). `PATCH /project-templates/:id` accepts
`status` as one more field alongside `name`/`description`/`componentTypes` — no
separate publish/unpublish endpoints. Built-in templates: publishable status changes
are still blocked the same way edits already are (`isBuiltIn` guard), since the
migrated Housing Scheme template must always stay published — nothing new to build
there, the existing `isBuiltIn` check in `ProjectTemplatesService.update()` already
covers it once `status` is added to the same guarded update path.

### Growable `componentTypesSnapshot`

No schema change — `Project.componentTypesSnapshot` (`Json?`) already exists. The
behavioral rule changes: creating a `ProjectComponent` whose type doesn't
case-insensitively match an existing entry's `label` in the project's
`componentTypesSnapshot` **appends** a new entry
`{ key: slugify(label), label, customerAssignable }` (the two-tier ceiling is set by
the admin at add-time — see Section 4) and sets
`componentCustomerSettings[key] = customerAssignable` in the same transaction as the
component insert, before the component row is created. This is no longer a frozen
snapshot in the literal sense; "snapshot" now means "this project's own registry of
known types," seeded from the template at creation and grown from there. Editing the
*template* itself still never retroactively touches any project's own registry —
that part of the original design is unchanged.

### "Customized project"

Not a template row. `POST /projects` with no `templateId` but a new boolean
`freeform: true` sets `templateId: null`, `componentTypesSnapshot: []` (empty array,
not `null`), `componentCustomerSettings: {}` — the client never sends
`componentTypesSnapshot` directly, only this flag. "No template" (today's plain
freeform project) keeps sending neither `templateId` nor `freeform`, which keeps
`componentTypesSnapshot: null`.

**Components-tab visibility gate changes**: from `!!project.templateId` to
`project.componentTypesSnapshot != null`. This is the one behavioral edge that makes
"Customized project" (no template, but has components) representable at all.

## 2. Backend APIs

**`crm-service` — `project-templates` module**:
- `UpdateTemplateDto` (in `project-templates.controller.ts`) gains
  `@IsOptional() @IsIn(['DRAFT', 'PUBLISHED']) status?: string`.
- `ProjectTemplatesService.update()`: the existing `isBuiltIn` guard now also blocks
  status changes on built-ins (already blocks name/description/componentTypes — one
  guard, one more field covered).
- `ProjectTemplatesService.create()`: `status` always starts at `'DRAFT'`, not
  accepted from the request body — a template can't be published before it exists to
  review.
- `ProjectTemplatesService.list()`: returns all statuses (Template Library needs
  drafts visible); no new query param. The New Project modal filters to
  `status === 'PUBLISHED'` client-side against the same list — one query, no new
  endpoint, consistent with how the modal already fetches templates today.

**`crm-service` — `projects` module**:
- `CreateProjectDto` gains `@IsOptional() @IsBoolean() freeform?: boolean`.
- `ProjectsService.create()`: when `freeform === true` (and no `templateId`), set
  `componentTypesSnapshot: []`, `componentCustomerSettings: {}`. This branch is
  mutually exclusive with the existing `templateId` branch — reject (400) if both are
  set.

**`crm-service` — `project-components` module**:
- `UpsertComponentDto` (`project-components.controller.ts`) changes: `label` stays
  required, but the type is now supplied as `{ typeLabel: string; typeAssignable?:
  boolean }` instead of a bare `componentTypeKey` — the frontend always sends the
  human-typed type name, never a raw key, and `typeAssignable` is only meaningful
  (and only sent) when the frontend's own case-insensitive match against
  `componentTypesSnapshot` came up empty (a genuinely new type).
- `ProjectComponentsService.create()`: new step before the existing
  `assertComponentType` validation — `resolveOrRegisterType(project, typeLabel,
  typeAssignable)`:
  1. Case-insensitive match `typeLabel` against `componentTypesSnapshot[].label`. If
     found, return that entry's existing `key`/`customerAssignable` — `typeAssignable`
     is ignored here even if sent (can't redefine an existing type's ceiling by
     typing it again — that's what Template/Settings editing is for).
  2. If not found: derive `key` via the same `slugify()` used in the template editor
     (label → lowercase, non-alphanumeric → `_`, trimmed), append
     `{ key, label: typeLabel, customerAssignable: typeAssignable ?? true }` to the
     project's `componentTypesSnapshot`, set
     `componentCustomerSettings[key] = typeAssignable ?? true`, persist via
     `prisma.project.update()`, and return the new `key`.
  3. Proceed with component creation using the resolved `key`, unchanged from today's
     `assertComponentType`/`assertOwnerAllowed` logic.
  - A key collision within the same request (two different labels slugifying to the
    same key, e.g. "Room #1" and "Room-1") is resolved by suffixing `-2`, `-3`, … —
    `key` only needs to be unique within one project's snapshot, not globally
    meaningful.

## 3. Frontend — New Project modal

**Sizing** (`ProjectEditorModal.tsx`): width `980px` → `1140px`; height cap
`min(860px, calc(100vh - 48px))` → `min(920px, calc(100vh - 48px))`.

**Picker restructure**:
```
┌─────────────────────────────┬─────────────────────────────┐
│  No template                │  Customized project          │   ← Row 1, two fixed
│  A single client with jobs, │  Start blank and add whatever│      primary cards,
│  agreements, and finances.  │  components you need as you  │      larger than the
│  No component breakdown.    │  go. No predefined structure.│      template cards
├─────────────────────────────┴─────────────────────────────┤
│  — Or start from a template —          (only if ≥1 exists) │   ← divider, conditional
├───────────┬───────────┬───────────┬─────────────────────────┤
│ Template A│ Template B│ Template C│   ...                   │   ← Row 2, existing
└───────────┴───────────┴───────────┴─────────────────────────┘      template-card grid,
                                                                       status=PUBLISHED only
```
`form.freeform: boolean` added to the modal's local state alongside the existing
`form.templateId`. Selecting "No template" sets both to falsy; selecting "Customized
project" sets `freeform: true, templateId: undefined`; selecting a template card sets
`templateId: <id>, freeform: false`. `save()`'s create payload sends whichever is set.

## 4. Frontend — Component creation (`ComponentsTab.tsx`)

**`AddComponentModal`**: the `<select>` bound to `componentTypeKey` is replaced by a
combobox — text input (`typeLabel`) with a filtered suggestion list drawn from
`componentTypes` (the project's current registry, passed in as before), matched
case-insensitively and updated as the admin types. Selecting a suggestion or typing
an exact case-insensitive match to one hides the "Owner OK / No owner" toggle
(read-only preview of that type's existing ceiling instead, so the admin isn't
confused about why the toggle disappeared). Typing something that matches nothing
existing reveals the toggle (default "Owner OK," matching the template editor's
default), and that value becomes the new type's `customerAssignable` on save.

**Payload change**: `useCreateComponent`'s mutation input adds `typeLabel: string`
and `typeAssignable?: boolean`, replacing the direct `componentTypeKey` the frontend
used to send — the resolve-or-register step now happens server-side (Section 2), so
the frontend never computes a `key` itself.

**Type suggestions elsewhere**: `ComponentsTab`'s type-filter chip bar and the
per-project Settings card (`ProjectDetail.tsx`'s `ComponentSettingsCard`) already
read from `project.componentTypesSnapshot` reactively — once the backend appends a
new type, the next `useComponents`/project-detail refetch (already triggered by the
existing `invalidateProjectComponents`/`invalidateProjects` calls on component
creation) picks it up with no additional frontend wiring.

## 5. Frontend — Cross-page tagging

**New shared component**: `ProjectComponentTag.tsx` (new file, alongside
`shared.tsx` in `pages/projects/`) — `{ projectId, componentId? }`, resolves via the
existing `useProjectName` and `useComponent` hooks, renders a compact
`📁 ProjectName` (plus `· 🧩 ComponentLabel` when `componentId` is set) chip. Single
implementation, reused everywhere instead of the per-page copies that already exist
in `Jobs.tsx`/`Finance.tsx`/`Agreements.tsx` — those three get refactored to use it
(behavior unchanged, just de-duplicated) as part of this pass since it's the same
files/pattern being touched anyway.

**Gaps closed**:
- `JobDetailModal.tsx`: existing `JobProjectChip` (project name only) replaced with
  `<ProjectComponentTag projectId={job.projectId} componentId={job.componentId} />`.
- `BoardPlan.tsx` / `BoardLive.tsx`: job cards gain the tag, small/secondary — placed
  so it doesn't compete visually with status/technician/time, the fields that
  actually drive a dispatcher's read of the card.
- `JobDetailPanel.tsx` (dispatch side panel): tag added near the customer/address
  block at the top, matching `JobDetailModal`'s placement.

## Testing

- `crm-service`: Jest —
  - `resolveOrRegisterType`: existing-type match (case-insensitive) returns the
    existing key/ceiling and ignores a passed `typeAssignable`; new-type path
    appends to `componentTypesSnapshot` and `componentCustomerSettings` correctly;
    slugify collision within one project gets a numeric suffix.
  - Template `create()` always starts `DRAFT` regardless of request body;
    `update()` rejects a `status` change on a built-in the same way it already
    rejects other field changes.
  - `ProjectsService.create()`: `freeform: true` produces
    `componentTypesSnapshot: []`; rejects when both `freeform` and `templateId` are set.
- Frontend: `tsc -b` + build (no test runner in these apps, per repo convention) +
  manual verification: create a Customized project, add three components typing
  brand-new type names each time (including one marked "No owner"), confirm the
  Settings card and filter chips reflect all three; publish a draft template and
  confirm it appears in the New Project picker; open a job linked to a component from
  the Scheduling board and the dispatch panel and confirm the tag renders in both.

## Out of scope

- Deleting/renaming a component type after it's been created (once a type exists on
  a project, per this design it's permanent — matches "growable, never contracts,"
  the same one-directional posture the base design already uses for template edits
  not retroactively touching projects).
- Bulk-publishing multiple templates at once.
- Any change to the built-in Housing Scheme template's own content — only its
  `status` gets backfilled to `PUBLISHED` so it keeps working exactly as it does today.
