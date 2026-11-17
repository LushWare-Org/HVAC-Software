# Projects/Housing Scheme UX changes + AI equipment photo scan

Date: 2026-07-22
Status: Approved
Related: docs/superpowers/specs/2026-07-04-projects-module-design.md, docs/superpowers/specs/2026-07-13-project-templates-housing-scheme-design.md

## Summary

Three changes to the Projects module and its Housing Scheme template:

1. A project's customer becomes optional at creation, settable later.
2. A house's owner can optionally be set at creation time (in addition to the existing "assign later" flow).
3. Equipment gets an optional photo upload. Upload triggers a background AI scan (OpenAI `gpt-4o` vision) that extracts nameplate fields (brand/model/serial) and/or a fault error-code table from the image, surfaced in the UI for the admin to review before applying.

## 1. Project — optional customer

### Backend (`apps/crm-service`)

- `prisma/schema.prisma`: `Project.customerId String` → `String?`. No FK exists on this column today (it's a plain string, validated in the service layer), so this is a straight nullability change.
- `projects.controller.ts`:
  - `CreateProjectDto.customerId`: `@IsString() customerId!: string` → `@IsOptional() @IsString() customerId?: string`.
  - `UpdateProjectDto`: add `@IsOptional() @IsString() customerId?: string` (currently absent — customer could never be changed post-creation).
- `projects.service.ts`:
  - `create()`: remove the `if (!input.customerId) throw new BadRequestException('customerId is required')` guard. Keep the "customer belongs to this company" check, but only run it `if (input.customerId)`. Store `customerId: input.customerId ?? null`.
  - `update()`: add `'customerId'` to the copied-field list, but validate (customer exists in company) before applying when it's a non-null value being set. Setting `customerId` back to `null` is not supported (no product need — once assigned, stays assigned or gets reassigned to another real customer, never unassigned).
  - `decorate()`: `customerIds` set must filter out `null`/`undefined` before the `customer.findMany` lookup. Projects with no customer get `customerName: null` (not `'—'` — the frontend renders its own "No customer assigned" state, distinct from "customer name unresolvable").

### Frontend (`apps/admin-dashboard`)

- `projectsApi.ts`: `Project.customerId` and `customerName` become `string | null`. `useCreateProject`/`useUpdateProject` input types make `customerId` optional.
- `ProjectEditorModal.tsx`:
  - `valid` drops the `!!form.customerId` requirement — only `name` is required.
  - Customer picker keeps its search-and-select UI, but an empty selection is allowed; add a line of helper copy: "Optional — you can add a customer later from the project page."
  - `save()` payload sends `customerId: form.customerId || undefined` for create (unchanged shape, now optional).
- `ProjectDetail.tsx`: header customer line — when `project.customerName` is `null`, render "No customer assigned" plus an inline "Add customer" button. Clicking it opens a small popover with the same search-and-pick list pattern already used in `HousesTab.tsx`'s `OverviewSection` owner picker, calling `useUpdateProject({ id, customerId })` on selection.

## 2. House — optional owner at creation

### Backend

- No schema change (`House.ownerCustomerId` is already nullable).
- `houses.controller.ts`: `UpsertHouseDto` gains `@IsOptional() @IsString() ownerCustomerId?: string`.
- `houses.service.ts`: `create()` accepts `ownerCustomerId` on `UpsertHouseInput`. If present, validate the customer belongs to the company (same check `assignOwner` already does) and pass it straight into `prisma.house.create`. No equipment-resync call needed here — a brand-new house has no equipment yet.

### Frontend

- `housesApi.ts`: `UpsertHouseInput` gains `ownerCustomerId?: string`.
- `HousesTab.tsx`'s `AddHouseModal`: add an optional customer search-picker (mirrors `OverviewSection`'s owner picker — search input + result list, selected customer shown as a removable chip). Selection is optional; existing copy ("You can assign an owner... after creating the house") adjusts to "...or change it later."

## 3. Equipment photo + AI scan + structured error codes

### Data model (`crm` schema)

```sql
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
```

`image_scan_status`: `NONE | SCANNING | DONE | FAILED`. `image_scan_result`: latest AI suggestion, shape `{ brand: string|null, model: string|null, serialNo: string|null, errorCodes: [{code, meaning}] }` — a *suggestion* the admin applies explicitly; it is never written straight into `brand`/`model`/`serialNo` or into `equipment_error_codes` by the scan itself.

Applied via `scripts/apply-migrations.mjs` (append a new entry to the `migrations` array, `schema: 'crm'`), matching how every migration since `20260512000000` in this repo has actually reached the database — **not** `prisma migrate dev`, which wants to reset the `crm` schema due to prior drift (see `docs/superpowers/specs/2026-07-03-enroute-notification-design.md`). `schema.prisma` is still updated to match, for Prisma Client generation and as documentation, with a corresponding (unrun) file under `prisma/migrations/`.

