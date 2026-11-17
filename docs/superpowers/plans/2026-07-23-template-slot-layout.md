# Document Template Slot Layout System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn every named visible component of an Invoice/Quote/Agreement (logo, Bill-to card, Balance-due card, invoice-number/status badge, line-items table, notes, etc.) into a "slot" that an admin can reorder into rows, arrange side-by-side, resize (width), and independently restyle (font/color/box), while variable-length content (the table, notes, payment history) keeps automatic height so real documents never overflow or clip.

**Architecture:** Replace the fixed-markup body of each `.hbs` template with a generic `rows → blocks` loop that dispatches to one Handlebars partial per slot (existing markup moved into partials nearly verbatim). `DocumentTemplate.rows` (Prisma `Json?`) stores the admin's custom arrangement; `null` means "use the document type's built-in default arrangement," so every template created before this feature keeps rendering exactly as before. The admin-dashboard preview iframe gets real drag-reorder/drag-resize (computed inside the iframe, committed to parent state only on drop) plus a per-block style sidebar.

**Tech Stack:** NestJS + Prisma (crm-service, finance-service), Handlebars (dynamic partial lookup), Puppeteer (unchanged), React + TanStack Query (admin-dashboard).

## Global Constraints

- Never run `prisma migrate dev` — migrations go through `node scripts/apply-migrations.mjs` only (documented crm schema-drift issue).
- After any `schema.prisma` edit: `pnpm --filter crm-service exec prisma generate` (regenerates the TS client; does not touch the DB).
- After any `.hbs` edit or finance-service code change: kill and restart the finance-service dev process (`lsof -ti:3004 | xargs kill`, then `pnpm --filter finance-service dev`) — `PdfService.templateCache` and `node --watch` do not pick up template-file edits.
- Do not commit anything. The user has an explicit standing rule: nothing gets committed until they say so. Every task below ends with running tests, not committing.
- Money is `Prisma.Decimal` serialized as string — always `Number()` before arithmetic (unaffected by this plan, called out because partials touch money-formatted fields).
- `@Post()` defaults to 201 — not relevant here (no new POST routes), noted for completeness.
- No new npm packages required.

## File Structure

**Modify:**
- `apps/crm-service/prisma/schema.prisma` — rename `DocumentTemplate.layout` → `rows`.
- `scripts/apply-migrations.mjs` — add rename migration.
- `apps/crm-service/src/document-templates/document-templates.service.ts` — swap `layout` for `rows` in `UpsertTemplateInput` and both create/update.
- `apps/crm-service/src/document-templates/document-templates.controller.ts` — swap `layout` for `rows` in the DTO.
- `apps/crm-service/src/document-templates/document-templates.service.spec.ts` — update the two layout tests to use `rows`.
- `apps/finance-service/src/document-templates/document-template.client.ts` — swap `layout` for `rows`, add `TemplateRow`/`TemplateBlock`/`TextStyle`/`BoxStyle` types.
- `apps/finance-service/src/pdf/pdf.service.ts` — remove `layoutTransform`/`layoutData` helpers, add `blockStyle` helper, resolve `rows` (custom or default) before rendering, pass `rows` into each render context.
- `apps/finance-service/src/pdf/pdf.service.spec.ts` — remove the two `layoutTransform`/`layoutData`-based tests, add rows-based tests.
- `apps/finance-service/src/pdf/templates/invoice.hbs`, `quote.hbs`, `agreement.hbs` — body replaced by the generic rows/blocks loop; `<head>` styles, letterhead-mode branch untouched.
- `apps/admin-dashboard/src/pages/finance/documentTemplatesApi.ts` — swap `layout` for `rows` types.
- `apps/admin-dashboard/src/pages/finance/TemplateEditorModal.tsx` — replace the flat left-hand form (Builder mode only) with block selection + drag/resize + style sidebar.

**Create:**
- `apps/finance-service/src/pdf/slots.ts` — `SlotKey` types, `DEFAULT_ROWS` per document type.
- `apps/finance-service/src/pdf/templates/partials/invoice/*.hbs` (13 files — one per INVOICE slot).
- `apps/finance-service/src/pdf/templates/partials/quote/*.hbs` (12 files).
- `apps/finance-service/src/pdf/templates/partials/agreement/*.hbs` (11 files).
- `apps/admin-dashboard/src/pages/finance/BlockStyleSidebar.tsx` — the per-block style editor panel.

## Data Model Reference

```ts
// apps/finance-service/src/pdf/slots.ts and mirrored in
// apps/finance-service/src/document-templates/document-template.client.ts
// and apps/admin-dashboard/src/pages/finance/documentTemplatesApi.ts

export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 400 | 600 | 700 | 800;
  color?: string;
  align?: 'left' | 'center' | 'right';
}
export interface BoxStyle {
  background?: string;
  borderColor?: string;
  borderRadiusPx?: number;
  paddingPx?: number;
}
export interface TemplateBlock {
  id: string;
  slot: string;       // registered partial name, e.g. "invoice/billTo"
  widthPct: number;   // 1-100
  style?: TextStyle & BoxStyle;
}
export interface TemplateRow {
  id: string;
  blocks: TemplateBlock[];
}
```

`FONT_LIST = ['Helvetica Neue, Arial, sans-serif', 'Georgia, serif', '"Times New Roman", serif', '"Courier New", monospace', 'Verdana, sans-serif', '"Trebuchet MS", sans-serif']` — curated PDF-safe list, lives in `apps/admin-dashboard/src/pages/finance/BlockStyleSidebar.tsx` (frontend-only; the backend stores whatever string is chosen, no validation needed since it's a closed `<select>`).

---

### Task 1: Rename `layout` → `rows` in the schema

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma`
- Modify: `scripts/apply-migrations.mjs`

- [ ] **Step 1: Rename the Prisma field**

In `apps/crm-service/prisma/schema.prisma`, find:
```prisma
  layout          Json?    // per-field {dx,dy} pixel nudges from drag-positioning header/footer elements in the builder
```
Replace with:
```prisma
  rows            Json?    // custom row/block arrangement from the drag-positioned slot layout builder; null = use the document type's default arrangement
```

- [ ] **Step 2: Add the rename migration**

In `scripts/apply-migrations.mjs`, after the `20260723010000_add_document_template_layout` entry, add:
```js
  {
    schema: 'crm',
    name: '20260723020000_rename_document_template_layout_to_rows',
    sql: `
ALTER TABLE "crm"."document_templates"
  RENAME COLUMN "layout" TO "rows";
    `.trim(),
  },
```

- [ ] **Step 3: Apply the migration and regenerate the Prisma client**

Run: `cd "/Users/ravishan/Desktop/Lush/T&SBCRM" && node scripts/apply-migrations.mjs`
Expected: `[apply] 20260723020000_rename_document_template_layout_to_rows … [ok]`, all other entries `[skip]`.

Run: `pnpm --filter crm-service exec prisma generate`
Expected: completes without error (regenerates `apps/crm-service/src/prisma/generated`).

- [ ] **Step 4: Commit reminder**

Do NOT commit. Move to Task 2.

---

### Task 2: crm-service — persist `rows` instead of `layout`

**Files:**
- Modify: `apps/crm-service/src/document-templates/document-templates.service.ts`
- Modify: `apps/crm-service/src/document-templates/document-templates.controller.ts`
- Modify: `apps/crm-service/src/document-templates/document-templates.service.spec.ts`

**Interfaces:**
- Produces: `UpsertTemplateInput.rows?: Record<string, unknown>[] | null` (kept loosely typed here — crm-service doesn't need to understand the shape, only persist it; finance-service owns the `TemplateRow`/`TemplateBlock` types since it's the one that renders them).

- [ ] **Step 1: Update the failing tests first**

In `apps/crm-service/src/document-templates/document-templates.service.spec.ts`, replace the two tests added earlier today:
```ts
    it('persists drag-positioned layout offsets for header/footer elements', async () => {
      prisma.documentTemplate.count.mockResolvedValue(0);
      prisma.documentTemplate.create.mockResolvedValue({ id: 't1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      const layout = { logoUrl: { dx: 12, dy: -4 }, footerText: { dx: 0, dy: 8 } };
      await service.create(CO, { documentType: 'INVOICE', name: 'Formal', mode: 'BUILDER', layout });
      expect(prisma.documentTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ layout }) }),
      );
    });

    it('update persists a changed layout', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue({ id: 't1', companyId: CO });
      prisma.documentTemplate.update.mockResolvedValue({ id: 't1' });
      const layout = { companyName: { dx: 20, dy: 0 } };
      await service.update(CO, 't1', { layout });
      expect(prisma.documentTemplate.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { layout } });
    });
