# Data Migration Wizard — Design Spec
**Date:** 2026-05-14
**Status:** Approved for implementation
**Source doc:** `docs/DATA_MIGRATION_BRAINSTORM.md` (Option 3 approved)

---

## Problem

HVAC businesses evaluating T&S CRM have years of customer and equipment history locked in Jobber, Housecall Pro, or spreadsheets. No self-service migration path = a hard barrier to switching. Competitors tell customers to "contact support." We ship a wizard.

---

## What We're Building

A guided CSV import wizard reachable two ways:
1. **`/import`** — standalone first-class route with its own sidebar entry, designed for the onboarding moment
2. **Settings page card** — "Data Import" card with a "Start Import" link that routes to `/import`

The wizard handles **Customers** and **Equipment** (v1 scope). Jobs require cross-service writes and are deferred to v2.

---

## Architecture

### Backend — `crm-service`

**New module:** `src/import/`

**Two new Prisma models** added to `crm-service/prisma/schema.prisma`:

```prisma
model ImportBatch {
  id          String   @id @default(uuid())
  companyId   String
  source      String   // 'jobber' | 'hcp' | 'generic' | 'equipment'
  status      ImportStatus @default(VALIDATING)
  totalRows   Int      @default(0)
  imported    Int      @default(0)
  skipped     Int      @default(0)
  failed      Int      @default(0)
  createdBy   String
  createdAt   DateTime @default(now())
  completedAt DateTime?
  errors      ImportError[]
  @@index([companyId])
  @@map("import_batches")
}

model ImportError {
  id         Int      @id @default(autoincrement())
  batchId    String
  batch      ImportBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)
  rowNumber  Int
  entityType String   // 'customer' | 'equipment'
  rawData    Json
  error      String
  createdAt  DateTime @default(now())
  @@map("import_errors")
}

enum ImportStatus {
  VALIDATING
  READY
  IMPORTING
  DONE
  FAILED
  ROLLED_BACK
}
```

`importBatchId String?` column added to `crm.customers` and `crm.equipment` — enables rollback via `DELETE WHERE importBatchId = X`.

**Real-time progress:** NestJS `@Sse()` endpoint. Frontend uses `EventSource` API. No Socket.IO dependency needed in crm-service. Events emitted per chunk of 50 rows:
```json
{ "processed": 145, "total": 312, "imported": 138, "skipped": 6, "failed": 1, "entity": "customer" }
```

**Platform auto-detection:** column fingerprinting on CSV headers.
- Jobber: has `"Client Name"`, `"Client Email"`, `"Job Title"`
- HCP: has `"Customer Name"`, `"Customer Email"`, `"Job Number"`
- Generic: anything else → shows full manual mapping UI

**Column maps per platform (customers):**

| T&S field | Jobber | HCP | Generic |
|---|---|---|---|
| firstName | `Client Name` (split on space) | `Customer Name` (split) | user maps |
| lastName | `Client Name` (split) | `Customer Name` (split) | user maps |
| email | `Client Email` | `Customer Email` | user maps |
| phone | `Client Phone` | `Customer Phone` | user maps |
| address | `Property Address` | `Service Address` | user maps |
| city | `Property City` | `City` | user maps |
| state | `Property State` | `State` | user maps |
| zipCode | `Property Zip` | `Zip Code` | user maps |
| type | `Client Type` (mapped: residential→RESIDENTIAL) | `Customer Type` | user maps |

**Duplicate handling:** Skip on `(email, companyId)` match. Tracked in `skipped` count. Report shows which rows were skipped.

**Rollback:** `DELETE FROM crm.customers WHERE import_batch_id = $1 AND company_id = $2` — instant, no soft-delete complexity needed.

**File session:** On detect, server parses the CSV, stores parsed rows in Redis with a 30-min TTL, returns a `sessionId`. Subsequent calls (validate, start) send `sessionId + columnMap` — the file is never re-uploaded.

**Controller endpoints:**
```
POST   /crm/import/detect          — multipart CSV upload → { sessionId, platform, columnMap, preview[5rows] }
POST   /crm/import/validate        — { sessionId, columnMap } → { counts, errors[], warnings[] }
POST   /crm/import/start           — { sessionId, columnMap } → creates ImportBatch, queues work, returns { batchId }
GET    /crm/import/batches/:id/stream  — SSE: real-time progress events
GET    /crm/import/batches         — list import history for company
GET    /crm/import/batches/:id     — final status + counts
GET    /crm/import/batches/:id/errors.csv — downloadable error report
DELETE /crm/import/batches/:id     — rollback (COMPANY_ADMIN only)
GET    /crm/import/equipment-template.csv — download blank equipment CSV template
```

### Frontend — `admin-dashboard`

**New files:**
- `src/pages/import/Import.tsx` — main wizard page
- `src/hooks/useImport.ts` — all API + SSE hooks

