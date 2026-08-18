# Tenant Finance Settings — Design Spec

**Status:** Approved for planning
**Sub-project:** A of 2 (multi-currency + configurable tax/payment-terms initiative)
**Depends on:** nothing — this is the foundation
**Feeds into:** Sub-project B ("Wire currency/tax/terms into records") — Quote/Invoice/Customer/Job/Payment/RecurringSchedule creation and edit forms will consume the currency list, tax-rate presets, and payment-terms presets this spec creates. Sub-project B is a separate design/plan cycle and is out of scope here.

## Problem

Three related gaps in tenant configurability today:

1. **Currency is locked.** `Company.currency` is a single ISO code, explicitly rejected by `CompanyService.update()` as "managed by the platform" (`SETTINGS_KEYS = ['currency', 'timezone', 'features']`). There is no concept of a tenant *enabling a set* of currencies to choose from elsewhere in the product, and no UI to change it at all.
2. **Tax rate is a freeform number, re-typed per document.** `AddQuoteModal.tsx` / `AddInvoiceModal.tsx` both hardcode `useState("10")` for tax rate — no tenant-level named presets (e.g. "VAT 15%", "Sales Tax 8.25%", "No Tax"), nothing reusable, nothing editable from Settings.
3. **Payment terms aren't surfaced at all.** `Invoice.dueDays` exists in the schema (`@default(30)`) but no form ever sets it — `AddInvoiceModal.tsx` only has a raw `dueDate` date-picker. No named terms ("Net 30", "Due on Receipt") anywhere.

This spec builds the **tenant-managed configuration layer** for all three — the lists, the CRUD, and the Settings UI to manage them. It intentionally does **not** wire these lists into Quote/Invoice/Customer/Job/Payment/RecurringSchedule forms — that's Sub-project B, sequenced after this ships, so each piece is independently testable and reviewable.

## Scope decisions (confirmed with product owner)

- Currency selection across the product will eventually be **fully independent per document** (no inheritance from customer → job → invoice) — out of scope here, but it means this spec's currency list has no "in use" tracking to worry about yet.
- Tenant currency list is built from the standard **ISO 4217 reference set** (code, name, symbol) — admins toggle which are enabled and pick one default. No free-form/custom currency creation.
- No exchange-rate conversion anywhere in this initiative — currencies are labels for display, not converted.
- Tax and payment terms are **named presets**, not a single default value — admins manage a small list, one marked default, with an inline override still possible at document-creation time (Sub-project B).
- New config data lives in **crm-service**, alongside `Company` — same schema, same ownership model as `Company.currency`/`timezone`/`features` today, and finance-service reads it the same way it already reads company settings via `company-settings.client.ts`.

## Data model

### `Company` (crm schema) — add one column

```prisma
model Company {
  // ...existing fields...
  enabledCurrencies String[] @default(["USD"])   // ISO 4217 codes this tenant can select from anywhere
  taxRatePresets       TaxRatePreset[]
  paymentTermsPresets  PaymentTermsPreset[]
}
```

`Company.currency` (existing field, unchanged type) becomes "the tenant default currency." Invariant: `currency ∈ enabledCurrencies`, enforced in the service layer on every write to either field. `enabledCurrencies` must never be empty.

### Two new tables (crm schema)

```prisma
model TaxRatePreset {
  id          String   @id @default(uuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String                          // "VAT 15%", "Sales Tax", "No Tax"
  rate        Decimal  @db.Decimal(5, 4)       // 0.1500 — matches finance-service's existing taxRate encoding
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([companyId, isActive])
  @@map("tax_rate_presets")
}

model PaymentTermsPreset {
  id          String   @id @default(uuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String                          // "Due on Receipt", "Net 15", "Net 30"
  days        Int                             // 0, 15, 30, 60...
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([companyId, isActive])
  @@map("payment_terms_presets")
}
```

