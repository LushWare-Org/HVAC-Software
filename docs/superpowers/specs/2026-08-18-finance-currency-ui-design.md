# Finance Module Currency/Tax/Terms UI Wiring — Design Spec

**Status:** Approved for planning
**Sub-project:** B2 of 2 (multi-currency initiative, final phase)
**Depends on:** Sub-project A (`2026-08-18-tenant-finance-settings-design.md` — currency list, tax-rate presets, payment-terms presets) and Sub-project B1 (`2026-08-18-per-record-currency-backend-design.md` — `Quote`/`Invoice.currency` columns, tenant-default fallback, quote→invoice currency inheritance, Payment's read-only currency, `formatMoney`'s per-value override). Both are complete and merged.
**Feeds into:** nothing — this is the final phase of the multi-currency initiative.

## Problem

Sub-projects A and B1 built the entire data and configuration layer — tenant currency lists, tax-rate presets, payment-terms presets, per-record `currency` columns, and a `formatMoney` that can format any value in any currency. None of it is visible or usable yet: `AddQuoteModal`/`AddInvoiceModal` still show a freeform "Tax Rate (%)" number input (hardcoded default `"10"`) and, for invoices, a raw date picker with no payment-terms concept; neither modal has a currency selector at all; every list and detail view still calls `formatMoney`/its local wrappers with no currency argument, so every amount displays in the tenant's single global default regardless of what currency the underlying record actually carries.

## Scope decisions (confirmed with product owner this session)

- **Job is out of scope entirely.** Investigation during this session found `Job.estimatedValue` (the field B1 added `currency` to) has no editing UI anywhere in admin-dashboard — its only UI reference is a *lead* recommendation signal, not the job record. `JobDetailModal`'s `job.estimatedAmount`/`job.finalAmount` fields referenced in JSX don't exist on the job-service backend at all (that UI permanently renders "—"). There is no real amount-editing surface to attach a currency dropdown to. `Job.currency` stays backend-only, ready for whenever real job-pricing UI gets built.
- **B2 is Quote/Invoice/Payment UI only**, across both admin-dashboard and customer-portal.
- **Detail-modal wrapper simplification**: `QuoteDetailModal`, `InvoiceDetailModal`, and `PayInvoiceModal` (both apps) each hold exactly one quote/invoice for their entire body already, through a single local `fmtMoney`/`fmtDecimal` wrapper function used at every call site inside that file. Rather than touching each call site individually, each wrapper is updated once to close over that record's `currency` — every call site inside gets the right currency for free.
- **List views need per-row wiring**: `Finance.tsx` (admin-dashboard), `Invoices.tsx` and `Quotes.tsx` (customer-portal) share one wrapper across many rows with different currencies, so only the genuine per-row amount cells get an explicit `currency` argument.
- **Aggregate/total call sites are explicitly excluded** — "TOTAL" table-footer rows, CSV export totals, and portal stat-cards (Total Paid, Pending, Overdue, Accepted Value) sum across potentially-mixed-currency records. Per the "no exchange-rate conversion" rule established in Sub-project A, these keep formatting in the tenant default — converting them to a real multi-currency rollup is out of scope for this initiative.
- **Manual override stays available** for both tax rate and payment terms, per Sub-project A's original design promise — the preset dropdowns get a "Custom…" escape hatch that reveals the pre-existing freeform input, rather than removing that flexibility.
- **The linked-quote invoice path in `AddInvoiceModal` gets no independent currency selector.** When `linkedQuoteId` is set, submission calls `convertQuote.mutate()` directly (the existing `POST /finance/quotes/:id/convert-to-invoice` route), which — per B1 — already inherits the quote's currency server-side. Showing a currency dropdown the user could set to something different would misrepresent what actually happens; the dropdown is hidden/disabled in that mode.

## UI changes — admin-dashboard

### `AddQuoteModal.tsx`