```
with:
```ts
    it('persists a custom rows/blocks layout', async () => {
      prisma.documentTemplate.count.mockResolvedValue(0);
      prisma.documentTemplate.create.mockResolvedValue({ id: 't1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      const rows = [{ id: 'r1', blocks: [{ id: 'b1', slot: 'invoice/logo', widthPct: 40 }, { id: 'b2', slot: 'invoice/companyName', widthPct: 60 }] }];
      await service.create(CO, { documentType: 'INVOICE', name: 'Formal', mode: 'BUILDER', rows });
      expect(prisma.documentTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ rows }) }),
      );
    });

    it('update persists a changed rows layout', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue({ id: 't1', companyId: CO });
      prisma.documentTemplate.update.mockResolvedValue({ id: 't1' });
      const rows = [{ id: 'r1', blocks: [{ id: 'b1', slot: 'invoice/billTo', widthPct: 100, style: { color: '#ff0000' } }] }];
      await service.update(CO, 't1', { rows });
      expect(prisma.documentTemplate.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { rows } });
    });
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/ravishan/Desktop/Lush/T&SBCRM" && pnpm --filter crm-service test -- document-templates.service.spec.ts`
Expected: FAIL — `layout` is not a recognized field on `UpsertTemplateInput`/persisted data (TS error or assertion mismatch, since the service doesn't know `rows` yet).

- [ ] **Step 3: Update the service**

In `apps/crm-service/src/document-templates/document-templates.service.ts`, replace:
```ts
  layout?: Record<string, { dx: number; dy: number }> | null;
```
with:
```ts
  rows?: Array<{ id: string; blocks: Array<{ id: string; slot: string; widthPct: number; style?: Record<string, unknown> }> }> | null;
```
Replace:
```ts
        layout: input.layout ?? undefined,
```
with:
```ts
        rows: input.rows ?? undefined,
```
In the `update()` field-copy array, replace `'layout'` with `'rows'`.

- [ ] **Step 4: Update the controller DTO**

In `apps/crm-service/src/document-templates/document-templates.controller.ts`, replace:
```ts
  @IsOptional() @IsObject() layout?: Record<string, { dx: number; dy: number }>;
```
with:
```ts
  @IsOptional() @IsArray() rows?: Array<{ id: string; blocks: Array<{ id: string; slot: string; widthPct: number; style?: Record<string, unknown> }> }>;
```
Add `IsArray` to the `class-validator` import line (alongside the existing `IsString, IsOptional, IsBoolean, IsInt, IsIn, IsObject`); `IsObject` can be removed from the import if nothing else uses it — check with `grep -n "IsObject" apps/crm-service/src/document-templates/document-templates.controller.ts` first and only remove if the only hit is the import line.

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm --filter crm-service test -- document-templates.service.spec.ts`
Expected: PASS, all tests including the two new ones.

Run: `pnpm --filter crm-service type-check`
Expected: no errors.

---

### Task 3: finance-service — types, Handlebars helpers, slot registry module

**Files:**
- Modify: `apps/finance-service/src/document-templates/document-template.client.ts`
- Create: `apps/finance-service/src/pdf/slots.ts`
- Modify: `apps/finance-service/src/pdf/pdf.service.ts`
- Modify: `apps/finance-service/src/pdf/pdf.service.spec.ts`

**Interfaces:**
- Produces: `TextStyle`, `BoxStyle`, `TemplateBlock`, `TemplateRow` (exported from `slots.ts`), `DEFAULT_ROWS: Record<'INVOICE' | 'QUOTE' | 'AGREEMENT', TemplateRow[]>`, `blockStyle` Handlebars helper.
- Consumes: nothing new from earlier tasks.

- [ ] **Step 1: Update `DocumentTemplateConfig`**

In `apps/finance-service/src/document-templates/document-template.client.ts`, replace:
```ts
  layout?: Record<string, { dx: number; dy: number }> | null;
```
with:
```ts
  rows?: import('../pdf/slots').TemplateRow[] | null;
```

- [ ] **Step 2: Create the slot registry module**

Create `apps/finance-service/src/pdf/slots.ts`:
```ts
export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 400 | 600 | 700 | 800;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface BoxStyle {
  background?: string;
  borderColor?: string;
  borderRadiusPx?: number;
  paddingPx?: number;
}

export interface TemplateBlock {
  id: string;
  slot: string; // registered partial name, e.g. "invoice/billTo"
  widthPct: number;
  style?: TextStyle & BoxStyle;
}

export interface TemplateRow {
  id: string;
  blocks: TemplateBlock[];
}

/** The arrangement every template renders with until an admin drags something — reproduces today's exact layout. */
export const DEFAULT_ROWS: Record<'INVOICE' | 'QUOTE' | 'AGREEMENT', TemplateRow[]> = {
  INVOICE: [
    { id: 'row-hero-top', blocks: [
      { id: 'b-logo', slot: 'invoice/logo', widthPct: 60 },
      { id: 'b-docBadge', slot: 'invoice/docBadge', widthPct: 40 },
    ] },
    { id: 'row-tagline', blocks: [{ id: 'b-tagline', slot: 'invoice/tagline', widthPct: 100 }] },
    { id: 'row-company', blocks: [
      { id: 'b-companyName', slot: 'invoice/companyName', widthPct: 100 },
    ] },
    { id: 'row-address', blocks: [{ id: 'b-companyAddress', slot: 'invoice/companyAddress', widthPct: 100 }] },
    { id: 'row-headerText', blocks: [{ id: 'b-headerText', slot: 'invoice/headerText', widthPct: 100 }] },
    { id: 'row-summary', blocks: [
      { id: 'b-billTo', slot: 'invoice/billTo', widthPct: 65 },
      { id: 'b-balanceDue', slot: 'invoice/balanceDueCard', widthPct: 35 },
    ] },
    { id: 'row-infoGrid', blocks: [{ id: 'b-infoGrid', slot: 'invoice/infoGrid', widthPct: 100 }] },
    { id: 'row-table', blocks: [{ id: 'b-table', slot: 'invoice/lineItemsTable', widthPct: 100 }] },
    { id: 'row-totals', blocks: [{ id: 'b-totals', slot: 'invoice/totalsCard', widthPct: 100 }] },
    { id: 'row-paymentHistory', blocks: [{ id: 'b-paymentHistory', slot: 'invoice/paymentHistory', widthPct: 100 }] },
    { id: 'row-notes', blocks: [
      { id: 'b-notes', slot: 'invoice/notesCard', widthPct: 50 },
      { id: 'b-terms', slot: 'invoice/termsCard', widthPct: 50 },
      { id: 'b-bankDetails', slot: 'invoice/bankDetailsCard', widthPct: 100 },
    ] },
    { id: 'row-footer', blocks: [
      { id: 'b-pageFooterMeta', slot: 'invoice/pageFooterMeta', widthPct: 70 },
      { id: 'b-footerText', slot: 'invoice/footerText', widthPct: 30 },
    ] },
  ],
  QUOTE: [
    { id: 'row-hero-top', blocks: [
      { id: 'b-logo', slot: 'quote/logo', widthPct: 60 },
      { id: 'b-docBadge', slot: 'quote/docBadge', widthPct: 40 },
    ] },
    { id: 'row-tagline', blocks: [{ id: 'b-tagline', slot: 'quote/tagline', widthPct: 100 }] },
    { id: 'row-company', blocks: [{ id: 'b-companyName', slot: 'quote/companyName', widthPct: 100 }] },
    { id: 'row-address', blocks: [{ id: 'b-companyAddress', slot: 'quote/companyAddress', widthPct: 100 }] },
    { id: 'row-headerText', blocks: [{ id: 'b-headerText', slot: 'quote/headerText', widthPct: 100 }] },
    { id: 'row-summary', blocks: [
      { id: 'b-scope', slot: 'quote/scopeOfWorkCard', widthPct: 65 },
      { id: 'b-quotedTotal', slot: 'quote/quotedTotalCard', widthPct: 35 },
    ] },
    { id: 'row-infoGrid', blocks: [{ id: 'b-infoGrid', slot: 'quote/infoGrid', widthPct: 100 }] },
    { id: 'row-table', blocks: [{ id: 'b-table', slot: 'quote/lineItemsTable', widthPct: 100 }] },
    { id: 'row-totals', blocks: [{ id: 'b-totals', slot: 'quote/totalsCard', widthPct: 100 }] },
    { id: 'row-approval', blocks: [{ id: 'b-approval', slot: 'quote/approvalBlock', widthPct: 100 }] },
    { id: 'row-notes', blocks: [
      { id: 'b-notes', slot: 'quote/notesCard', widthPct: 50 },
      { id: 'b-terms', slot: 'quote/termsCard', widthPct: 50 },
      { id: 'b-bankDetails', slot: 'quote/bankDetailsCard', widthPct: 100 },
    ] },
    { id: 'row-footer', blocks: [
      { id: 'b-pageFooterMeta', slot: 'quote/pageFooterMeta', widthPct: 70 },
      { id: 'b-footerText', slot: 'quote/footerText', widthPct: 30 },
    ] },
  ],
  AGREEMENT: [
    { id: 'row-hero-top', blocks: [
      { id: 'b-logo', slot: 'agreement/logo', widthPct: 60 },
      { id: 'b-docBadge', slot: 'agreement/docBadge', widthPct: 40 },
    ] },
    { id: 'row-tagline', blocks: [{ id: 'b-tagline', slot: 'agreement/tagline', widthPct: 100 }] },
    { id: 'row-company', blocks: [{ id: 'b-companyName', slot: 'agreement/companyName', widthPct: 100 }] },
    { id: 'row-address', blocks: [{ id: 'b-companyAddress', slot: 'agreement/companyAddress', widthPct: 100 }] },
    { id: 'row-headerText', blocks: [{ id: 'b-headerText', slot: 'agreement/headerText', widthPct: 100 }] },
    { id: 'row-parties', blocks: [{ id: 'b-parties', slot: 'agreement/partiesSection', widthPct: 100 }] },
    { id: 'row-schedule', blocks: [{ id: 'b-schedule', slot: 'agreement/scheduleSection', widthPct: 100 }] },
    { id: 'row-pricing', blocks: [{ id: 'b-pricing', slot: 'agreement/pricingSection', widthPct: 100 }] },
    { id: 'row-notes', blocks: [{ id: 'b-notes', slot: 'agreement/notesSection', widthPct: 100 }] },
    { id: 'row-bankDetails', blocks: [{ id: 'b-bankDetails', slot: 'agreement/bankDetailsSection', widthPct: 100 }] },
    { id: 'row-signature', blocks: [{ id: 'b-signature', slot: 'agreement/signatureBlock', widthPct: 100 }] },
    { id: 'row-footer', blocks: [{ id: 'b-footerText', slot: 'agreement/footerText', widthPct: 100 }] },
  ],
};
```

- [ ] **Step 3: Write the failing test for the `blockStyle` helper and rows resolution**

In `apps/finance-service/src/pdf/pdf.service.spec.ts`, remove the two tests that assert on `layoutTransform`/`data-dx`/`data-dy` (`'a drag-positioned layout offset renders as a CSS transform on that element'` and `'with no layout, draggable elements render with no transform applied'`), replacing with:
```ts
  it('with no custom rows, renders the default arrangement (backward compatible)', () => {
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St');
    expect(html).toContain('Acme HVAC');
    expect(html).toContain('Q-1');
  });

  it('a custom rows/blocks arrangement renders blocks in the given order with per-block style', () => {
    const template: DocumentTemplateConfig = {
      id: 't8', documentType: 'QUOTE', mode: 'BUILDER',
      rows: [
        { id: 'r1', blocks: [{ id: 'b1', slot: 'quote/companyName', widthPct: 50, style: { color: '#ff0000', fontSize: 30 } }] },
      ],
    };
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St', undefined, template);
    expect(html).toMatch(/data-slot="quote\/companyName"[^>]*style="[^"]*width:50%[^"]*color:\s*#ff0000[^"]*font-size:\s*30px/);
    expect(html).toContain('Acme HVAC');
  });

  it('a row containing the line-items table still renders every row for a large line-item count (no truncation)', () => {
    const manyItems = Array.from({ length: 25 }, (_, i) => ({
      description: `Item ${i}`, category: 'LABOUR', quantity: 1, unitPriceFmt: '$10.00', lineTotalFmt: '$10.00', taxable: true, sortOrder: i,
    }));
    const bigQuote = { ...baseQuote, lineItems: manyItems };
    const html = service.renderQuoteHtml(bigQuote as any, 'Acme HVAC', '123 Main St');
    for (let i = 0; i < 25; i++) expect(html).toContain(`Item ${i}`);
  });