Invariant (service-layer, not a DB constraint — matching the codebase's existing "one default" pattern elsewhere): **exactly one row per company per table has `isDefault: true`**, and that row must also have `isActive: true`. Setting a new preset's `isDefault: true` unsets it on the prior default in the same transaction. Deactivating or deleting the current default is rejected with a 409 until another preset is promoted.

### Migration + backfill

Added via `scripts/apply-migrations.mjs` (new migration id, same pattern as `20260815010000_add_activity_logs`):

1. `ALTER TABLE crm.companies ADD COLUMN "enabledCurrencies" TEXT[] NOT NULL DEFAULT ARRAY['USD']`
2. Backfill: `UPDATE crm.companies SET "enabledCurrencies" = ARRAY[currency] WHERE NOT (currency = ANY("enabledCurrencies"))` — guarantees every tenant's existing default is already a member post-migration, including tenants whose `currency` isn't `'USD'` (e.g. the LKR tenant referenced in `project_tenant_settings` memory).
3. Create `tax_rate_presets`, `payment_terms_presets` tables.
4. Seed one default row into each new table **per existing company**: `TaxRatePreset { name: "No Tax", rate: 0, isDefault: true, isActive: true }` and `PaymentTermsPreset { name: "Net 30", days: 30, isDefault: true, isActive: true }` — so no tenant ever sees an empty list or a document form with nothing to select (relevant once Sub-project B lands).

## API surface (crm-service)

Extends the existing `company` module (`company.controller.ts` / `company.service.ts`) — same guard pattern (`JwtAuthGuard`, scoped via `AuthUser.companyId`).

```
GET   /crm/company/currencies
  → { enabled: string[], default: string }

PATCH /crm/company/currencies                 [company_admin, super_admin]
  body: { enabled: string[], default: string }
  400 if default ∉ enabled, or enabled is empty

GET    /crm/company/tax-rates
  → TaxRatePreset[]  (all rows, active + inactive, sorted by sortOrder)

POST   /crm/company/tax-rates                 [company_admin, super_admin]
  body: { name: string, rate: number, isDefault?: boolean }

PATCH  /crm/company/tax-rates/:id             [company_admin, super_admin]
  body: { name?, rate?, isActive?, isDefault?, sortOrder? }
  409 if isActive:false or isDefault:false would leave the company with no default

DELETE /crm/company/tax-rates/:id             [company_admin, super_admin]
  409 if isDefault:true (reassign default first)

GET    /crm/company/payment-terms
POST   /crm/company/payment-terms             [company_admin, super_admin]
PATCH  /crm/company/payment-terms/:id         [company_admin, super_admin]
DELETE /crm/company/payment-terms/:id         [company_admin, super_admin]
  same shapes/rules as tax-rates, with { name, days } instead of { name, rate }
```

Read endpoints are open to any authenticated staff role (technician/dispatcher/office_manager included) since Sub-project B will need these lists to populate dropdowns everywhere, not just for admins. Mutating endpoints are restricted to `company_admin`/`super_admin`, matching the existing RBAC convention for company-wide settings elsewhere in `company.controller.ts`.

### Shared types (`packages/types`)

New file `packages/types/src/finance-settings.ts`:

```ts
export interface CurrencySettings {
  enabled: string[];
  default: string;
}

export interface TaxRatePreset {
  id: string;
  companyId: string;
  name: string;
  rate: number;        // decimal fraction, e.g. 0.15
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTermsPreset {
  id: string;
  companyId: string;
  name: string;
  days: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

Re-exported from `packages/types/src/index.ts`, imported by crm-service DTOs and both frontends — single source of truth, same convention `CompanySettings` already follows.

## Frontend — admin-dashboard

### New "Finance" tab in `Settings.tsx`

Added to the existing tab bar (`page-tabs`) between "Company" and "Notifications" — icon `Landmark`. Three cards, reusing the page's existing `card`/`card-header`/`card-body`/`Toggle`/`form-input`/`btn` primitives so it reads as native to this page, not bolted on.

**Card 1 — Currencies.**
A searchable combobox over a static ISO 4217 reference list (`packages/types` or a small `apps/admin-dashboard/src/lib/currencies.ts` constant — code, name, symbol; e.g. `LKR — Sri Lankan Rupee (Rs)`). Selecting an entry adds it as a removable chip below the search box. Each chip shows its code + symbol; the tenant's current default chip is visually distinguished (filled/accent style) with the rest outlined. Clicking a non-default chip's star icon promotes it to default (optimistic, single PATCH). Removing the default chip is blocked inline — a small inline note ("set another currency as default first") replaces the remove action rather than a blocking alert dialog. Removing a chip that isn't the default just removes it from `enabled` (no "in use" check yet — deferred to Sub-project B).

**Card 2 — Tax Rates.**
An inline-editable list, not a modal-per-row flow (this list is typically 2-5 rows total): each row = name text input, rate number input (%-suffixed, stored as fraction), a default-star toggle, an active/inactive toggle, and a delete icon-button (disabled + tooltipped "This is the default rate" when `isDefault`). "+ Add tax rate" appends a new inline row in edit state. Rows save on blur/debounce, matching the page's existing dirty-tracking pattern (`SaveButton` component) but scoped per-row rather than one page-wide save, since these are independent list items.

**Card 3 — Payment Terms.**
Same interaction pattern as Card 2: name, days (number input, "days" suffix; a `days === 0` row auto-labels as "Due on Receipt" in the summary line beneath the name field), default-star, active toggle, delete.

### Hooks — `apps/admin-dashboard/src/hooks/useSettings.ts`

New hook pairs following the existing `useCompany`/`useUpdateCompany` pattern exactly:
- `useCurrencies()` / `useUpdateCurrencies()`
- `useTaxRates()` / `useCreateTaxRate()` / `useUpdateTaxRate()` / `useDeleteTaxRate()`
- `usePaymentTerms()` / `useCreatePaymentTerms()` / `useUpdatePaymentTerms()` / `useDeletePaymentTerms()`

All invalidate their own query key on mutation success; no cross-invalidation needed since nothing else reads these yet (Sub-project B will add that).

### Visual design pass

Per the UI/UX and frontend-design skills: the one genuinely new interaction pattern on this page is the currency search-combobox-with-chips — that gets deliberate attention (keyboard navigation, clear enabled/default state distinction, empty/loading states). The preset list rows reuse this page's established list-row visual language (already seen in `JobTypeRow`) so they don't compete for a second new pattern in the same page.

## Testing

- **crm-service (Jest):**
  - `CompanyService` — currency update validation (`default` must be in `enabled`, `enabled` can't be empty), tax-rate/payment-terms CRUD (create, update, the "can't deactivate/delete the default" 409s, "setting a new default unsets the old one" transaction behavior).
  - `CompanyController` — RBAC: non-admin roles get 403 on every mutating route, 200 on every GET route.
- **Migration verification:** run the migration against a copy of seed data; assert every existing company ends up with `enabledCurrencies` containing its prior `currency`, exactly one default `TaxRatePreset`, and exactly one default `PaymentTermsPreset`.
- **Frontend:** `pnpm --filter admin-dashboard build` (the repo's only type-check for this app) must be clean; manual verification pass through the new Finance tab (add/remove currencies, change default, add/edit/delete tax and payment-terms presets, confirm the default-protection rules surface correctly in the UI).

## Out of scope (deferred to Sub-project B)

- Any schema/UI change to Customer, Job, Quote, Invoice, Payment, or RecurringSchedule.
- Replacing the freeform tax-rate number input in `AddQuoteModal.tsx`/`AddInvoiceModal.tsx` with a preset dropdown.
- Replacing the raw `dueDate` picker in `AddInvoiceModal.tsx` with a payment-terms dropdown.
- `formatMoney`/`formatDollars` accepting a per-value currency override instead of only the global tenant default.
- "In use" delete-protection for currencies/presets (requires records to actually reference them first).
- Customer-portal changes (this initiative's forms are all staff-side; customer-portal is read-only display and picks up currency-aware formatting for free in Sub-project B).
