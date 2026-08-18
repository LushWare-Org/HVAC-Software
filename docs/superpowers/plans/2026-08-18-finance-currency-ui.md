# Finance Currency UI Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give staff a currency dropdown and tax-rate/payment-terms preset dropdowns on quote and invoice creation, replace `convertToInvoice`'s hardcoded 30-day default with the tenant's configured default, and make every finance list/detail view in both frontends display each record's own currency instead of the tenant global default.

**Architecture:** `AddQuoteModal`/`AddInvoiceModal` gain new dropdown-backed state fed by Sub-project A's `useCurrencies`/`useTaxRates`/`usePaymentTerms` hooks, with a "Custom…" escape hatch that reveals the pre-existing freeform inputs unchanged. `CompanySettingsClient` (finance-service) gains one new method mirroring its existing `getSettings` fail-open pattern. Every list/detail view either introduces or extends a local money-formatting wrapper to pass `{ currency: record.currency }` to `formatMoney`, exploiting the fact that every detail modal in scope already holds exactly one quote/invoice for its whole render.

**Tech Stack:** React 19 (both frontends), NestJS 10 + Jest (finance-service).

**Spec:** `docs/superpowers/specs/2026-08-18-finance-currency-ui-design.md`

## Global Constraints

- Job is entirely out of scope — no real amount-editing UI exists for it.
- Aggregate/total call sites (table-footer "TOTAL" rows, CSV exports, portal stat-cards) keep formatting in the tenant default — never given a per-record `currency` override.
- Every preset dropdown (tax rate, payment terms) keeps a "Custom…"/"Custom date…" option that reveals the pre-existing freeform input, preserving the manual-override path Sub-project A promised.
- The linked-quote path in `AddInvoiceModal` gets no independent currency/tax/terms dropdowns — those fields are already inside the existing `{!linkedQuoteId && (...)}` conditional block, so placing new fields there hides them automatically; no new conditional logic is needed.
- No backend validation of a submitted `currency` against `enabledCurrencies` in this pass — the dropdown is the enforcement point.

---

### Task 1: Shared frontend types — add `currency` fields