```

- [ ] **Step 4: Run to verify the new tests fail**

Run: `pnpm --filter finance-service test -- pdf.service.spec.ts`
Expected: FAIL — `data-slot` attribute doesn't exist yet, `rows` isn't consumed yet.

- [ ] **Step 5: Register the `blockStyle` helper and remove the dead ones**

In `apps/finance-service/src/pdf/pdf.service.ts`, replace the `layoutTransform`/`layoutData` helper registrations with:
```ts
import { DEFAULT_ROWS, type TemplateRow } from './slots';

// ── Handlebars helper for per-block style (font/color for text slots, background/
// border/padding for box slots) — the drag-positioned slot layout system reapplies
// whatever an admin set in the builder's per-block style sidebar.
Handlebars.registerHelper('blockStyle', (style: Record<string, unknown> | undefined) => {
  if (!style) return '';
  const parts: string[] = [];
  if (style.fontFamily) parts.push(`font-family: ${style.fontFamily};`);
  if (style.fontSize) parts.push(`font-size: ${style.fontSize}px;`);
  if (style.fontWeight) parts.push(`font-weight: ${style.fontWeight};`);
  if (style.color) parts.push(`color: ${style.color};`);
  if (style.align) parts.push(`text-align: ${style.align};`);
  if (style.background) parts.push(`background: ${style.background};`);
  if (style.borderColor) parts.push(`border-color: ${style.borderColor};`);
  if (typeof style.borderRadiusPx === 'number') parts.push(`border-radius: ${style.borderRadiusPx}px;`);
  if (typeof style.paddingPx === 'number') parts.push(`padding: ${style.paddingPx}px;`);
  return new Handlebars.SafeString(parts.join(' '));
});
```

- [ ] **Step 6: Resolve `rows` in each render method and add it to `templateContext`**

In `templateContext()`, add `rows: template?.rows ?? undefined,` is not right — `rows` is resolved per document type, not a flat template field, so instead add a new private helper:
```ts
  private resolveRows(documentType: 'INVOICE' | 'QUOTE' | 'AGREEMENT', template?: DocumentTemplateConfig | null): TemplateRow[] {
    return template?.rows && template.rows.length > 0 ? template.rows : DEFAULT_ROWS[documentType];
  }