- New `currency` state, initialized from `useCurrencies().data?.default` once loaded (via a `useEffect` keyed on the query settling, matching this file's existing pattern for defaulting `templateId`). A `<select>` next to the existing Tax Rate field lists `useCurrencies().data?.enabled` as options.
- The freeform "Tax Rate (%)" input is replaced with a `<select>` (`taxRatePresetId` state) populated from `useTaxRates().data` filtered to `isActive`, each option labeled `"{name} ({rate * 100}%)"`, defaulting to the preset where `isDefault === true`. The list's last option is `"Custom…"`; selecting it reveals the pre-existing freeform `taxRate` input unchanged. The numeric rate actually submitted (`(parseFloat(taxRate) || 0) / 100` today) is derived from the selected preset's `rate` unless "Custom…" is active, in which case the freeform value is used exactly as today.
- `createQuote.mutate({ ..., currency, taxRate: resolvedTaxRateFraction, ... })` — `currency` is a new field on the submitted payload; `taxRate`'s computation changes but its type/units (decimal fraction) stay identical to today.

### `AddInvoiceModal.tsx`

- Same `currency` state/dropdown as `AddQuoteModal`, with one difference: rendered disabled (or hidden entirely, whichever reads cleaner given the existing linked-quote UI block) whenever `linkedQuoteId` is truthy, with a short inline note ("Inherits the quotation's currency") replacing it in that state.
- Same tax-rate preset dropdown pattern as `AddQuoteModal`.
- The raw "Due Date" date input is replaced with a `<select>` (`paymentTermsPresetId` state) populated from `usePaymentTerms().data` filtered to `isActive`, each option labeled `"{name} ({days} days)"` (or `"{name} (Due on Receipt)"` when `days === 0`), defaulting to the tenant's default preset. Selecting a preset computes `dueDate = today + preset.days` (client-side, using the same date-math convention `date-fns`-free approach already used elsewhere in this repo, i.e. plain `Date` arithmetic). The list's last option is `"Custom date…"`, which reveals the pre-existing raw date picker unchanged.
- Both new dropdowns are hidden/disabled in the linked-quote submission path for the same reason as the currency dropdown — a converted invoice's due date and currency are both determined server-side from the quote (currency already, per B1; due date is not currently inherited from anything on conversion — see the backend change below, which only affects the *tenant default* used for standalone invoices, not quote conversions).

## Backend change — `convertToInvoice`'s hardcoded due date

`apps/finance-service/src/company-settings/company-settings.client.ts` gains a new method:

```ts
async getDefaultPaymentTermsDays(companyId: string): Promise<number> {
  try {
    const res = await fetch(`${CRM_SERVICE_URL}/company/payment-terms`, {
      headers: this.authHeaders(companyId),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`crm responded ${res.status}`);
    const presets = (await res.json()) as Array<{ isDefault: boolean; days: number }>;
    return presets.find((p) => p.isDefault)?.days ?? 30;
  } catch (err) {
    this.logger.warn(`payment-terms fetch failed for ${companyId}, using 30 days: ${(err as Error).message}`);
    return 30;
  }
}
```

`QuotesService.convertToInvoice` replaces its hardcoded `dueDate.setDate(dueDate.getDate() + 30)` with `dueDate.setDate(dueDate.getDate() + (await this.companySettings.getDefaultPaymentTermsDays(companyId)))`. This affects only the *tenant's default terms* used when converting a quote to an invoice — it does not touch `InvoicesService.create`'s existing `dueDays = 30` default for standalone invoices in this pass (that default becomes the payment-terms preset dropdown's job in the frontend above, which sends an explicit `dueDate` — the backend default only matters when no dropdown value is sent at all, an edge case not worth a second wiring point in the same spec).

## Per-record currency display

### Detail modals (wrapper-level fix — 5 files)

**Customer-portal** (`QuoteDetailModal.tsx`, `InvoiceDetailModal.tsx`, `PayInvoiceModal.tsx`) already each have a local wrapper (`fmtMoney`) used at every money call site in the file. Each is changed from:

```ts
function fmtMoney(value?: string | number) {
  return formatMoney(value)
}
```

to:

```ts
function fmtMoney(value?: string | number) {
  return formatMoney(value, { currency: quote.currency })  // or invoice.currency, matching whichever record the file holds
}
```

No call site inside these three files changes — line items, subtotal, tax, total, amount-paid, and outstanding-balance all inherit the fix automatically.

**Admin-dashboard** (`QuoteDetailModal.tsx`, `InvoiceDetailModal.tsx`) call `formatMoney` **directly** at every site today — no local wrapper exists in either file (confirmed by grep: `QuoteDetailModal.tsx` has 1 direct call, `InvoiceDetailModal.tsx` has 6). This spec introduces one, matching the customer-portal convention:

```ts
// QuoteDetailModal.tsx — added once, near the top of the component body, once `q` is known non-null
const fmtMoney = (value: number) => formatMoney(value, { currency: q!.currency })
```

```ts
// InvoiceDetailModal.tsx — added once, near the top of the component body, once `invoice`/`inv` is known
const fmtMoney = (value: number) => formatMoney(value, { currency: invoice.currency })
```

Every existing `formatMoney(decimalToNumber(...))` call site in these two files is changed to `fmtMoney(decimalToNumber(...))` — this includes `InvoiceDetailModal`'s payment-history line (`p.amount`); since `payment.currency` equals `invoice.currency` by construction (B1), using the invoice's currency there is equivalent and avoids threading a second value through props that aren't otherwise needed.

### List views (per-row fix — 3 files)

- `apps/admin-dashboard/src/pages/finance/Finance.tsx`: `fmtDecimal` gains an optional second parameter — `function fmtDecimal(val, currency?: string)`, passing `currency` through to `formatMoney`'s `opts.currency` when provided. The per-row cells `fmtDecimal(inv.total)` → `fmtDecimal(inv.total, inv.currency)` (line ~451) and `fmtDecimal(q.total)` → `fmtDecimal(q.total, q.currency)` (line ~604). Every other `fmtDecimal(...)` call site (CSV export rows, "TOTAL" footer rows, expense amounts) is left unchanged — expenses were never in scope for currency (no `Expense.currency` column exists), and totals are deliberately tenant-default per the aggregate exclusion above.
- `apps/customer-portal/src/pages/invoices/Invoices.tsx`: same pattern — `fmtMoney` gains an optional `currency` param; the per-row cell (`fmtMoney(outstanding > 0 ? outstanding : invoice.total)`) becomes `fmtMoney(outstanding > 0 ? outstanding : invoice.total, invoice.currency)`. Stat-card totals unchanged.
- `apps/customer-portal/src/pages/quotes/Quotes.tsx`: same pattern — the per-row cell (`fmtMoney(quote.total)`) becomes `fmtMoney(quote.total, quote.currency)`. The "Accepted Value" stat-card total unchanged.

## Testing

- **finance-service (Jest):** `CompanySettingsClient.getDefaultPaymentTermsDays` — returns the default preset's days on success, falls back to 30 on fetch failure and on an empty/no-default preset list (mirroring the existing `getSettings` fail-open test pattern). `QuotesService.convertToInvoice` — a new test asserting the created invoice's `dueDate` reflects a non-30 mocked default (e.g. 15 days) rather than the old hardcoded value, proving the wiring actually replaced the constant rather than just adding an unused code path.
- **Frontend:** no existing test harness for these page-level components (per repo convention, `tsc -b` via `build` is the type check) — verification is `pnpm --filter admin-dashboard build` / `pnpm --filter customer-portal build` clean, plus a manual pass: create a quote/invoice in a non-default currency and confirm every downstream view (list row, detail modal, payment record) displays that currency's symbol, not the tenant default; confirm the tax-rate and payment-terms dropdowns' "Custom…" escape hatches still work exactly as the old freeform inputs did; confirm the linked-quote invoice path hides its currency/terms dropdowns and still produces an invoice with the quote's currency.

## Out of scope

- Any Job/JobDetailModal/AddJobModal change (see scope decision above).
- Server-side validation of a submitted `currency` against the tenant's `enabledCurrencies` list (the dropdown is the enforcement point, same lenient-backend decision as B1).
- Converting Dashboard/Analytics/Marketing aggregate KPIs, or Finance's own "TOTAL" rows and CSV exports, to any currency-aware or multi-currency-rollup treatment.
- `Expense` currency (no column exists; was never in scope for this initiative).
- Customer JobsTab / Agreements list currency display (explicitly declined by the product owner this session).