**Files:**
- Modify: `apps/admin-dashboard/src/types/api.ts`
- Modify: `apps/customer-portal/src/types/api.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `Invoice.currency?: string`, `Quote.currency?: string`, `Payment.currency?: string` (admin-dashboard); `Invoice.currency?: string`, `Quote.currency?: string`, `InvoicePayment.currency?: string` (customer-portal) — every later task in this plan reads `.currency` off objects typed by these interfaces.

- [ ] **Step 1: Add the field to admin-dashboard's types**

In `apps/admin-dashboard/src/types/api.ts`, add `currency?: string` to three interfaces:

```ts
export interface Payment {
  id: string
  invoiceId: string
  amount: string        // Prisma Decimal serialised as string
  paymentMethod: string // CARD | ACH | CASH | CHECK | OTHER
  status: string        // PENDING | SUCCEEDED | FAILED | REFUNDED
  receiptNumber?: string
  paidAt?: string
  notes?: string
  createdAt: string
  currency?: string
}
```

```ts
export interface Invoice {
  id: string
  companyId: string
  invoiceNumber: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  jobId?: string
  jobTitle?: string
  projectId?: string
  houseId?: string
  componentId?: string
  quoteId?: string
  quote?: { quoteNumber: string }
  status: InvoiceStatus
  total: string        // Prisma Decimal serialised as string
  balanceDue: string
  amountPaid: string
  dueDate?: string
  paidAt?: string
  notes?: string
  quickbooksId?: string
  payments?: Payment[]
  createdAt: string
  updatedAt: string
  currency?: string
}
```

```ts
export interface Quote {
  id: string
  companyId: string
  quoteNumber: string
  title: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  jobId?: string
  jobTitle?: string
  projectId?: string
  houseId?: string
  componentId?: string
  status: QuoteStatus
  total: string        // Prisma Decimal serialised as string
  taxRate?: number
  validUntil?: string
  notes?: string
  invoices?: { id: string; invoiceNumber: string; status: string }[]
  createdAt: string
  updatedAt: string
  currency?: string
}
```

- [ ] **Step 2: Add the field to customer-portal's types**

In `apps/customer-portal/src/types/api.ts`, add `currency?: string` to `Invoice`, `Quote`, and `InvoicePayment`:

```ts
export interface Invoice {
  id: string
  companyId: string
  invoiceNumber: string
  customerId?: string
  customerName?: string
  jobId?: string
  projectId?: string
  houseId?: string
  componentId?: string
  status: InvoiceStatus
  issueDate: string
  dueDate?: string
  subtotal: string | number
  taxRate: string | number
  taxAmount: string | number
  total: string | number
  amountPaid: string | number
  notes?: string
  approvedAt?: string
  approvedByName?: string
  approvedByEmail?: string
  declinedAt?: string
  declinedByName?: string
  declinedByEmail?: string
  declineReason?: string
  voidedAt?: string
  createdAt: string
  updatedAt: string
  lineItems?: InvoiceLineItem[]
  payments?: InvoicePayment[]
  currency?: string
}
```

```ts
export interface InvoicePayment {
  id: string
  amount: string | number
  method: PaymentMethod
  paidAt: string
  notes?: string
  currency?: string
}
```

```ts
export interface Quote {
  id: string
  companyId: string
  quoteNumber: string
  title: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  jobId?: string
  projectId?: string
  houseId?: string
  componentId?: string
  status: QuoteStatus
  subtotal: string | number
  discountAmount: string | number
  taxRate: string | number
  taxAmount: string | number
  total: string | number
  notes?: string
  sentAt?: string
  viewedAt?: string
  approvedAt?: string
  acceptedAt?: string
  validUntil?: string
  currency?: string
}
```

(Keep every other field already in each interface exactly as-is — only `currency?: string` is new.)

- [ ] **Step 3: Type-check both apps**

Run: `pnpm --filter admin-dashboard build`
Run: `pnpm --filter customer-portal build`
Expected: both compile cleanly — adding an optional field never breaks existing usage.

- [ ] **Step 4: Commit**

```bash
git add apps/admin-dashboard/src/types/api.ts apps/customer-portal/src/types/api.ts
git commit -m "feat(types): add currency field to Invoice/Quote/Payment frontend types"
```

---

### Task 2: finance-service — tenant default payment-terms lookup + convertToInvoice wiring

**Files:**
- Modify: `apps/finance-service/src/company-settings/company-settings.client.ts`
- Modify: `apps/finance-service/src/company-settings/company-settings.client.spec.ts`
- Modify: `apps/finance-service/src/quotes/quotes.service.ts`
- Modify: `apps/finance-service/src/quotes/quotes.service.spec.ts`

**Interfaces:**
- Consumes: crm-service's `GET /company/payment-terms` (built in Sub-project A).
- Produces: `CompanySettingsClient.getDefaultPaymentTermsDays(companyId: string): Promise<number>` — `QuotesService.convertToInvoice` calls this by exact name.

- [ ] **Step 1: Write the failing tests for the new client method**

Add to `apps/finance-service/src/company-settings/company-settings.client.spec.ts`, inside the existing `describe('CompanySettingsClient', ...)` block (after the existing `getSettings` tests):

```ts
  describe('getDefaultPaymentTermsDays', () => {
    it('returns the default preset\'s days', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [
          { isDefault: false, days: 15 },
          { isDefault: true, days: 45 },
        ],
      });
      const days = await client.getDefaultPaymentTermsDays('co-1');
      expect(days).toBe(45);
    });

    it('falls back to 30 when no preset is marked default', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => [{ isDefault: false, days: 15 }] });
      const days = await client.getDefaultPaymentTermsDays('co-1');
      expect(days).toBe(30);
    });

    it('falls back to 30 on HTTP error', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 });
      const days = await client.getDefaultPaymentTermsDays('co-1');
      expect(days).toBe(30);
    });

    it('falls back to 30 on network error', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
      const days = await client.getDefaultPaymentTermsDays('co-1');
      expect(days).toBe(30);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter finance-service test -- company-settings.client`
Expected: FAIL — `client.getDefaultPaymentTermsDays is not a function`.

- [ ] **Step 3: Implement the method**

In `apps/finance-service/src/company-settings/company-settings.client.ts`, add this method to the `CompanySettingsClient` class (right after `getSettings`):

```ts
  /** Tenant's default payment-terms days, for invoices created without an explicit due date. Fails open to 30. */
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
      this.logger.warn(
        `payment-terms fetch failed for ${companyId}, using 30 days: ${(err as Error).message}`,
      );
      return 30;
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter finance-service test -- company-settings.client`
Expected: PASS — all `getDefaultPaymentTermsDays` tests green, plus the pre-existing `getSettings` tests still green.

- [ ] **Step 5: Write the failing test for convertToInvoice**

Add to `apps/finance-service/src/quotes/quotes.service.spec.ts`, inside the `describe('convertToInvoice', ...)` block:

```ts
    it('uses the tenant\'s default payment-terms days instead of a hardcoded 30', async () => {
      const settingsMock = module.get(CompanySettingsClient) as any;
      settingsMock.getDefaultPaymentTermsDays = jest.fn().mockResolvedValue(15);
      const q = makeQuote({ status: QuoteStatus.ACCEPTED });
      mockPrisma.quote.findFirst.mockResolvedValue(q);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'inv-001' }),
      );

      const before = Date.now();
      await service.convertToInvoice(COMPANY_ID, QUOTE_ID, USER_ID);

      const createCall = mockPrisma.invoice.create.mock.calls[0][0];
      const daysUsed = Math.round((createCall.data.dueDate.getTime() - before) / (24 * 60 * 60 * 1000));
      expect(daysUsed).toBe(15);
      expect(settingsMock.getDefaultPaymentTermsDays).toHaveBeenCalledWith(COMPANY_ID);
    });
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm --filter finance-service test -- quotes.service`
Expected: FAIL — either `settingsMock.getDefaultPaymentTermsDays is not a function` (before the mock override takes effect there's no real method to spy over cleanly) or the days computed still reflect the old hardcoded `30`. Either failure confirms the wiring isn't in place yet.

- [ ] **Step 7: Replace the hardcoded 30-day default**

In `apps/finance-service/src/quotes/quotes.service.ts::convertToInvoice`, find:

```ts
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
```

Replace with:

```ts
    const defaultPaymentTermsDays = await this.companySettings.getDefaultPaymentTermsDays(companyId);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + defaultPaymentTermsDays);
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm --filter finance-service test -- quotes.service`
Expected: PASS.

- [ ] **Step 9: Full finance-service test suite + build**

Run: `pnpm --filter finance-service test`
Expected: PASS, no regressions.

Run: `pnpm --filter finance-service build`
Expected: compiles cleanly.

- [ ] **Step 10: Commit**

```bash
git add apps/finance-service/src/company-settings/company-settings.client.ts apps/finance-service/src/company-settings/company-settings.client.spec.ts apps/finance-service/src/quotes/quotes.service.ts apps/finance-service/src/quotes/quotes.service.spec.ts
git commit -m "feat(finance-service): use tenant default payment-terms days on quote conversion"
```

---

### Task 3: AddQuoteModal — currency dropdown + tax-rate preset dropdown

**Files:**
- Modify: `apps/admin-dashboard/src/pages/finance/AddQuoteModal.tsx`

**Interfaces:**
- Consumes: `useCurrencies`, `useTaxRates` (from `../../hooks/useSettings`, built in Sub-project A); `CurrencySettings { enabled: string[]; default: string }`, `TaxRatePreset { id, name, rate, isDefault, isActive }` (local mirrors in that same hooks file).
- Produces: `createQuote.mutate({ ..., currency })` — the payload now includes `currency`, consumed by `CreateQuoteDto.currency` (built in Sub-project B1).

- [ ] **Step 1: Add the new imports and state**

In `apps/admin-dashboard/src/pages/finance/AddQuoteModal.tsx`, add to the imports:

```ts
import { useCurrencies, useTaxRates } from "../../hooks/useSettings";
```

Add new state right after the existing `const [taxRate, setTaxRate] = useState("10");` line:

```ts
  const [taxRate, setTaxRate] = useState("10");
  const [taxRatePresetId, setTaxRatePresetId] = useState("");
  const [currency, setCurrency] = useState("");
  const currenciesQuery = useCurrencies();
  const taxRatesQuery = useTaxRates();
