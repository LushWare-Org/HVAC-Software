# Per-Record Currency — Backend + formatMoney Core — Design Spec

**Status:** Approved for planning
**Sub-project:** B1 of 2 (multi-currency initiative, second phase — "wire currency/tax/terms into records")
**Depends on:** Sub-project A (`docs/superpowers/specs/2026-08-18-tenant-finance-settings-design.md`) — ships the tenant currency list, tax-rate presets, and payment-terms presets this initiative's UI (B2) will draw from. A is complete and merged.
**Feeds into:** Sub-project B2 ("Wire it into every form and list view") — B2 adds the currency dropdowns, tax-rate/payment-terms preset dropdowns, and updates every list/detail-view `formatMoney` call site to pass a record's own currency. B2 is a separate design/plan cycle and out of scope here.

## Problem

Sub-project A gave tenants a currency list, tax-rate presets, and payment-terms presets to manage — but nothing yet *uses* them per record. Every Job, Quote, Invoice, and Payment today is implicitly priced in the tenant's single global `Company.currency`; there is no per-record currency column anywhere, and `formatMoney()`/`formatDollars()` in both frontends' `lib/format.ts` format every amount using one module-level `activeCurrency` set once at login.

This spec builds the **data layer and formatting core** for per-record currency: schema columns, DTOs, tenant-default fallback, quote→invoice currency inheritance, and a `formatMoney` signature change that accepts a per-value currency override. It intentionally does **not** touch any UI — no dropdowns, no list-view call-site updates, no tax/payment-terms preset wiring. That's Sub-project B2, sequenced after this ships, so each piece is independently testable and reviewable (same reasoning as the A → B split).

## Scope decisions (confirmed with product owner this session)