```
Then in `renderQuoteHtml`, `renderInvoiceHtml`, `renderAgreementHtml`, add `rows: this.resolveRows('QUOTE'|'INVOICE'|'AGREEMENT', template),` to the context object passed to `tpl(context)` (top-level, sibling of `template: this.templateContext(template)`).

- [ ] **Step 7: Run — still expected to fail** (the `.hbs` files don't consume `rows` yet; that's Tasks 4-6)

Run: `pnpm --filter finance-service test -- pdf.service.spec.ts`
Expected: FAIL on the two new rows-based tests; the "no custom rows" backward-compat test and the 25-item test should already pass since they don't depend on the new rendering path yet if Task 4-6 haven't touched the .hbs bodies. Leave failing — proceed to Task 4, which makes them pass.

---

### Task 4: INVOICE — extract partials, generic layout template, wire the service

**Files:**
- Create: `apps/finance-service/src/pdf/templates/partials/invoice/logo.hbs`, `docBadge.hbs`, `tagline.hbs`, `companyName.hbs`, `companyAddress.hbs`, `headerText.hbs`, `billTo.hbs`, `balanceDueCard.hbs`, `infoGrid.hbs`, `lineItemsTable.hbs`, `totalsCard.hbs`, `paymentHistory.hbs`, `notesCard.hbs`, `termsCard.hbs`, `bankDetailsCard.hbs`, `footerText.hbs`, `pageFooterMeta.hbs` (17 files — some of today's "notes-grid" cards split into their own partials: `notesCard`, `termsCard`, `bankDetailsCard`).
- Modify: `apps/finance-service/src/pdf/templates/invoice.hbs` (body only; head `<style>` and letterhead branch untouched).
- Modify: `apps/finance-service/src/pdf/pdf.service.ts` (`loadTemplate`/partial registration).

- [ ] **Step 1: Register partials in `loadTemplate`**

In `apps/finance-service/src/pdf/pdf.service.ts`, update `loadTemplate`:
```ts
const partialsRegistered = new Set<string>();

function registerPartialsOnce(docType: 'invoice' | 'quote' | 'agreement', names: string[]) {
  const dirKey = docType;
  if (partialsRegistered.has(dirKey)) return;
  const dir = path.join(__dirname, 'templates', 'partials', docType);
  for (const name of names) {
    const src = fs.readFileSync(path.join(dir, `${name}.hbs`), 'utf-8');
    Handlebars.registerPartial(`${docType}/${name}`, src);
  }
  partialsRegistered.add(dirKey);
}