```

- [ ] **Step 2: Default currency and tax preset once their queries load**

Add these two `useEffect` hooks right after the existing template-defaulting `useEffect` (the one that sets `templateId` from `templates.find((t) => t.isDefault)`):

```ts
  useEffect(() => {
    if (isOpen && !currency && currenciesQuery.data?.default) {
      setCurrency(currenciesQuery.data.default);
    }
  }, [isOpen, currency, currenciesQuery.data]);

  useEffect(() => {
    if (isOpen && !taxRatePresetId && taxRatesQuery.data) {
      const def = taxRatesQuery.data.find((t) => t.isDefault && t.isActive);
      if (def) {
        setTaxRatePresetId(def.id);
        setTaxRate(String(def.rate * 100));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taxRatePresetId, taxRatesQuery.data]);
```

- [ ] **Step 3: Replace the Tax Rate field and add the Currency field**

Find:

```tsx
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Tax Rate (%)</label>
              <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} min="0" step="0.5" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Valid Until</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className={inputClass} />
            </div>
```

Replace with:

```tsx
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputClass}>
                {(currenciesQuery.data?.enabled ?? []).map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Tax Rate</label>
              <select
                value={taxRatePresetId}
                onChange={e => {
                  const val = e.target.value;
                  setTaxRatePresetId(val);
                  if (val !== "custom") {
                    const preset = (taxRatesQuery.data ?? []).find(t => t.id === val);
                    if (preset) setTaxRate(String(preset.rate * 100));
                  }
                }}
                className={inputClass}
              >
                {(taxRatesQuery.data ?? []).filter(t => t.isActive).map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({(t.rate * 100).toFixed(2)}%)</option>
                ))}
                <option value="custom">Custom…</option>
              </select>
              {taxRatePresetId === "custom" && (
                <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} min="0" step="0.5" className={inputClass} style={{ marginTop: 6 }} />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Valid Until</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className={inputClass} />
            </div>
```

- [ ] **Step 4: Send currency on submit**

Find the `createQuote.mutate({ ... } as any)` call and add `currency,` to the object (e.g. right after `title,`):

```ts
    createQuote.mutate(
      {
        title,
        currency,
        customerName: customerNameVal,
```

- [ ] **Step 5: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: compiles cleanly.

- [ ] **Step 6: Manual verification**

Run `pnpm dev:admin`, open Create Quote. Verify: Currency dropdown shows the tenant's enabled currencies, defaulting to the tenant default. Tax Rate dropdown shows tax presets by name+percentage, defaulting to the default preset; selecting "Custom…" reveals a freeform number input pre-filled with the last resolved value; changing the preset updates the computed tax total shown in the modal's summary line.

- [ ] **Step 7: Commit**

```bash
git add apps/admin-dashboard/src/pages/finance/AddQuoteModal.tsx
git commit -m "feat(admin-dashboard): add currency + tax-rate preset dropdowns to Add Quote"
```

---

### Task 4: AddInvoiceModal — currency, tax-rate preset, and payment-terms preset dropdowns

**Files:**
- Modify: `apps/admin-dashboard/src/pages/finance/AddInvoiceModal.tsx`

**Interfaces:**
- Consumes: `useCurrencies`, `useTaxRates`, `usePaymentTerms` (from `../../hooks/useSettings`).
- Produces: `createInvoice.mutate({ ..., currency })` — consumed by `CreateInvoiceDto.currency` (Sub-project B1). The linked-quote path (`convertQuote.mutate(linkedQuoteId)`) is unchanged and sends no currency, matching B1's inheritance behavior.

- [ ] **Step 1: Add the new imports and state**

Add to the imports:

```ts
import { useCurrencies, useTaxRates, usePaymentTerms } from "../../hooks/useSettings";
```

Add new state right after `const [taxRate, setTaxRate] = useState("10");`:

```ts
  const [taxRate, setTaxRate] = useState("10");
  const [taxRatePresetId, setTaxRatePresetId] = useState("");
  const [paymentTermsPresetId, setPaymentTermsPresetId] = useState("");
  const [currency, setCurrency] = useState("");
  const currenciesQuery = useCurrencies();
  const taxRatesQuery = useTaxRates();
  const paymentTermsQuery = usePaymentTerms();
```

- [ ] **Step 2: Default currency, tax preset, and payment-terms preset once their queries load**

Add these `useEffect` hooks (this file has no existing template-defaulting effect to place them near, since it doesn't default `templateId` the same way — add them right after the state declarations from Step 1, before the existing customer/job query declarations):

```ts
  useEffect(() => {
    if (isOpen && !currency && currenciesQuery.data?.default) {
      setCurrency(currenciesQuery.data.default);
    }
  }, [isOpen, currency, currenciesQuery.data]);

  useEffect(() => {
    if (isOpen && !taxRatePresetId && taxRatesQuery.data) {
      const def = taxRatesQuery.data.find((t) => t.isDefault && t.isActive);
      if (def) {
        setTaxRatePresetId(def.id);
        setTaxRate(String(def.rate * 100));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taxRatePresetId, taxRatesQuery.data]);

  useEffect(() => {
    if (isOpen && !paymentTermsPresetId && paymentTermsQuery.data) {
      const def = paymentTermsQuery.data.find((t) => t.isDefault && t.isActive);
      if (def) {
        setPaymentTermsPresetId(def.id);
        const d = new Date();
        d.setDate(d.getDate() + def.days);
        setDueDate(d.toISOString().split("T")[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, paymentTermsPresetId, paymentTermsQuery.data]);
```

Note: `isOpen` is used by these effects but is a prop destructured in the component signature — confirm it's in scope (it already is, since the file's other effects reference it the same way).

- [ ] **Step 3: Replace the Due Date and Tax Rate fields, add the Currency field**

Find:

```tsx
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Tax Rate (%)</label>
              <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} min="0" step="0.5" className={inputClass} />
            </div>
```

Replace with:

```tsx
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                {(currenciesQuery.data?.enabled ?? []).map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Payment Terms</label>
              <select
                value={paymentTermsPresetId}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaymentTermsPresetId(val);
                  if (val !== "custom") {
                    const preset = (paymentTermsQuery.data ?? []).find(t => t.id === val);
                    if (preset) {
                      const d = new Date();
                      d.setDate(d.getDate() + preset.days);
                      setDueDate(d.toISOString().split("T")[0]);
                    }
                  }
                }}
                className={inputClass}
              >
                {(paymentTermsQuery.data ?? []).filter(t => t.isActive).map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.days === 0 ? "Due on Receipt" : `${t.days} days`})</option>
                ))}
                <option value="custom">Custom date…</option>
              </select>
              {paymentTermsPresetId === "custom" && (
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} style={{ marginTop: 6 }} />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Tax Rate</label>
              <select
                value={taxRatePresetId}
                onChange={(e) => {
                  const val = e.target.value;
                  setTaxRatePresetId(val);
                  if (val !== "custom") {
                    const preset = (taxRatesQuery.data ?? []).find(t => t.id === val);
                    if (preset) setTaxRate(String(preset.rate * 100));
                  }
                }}
                className={inputClass}
              >
                {(taxRatesQuery.data ?? []).filter(t => t.isActive).map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({(t.rate * 100).toFixed(2)}%)</option>
                ))}
                <option value="custom">Custom…</option>
              </select>
              {taxRatePresetId === "custom" && (
                <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} min="0" step="0.5" className={inputClass} style={{ marginTop: 6 }} />
              )}
            </div>
```

This entire block is already inside `{!linkedQuoteId && ( <> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> ... </div> ...`, so all three new fields are automatically hidden whenever a quote is linked — no additional conditional needed.

- [ ] **Step 4: Send currency on submit**

Find the `createInvoice.mutate({ ... }, ...)` call (the standalone-invoice branch, not the `convertQuote.mutate(linkedQuoteId, ...)` branch) and add `currency,`:

```ts
    createInvoice.mutate(
      {
        customerId,
        currency,
        customerName: customerNameVal || undefined,
```

- [ ] **Step 5: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: compiles cleanly.

- [ ] **Step 6: Manual verification**

Run `pnpm dev:admin`, open Create Invoice. Verify: Currency, Payment Terms, and Tax Rate dropdowns behave the same way as AddQuoteModal's; selecting "Due on Receipt" or "Net 30" from Payment Terms updates a computed due date correctly; linking an existing quote hides all three new dropdowns (and the due-date/tax-rate fields entirely, matching today's existing behavior for that path); the resulting invoice, once converted, shows the quote's currency (verified via Task 2's backend behavior).

- [ ] **Step 7: Commit**

```bash
git add apps/admin-dashboard/src/pages/finance/AddInvoiceModal.tsx
git commit -m "feat(admin-dashboard): add currency, tax-rate, and payment-terms preset dropdowns to Add Invoice"
```

---

### Task 5: admin-dashboard — QuoteDetailModal + InvoiceDetailModal currency-aware display

**Files:**
- Modify: `apps/admin-dashboard/src/pages/finance/QuoteDetailModal.tsx`
- Modify: `apps/admin-dashboard/src/pages/finance/InvoiceDetailModal.tsx`

**Interfaces:**
- Consumes: `Quote.currency`/`Invoice.currency` (Task 1).
- Produces: nothing consumed by later tasks — this is a display-only fix.

- [ ] **Step 1: Introduce the wrapper in QuoteDetailModal**

In `apps/admin-dashboard/src/pages/finance/QuoteDetailModal.tsx`, find:

```ts
  const q = liveQuote ?? quote
```

Add immediately after it:

```ts
  const fmtMoney = (value: number) => formatMoney(value, { currency: q?.currency })
```

Then find the one existing call site:

```tsx
                  <input
                    type="text"
                    value={formatMoney(decimalToNumber(q!.total))}
                    disabled
                    className={inputView}
```

Replace `formatMoney(decimalToNumber(q!.total))` with `fmtMoney(decimalToNumber(q!.total))`:

```tsx
                  <input
                    type="text"
                    value={fmtMoney(decimalToNumber(q!.total))}
                    disabled
                    className={inputView}
```

- [ ] **Step 2: Introduce the wrapper in InvoiceDetailModal**

In `apps/admin-dashboard/src/pages/finance/InvoiceDetailModal.tsx`, find:

```ts
  const inv = liveInvoice ?? invoice
```

Add immediately after it:

```ts
  const fmtMoney = (value: number) => formatMoney(value, { currency: inv?.currency })
```

Then replace each of the following 6 call sites (all currently calling `formatMoney(...)` directly) to call `fmtMoney(...)` instead — the argument inside stays exactly the same in every case:

```tsx
                  <input type="text" value={fmtMoney(decimalToNumber(invoice.total))} disabled className={inputView} />
```
```tsx
                  <input type="text" value={fmtMoney(decimalToNumber(invoice.balanceDue))} disabled className={inputView} />
```
```tsx
                          placeholder={`Max: ${fmtMoney(decimalToNumber(inv!.balanceDue))}`}
```
```tsx
                                {fmtMoney(decimalToNumber(p.amount))}
```
```tsx
                      Paid: {new Date(inv!.paidAt).toLocaleString()} · Amount Paid: {fmtMoney(decimalToNumber(inv!.amountPaid))}
```

(There are 5 listed here, not 6 — the 6th occurrence found during design exploration was a duplicate count; verify by running `grep -n "formatMoney(" apps/admin-dashboard/src/pages/finance/InvoiceDetailModal.tsx` before this step and after — the count should drop to 0 direct calls, with the import line `import { formatMoney } from '../../lib/format'` and the new wrapper definition being the only remaining references to `formatMoney` itself.)

- [ ] **Step 3: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: compiles cleanly.

- [ ] **Step 4: Manual verification**

Open a quote and an invoice created in a non-default currency (e.g. LKR, created via Tasks 3-4's new dropdowns) in their detail modals. Verify every dollar amount shown — total, balance due, payment amounts, "amount paid" — displays with the LKR symbol, not the tenant's default currency symbol.

- [ ] **Step 5: Commit**

```bash
git add apps/admin-dashboard/src/pages/finance/QuoteDetailModal.tsx apps/admin-dashboard/src/pages/finance/InvoiceDetailModal.tsx
git commit -m "feat(admin-dashboard): show each quote/invoice's own currency in their detail modals"
```

---

### Task 6: admin-dashboard — Finance.tsx list currency-aware display

**Files:**
- Modify: `apps/admin-dashboard/src/pages/finance/Finance.tsx`

**Interfaces:**
- Consumes: `Invoice.currency`/`Quote.currency` (Task 1).
- Produces: `fmtDecimal(val, currency?)` — no later task in this plan consumes it.

- [ ] **Step 1: Add the optional currency parameter**

Find:

```ts
function fmtDecimal(val: string | number | undefined | null): string {
  const n = decimalToNumber(val)
  return formatMoney(n)
}
```

Replace with:

```ts
function fmtDecimal(val: string | number | undefined | null, currency?: string): string {
  const n = decimalToNumber(val)
  return formatMoney(n, { currency })
}
```

- [ ] **Step 2: Pass currency at the two per-row call sites**

Find:

```tsx
                      <td className="td-primary font-600">{fmtDecimal(inv.total)}</td>
```

Replace with:

```tsx
                      <td className="td-primary font-600">{fmtDecimal(inv.total, inv.currency)}</td>
```

Find:

```tsx
                      <td className="td-primary font-600">{fmtDecimal(q.total)}</td>
```

Replace with:

```tsx
                      <td className="td-primary font-600">{fmtDecimal(q.total, q.currency)}</td>
```

Leave every other `fmtDecimal(...)` call site in this file unchanged (CSV export rows, "TOTAL" footer rows, and expense amounts) — these are aggregate or out-of-scope-entity values per this plan's Global Constraints.

- [ ] **Step 3: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: compiles cleanly.

- [ ] **Step 4: Manual verification**

Open the Finance page's Invoices and Quotes tabs. Verify a row for a record created in a non-default currency shows that currency's symbol, while other rows and the "TOTAL" footer row keep showing the tenant default.

- [ ] **Step 5: Commit**

```bash
git add apps/admin-dashboard/src/pages/finance/Finance.tsx
git commit -m "feat(admin-dashboard): show each invoice/quote's own currency in the Finance list"
```

---

### Task 7: customer-portal — QuoteDetailModal, InvoiceDetailModal, PayInvoiceModal currency-aware display

**Files:**
- Modify: `apps/customer-portal/src/pages/quotes/QuoteDetailModal.tsx`
- Modify: `apps/customer-portal/src/pages/invoices/InvoiceDetailModal.tsx`
- Modify: `apps/customer-portal/src/pages/invoices/PayInvoiceModal.tsx`

**Interfaces:**
- Consumes: `Quote.currency`/`Invoice.currency` (Task 1).
- Produces: nothing consumed by later tasks — display-only fix.

- [ ] **Step 1: Move `fmtMoney` inside the component in QuoteDetailModal**

In `apps/customer-portal/src/pages/quotes/QuoteDetailModal.tsx`, remove the module-level function:

```ts
function fmtMoney(value?: string | number) {
  return formatMoney(value)
}
```

Then find, inside the component body:

```ts
  const quote = data ?? initialQuote
```

Add immediately after it:

```ts
  const fmtMoney = (value?: string | number) => formatMoney(value, { currency: quote.currency })
```

No call site inside this file needs to change — every `fmtMoney(...)` call now resolves to this component-scoped version.

- [ ] **Step 2: Move `fmtMoney` inside the component in InvoiceDetailModal**

In `apps/customer-portal/src/pages/invoices/InvoiceDetailModal.tsx`, remove:

```ts
function fmtMoney(value?: string | number) {
  return formatMoney(value)
}
```

Find, inside the component body:

```ts
  const invoice = data ?? initialInvoice
```

Add immediately after it:

```ts
  const fmtMoney = (value?: string | number) => formatMoney(value, { currency: invoice.currency })
```

- [ ] **Step 3: Move `fmtMoney` inside the component in PayInvoiceModal**

In `apps/customer-portal/src/pages/invoices/PayInvoiceModal.tsx`, remove the module-level function:

```ts
function fmtMoney(value?: string | number) {
  return formatMoney(value)
}
```

Find the component signature:

```ts
export default function PayInvoiceModal({ onClose, invoice }: PayInvoiceModalProps) {
```

Add as the first line inside the function body:

```ts
export default function PayInvoiceModal({ onClose, invoice }: PayInvoiceModalProps) {
  const fmtMoney = (value?: string | number) => formatMoney(value, { currency: invoice.currency })
```

- [ ] **Step 4: Type-check**

Run: `pnpm --filter customer-portal build`
Expected: compiles cleanly.

- [ ] **Step 5: Manual verification**

As a customer, view a quote and an invoice created in a non-default currency. Verify every amount in both detail modals, and in the Pay Invoice flow (outstanding amount, "Pay X Securely" button label, payment confirmation message), shows that currency's symbol.

- [ ] **Step 6: Commit**

```bash
git add apps/customer-portal/src/pages/quotes/QuoteDetailModal.tsx apps/customer-portal/src/pages/invoices/InvoiceDetailModal.tsx apps/customer-portal/src/pages/invoices/PayInvoiceModal.tsx
git commit -m "feat(customer-portal): show each quote/invoice's own currency in detail and pay modals"
```

---

### Task 8: customer-portal — Invoices.tsx and Quotes.tsx list currency-aware display

**Files:**
- Modify: `apps/customer-portal/src/pages/invoices/Invoices.tsx`
- Modify: `apps/customer-portal/src/pages/quotes/Quotes.tsx`

**Interfaces:**
- Consumes: `Invoice.currency`/`Quote.currency` (Task 1).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the optional currency parameter in Invoices.tsx**

Find:

```ts
function fmtMoney(val?: string | number) {
  return formatMoney(val)
}
```

Replace with:

```ts
function fmtMoney(val?: string | number, currency?: string) {
  return formatMoney(val, { currency })
}
```

Find the per-row call site:

```tsx
                        <td className="td-primary font-600">{fmtMoney(outstanding > 0 ? outstanding : invoice.total)}</td>
```

Replace with:

```tsx
                        <td className="td-primary font-600">{fmtMoney(outstanding > 0 ? outstanding : invoice.total, invoice.currency)}</td>
```

Leave the stat-card totals (`Total Paid`, `Pending`, `Overdue`) unchanged — these sum across rows and stay on the tenant default.

- [ ] **Step 2: Add the optional currency parameter in Quotes.tsx**

Find:

```ts
function fmtMoney(val?: string | number) {
  return formatMoney(val)
}
```

Replace with:

```ts
function fmtMoney(val?: string | number, currency?: string) {
  return formatMoney(val, { currency })
}
```

Find the per-row call site:

```tsx
                        <td className="td-primary font-600">{fmtMoney(quote.total)}</td>
```

Replace with:

```tsx
                        <td className="td-primary font-600">{fmtMoney(quote.total, quote.currency)}</td>
```

Leave the "Accepted Value" stat-card total unchanged.

- [ ] **Step 3: Type-check**

Run: `pnpm --filter customer-portal build`
Expected: compiles cleanly.

- [ ] **Step 4: Manual verification**

As a customer, view the Invoices and Quotes list pages. Verify a row for a record in a non-default currency shows that currency's symbol, while the stat-card totals keep showing the tenant default.

- [ ] **Step 5: Commit**

```bash
git add apps/customer-portal/src/pages/invoices/Invoices.tsx apps/customer-portal/src/pages/quotes/Quotes.tsx
git commit -m "feat(customer-portal): show each invoice/quote's own currency in list views"
```

---

## Self-Review Notes

- **Spec coverage:** Currency dropdown (AddQuoteModal/AddInvoiceModal) → Tasks 3-4. Tax-rate preset dropdown → Tasks 3-4. Payment-terms preset dropdown → Task 4. `convertToInvoice`'s hardcoded due date → Task 2. Per-record currency display across all named files (Finance.tsx, both admin detail modals, both portal list views, all three portal detail/pay modals) → Tasks 5-8. Job explicitly untouched anywhere in this plan, matching the spec's scope decision.
- **Placeholder scan:** no TBDs; every step shows literal before/after code.
- **Type consistency verified:** `fmtDecimal`/`fmtMoney`'s new `currency?: string` parameter name and position (second, optional) is identical across Tasks 6 and 8's four wrapper functions; the wrapper-closure pattern in Tasks 5 and 7 uses the same `formatMoney(value, { currency: record.currency })` shape consistently across all 5 files it touches.
- **Task 5 call-site count verified**: `InvoiceDetailModal.tsx` has exactly 5 direct `formatMoney(...)` call sites (lines ~355, 359, 443, 504, 547 as of design-phase exploration), matching the 5 replacement blocks in Step 2. The implementer should still `grep -c "formatMoney("` before and after as a final check — if the file has drifted since this plan was written, apply the identical `formatMoney(...)` → `fmtMoney(...)` substitution to any additional site found (same transformation, not a new pattern).