### Backend (`apps/crm-service`)

- Add `openai` to `apps/crm-service/package.json` dependencies (same version as `chat-service`, `^4.47.0`).
- New `equipment-scan.service.ts`:
  - `scanAndStore(companyId, equipmentId, imageUrl): Promise<void>` — calls `openai.chat.completions.create` with `model: 'gpt-4o'`, `response_format: { type: 'json_object' }`, one user message containing the image (`image_url` content part, pointing at the public S3/MinIO URL — the bucket is public-read, same as avatars) plus a text instruction to extract nameplate fields and/or a fault/error-code table, returning strict JSON matching the `image_scan_result` shape, nulls/empty array when nothing relevant is visible.
  - Internally wrapped in try/catch: success → `imageScanStatus: 'DONE', imageScanResult: <parsed>`; failure → `imageScanStatus: 'FAILED', imageScanError: <message>`. This method never throws — it always resolves, so it's safe to call fire-and-forget.
- `equipment.service.ts`:
  - `uploadImage(companyId, id, file)`: uploads via `StorageService.putPublicObject` (new bucket `S3_BUCKET_EQUIPMENT`, default `tscrm-equipment`, same auto-provision pattern as `tscrm-avatars`), sets `imageUrl` + `imageScanStatus: 'SCANNING'` + clears any prior `imageScanResult`/`imageScanError`, then calls `void this.scan.scanAndStore(...)` without awaiting, and returns the updated equipment row immediately.
  - `addErrorCode(companyId, equipmentId, { code, meaning, source })` / `removeErrorCode(companyId, id)` / `listErrorCodes(companyId, equipmentId)` — straightforward CRUD against `equipment_error_codes`, same shape as `ConsumablesService`.
  - `findByHouse`/`findByCustomer` responses include the new image/scan fields plus an `errorCodes` array (one extra query, batched, not N+1 — same pattern as `HousesService.decorate`'s equipment/issue counts).
- New endpoints on `equipment.controller.ts` (staff-only — `STAFF_WRITE` roles, consistent with "the admin can then add..." framing):
  - `POST /equipment/:id/image` (multipart, `FileInterceptor('file')`)
  - `POST /equipment/:id/error-codes` — body `{ code, meaning? }`, `source` forced to `'MANUAL'` for admin-typed entries; a separate internal call path used when the admin clicks "Add" on an AI suggestion passes `source: 'AI_SCAN'`.
  - `DELETE /equipment/:id/error-codes/:codeId`

### Frontend (`apps/admin-dashboard`)

- `housesApi.ts`: `HouseEquipment` gains `imageUrl`, `imageScanStatus`, `imageScanResult`, `imageScanError`, `errorCodes: {id, code, meaning, source}[]`. New hooks `useUploadEquipmentImage(equipmentId)` (FormData POST, mirrors `AddTechnicianModal`'s avatar upload), `useAddErrorCode(equipmentId)`, `useDeleteErrorCode(equipmentId)`.
- `useHouseEquipment`: add `refetchInterval` — poll every 3s while any returned item has `imageScanStatus === 'SCANNING'`, else no polling (react-query's function form of `refetchInterval`, computed from the last-fetched data).
- `EquipmentDetailModal` (in `HousesTab.tsx`):
  - New "Photo" section: file input/dropzone → immediate upload on selection → thumbnail preview + status pill (Scanning… spinner / Scanned check / Scan failed). On failure, the same file picker is offered again labeled "Retry" — picking a photo (the same one or a different one) re-runs the upload+scan endpoint.
  - When `imageScanStatus === 'DONE'` and `imageScanResult` has any non-null nameplate field: a "Suggested from photo" panel shows Brand/Model/Serial with an **Apply** action that populates the (already-existing) equipment edit fields for the admin to review and save — it does not call the update mutation itself.
  - When `imageScanResult.errorCodes` is non-empty: a checkable suggestion list with "Add selected" → calls `useAddErrorCode` per checked row with `source: 'AI_SCAN'`.
  - Persisted `errorCodes` (regardless of source) render as an editable list — code, meaning, a small "AI" or "Manual" tag, delete button — plus a small manual "Add code" inline form for entries with no photo involved at all.

## Out of scope

- No nullable-`Equipment.customerId` migration — the existing "assign a house owner before adding equipment" gate is unchanged; setting the owner during house creation (change #2) is what unblocks equipment addition immediately, without touching that constraint.
- No multi-image gallery per equipment — one photo, replaceable (re-upload overwrites `imageUrl` and re-triggers a scan).
- No changes to the customer-facing portal — this is an admin/staff-only surface (equipment image + scan endpoints are `STAFF_WRITE`-gated).