- **Currency remains fully independent per document** (Job, Quote, standalone Invoice) — no inheritance from Customer or Job into Quote/Invoice, consistent with the original multi-currency decision.
- **Exception 1 — Customer gets no currency field.** Customer has no monetary amount anywhere on the entity; a currency field with nothing to attach to or pre-fill (since documents don't inherit) would be pure decoration. Dropped from this initiative. (What *is* required, per the product owner: every table/list showing a Job/Quote/Invoice/Payment amount must display that record's own currency, not the tenant default — that requirement lives entirely in B2's UI work, but the `formatMoney` core built here is what makes it possible.)
- **Exception 2 — Payment inherits its Invoice's currency, read-only, not stored.** Payment is always recorded against a specific invoice's balance (`InvoiceDetailModal` in admin-dashboard); an independently-selectable Payment currency would let someone record a payment in a different currency than its invoice with no conversion, silently corrupting `balanceDue`. Payment gets no new column — its currency is read from the parent Invoice at serialization time.
- **Exception 3 — Invoice inherits Quote's currency on conversion.** An invoice created via `POST /finance/quotes/:id/convert-to-invoice` carries its source quote's `currency` forward automatically — restating currency on a document that's just a quote becoming billable would be busywork, not flexibility. A *standalone* invoice (not from a quote) keeps its own independent currency in B2's UI.
- **RecurringSchedule gets the schema column only, no UI.** No recurring-billing UI exists in admin-dashboard today; adding the column now avoids a follow-up migration whenever that UI gets built, but nothing wires it up this pass.
- **No exchange-rate conversion** anywhere — same as Sub-project A. Currencies are labels; nothing sums across them (dashboard/analytics aggregates keep using the tenant default, unchanged).

## Data model

### `job-service` schema — `Job` model

```prisma
model Job {
  // ...existing fields...
  currency String @default("USD")   // ISO 4217, independent per job
}
```

### `finance-service` schema — three models

```prisma
model Quote {
  // ...existing fields...
  currency String @default("USD")
}

model Invoice {
  // ...existing fields...
  currency String @default("USD")   // set from the source Quote on conversion; independently editable when created standalone (B2)
}

model RecurringSchedule {
  // ...existing fields...
  currency String @default("USD")   // schema only this pass — no UI exists to set it yet
}
```

`Payment` — **no new column.** Its currency is always its parent Invoice's `currency`, read at query time.

### Migration + backfill

New migration entries in `scripts/apply-migrations.mjs`, following the exact pattern established in Sub-project A (`20260818000000_add_tenant_finance_settings`):

**`jobs` schema:**
```sql
ALTER TABLE "jobs"."job" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
```
Backfill requires joining across schemas (Postgres allows cross-schema queries within one database, which this repo already does — see `houseId`/`componentId` cross-schema patterns): update every job's `currency` to its owning company's current `Company.currency`, not a blind `'USD'`, via a join through `crm.companies` on `companyId`.

**`finance` schema:**
```sql
ALTER TABLE "finance"."quotes" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "finance"."invoices" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "finance"."recurring_schedules" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
```
Same cross-schema backfill pattern, joining to `crm.companies` on `companyId` for each of the three tables.

## Quote → Invoice conversion (currency inheritance)

In `apps/finance-service/src/quotes/quotes.service.ts::convertToInvoice`, the `tx.invoice.create({ data: { ... } })` call (currently building the invoice from quote fields like `subtotal`, `taxRate`, `total`) gets one added field:

```ts
currency: quote.currency,
```

This is the single deliberate exception to "every document gets its own independent currency" — justified because the invoice literally *is* the quote becoming billable, not a new, separate financial decision.

## DTOs

`CreateQuoteDto`, `UpdateQuoteDto` (finance-service `quotes/dto/`), `CreateInvoiceDto`, `UpdateInvoiceDto` (finance-service `invoices/dto/`), `CreateJobDto`, `UpdateJobDto` (job-service `jobs/dto/`) each add:

```ts
@ApiPropertyOptional({ example: 'USD', description: 'ISO 4217 code; defaults to the tenant currency when omitted' })
@IsOptional()
@IsString()
@Length(3, 3)
currency?: string;
```

When omitted on create, each service's `*.service.ts` resolves it via that service's existing `company-settings.client.ts` (the same cross-service client already used to fetch the tenant's default currency/timezone/features for other purposes) — never a hardcoded `'USD'` fallback for a non-USD tenant. When provided, the given value is used as-is (no validation against the tenant's `enabledCurrencies` list in this pass — that check is a B2 UI-layer concern once a dropdown exists to constrain the choice at the source; the backend accepting any 3-letter code here matches the current lenient pattern already used for `Company.currency` itself).

## Payment currency (read path)

`PaymentsService`'s existing methods that return a `Payment` (list, findOne, create-response) already load the parent `Invoice` row to update `balanceDue` — no new query is introduced. The serialized Payment response gains a `currency` field populated from that already-loaded `invoice.currency`. `packages/types`' `Payment`-adjacent shared type (if one exists) gains `currency: string` as a response-only field; the DTOs accepting Payment *input* (recording a payment) are unchanged — currency is never submitted by the client for a Payment.

## `formatMoney` core change (both frontends)

`apps/admin-dashboard/src/lib/format.ts` and `apps/customer-portal/src/lib/format.ts` — `formatMoney` (and by extension `formatDollars`, which delegates to it) gains an options field:

```ts
export function formatMoney(
  value: number | string | null | undefined,
  opts: { decimals?: number; currency?: string } = {},
): string {
  const decimals = opts.decimals ?? 2
  const currency = opts.currency || activeCurrency
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(toNumber(value))
  } catch {
    return `$${toNumber(value).toFixed(decimals)}`
  }
}
```

`opts.currency` omitted → byte-for-byte identical behavior to today (falls through to the module-level `activeCurrency`). Every existing call site across both apps continues to compile and behave unchanged; this is purely additive. B2's job is entirely about *adding* `{ currency: record.currency }` at call sites that now have a specific record's currency to pass — Dashboard/Analytics aggregate KPIs deliberately keep calling `formatMoney(total)` with no override, since those are sums across potentially-mixed-currency records and this initiative does not do cross-currency conversion.

## Testing

- **job-service (Jest):** `JobsService` — creating a job without `currency` resolves the tenant default via the mocked `company-settings.client.ts`; an explicit `currency` in the DTO is respected and returned unchanged.
- **finance-service (Jest):** `QuotesService` — same default-fallback/explicit-value pattern for quotes. `QuotesService.convertToInvoice` — a dedicated test asserting the created invoice's `currency` equals the source quote's `currency`, using a quote whose currency differs from the (mocked) current tenant default, to prove it's inheritance and not a fresh lookup. `InvoicesService` — same default-fallback/explicit-value pattern for standalone invoice creation. `PaymentsService` — a returned Payment's `currency` matches its parent invoice's `currency`.
- **Migration verification:** after backfill, spot-check (via a raw query joining `companies`) that every existing Job/Quote/Invoice/RecurringSchedule row's `currency` equals its own company's `Company.currency` as of migration time — same verification pattern used in Sub-project A.
- **Frontend:** no existing test harness for `lib/format.ts` in either app (per repo convention, `tsc -b` via `build` is the type check) — verification is `pnpm --filter admin-dashboard build` / `pnpm --filter customer-portal build` clean, plus a manual confirmation that `formatMoney(100, { currency: 'LKR' })` renders `Rs 100.00` while `formatMoney(100)` is unchanged from current output.

## Out of scope (deferred to Sub-project B2)

- Every currency dropdown on Job/Quote/Invoice creation and edit forms, in both frontends.
- Updating list/detail-view `formatMoney` call sites (Jobs list, Finance quotes/invoices, Customer JobsTab, Agreements, JobDetailModal/QuoteDetailModal/InvoiceDetailModal, and customer-portal's equivalents) to pass each record's own `currency`.
- Tax-rate and payment-terms preset dropdowns replacing the freeform inputs in `AddQuoteModal`/`AddInvoiceModal`.
- Replacing `convertToInvoice`'s hardcoded `dueDate.setDate(dueDate.getDate() + 30)` with the tenant's default payment-terms preset (from Sub-project A).
- Validating a chosen `currency` against the tenant's `enabledCurrencies` list server-side (the dropdown built in B2 is the enforcement point; the backend stays lenient in this pass, matching `Company.currency`'s existing lenient validation).
- Any RecurringSchedule UI.