**Route:** `/import` — lazy-loaded, added to `App.tsx`
**Sidebar:** "Upload" icon entry between Settings and bottom of nav (or after Marketing)
**Settings page:** New "Data Import" card section with description + "Start Import →" button

---

## The 6-Step Wizard UX

### Step 1 — Choose Source
Large platform cards in a 2×2 grid:
- Jobber (logo placeholder + "How to export" collapsible with 3-step instruction)
- Housecall Pro
- Generic CSV / Spreadsheet
- Equipment Template (separate card, orange accent — "Add equipment to existing customers")

Selecting a card highlights it and enables the Next button.

### Step 2 — Upload
- Drag-and-drop zone with dashed border, animated on hover
- Accepts `.csv` and `.zip` (ZIP auto-extracted, file list shown)
- File selected → immediately fires `POST /detect` → spinner → transitions to Step 3 with auto-populated mapping
- "Download sample file" link shown per platform

### Step 3 — Column Mapping
- Three-column table: `CSV Column | Sample Data (first 3 rows) | Maps To (dropdown)`
- Auto-detected fields: green checkmark badge
- Unmapped required fields: amber warning badge + dropdown focused
- "Ignore this column" option in every dropdown
- Required fields (firstName, lastName) blocked until mapped
- Live "X of Y required fields mapped" counter at bottom

### Step 4 — Validation Preview
Fires `POST /validate` on entering step. Shows:
- Three summary chips: `X will import` (green) · `Y duplicates — skipped` (amber) · `Z errors — skipped` (red)
- Expandable accordion per error type: "Missing email (14 rows)" → expand → table of row numbers + raw data
- Toggle: **"Import with warnings"** — enabled by default if only warnings (not hard errors)
- "Fix and re-upload" link resets to Step 2
- "Continue to import →" button (disabled if hard errors AND toggle off)

### Step 5 — Live Import Progress
- `POST /start` fires on entering step → `batchId` returned
- `EventSource` connects to `/crm/import/batches/:id/stream`
- Animated progress bar (CSS transition on width)
- Live counters with animated number transitions: `Imported 138 · Skipped 6 · Errors 1`
- Current entity label: "Importing customers..." → "Linking equipment..."
- Non-blocking notice: "You can navigate away — import continues in the background"
- On `status: DONE` event → auto-advance to Step 6

### Step 6 — Summary
- Large animated checkmark (CSS) on success
- Final count cards: Customers Imported · Equipment Imported · Skipped · Errors
- "Download error report" button (only shown if errors > 0)
- Two CTA cards:
  - "View your customers →" — links to `/customers`
  - "Add equipment data →" — shown if no equipment imported, links back to wizard with equipment template pre-selected
- Import history note: "This import can be rolled back from Settings → Data Import"

---

## Settings Page Integration

New card added to `Settings.tsx` between existing sections:

```
┌─────────────────────────────────────────────────────┐
│ 📦 Data Import                                       │
│ Migrate customers and equipment from Jobber,         │
│ Housecall Pro, or a spreadsheet.                     │
│                                                      │
│ Last import: 147 customers · 3 days ago    [Rollback]│
│                              [View history] [Start →]│
└─────────────────────────────────────────────────────┘
```

The rollback button shows only if a non-rolled-back batch exists. Clicking it shows a confirmation modal with the exact count of records that will be deleted.

---

## White-Glove Panel (`/internal/imports`)

`super_admin` role only — not in the main sidebar, accessible by direct URL.

Extra controls on top of the standard wizard:
- **Company selector** — searchable dropdown at top of page
- **Import history table** — all companies, all batches, sortable by date/status/company
- **Rollback** per batch row — confirmation modal with record count
- **Skip validation toggle** — bypass warnings for known-clean Jobber exports

---

## V1 Scope

| Entity | V1 | V2 |
|---|---|---|
| Customers | ✅ | — |
| Equipment (via template) | ✅ | — |
| Jobs | ❌ | ✅ (cross-service) |
| Invoices | ❌ | future |
| Price book | ❌ | future |

---

## Error Handling

- Parse errors (malformed CSV): shown immediately in Step 3, import blocked
- Validation warnings (missing email, invalid date): shown in Step 4, user can override
- Row-level import errors: logged to `import_errors`, import continues, included in error CSV download
- SSE connection drop: frontend retries `EventSource` up to 3 times, then falls back to polling `/batches/:id` every 3s
- Rollback failure: shown as toast error, batch status set to FAILED (not ROLLED_BACK)

---

## Build Order

1. Prisma schema additions + SQL migration
2. `ImportService` — detect, validate, execute (customers only first)
3. SSE endpoint + progress emission
4. Import controller + equipment template endpoint
5. `useImport.ts` hooks
6. Wizard shell — step navigation, layout, stepper component
7. Steps 1–4 (source, upload, mapping, validation)
8. Step 5 — SSE live progress
9. Step 6 — summary + error download
10. Settings page card + rollback modal
11. Sidebar entry + `/import` route in App.tsx
12. White-glove `/internal/imports` panel