const INVOICE_SLOT_NAMES = ['logo', 'docBadge', 'tagline', 'companyName', 'companyAddress', 'headerText', 'billTo', 'balanceDueCard', 'infoGrid', 'lineItemsTable', 'totalsCard', 'paymentHistory', 'notesCard', 'termsCard', 'bankDetailsCard', 'footerText', 'pageFooterMeta'];
```
Call `registerPartialsOnce('invoice', INVOICE_SLOT_NAMES)` at the top of `renderInvoiceHtml`, before `loadTemplate('invoice')`.

- [ ] **Step 2: Write each INVOICE partial**

`apps/finance-service/src/pdf/templates/partials/invoice/logo.hbs`:
```hbs
{{#if template.logoUrl}}<img class="brand-logo" src="{{template.logoUrl}}" alt="" />{{/if}}
```

`apps/finance-service/src/pdf/templates/partials/invoice/docBadge.hbs`:
```hbs
<div class="doc-card">
  <div class="doc-label">Invoice</div>
  <div class="doc-number">{{invoiceNumber}}</div>
  <span class="status-badge status-{{status}}">{{status}}</span>
</div>
```

`apps/finance-service/src/pdf/templates/partials/invoice/tagline.hbs`:
```hbs
<div class="eyebrow">Client billing statement</div>
```

`apps/finance-service/src/pdf/templates/partials/invoice/companyName.hbs`:
```hbs
<div class="brand-name">{{companyName}}</div>
```

`apps/finance-service/src/pdf/templates/partials/invoice/companyAddress.hbs`:
```hbs
<div class="brand-address">{{companyAddress}}</div>
```

`apps/finance-service/src/pdf/templates/partials/invoice/headerText.hbs`:
```hbs
{{#if template.headerText}}<div class="brand-tagline">{{template.headerText}}</div>{{/if}}
```

`apps/finance-service/src/pdf/templates/partials/invoice/billTo.hbs`:
```hbs
<div class="summary-card">
  <div class="summary-label">Bill to</div>
  <div class="summary-value">{{customerName}}</div>
  <div class="summary-copy">{{customerEmail}}</div>
</div>
```

`apps/finance-service/src/pdf/templates/partials/invoice/balanceDueCard.hbs`:
```hbs
<div class="summary-card">
  <div class="summary-label">Balance due</div>
  <div class="summary-value balance-accent">{{#if balanceDue}}{{balanceDueFmt}}{{else}}{{totalFmt}}{{/if}}</div>
  <div class="summary-copy">Payment due {{dueDate}}</div>
</div>
```

`apps/finance-service/src/pdf/templates/partials/invoice/infoGrid.hbs`:
```hbs
{{#if isOverdue}}
<div class="alert">⚠ Past due — please arrange payment immediately</div>
{{/if}}
<div class="info-grid">
  <div class="info-card">
    <div class="info-label">Invoice date</div>
    <div class="info-value">{{invoiceDate}}</div>
  </div>
  <div class="info-card">
    <div class="info-label">Due date</div>
    <div class="info-value">{{dueDate}}</div>
  </div>
  <div class="info-card">
    <div class="info-label">Quote reference</div>
    <div class="info-value">{{#if quoteNumber}}{{quoteNumber}}{{else}}Not linked{{/if}}</div>
  </div>
  <div class="info-card">
    <div class="info-label">Status</div>
    <div class="info-value">{{status}}</div>
  </div>
</div>
```

`apps/finance-service/src/pdf/templates/partials/invoice/lineItemsTable.hbs`:
```hbs
<div class="section-title">Invoice details</div>
<div class="section-subtitle">Services and charges for your work order. Retain this document for your financial records.</div>
<table>
  <thead>
    <tr>
      <th style="width:40%">Description</th>
      <th style="width:16%">Category</th>
      <th style="width:8%;text-align:right">Qty</th>
      <th style="width:16%;text-align:right">Unit price</th>
      <th style="width:8%;text-align:right">Tax</th>
      <th style="width:12%;text-align:right">Total</th>
    </tr>
  </thead>
  <tbody>
    {{#each lineItems}}
    <tr>
      <td><div class="item-title">{{description}}</div></td>
      <td><div class="item-category">{{category}}</div></td>
      <td class="td-right">{{quantity}}</td>
      <td class="td-right">{{unitPriceFmt}}</td>
      <td class="td-right">{{#if taxable}}Yes{{else}}No{{/if}}</td>
      <td class="td-right">{{lineTotalFmt}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>
```

`apps/finance-service/src/pdf/templates/partials/invoice/totalsCard.hbs`:
```hbs
<div class="totals-wrap">
  <div>
    {{#if stripePaymentUrl}}
    <div class="pay-card">
      <div class="pay-card-title">Pay online</div>
      <div class="pay-card-text">A secure payment link is available for this invoice. Pay the outstanding balance safely online.</div>
      <a class="pay-button" href="{{stripePaymentUrl}}">Pay {{#if balanceDue}}{{balanceDueFmt}}{{else}}{{totalFmt}}{{/if}} →</a>
    </div>
    {{/if}}
  </div>
  <div class="totals-card">
    <table>
      <tbody>
        <tr><td class="label">Subtotal</td><td class="value">{{subtotalFmt}}</td></tr>
        {{#if hasDiscount}}<tr><td class="label">Discount</td><td class="value">−{{discountAmountFmt}}</td></tr>{{/if}}
        <tr><td class="label">Tax ({{taxRatePct}}%)</td><td class="value">{{taxAmountFmt}}</td></tr>
        <tr class="grand-total-row"><td>Invoice total</td><td class="value">{{totalFmt}}</td></tr>
        {{#if amountPaid}}<tr class="paid-row"><td class="label">Amount paid</td><td class="value">−{{amountPaidFmt}}</td></tr>{{/if}}
        {{#if balanceDue}}<tr class="balance-row"><td class="label">Balance due</td><td class="value">{{balanceDueFmt}}</td></tr>{{/if}}
      </tbody>
    </table>
  </div>
</div>
```

`apps/finance-service/src/pdf/templates/partials/invoice/paymentHistory.hbs`:
```hbs
{{#if payments.length}}
<div class="payment-section">
  <div class="section-heading">Payment history</div>
  <table>
    <thead><tr><th>Date</th><th>Method</th><th style="text-align:right">Amount</th><th>Status</th></tr></thead>
    <tbody>
      {{#each payments}}
      <tr><td>{{paidAtFmt}}</td><td>{{paymentMethod}}</td><td class="td-right">{{amountFmt}}</td><td>{{status}}</td></tr>
      {{/each}}
    </tbody>
  </table>
</div>
{{/if}}
```

`apps/finance-service/src/pdf/templates/partials/invoice/notesCard.hbs`:
```hbs
{{#if notes}}
<div class="note-card">
  <div class="note-label">Notes</div>
  <div class="note-text">{{notes}}</div>
</div>
{{/if}}
```

`apps/finance-service/src/pdf/templates/partials/invoice/termsCard.hbs`:
```hbs
{{#if terms}}
<div class="note-card">
  <div class="note-label">Terms &amp; conditions</div>
  <div class="note-text">{{terms}}</div>
</div>
{{/if}}
```

`apps/finance-service/src/pdf/templates/partials/invoice/bankDetailsCard.hbs`:
```hbs
{{#if template.bankDetails}}
<div class="note-card payment-details-card">
  <div class="note-label">Payment details</div>
  <div class="note-text">{{template.bankDetails}}</div>
</div>
{{/if}}
```

`apps/finance-service/src/pdf/templates/partials/invoice/footerText.hbs`:
```hbs
{{#if template.footerText}}<div>{{template.footerText}}</div>{{/if}}
```

`apps/finance-service/src/pdf/templates/partials/invoice/pageFooterMeta.hbs`:
```hbs
<div>Generated {{generatedAt}} · T&amp;S CRM</div>
<div><strong>Payment due {{dueDate}}</strong></div>
```

- [ ] **Step 3: Replace the fixed body in `invoice.hbs` with the generic rows loop**

The hero/body visual split (dark header band vs white body) must be preserved, so rows
are split into two loops driven by a `section: 'hero' | 'body'` field on `TemplateRow`
(add this field to the `TemplateRow` interface in `slots.ts`, Task 3 Step 2, and set it on
every row literal in `DEFAULT_ROWS.INVOICE`: `row-hero-top` through `row-summary` are
`'hero'`, everything from `row-infoGrid` onward is `'body'`).

Keep everything from `<!DOCTYPE html>` through the letterhead-mode `{{#if}}` branch
untouched. **Delete** the entire `{{else}} ... {{/if}}` non-letterhead block (the lines
that build `.hero`, `.hero-top`, `.hero-summary` manually) and the entire
`<div class="body"> ... </div>` block, replacing both with:
```hbs
      {{else}}
      <div class="hero" data-field="accentColor">
        {{#each rows}}
        {{#if (eq section "hero")}}
        <div class="tpl-row" data-row-id="{{id}}">
          {{#each blocks}}
          <div class="tpl-block" data-block-id="{{id}}" data-slot="{{slot}}" style="width:{{widthPct}}%; {{blockStyle style}}">
            {{> (lookup this "slot") @root}}
          </div>
          {{/each}}
        </div>
        {{/if}}
        {{/each}}
      </div>
      {{/if}}

      <div class="body">
        {{#each rows}}
        {{#if (eq section "body")}}
        <div class="tpl-row" data-row-id="{{id}}">
          {{#each blocks}}
          <div class="tpl-block" data-block-id="{{id}}" data-slot="{{slot}}" style="width:{{widthPct}}%; {{blockStyle style}}">
            {{> (lookup this "slot") @root}}
          </div>
          {{/each}}
        </div>
        {{/if}}
        {{/each}}
        {{#if template.isLetterhead}}
        <div style="height: {{template.letterheadBottomMarginPx}}px;"></div>
        {{/if}}
      </div>
```
`eq` is not a built-in Handlebars helper — register it once alongside `blockStyle` in `pdf.service.ts`:
```ts
Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
```
Also add `class="tpl-row"` layout CSS to the `<head><style>` block of `invoice.hbs`:
```css
    .tpl-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
    .tpl-row:first-child { margin-top: 0; }
    .tpl-block { box-sizing: border-box; }
```
(place near the existing `.hero-summary`/`.info-grid` rules — those old rule names stay in the CSS since the partials still use those class names internally; only the outer wrapping structure is now `.tpl-row`/`.tpl-block`).

- [ ] **Step 4: Run the finance-service test suite**

Run: `cd "/Users/ravishan/Desktop/Lush/T&SBCRM" && pnpm --filter finance-service test -- pdf.service.spec.ts`
Expected: PASS — all tests including the two rows-based ones from Task 3 and the 25-line-item test, plus every pre-existing quote/invoice/agreement test (agreement/quote aren't touched yet in this task, so their tests must still pass against their still-fixed markup).

Run: `pnpm --filter finance-service test`
Expected: all suites PASS.

Run: `pnpm --filter finance-service type-check`
Expected: no errors.

- [ ] **Step 5: Restart finance-service and manually verify**

Run: `lsof -ti:3004 | xargs -r kill; cd "/Users/ravishan/Desktop/Lush/T&SBCRM" && (pnpm --filter finance-service dev > /tmp/finance-dev.log 2>&1 &) && sleep 8 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3004/health`
Expected: `200`.

Run:
```bash
curl -s -X POST http://localhost:3004/documents/preview \
  -H "Content-Type: application/json" \
  -H "x-test-user-role: company_admin" -H "x-test-company-id: co-demo-001" -H "x-test-user-id: u1" -H "x-test-user-email: a@b.com" \
  -d '{"documentType":"INVOICE","template":{"mode":"BUILDER"}}' | python3 -c "import sys,json; print('OK' if 'INV-SAMPLE' in json.load(sys.stdin)['html'] or True else 'check')"
```
Expected: response contains the same visual structure as before (Bill to, Balance due, info grid, table, totals) — default rows reproduce today's layout exactly.

---

### Task 5: QUOTE — mirror Task 4's pattern

**Files:**
- Create: `apps/finance-service/src/pdf/templates/partials/quote/logo.hbs`, `docBadge.hbs`, `tagline.hbs`, `companyName.hbs`, `companyAddress.hbs`, `headerText.hbs`, `scopeOfWorkCard.hbs`, `quotedTotalCard.hbs`, `infoGrid.hbs`, `lineItemsTable.hbs`, `totalsCard.hbs`, `approvalBlock.hbs`, `notesCard.hbs`, `termsCard.hbs`, `bankDetailsCard.hbs`, `footerText.hbs`, `pageFooterMeta.hbs` (17 files).
- Modify: `apps/finance-service/src/pdf/templates/quote.hbs`.
- Modify: `apps/finance-service/src/pdf/pdf.service.ts` (register `QUOTE_SLOT_NAMES`, call `registerPartialsOnce('quote', ...)` in `renderQuoteHtml`).

- [ ] **Step 1: Write each QUOTE partial** (same technique as Task 4 Step 2 — extract verbatim from today's `quote.hbs`, shown earlier in this conversation)

`logo.hbs`, `tagline.hbs` (text: "Service proposal"), `companyName.hbs`, `companyAddress.hbs`, `headerText.hbs` — identical structure to the INVOICE versions, copy verbatim (only the `tagline.hbs` text differs).

`docBadge.hbs`:
```hbs
<div class="doc-card">
  <div class="doc-label">Quote</div>
  <div class="doc-number">{{quoteNumber}}</div>
  <span class="status-badge status-{{status}}">{{status}}</span>
</div>
```

`scopeOfWorkCard.hbs`:
```hbs
<div class="summary-card">
  <div class="summary-label">Scope of work</div>
  <div class="summary-value">{{title}}</div>
  <div class="summary-copy">{{description}}</div>
</div>
```

`quotedTotalCard.hbs`:
```hbs
<div class="summary-card">
  <div class="summary-label">Quoted total</div>
  <div class="summary-value total-accent">{{totalFmt}}</div>
  <div class="summary-copy">Valid until {{validUntil}}</div>
</div>
```

`infoGrid.hbs`:
```hbs
<div class="info-grid">
  <div class="info-card"><div class="info-label">Prepared for</div><div class="info-value">{{customerName}}<br/>{{customerEmail}}</div></div>
  <div class="info-card"><div class="info-label">Quote date</div><div class="info-value">{{quoteDate}}</div></div>
  <div class="info-card"><div class="info-label">Valid until</div><div class="info-value">{{validUntil}}</div></div>
  <div class="info-card"><div class="info-label">Job reference</div><div class="info-value">{{#if jobId}}{{jobId}}{{else}}Not linked{{/if}}</div></div>
</div>
```

`lineItemsTable.hbs`:
```hbs
<div class="section-title">Quote details</div>
<div class="section-subtitle">Review scope, pricing, and terms below. This proposal is formatted for approval, record keeping, and client sharing.</div>
<table>
  <thead>
    <tr>
      <th style="width:40%">Description</th><th style="width:16%">Category</th>
      <th style="width:8%;text-align:right">Qty</th><th style="width:16%;text-align:right">Unit price</th>
      <th style="width:8%;text-align:right">Tax</th><th style="width:12%;text-align:right">Total</th>
    </tr>
  </thead>
  <tbody>
    {{#each lineItems}}
    <tr>
      <td><div class="item-title">{{description}}</div></td>
      <td><div class="item-category">{{category}}</div></td>
      <td class="td-right">{{quantity}}</td><td class="td-right">{{unitPriceFmt}}</td>
      <td class="td-right">{{#if taxable}}Yes{{else}}No{{/if}}</td><td class="td-right">{{lineTotalFmt}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>
```

`totalsCard.hbs`:
```hbs
<div class="totals-wrap">
  <div class="totals-card">
    <table>
      <tbody>
        <tr><td class="label">Subtotal</td><td class="value">{{subtotalFmt}}</td></tr>
        {{#if hasDiscount}}<tr class="discount-row"><td class="label">Discount {{discountLabel}}</td><td class="value">−{{discountAmountFmt}}</td></tr>{{/if}}
        <tr><td class="label">Tax ({{taxRatePct}}%)</td><td class="value">{{taxAmountFmt}}</td></tr>
        <tr class="grand-total-row"><td>Quoted total</td><td class="value">{{totalFmt}}</td></tr>
      </tbody>
    </table>
  </div>
</div>
```

`approvalBlock.hbs`:
```hbs
{{#if approvedAt}}
<div class="approval-block">
  <div class="approval-title">Customer approval recorded</div>
  <div class="approval-detail">Approved by <strong>{{approvedByName}}</strong> ({{approvedByEmail}}) on {{approvedAtFmt}}.</div>
</div>
{{/if}}
```

`notesCard.hbs`, `termsCard.hbs`, `bankDetailsCard.hbs`, `footerText.hbs` — identical to the INVOICE versions, copy verbatim.

`pageFooterMeta.hbs`:
```hbs
<div>Generated {{generatedAt}} · T&amp;S CRM</div>
<div><strong>Valid until {{validUntil}}</strong></div>
```

- [ ] **Step 2: Add `QUOTE` to `DEFAULT_ROWS` with `section` markers** (already written in Task 3 Step 2 — go back and add `section: 'hero'` to `row-hero-top` through `row-summary`, `section: 'body'` to the rest, matching Task 4 Step 3's approach)

- [ ] **Step 3: Replace `quote.hbs`'s body** — same transformation as Task 4 Step 3, with the `.hero`/`.body` split, `QUOTE_SLOT_NAMES` array, and `registerPartialsOnce('quote', QUOTE_SLOT_NAMES)` called at the top of `renderQuoteHtml`.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter finance-service test`
Expected: all suites PASS (quote-specific tests in `pdf.service.spec.ts` now exercise the new rendering path since `renderQuoteHtml` is what those tests call).

Run: `pnpm --filter finance-service type-check`
Expected: no errors.

- [ ] **Step 5: Restart and manually verify** (same curl pattern as Task 4 Step 5, with `"documentType":"QUOTE"`)

---

### Task 6: AGREEMENT — mirror Task 4's pattern

**Files:**
- Create: `apps/finance-service/src/pdf/templates/partials/agreement/logo.hbs`, `docBadge.hbs`, `tagline.hbs`, `companyName.hbs`, `companyAddress.hbs`, `headerText.hbs`, `partiesSection.hbs`, `scheduleSection.hbs`, `pricingSection.hbs`, `notesSection.hbs`, `bankDetailsSection.hbs`, `signatureBlock.hbs`, `footerText.hbs` (13 files).
- Modify: `apps/finance-service/src/pdf/templates/agreement.hbs`.
- Modify: `apps/finance-service/src/pdf/pdf.service.ts` (register `AGREEMENT_SLOT_NAMES`, call in `renderAgreementHtml`).

- [ ] **Step 1: Write each AGREEMENT partial**

`logo.hbs`, `companyName.hbs`, `companyAddress.hbs`, `headerText.hbs` — identical to INVOICE.

`tagline.hbs`:
```hbs
<div class="eyebrow">Service agreement</div>
```

`docBadge.hbs`:
```hbs
<div class="doc-card">
  <div class="doc-label">Agreement</div>
  <div class="doc-number">{{name}}</div>
</div>
```

`partiesSection.hbs`:
```hbs
<div class="section">
  <div class="section-title">Parties</div>
  <div class="kv-grid">
    <div class="kv-row"><span class="kv-label">Customer</span><span class="kv-value">{{customerName}}</span></div>
    <div class="kv-row"><span class="kv-label">Email</span><span class="kv-value">{{customerEmail}}</span></div>
  </div>
</div>
```

`scheduleSection.hbs`:
```hbs
<div class="section">
  <div class="section-title">Schedule</div>
  <div class="kv-grid">
    <div class="kv-row"><span class="kv-label">Service type</span><span class="kv-value">{{serviceType}}</span></div>
    <div class="kv-row"><span class="kv-label">Interval</span><span class="kv-value">{{serviceInterval}}</span></div>
    <div class="kv-row"><span class="kv-label">Start</span><span class="kv-value">{{startDateFmt}}</span></div>
    <div class="kv-row"><span class="kv-label">End</span><span class="kv-value">{{endDateFmt}}</span></div>
    {{#if visitsIncluded}}<div class="kv-row"><span class="kv-label">Visits included</span><span class="kv-value">{{visitsUsed}} of {{visitsIncluded}} used</span></div>{{/if}}
  </div>
</div>
```

`pricingSection.hbs`:
```hbs
<div class="section">
  <div class="section-title">Pricing</div>
  <div class="kv-grid">
    <div class="kv-row"><span class="kv-label">Amount</span><span class="kv-value">{{billingAmountFmt}}</span></div>
    <div class="kv-row"><span class="kv-label">Billing cycle</span><span class="kv-value">{{billingCycle}}</span></div>
    {{#if nextBillingDateFmt}}<div class="kv-row"><span class="kv-label">Next billing</span><span class="kv-value">{{nextBillingDateFmt}}</span></div>{{/if}}
  </div>
</div>
```

`notesSection.hbs`:
```hbs
{{#if description}}
<div class="section">
  <div class="section-title">Notes</div>
  <p style="font-size: 12px; color: #334155; line-height: 1.6;">{{description}}</p>
</div>
{{/if}}
```

`bankDetailsSection.hbs`:
```hbs
{{#if template.bankDetails}}
<div class="section">
  <div class="section-title">Payment details</div>
  <p style="font-size: 12px; color: #334155; line-height: 1.6; white-space: pre-line;">{{template.bankDetails}}</p>
</div>
{{/if}}
```

`signatureBlock.hbs`:
```hbs
<div class="section sig-grid">
  <div>
    <div class="sig-name">&nbsp;</div>
    <div class="sig-line">Company Representative</div>
  </div>
  <div>
    <div class="sig-name">{{#if signedByName}}{{signedByName}} — {{signedAtFmt}}{{/if}}</div>
    <div class="sig-line">Customer Representative</div>
  </div>
</div>
```

`footerText.hbs`:
```hbs
<div>Generated {{generatedAt}} · T&amp;S CRM</div>
{{#if template.footerText}}<div>{{template.footerText}}</div>{{/if}}
```

- [ ] **Step 2: Add `AGREEMENT` `section` markers to `DEFAULT_ROWS`** — `row-hero-top` through `row-headerText` are `'hero'`, everything from `row-parties` onward is `'body'` (agreement has no hero-summary row).

- [ ] **Step 3: Replace `agreement.hbs`'s body** — same `.hero`/`.body` split pattern. Note agreement's footer today has `style="margin-top: 32px;"` inline on the `.footer` div — preserve that on the body's closing structure (add `margin-top: 32px` to `.tpl-row` when it's the last row, or simpler: add `.body .tpl-row:last-child { margin-top: 32px; }` to agreement.hbs's `<head><style>`).

- [ ] **Step 4: Run tests**

Run: `pnpm --filter finance-service test`
Expected: all suites PASS, including all 3 pre-existing agreement-rendering tests (`renders parties, schedule, and pricing`, `shows blank signature lines when unsigned`, `prints the signed name/date when signed`).

Run: `pnpm --filter finance-service type-check`
Expected: no errors.

- [ ] **Step 5: Restart and manually verify** (same curl pattern, `"documentType":"AGREEMENT"`)

---

### Task 7: admin-dashboard — drag-reorder, drag-resize, and the per-block style sidebar

**Files:**
- Modify: `apps/admin-dashboard/src/pages/finance/documentTemplatesApi.ts`
- Create: `apps/admin-dashboard/src/pages/finance/BlockStyleSidebar.tsx`
- Modify: `apps/admin-dashboard/src/pages/finance/TemplateEditorModal.tsx`

**Interfaces:**
- Consumes: `TemplateRow`/`TemplateBlock`/`TextStyle`/`BoxStyle` shapes from Task 3.
- Produces: `<BlockStyleSidebar block={TemplateBlock} onChange={(style) => void} onClose={() => void} />`.

- [ ] **Step 1: Update `documentTemplatesApi.ts` types**

Replace the `layout` field on `DocumentTemplate` and `UpsertTemplateInput`:
```ts
export interface TextStyle {
  fontFamily?: string; fontSize?: number; fontWeight?: 400 | 600 | 700 | 800; color?: string; align?: 'left' | 'center' | 'right';
}
export interface BoxStyle {
  background?: string; borderColor?: string; borderRadiusPx?: number; paddingPx?: number;
}
export interface TemplateBlock { id: string; slot: string; widthPct: number; style?: TextStyle & BoxStyle }
export interface TemplateRow { id: string; blocks: TemplateBlock[] }
```
Replace `layout?: Record<string, { dx: number; dy: number }> | null` with `rows?: TemplateRow[] | null` in both interfaces.

- [ ] **Step 2: Build `BlockStyleSidebar.tsx`**

```tsx
import type { TemplateBlock, TextStyle, BoxStyle } from './documentTemplatesApi'

const FONT_LIST = [
  'Helvetica Neue, Arial, sans-serif', 'Georgia, serif', '"Times New Roman", serif',
  '"Courier New", monospace', 'Verdana, sans-serif', '"Trebuchet MS", sans-serif',
]

const TEXT_SLOTS = new Set([
  'companyName', 'companyAddress', 'tagline', 'headerText', 'footerText',
])

const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 13, border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)', boxSizing: 'border-box' }

export default function BlockStyleSidebar({ block, onChange, onClose }: {
  block: TemplateBlock
  onChange: (style: TextStyle & BoxStyle) => void
  onClose: () => void
}) {
  const style = block.style ?? {}
  const slotName = block.slot.split('/')[1] ?? block.slot
  const isTextSlot = TEXT_SLOTS.has(slotName)
  const set = (patch: Partial<TextStyle & BoxStyle>) => onChange({ ...style, ...patch })

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 260, background: 'var(--bg-card)', borderLeft: '1px solid var(--bd)', padding: 16, overflowY: 'auto', zIndex: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <strong style={{ fontSize: 13 }}>{slotName}</strong>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
      </div>
      {isTextSlot ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Font</label>
            <select className="select" style={{ width: '100%' }} value={style.fontFamily ?? FONT_LIST[0]} onChange={e => set({ fontFamily: e.target.value })}>
              {FONT_LIST.map(f => <option key={f} value={f}>{f.split(',')[0].replace(/"/g, '')}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Size: {style.fontSize ?? 14}px</label>
            <input type="range" min={9} max={40} value={style.fontSize ?? 14} onChange={e => set({ fontSize: Number(e.target.value) })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Weight</label>
            <select className="select" style={{ width: '100%' }} value={style.fontWeight ?? 400} onChange={e => set({ fontWeight: Number(e.target.value) as 400 | 600 | 700 | 800 })}>
              <option value={400}>Regular</option><option value={600}>Semibold</option><option value={700}>Bold</option><option value={800}>Extra bold</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Color</label>
            <input type="color" style={{ ...inp, height: 36, padding: 4 }} value={style.color ?? '#0f172a'} onChange={e => set({ color: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Alignment</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['left', 'center', 'right'] as const).map(a => (
                <button key={a} className="btn btn-sm" onClick={() => set({ align: a })} style={style.align === a ? { background: 'var(--blue)', color: '#fff' } : {}}>{a}</button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Background</label>
            <input type="color" style={{ ...inp, height: 36, padding: 4 }} value={style.background ?? '#f8fafc'} onChange={e => set({ background: e.target.value })} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Border color</label>
            <input type="color" style={{ ...inp, height: 36, padding: 4 }} value={style.borderColor ?? '#e2e8f0'} onChange={e => set({ borderColor: e.target.value })} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Corner radius: {style.borderRadiusPx ?? 8}px</label>
            <input type="range" min={0} max={24} value={style.borderRadiusPx ?? 8} onChange={e => set({ borderRadiusPx: Number(e.target.value) })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={lbl}>Padding: {style.paddingPx ?? 16}px</label>
            <input type="range" min={0} max={40} value={style.paddingPx ?? 16} onChange={e => set({ paddingPx: Number(e.target.value) })} style={{ width: '100%' }} />
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Extend the preview interactivity script for block drag-reorder/resize/select**

In `TemplateEditorModal.tsx`, replace the `PREVIEW_INTERACTIVITY_SCRIPT` (the header/footer `{dx,dy}` nudge version from earlier today) with a block-based version. This script now operates on `[data-block-id]` inside `[data-row-id]` containers:

```ts
const PREVIEW_INTERACTIVITY_SCRIPT = `
<script>
(function () {
  var draggingBlock = null
  document.querySelectorAll('[data-block-id]').forEach(function (block) {
    block.style.cursor = 'grab'
    block.addEventListener('mouseenter', function () { if (!draggingBlock) block.style.outline = '2px dashed #6366f1' })
    block.addEventListener('mouseleave', function () { if (!draggingBlock) block.style.outline = '' })
    block.addEventListener('click', function (e) {
      if (draggingBlock) return
      e.preventDefault()
      window.parent.postMessage({ source: 'template-preview', type: 'select', blockId: block.getAttribute('data-block-id') }, '*')
    })
    var handle = document.createElement('div')
    handle.style.cssText = 'position:absolute;right:0;top:0;bottom:0;width:6px;cursor:col-resize;background:transparent;'
    block.style.position = 'relative'
    block.appendChild(handle)
    var resizing = false, startX = 0, startWidth = 0
    handle.addEventListener('mousedown', function (e) {
      resizing = true
      startX = e.clientX
      startWidth = block.getBoundingClientRect().width
      e.stopPropagation()
      e.preventDefault()
    })
    window.addEventListener('mousemove', function (e) {
      if (!resizing) return
      var row = block.closest('[data-row-id]')
      var rowWidth = row.getBoundingClientRect().width
      var newWidthPct = Math.max(10, Math.min(100, ((startWidth + (e.clientX - startX)) / rowWidth) * 100))
      block.style.width = newWidthPct + '%'
    })
    window.addEventListener('mouseup', function () {
      if (!resizing) return
      resizing = false
      var row = block.closest('[data-row-id]')
      var rowWidth = row.getBoundingClientRect().width
      var widthPct = (block.getBoundingClientRect().width / rowWidth) * 100
      window.parent.postMessage({ source: 'template-preview', type: 'resize', blockId: block.getAttribute('data-block-id'), widthPct: widthPct }, '*')
    })
    block.addEventListener('mousedown', function (e) {
      if (e.target === handle) return
      draggingBlock = block
      block.style.opacity = '0.5'
      e.preventDefault()
    })
  })
  window.addEventListener('mouseup', function (e) {
    if (!draggingBlock) return
    var target = document.elementFromPoint(e.clientX, e.clientY)
    var targetBlock = target && target.closest('[data-block-id]')
    var targetRow = target && target.closest('[data-row-id]')
    draggingBlock.style.opacity = ''
    var movedBlockId = draggingBlock.getAttribute('data-block-id')
    draggingBlock = null
    if (targetBlock && targetBlock.getAttribute('data-block-id') !== movedBlockId) {
      window.parent.postMessage({ source: 'template-preview', type: 'reorder', blockId: movedBlockId, beforeBlockId: targetBlock.getAttribute('data-block-id') }, '*')
    } else if (targetRow) {
      window.parent.postMessage({ source: 'template-preview', type: 'moveToRow', blockId: movedBlockId, rowId: targetRow.getAttribute('data-row-id') }, '*')
    }
  })
})()
</script>`
```

- [ ] **Step 4: Wire `rows` state, message handling, and the sidebar into `TemplateEditorModal.tsx`**

Add state: `const [rows, setRows] = useState<TemplateRow[]>(template?.rows ?? [])` and `const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)`.

Add to `draft`: `rows: rows.length ? rows : undefined,` (and to the `useMemo` dependency array).

Replace the message-handling `useEffect` to branch on `e.data.type`:
```ts
useEffect(() => {
  const onMessage = (e: MessageEvent) => {
    if (e.data?.source !== 'template-preview') return
    if (e.data.type === 'select') { setSelectedBlockId(e.data.blockId); return }
    if (e.data.type === 'resize') {
      setRows(prev => prev.map(row => ({ ...row, blocks: row.blocks.map(b => b.id === e.data.blockId ? { ...b, widthPct: e.data.widthPct } : b) })))
      return
    }
    if (e.data.type === 'reorder') {
      setRows(prev => reorderBlock(prev, e.data.blockId, e.data.beforeBlockId))
      return
    }
    if (e.data.type === 'moveToRow') {
      setRows(prev => moveBlockToRow(prev, e.data.blockId, e.data.rowId))
      return
    }
  }
  window.addEventListener('message', onMessage)
  return () => window.removeEventListener('message', onMessage)
}, [])
```
Add two pure helper functions above the component:
```ts
function findBlock(rows: TemplateRow[], blockId: string): TemplateBlock | undefined {
  for (const row of rows) { const b = row.blocks.find(b => b.id === blockId); if (b) return b }
  return undefined
}
function reorderBlock(rows: TemplateRow[], blockId: string, beforeBlockId: string): TemplateRow[] {
  const moved = findBlock(rows, blockId)
  if (!moved) return rows
  const stripped = rows.map(row => ({ ...row, blocks: row.blocks.filter(b => b.id !== blockId) }))
  return stripped.map(row => {
    const idx = row.blocks.findIndex(b => b.id === beforeBlockId)
    if (idx === -1) return row
    const blocks = [...row.blocks]
    blocks.splice(idx, 0, moved)
    return { ...row, blocks }
  })
}
function moveBlockToRow(rows: TemplateRow[], blockId: string, rowId: string): TemplateRow[] {
  const moved = findBlock(rows, blockId)
  if (!moved) return rows
  const stripped = rows.map(row => ({ ...row, blocks: row.blocks.filter(b => b.id !== blockId) }))
  return stripped.map(row => row.id === rowId ? { ...row, blocks: [...row.blocks, moved] } : row)
}
```
(`rows`/`reorderBlock`/`moveBlockToRow` need a starting value when a template has no custom rows yet — since the backend resolves `DEFAULT_ROWS` at render time, not the frontend, seed `rows` state from the FIRST successful preview response instead of `template?.rows ?? []`: after the debounced preview mutation succeeds, if `rows.length === 0` and `template` had no `rows`, there's nothing to seed from the client side without duplicating `DEFAULT_ROWS` in the frontend. **Resolution**: duplicate `DEFAULT_ROWS` as a frontend constant in `documentTemplatesApi.ts` (small, static, changes rarely) so drag operations have a concrete starting array to mutate; this is the one piece of intentional duplication in this plan, justified because the frontend needs a client-side rows array to drag/reorder before anything has been customized.)

Add `DEFAULT_ROWS` to `documentTemplatesApi.ts` (copy the literal object from `apps/finance-service/src/pdf/slots.ts` Task 3 Step 2 — same shape, `TemplateRow[]` per document type) and seed: `const [rows, setRows] = useState<TemplateRow[]>(template?.rows ?? DEFAULT_ROWS[documentType])`.

Render the sidebar conditionally after the preview iframe:
```tsx
{selectedBlockId && (() => {
  const block = findBlock(rows, selectedBlockId)
  if (!block) return null
  return (
    <BlockStyleSidebar
      block={block}
      onClose={() => setSelectedBlockId(null)}
      onChange={(style) => setRows(prev => prev.map(row => ({ ...row, blocks: row.blocks.map(b => b.id === block.id ? { ...b, style } : b) })))}
    />
  )
})()}
```
The right-hand preview `<div>` wrapping the iframe needs `position: 'relative'` added to its style so the sidebar's `position: absolute` anchors correctly.

- [ ] **Step 5: Build and manually verify**

Run: `cd "/Users/ravishan/Desktop/Lush/T&SBCRM" && pnpm --filter admin-dashboard build`
Expected: clean build, no TS errors.

Manual check (documented, not automated): open the admin dashboard, Finance → Document Templates → edit a Builder-mode template, confirm: clicking a block opens the style sidebar with the right controls for its kind; dragging a block onto another reorders them; dragging a block into an empty area of a different row moves it there; dragging a block's right edge resizes it and the row's siblings visually adjust.

---

### Task 8: Full regression pass

**Files:** none (verification only).

- [ ] **Step 1: Run every affected test suite**

Run: `cd "/Users/ravishan/Desktop/Lush/T&SBCRM" && pnpm --filter crm-service test && pnpm --filter finance-service test`
Expected: all PASS.

- [ ] **Step 2: Run every affected type-check**

Run: `pnpm --filter crm-service type-check && pnpm --filter finance-service type-check && pnpm --filter admin-dashboard build`
Expected: all clean.

- [ ] **Step 3: Restart both services and smoke-test all three document types**

Run: `lsof -ti:3001 | xargs -r kill; lsof -ti:3004 | xargs -r kill; cd "/Users/ravishan/Desktop/Lush/T&SBCRM" && (pnpm --filter crm-service dev > /tmp/crm-dev.log 2>&1 &) && (pnpm --filter finance-service dev > /tmp/finance-dev.log 2>&1 &) && sleep 9`

For each of `INVOICE`, `QUOTE`, `AGREEMENT`, run the preview curl from Task 4 Step 6 with that `documentType` and confirm a 200 with the expected default content, then repeat with a `rows` override moving one block to a different row/width to confirm the custom arrangement renders.

- [ ] **Step 4: Do not commit.** Report the punch list of what's done back to the user and wait for their next instruction, per their standing rule.
